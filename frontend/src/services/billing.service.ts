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
}

export interface CheckoutResult {
  devMode?: boolean;
  activated?: boolean;
  message?: string;
  plan?: PlanKey;
  planLabel?: string;
  url?: string | null;
  subscriptionId?: string;
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
};
