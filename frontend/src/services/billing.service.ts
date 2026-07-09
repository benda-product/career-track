import apiClient from '@/lib/api-client';
import { ApiResponse } from '@/types';
import { PlanKey } from '@/config/plans';

export interface PlanEntitlements {
  plan: PlanKey;
  planLabel: string;
  priceMonthly: number;
  features: string[];
  maxRecommendedJobs: number;
  coachingCreditsPerMonth: number;
  coachingCreditsRemaining?: number;
  paypalEnabled: boolean;
  devMode: boolean;
  featureFlags: {
    priorityInsights: boolean;
    advancedAnalytics: boolean;
    coachingCredits: boolean;
  };
  includedProducts?: {
    resumeAi: { tier: string; source: string; label: string } | null;
    skillCheck: { tier: string; source: string; label: string } | null;
  };
  subscriptionCurrentPeriodEnd?: string | Date | null;
  subscriptionCancelAtPeriodEnd?: boolean;
}

export interface BillingInvoice {
  id: string;
  invoiceNumber: string;
  planKey: string;
  planLabel: string;
  amount: number;
  currency: string;
  billingCycle: 'monthly' | 'annual';
  status: 'paid' | 'refunded' | 'failed';
  paymentMethod: 'paypal' | 'demo';
  description: string;
  paidAt: string | Date;
  paypalSubscriptionId?: string | null;
}

export interface CheckoutResult {
  devMode?: boolean;
  activated?: boolean;
  message?: string;
  plan?: PlanKey;
  planLabel?: string;
  url?: string | null;
  subscriptionId?: string;
  checkoutMode?: 'paypal_sdk' | 'paypal_sdk_order';
  paypalClientId?: string;
  paypalPlanId?: string;
  customId?: string;
  orderAmount?: string;
  orderDescription?: string;
}

export const billingService = {
  getEntitlements: async () => {
    const res = await apiClient.get<ApiResponse<PlanEntitlements>>('/billing/entitlements');
    return res.data.data!;
  },

  listPlans: async () => {
    const res = await apiClient.get<
      ApiResponse<{
        plans: typeof import('@/config/plans').PLAN_CATALOG;
        devMode: boolean;
        paypalEnabled: boolean;
      }>
    >('/billing/catalog');
    return res.data.data!;
  },

  startCheckout: async (planKey: string, billingCycle: 'monthly' | 'annual' = 'monthly') => {
    const res = await apiClient.post<ApiResponse<CheckoutResult>>('/billing/checkout', {
      planKey,
      billingCycle,
    });
    return res.data.data!;
  },

  confirmCheckout: async (subscriptionId: string) => {
    const res = await apiClient.get<ApiResponse<{ activated: boolean; plan?: PlanKey; planLabel?: string }>>(
      '/billing/confirm',
      { params: { subscriptionId } }
    );
    return res.data.data!;
  },

  cancelSubscription: async () => {
    const res = await apiClient.post<
      ApiResponse<{
        cancelled: boolean;
        cancelAtPeriodEnd?: boolean;
        accessUntil?: string | Date;
        plan: PlanKey;
        planLabel: string;
        message: string;
      }>
    >('/billing/cancel');
    return res.data.data!;
  },

  listInvoices: async () => {
    const res = await apiClient.get<ApiResponse<BillingInvoice[]>>('/billing/invoices');
    return res.data.data!;
  },

  downloadInvoicePdf: async (invoiceId: string, invoiceNumber: string) => {
    const res = await apiClient.get(`/billing/invoices/${invoiceId}/pdf`, {
      responseType: 'blob',
    });
    const blob = res.data as Blob;
    const contentType = String(res.headers['content-type'] || '');
    if (!contentType.includes('application/pdf')) {
      const text = await blob.text();
      try {
        const parsed = JSON.parse(text) as { message?: string };
        throw new Error(parsed.message || 'Unable to download invoice.');
      } catch (error) {
        if (error instanceof Error && error.message !== 'Unable to download invoice.') throw error;
        throw new Error(text || 'Unable to download invoice.');
      }
    }
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${invoiceNumber}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};
