import {
  ANNUAL_DISCOUNT,
  getPlanByKey,
  isBillingDevMode,
} from '../constants/plans';
import { planService } from './plan.service';

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

function clientBaseUrl() {
  return process.env.CLIENT_URL || 'http://localhost:3003';
}

function computeAmountUsd(monthlyPrice: number, billingCycle = 'monthly') {
  if (billingCycle === 'annual') {
    return monthlyPrice * 12 * (1 - ANNUAL_DISCOUNT);
  }
  return monthlyPrice;
}

function packMetadata(metadata: Record<string, string>) {
  const raw = JSON.stringify(metadata);
  if (raw.length > 127) {
    throw Object.assign(new Error('Checkout metadata is too large for PayPal.'), { status: 400 });
  }
  return raw;
}

export function unpackMetadata(customId?: string) {
  if (!customId) return {};
  try {
    return JSON.parse(customId) as Record<string, string>;
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

  const plan = await paypalRequest<{ id: string }>('/v1/billing/plans', 'POST', {
    product_id: product?.id,
    name,
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

  planIdCache.set(cacheKey, plan?.id || '');
  return plan?.id || '';
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

  const returnUrl = `${clientBaseUrl()}${successPath}`;
  const cancelUrl = `${clientBaseUrl()}${cancelPath}`;
  const customId = packMetadata(metadata);

  const plan = getPlanByKey(planKey || '');
  if (!plan || plan.key === 'free') {
    throw Object.assign(new Error('Invalid plan selected.'), { status: 400 });
  }

  const amountUsd = computeAmountUsd(plan.priceMonthly, billingCycle);
  const paypalPlanId = await ensureBillingPlan({
    cacheKey: `career-track-${planKey}-${billingCycle}-${amountUsd.toFixed(2)}`,
    name: `Career Track ${plan.label}`,
    amountUsd,
    billingCycle,
  });

  const subscription = await paypalRequest<{ id: string; links?: { rel: string; href: string }[] }>(
    '/v1/billing/subscriptions',
    'POST',
    {
      plan_id: paypalPlanId,
      custom_id: customId,
      application_context: {
        brand_name: 'Career Track',
        user_action: 'SUBSCRIBE_NOW',
        return_url: returnUrl,
        cancel_url: cancelUrl,
      },
    }
  );

  const approveUrl = subscription?.links?.find((link) => link.rel === 'approve')?.href;
  return { subscriptionId: subscription?.id, url: approveUrl, devMode: false };
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
  const { planKey, userId } = metadata;
  if (!userId || !planKey) return null;

  const currentPeriodEnd = subscription.billing_info?.next_billing_time
    ? new Date(subscription.billing_info.next_billing_time)
    : undefined;

  return planService.activatePlan(userId, planKey, {
    paypalSubscriptionId: subscription.id,
    currentPeriodEnd,
  });
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
    if (metadata.userId) {
      return planService.activatePlan(metadata.userId, 'free');
    }
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
