export const SUBSCRIPTION_PLANS = ['free', 'pro'] as const;
export type SubscriptionPlan = (typeof SUBSCRIPTION_PLANS)[number];

export const ANNUAL_DISCOUNT = 0.5;

export function computePlanAmountUsd(plan: { priceMonthly?: number; priceYearly?: number; savePercent?: number } | null | undefined, billingCycle = 'monthly') {
  if (!plan?.priceMonthly) return 0;
  if (billingCycle === 'annual' || billingCycle === 'yearly') {
    if (plan.priceYearly != null) return Number(plan.priceYearly);
    const discount = plan.savePercent != null ? plan.savePercent / 100 : ANNUAL_DISCOUNT;
    return Number((plan.priceMonthly * 12 * (1 - discount)).toFixed(2));
  }
  return plan.priceMonthly;
}

export const FREE_RECOMMENDED_JOBS_LIMIT = 20;
export const PRO_RECOMMENDED_JOBS_LIMIT = 100;
export const PRO_COACHING_CREDITS_PER_MONTH = 1;

export function normalizePlan(plan?: string | null): SubscriptionPlan {
  if (plan === 'pro' || plan === 'career_pro') return 'pro';
  return 'free';
}

export function isBillingDevMode() {
  return process.env.BILLING_DEV_MODE === 'true';
}

export function isPayPalEnabled() {
  return Boolean(process.env.PAYPAL_CLIENT_ID?.trim() && process.env.PAYPAL_CLIENT_SECRET?.trim());
}

/** True when checkout/cancel should call live PayPal (credentials set and dev mode off). */
export function isLivePayPalCheckout() {
  return isPayPalEnabled() && !isBillingDevMode();
}

export const PLAN_CATALOG = {
  free: {
    key: 'free' as const,
    label: 'Free',
    priceMonthly: 0,
    tag: 'Included with Benda Job Seeker',
    subtitle: 'Core job search and application tools.',
    features: [
      'Job search and saved jobs',
      'Application tracker',
      'Profile and resume integration',
      'Resume AI & SkillCheck free tiers via ecosystem',
      'Up to 20 recommended job matches',
    ],
  },
  pro: {
    key: 'pro' as const,
    label: 'Career Track Pro',
    priceMonthly: 14.99,
    priceYearly: 89.99,
    savePercent: 50,
    tag: 'Active job seekers',
    subtitle: 'Priority insights and advanced career analytics.',
    featured: true,
    features: [
      'Everything in Free',
      'Resume AI Pro included',
      'SkillCheck Pro included',
      'Priority job insights',
      'Advanced analytics dashboard',
      '1 mock interview credit per month',
      'Up to 100 recommended job matches',
    ],
  },
};

export type PlanCatalogKey = keyof typeof PLAN_CATALOG;

export function getPlanByKey(planKey?: string) {
  const key = normalizePlan(planKey);
  return PLAN_CATALOG[key];
}

export function hasPlanFeature(plan: SubscriptionPlan, feature: PlanFeature) {
  const flags = PLAN_FEATURE_FLAGS[plan];
  return Boolean(flags[feature]);
}

export type PlanFeature = 'priority_insights' | 'advanced_analytics' | 'coaching_credits';

const PLAN_FEATURE_FLAGS: Record<SubscriptionPlan, Record<PlanFeature, boolean>> = {
  free: {
    priority_insights: false,
    advanced_analytics: false,
    coaching_credits: false,
  },
  pro: {
    priority_insights: true,
    advanced_analytics: true,
    coaching_credits: true,
  },
};
