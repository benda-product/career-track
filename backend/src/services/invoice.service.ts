import { ANNUAL_DISCOUNT, getPlanByKey, normalizePlan, PLAN_CATALOG } from '../constants/plans';
import { BillingInvoice } from '../modules/billing/billing-invoice.model';
import type { BillingPaymentMethod } from '../modules/billing/billing-invoice.model';

function computePlanAmount(planKey: string, billingCycle = 'monthly') {
  const plan = getPlanByKey(planKey);
  if (!plan || plan.priceMonthly === 0) return 0;
  if (billingCycle === 'annual') {
    return Number((plan.priceMonthly * 12 * (1 - ANNUAL_DISCOUNT)).toFixed(2));
  }
  return plan.priceMonthly;
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
