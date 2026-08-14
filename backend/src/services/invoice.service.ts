import { computePlanAmountUsd, getPlanByKey, normalizePlan, PLAN_CATALOG } from '../constants/plans';
import { BillingInvoice } from '../modules/billing/billing-invoice.model';
import type { BillingPaymentMethod } from '../modules/billing/billing-invoice.model';
import { User } from '../modules/auth/user.model';

function computePlanAmount(planKey: string, billingCycle = 'monthly') {
  return computePlanAmountUsd(getPlanByKey(planKey), billingCycle);
}

async function generateInvoiceNumber() {
  const year = new Date().getFullYear();
  const prefix = `CT-${year}-`;
  const last = await BillingInvoice.findOne({ invoiceNumber: new RegExp(`^${prefix}`) })
    .sort({ invoiceNumber: -1 })
    .select('invoiceNumber')
    .lean();

  const lastSeq = last?.invoiceNumber ? Number.parseInt(last.invoiceNumber.split('-')[2] || '0', 10) : 0;
  return `${prefix}${String(lastSeq + 1).padStart(6, '0')}`;
}

export const invoiceService = {
  computePlanAmount,

  async recordPayment({
    userId,
    planKey,
    billingCycle = 'monthly',
    paymentMethod,
    paypalSubscriptionId,
    paypalTransactionId,
    amount,
    description,
    paidAt,
  }: {
    userId: string;
    planKey: string;
    billingCycle?: string;
    paymentMethod: BillingPaymentMethod;
    paypalSubscriptionId?: string;
    paypalTransactionId?: string;
    amount?: number;
    description?: string;
    paidAt?: Date;
  }) {
    const cycle = billingCycle === 'annual' ? 'annual' : 'monthly';
    const catalog = PLAN_CATALOG[normalizePlan(planKey)];
    const txnId =
      paypalTransactionId ||
      (paypalSubscriptionId ? `${paypalSubscriptionId}-${paidAt?.toISOString().slice(0, 10) || 'initial'}` : `demo-${userId}-${Date.now()}`);

    const existing = await BillingInvoice.findOne({ paypalTransactionId: txnId });
    if (existing) return existing;

    const invoiceNumber = await generateInvoiceNumber();
    const resolvedAmount = amount ?? computePlanAmount(planKey, cycle);
    const planLabel = catalog?.label ?? planKey;

    return BillingInvoice.create({
      userId,
      invoiceNumber,
      planKey: normalizePlan(planKey),
      planLabel,
      amount: resolvedAmount,
      currency: 'USD',
      billingCycle: cycle,
      status: 'paid',
      paymentMethod,
      paypalSubscriptionId,
      paypalTransactionId: txnId,
      description: description || `${planLabel} subscription (${cycle})`,
      paidAt: paidAt || new Date(),
    });
  },

  async listForUser(userId: string, limit = 24) {
    const invoices = await BillingInvoice.find({ userId })
      .sort({ paidAt: -1 })
      .limit(limit)
      .lean();

    return invoices.map((invoice) => ({
      id: String(invoice._id),
      invoiceNumber: invoice.invoiceNumber,
      planKey: invoice.planKey,
      planLabel: invoice.planLabel,
      amount: invoice.amount,
      currency: invoice.currency,
      billingCycle: invoice.billingCycle,
      status: invoice.status,
      paymentMethod: invoice.paymentMethod,
      description: invoice.description,
      paidAt: invoice.paidAt,
      paypalSubscriptionId: invoice.paypalSubscriptionId ?? null,
    }));
  },

  async ensureReceiptForUser(userId: string, opts: { paymentMethod?: BillingPaymentMethod } = {}) {
    const user = await User.findById(userId).select(
      'subscriptionPlan subscriptionCurrentPeriodEnd paypalSubscriptionId updatedAt'
    );
    if (!user) return;
    const plan = normalizePlan(user.subscriptionPlan);
    if (plan !== 'pro') return;

    const existing = await BillingInvoice.findOne({ userId }).lean();
    if (existing) return;

    const paymentMethod: BillingPaymentMethod = opts.paymentMethod || (user.paypalSubscriptionId ? 'paypal' : 'demo');
    const paidAt =
      user.subscriptionCurrentPeriodEnd
        ? new Date(user.subscriptionCurrentPeriodEnd)
        : (user as { updatedAt?: Date }).updatedAt || new Date();

    await this.recordPayment({
      userId: String(userId),
      planKey: 'pro',
      billingCycle: 'monthly',
      paymentMethod,
      paypalSubscriptionId: user.paypalSubscriptionId || undefined,
      paypalTransactionId: user.paypalSubscriptionId
        ? `${user.paypalSubscriptionId}-backfill`
        : `backfill-${userId}-${Date.now()}`,
      description: `${PLAN_CATALOG.pro.label} (backfilled)`,
      paidAt,
    });
  },

  async getForUserById(userId: string, invoiceId: string) {
    const invoice = await BillingInvoice.findOne({ _id: invoiceId, userId }).lean();
    if (!invoice) return null;

    return {
      id: String(invoice._id),
      invoiceNumber: invoice.invoiceNumber,
      planKey: invoice.planKey,
      planLabel: invoice.planLabel,
      amount: invoice.amount,
      currency: invoice.currency,
      billingCycle: invoice.billingCycle,
      status: invoice.status,
      paymentMethod: invoice.paymentMethod,
      description: invoice.description,
      paidAt: invoice.paidAt,
      paypalSubscriptionId: invoice.paypalSubscriptionId ?? null,
    };
  },
};
