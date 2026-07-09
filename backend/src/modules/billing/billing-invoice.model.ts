import mongoose, { Document, Schema } from 'mongoose';

export type BillingInvoiceStatus = 'paid' | 'refunded' | 'failed';
export type BillingPaymentMethod = 'paypal' | 'demo';

export interface IBillingInvoice extends Document {
  userId: mongoose.Types.ObjectId;
  invoiceNumber: string;
  planKey: string;
  planLabel: string;
  amount: number;
  currency: string;
  billingCycle: 'monthly' | 'annual';
  status: BillingInvoiceStatus;
  paymentMethod: BillingPaymentMethod;
  paypalSubscriptionId?: string;
  paypalTransactionId?: string;
  description: string;
  paidAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const billingInvoiceSchema = new Schema<IBillingInvoice>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    invoiceNumber: { type: String, required: true, unique: true },
    planKey: { type: String, required: true },
    planLabel: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'USD' },
    billingCycle: { type: String, enum: ['monthly', 'annual'], default: 'monthly' },
    status: { type: String, enum: ['paid', 'refunded', 'failed'], default: 'paid' },
    paymentMethod: { type: String, enum: ['paypal', 'demo'], required: true },
    paypalSubscriptionId: { type: String, index: true },
    paypalTransactionId: { type: String, unique: true, sparse: true },
    description: { type: String, required: true },
    paidAt: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true }
);

billingInvoiceSchema.index({ userId: 1, paidAt: -1 });

export const BillingInvoice = mongoose.model<IBillingInvoice>('BillingInvoice', billingInvoiceSchema);
