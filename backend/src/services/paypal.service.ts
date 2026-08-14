import {
  computePlanAmountUsd,
  getPlanByKey,
  isBillingDevMode,
  normalizePlan,
  PLAN_CATALOG,
} from '../constants/plans';
import { planService } from './plan.service';
import { invoiceService } from './invoice.service';
import { BillingInvoice } from '../modules/billing/billing-invoice.model';
import { User } from '../modules/auth/user.model';

const planIdCache = new Map<string, string>();
let accessTokenCache: { token: string | null; expiresAt: number } = { token: null, expiresAt: 0 };

function getPayPalApiBase() {
  return process.env.PAYPAL_MODE === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';
}

export function isPayPalConfigured() {
  return Boolean(process.env.PAYPAL_CLIENT_ID?.trim() && process.env.PAYPAL_CLIENT_SECRET?.trim());
}

export function getPayPalClientId() {
  return process.env.PAYPAL_CLIENT_ID?.trim() || '';
}

function clientBaseUrl() {
  return process.env.CLIENT_URL || 'http://localhost:3003';
}

function computeAmountUsd(plan: { priceMonthly?: number; priceYearly?: number; savePercent?: number } | null, billingCycle = 'monthly') {
  return computePlanAmountUsd(plan, billingCycle);
}

function packMetadata(metadata: Record<string, string>) {
  // PayPal custom_id max length is 127.
  const compact: Record<string, string> = {};
  if (metadata.planKey) compact.p = String(metadata.planKey);
  if (metadata.billingCycle && metadata.billingCycle !== 'monthly') {
    compact.b = metadata.billingCycle === 'annual' ? 'y' : String(metadata.billingCycle);
  }
  if (metadata.userId) compact.u = String(metadata.userId);

  const raw = JSON.stringify(compact);
  if (raw.length > 127) {
    throw Object.assign(new Error('Checkout metadata is too large for PayPal.'), { status: 400 });
  }
  return raw;
}

export function unpackMetadata(customId?: string) {
  if (!customId) return {};
  try {
    const parsed = JSON.parse(customId) as Record<string, string>;
    if (parsed.userId || parsed.planKey) {
      return {
        planKey: parsed.planKey || '',
        billingCycle: parsed.billingCycle || 'monthly',
        userId: parsed.userId || '',
      };
    }
    return {
      planKey: parsed.p || '',
      billingCycle: parsed.b === 'y' ? 'annual' : parsed.b || 'monthly',
      userId: parsed.u || '',
    };
  } catch {
    return {};
  }
}

async function getAccessToken() {
  if (accessTokenCache.token && accessTokenCache.expiresAt > Date.now() + 60_000) {
    return accessTokenCache.token;
  }

  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const response = await fetch(`${getPayPalApiBase()}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  const data = (await response.json().catch(() => ({}))) as {
    access_token?: string;
    expires_in?: number;
    error_description?: string;
  };

  if (!response.ok) {
    throw Object.assign(new Error(data.error_description || 'PayPal authentication failed.'), {
      status: 502,
    });
  }

  accessTokenCache = {
    token: data.access_token || null,
    expiresAt: Date.now() + Number(data.expires_in || 3600) * 1000,
  };
  return data.access_token || null;
}

async function paypalRequest<T>(path: string, method: string, body?: unknown): Promise<T | null> {
  const token = await getAccessToken();
  if (!token) return null;

  const response = await fetch(`${getPayPalApiBase()}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = (await response.json().catch(() => ({}))) as T & {
    message?: string;
    error_description?: string;
  };

  if (!response.ok) {
    const message = data.message || data.error_description || 'PayPal request failed.';
    throw Object.assign(new Error(message), { status: response.status >= 500 ? 502 : 400 });
  }

  return data;
}

async function ensureBillingPlan({
  cacheKey,
  name,
  amountUsd,
  billingCycle,
}: {
  cacheKey: string;
  name: string;
  amountUsd: number;
  billingCycle: string;
}) {
  if (planIdCache.has(cacheKey)) return planIdCache.get(cacheKey) as string;

  const product = await paypalRequest<{ id: string }>('/v1/catalogs/products', 'POST', {
    name,
    type: 'SERVICE',
    category: 'SOFTWARE',
  });

  const interval =
    billingCycle === 'annual'
      ? { interval_unit: 'YEAR', interval_count: 1 }
      : { interval_unit: 'MONTH', interval_count: 1 };

  const plan = await paypalRequest<{ id: string; status?: string }>('/v1/billing/plans', 'POST', {
    product_id: product?.id,
    name,
    status: 'ACTIVE',
    billing_cycles: [
      {
        frequency: interval,
        tenure_type: 'REGULAR',
        sequence: 1,
        total_cycles: 0,
        pricing_scheme: {
          fixed_price: {
            value: amountUsd.toFixed(2),
            currency_code: 'USD',
          },
        },
      },
    ],
    payment_preferences: {
      auto_bill_outstanding: true,
    },
  });

  if (!plan?.id) {
    throw Object.assign(new Error('Failed to create PayPal billing plan.'), { status: 502 });
  }

  if (plan.status && plan.status !== 'ACTIVE') {
    await paypalRequest(`/v1/billing/plans/${plan.id}/activate`, 'POST', {});
  }

  planIdCache.set(cacheKey, plan.id);
  return plan.id;
}

export async function createCheckoutSession({
  planKey,
  billingCycle = 'monthly',
  userId,
  successPath = '/billing/success',
  cancelPath = '/billing',
}: {
  planKey?: string;
  billingCycle?: string;
  userId: string;
  successPath?: string;
  cancelPath?: string;
}) {
  const metadata = {
    planKey: planKey || '',
    billingCycle,
    userId,
  };

  if (!isPayPalConfigured()) {
    return { devMode: true, url: null as string | null, metadata };
  }

  const customId = packMetadata(metadata);

  const plan = getPlanByKey(planKey || '');
  if (!plan || plan.key === 'free') {
    throw Object.assign(new Error('Invalid plan selected.'), { status: 400 });
  }

  const amountUsd = computeAmountUsd(plan, billingCycle);
  const paypalPlanId = await ensureBillingPlan({
    cacheKey: `career-track-${planKey}-${billingCycle}-${amountUsd.toFixed(2)}`,
    name: `Career Track ${plan.label}`,
    amountUsd,
    billingCycle,
  });

  return {
    checkoutMode: 'paypal_sdk' as const,
    paypalClientId: getPayPalClientId(),
    paypalPlanId,
    customId,
    devMode: false,
  };
}

export async function retrievePayPalSubscription(subscriptionId: string) {
  if (!subscriptionId) return null;
  return paypalRequest<{
    id: string;
    status: string;
    custom_id?: string;
    billing_info?: { next_billing_time?: string };
  }>(`/v1/billing/subscriptions/${subscriptionId}`, 'GET');
}

export async function cancelPayPalSubscription(subscriptionId: string, reason = 'Cancelled by user') {
  if (!subscriptionId || !isPayPalConfigured()) return false;

  const token = await getAccessToken();
  if (!token) return false;

  const response = await fetch(
    `${getPayPalApiBase()}/v1/billing/subscriptions/${subscriptionId}/cancel`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reason }),
    }
  );

  // 204 No Content = success. 422 = already cancelled/inactive (treat as done).
  if (response.status === 204 || response.status === 422) return true;

  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as {
      message?: string;
      error_description?: string;
    };
    throw Object.assign(new Error(data.message || data.error_description || 'PayPal cancellation failed.'), {
      status: response.status >= 500 ? 502 : 400,
    });
  }

  return true;
}

export async function confirmPayPalCheckout({
  subscriptionId,
}: {
  subscriptionId?: string;
}) {
  if (!subscriptionId) return null;

  const subscription = await retrievePayPalSubscription(subscriptionId);
  if (!subscription) return null;

  if (['ACTIVE', 'APPROVED'].includes(subscription.status)) {
    return handlePayPalCheckoutCompleted({ subscription });
  }

  return null;
}

export async function handlePayPalCheckoutCompleted({
  subscription,
}: {
  subscription?: { id: string; custom_id?: string; billing_info?: { next_billing_time?: string } };
}) {
  if (!subscription) return null;

  const metadata = unpackMetadata(subscription.custom_id);
  const { planKey, userId, billingCycle } = metadata;
  if (!userId || !planKey) return null;

  const currentPeriodEnd = subscription.billing_info?.next_billing_time
    ? new Date(subscription.billing_info.next_billing_time)
    : undefined;

  const result = await planService.activatePlan(userId, planKey, {
    paypalSubscriptionId: subscription.id,
    currentPeriodEnd,
  });

  await invoiceService.recordPayment({
    userId,
    planKey,
    billingCycle,
    paymentMethod: 'paypal',
    paypalSubscriptionId: subscription.id,
    paypalTransactionId: subscription.id,
    description: `${result.planLabel} subscription started`,
  });

  return result;
}

export async function handlePayPalWebhook(event: { event_type?: string; resource?: Record<string, unknown> }) {
  const eventType = event?.event_type;
  const resource = event?.resource;

  if (
    (eventType === 'BILLING.SUBSCRIPTION.ACTIVATED' || eventType === 'BILLING.SUBSCRIPTION.RE-ACTIVATED') &&
    resource?.id
  ) {
    const subscription = await retrievePayPalSubscription(String(resource.id));
    if (subscription?.status === 'ACTIVE') {
      return handlePayPalCheckoutCompleted({ subscription });
    }
  }

  if (eventType === 'BILLING.SUBSCRIPTION.CANCELLED' && resource?.id) {
    const subscription = await retrievePayPalSubscription(String(resource.id));
    const metadata = unpackMetadata(subscription?.custom_id);
    if (!metadata.userId) return null;

    const user = await User.findById(metadata.userId).select(
      'subscriptionCurrentPeriodEnd subscriptionCancelAtPeriodEnd'
    );
    const periodEnd = user?.subscriptionCurrentPeriodEnd ? new Date(user.subscriptionCurrentPeriodEnd) : null;
    const keepAccessUntilPeriodEnd =
      user?.subscriptionCancelAtPeriodEnd && periodEnd && periodEnd > new Date();

    if (keepAccessUntilPeriodEnd) return null;

    return planService.activatePlan(metadata.userId, 'free');
  }

  if (eventType === 'PAYMENT.SALE.COMPLETED' && resource?.id) {
    const sale = resource as {
      id?: string;
      amount?: { total?: string; currency?: string };
      billing_agreement_id?: string;
      create_time?: string;
    };
    const subscriptionId = sale.billing_agreement_id;
    if (!subscriptionId) return null;

    const subscription = await retrievePayPalSubscription(subscriptionId);
    const metadata = unpackMetadata(subscription?.custom_id);
    if (!metadata.userId || !metadata.planKey) return null;

    const catalog = PLAN_CATALOG[normalizePlan(metadata.planKey)];

    const recentActivation = await BillingInvoice.findOne({
      paypalSubscriptionId: subscriptionId,
      paypalTransactionId: subscriptionId,
    }).lean();
    if (recentActivation?.paidAt && sale.create_time) {
      const saleTime = new Date(sale.create_time).getTime();
      const activationTime = new Date(recentActivation.paidAt).getTime();
      if (Math.abs(saleTime - activationTime) < 60 * 60 * 1000) {
        return null;
      }
    }

    await invoiceService.recordPayment({
      userId: metadata.userId,
      planKey: metadata.planKey,
      billingCycle: metadata.billingCycle || 'monthly',
      paymentMethod: 'paypal',
      paypalSubscriptionId: subscriptionId,
      paypalTransactionId: sale.id,
      amount: sale.amount?.total ? Number.parseFloat(sale.amount.total) : undefined,
      description: `${catalog?.label ?? 'Career Pro'} renewal`,
      paidAt: sale.create_time ? new Date(sale.create_time) : new Date(),
    });
    return { recorded: true };
  }

  return null;
}

export async function verifyPayPalWebhook(req: {
  headers: Record<string, string | string[] | undefined>;
  body: Buffer;
}) {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!webhookId) return null;

  const transmissionId = req.headers['paypal-transmission-id'];
  const transmissionTime = req.headers['paypal-transmission-time'];
  const certUrl = req.headers['paypal-cert-url'];
  const authAlgo = req.headers['paypal-auth-algo'];
  const transmissionSig = req.headers['paypal-transmission-sig'];

  if (!transmissionId || !transmissionSig) return null;

  const body =
    typeof req.body === 'string'
      ? JSON.parse(req.body)
      : JSON.parse(req.body?.toString?.('utf8') || '{}');

  const verification = await paypalRequest<{ verification_status?: string }>(
    '/v1/notifications/verify-webhook-signature',
    'POST',
    {
      auth_algo: authAlgo,
      cert_url: certUrl,
      transmission_id: transmissionId,
      transmission_sig: transmissionSig,
      transmission_time: transmissionTime,
      webhook_id: webhookId,
      webhook_event: body,
    }
  );

  if (verification?.verification_status === 'SUCCESS') {
    return body;
  }

  return null;
}

export { isBillingDevMode };
