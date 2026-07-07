import { User } from '../modules/auth/user.model';
import {
  FREE_RECOMMENDED_JOBS_LIMIT,
  PLAN_CATALOG,
  PRO_RECOMMENDED_JOBS_LIMIT,
  hasPlanFeature,
  isBillingDevMode,
  isPayPalEnabled,
  normalizePlan,
  type PlanFeature,
  type SubscriptionPlan,
} from '../constants/plans';
import { CAREER_PRO_BUNDLE } from '../constants/bundles';
import { ApiError } from '../utils/apiError';
import { createCheckoutSession } from './paypal.service';
import {
  fetchActiveGrants,
  grantCareerProBundle,
  revokeCareerProBundle,
} from './entitlementClient.service';
import { coachingService } from './coaching.service';

export const planService = {
  async getUserPlan(userId: string): Promise<SubscriptionPlan> {
    const user = await User.findById(userId).select('subscriptionPlan');
    return normalizePlan(user?.subscriptionPlan);
  },

  async getEntitlements(userId: string) {
    const plan = await this.getUserPlan(userId);
    const catalog = PLAN_CATALOG[plan];
    const user = await User.findById(userId).select('email subscriptionCurrentPeriodEnd');

    let includedProducts: Record<
      string,
      { tier: string; source: string; label: string } | null
    > = {
      resumeAi: null,
      skillCheck: null,
    };

    if (user?.email) {
      const grants = await fetchActiveGrants(user.email);
      for (const item of CAREER_PRO_BUNDLE.includedProducts) {
        const grant = grants.find((g) => g.product === item.product && g.tier === item.tier);
        if (grant) {
          const key = item.product === 'resume_ai' ? 'resumeAi' : 'skillCheck';
          includedProducts[key] = {
            tier: item.tier,
            source: grant.source,
            label: item.label,
          };
        }
      }
    }

    const coaching = await coachingService.getEntitlements(userId);

    return {
      plan,
      planLabel: catalog.label,
      priceMonthly: catalog.priceMonthly,
      features: catalog.features,
      maxRecommendedJobs: plan === 'pro' ? PRO_RECOMMENDED_JOBS_LIMIT : FREE_RECOMMENDED_JOBS_LIMIT,
      coachingCreditsPerMonth: plan === 'pro' ? coaching.creditsAllowance : 0,
      coachingCreditsRemaining: coaching.creditsRemaining,
      paypalEnabled: isPayPalEnabled(),
      devMode: isBillingDevMode(),
      featureFlags: {
        priorityInsights: hasPlanFeature(plan, 'priority_insights'),
        advancedAnalytics: hasPlanFeature(plan, 'advanced_analytics'),
        coachingCredits: hasPlanFeature(plan, 'coaching_credits'),
      },
      includedProducts,
      subscriptionCurrentPeriodEnd: user?.subscriptionCurrentPeriodEnd ?? null,
    };
  },

  async assertFeature(userId: string, feature: PlanFeature) {
    const plan = await this.getUserPlan(userId);
    if (!hasPlanFeature(plan, feature)) {
      throw new ApiError(403, 'Career Pro plan required for this feature. Upgrade in Billing.');
    }
  },

  listPublicPlans() {
    return {
      plans: Object.values(PLAN_CATALOG),
      devMode: isBillingDevMode(),
      paypalEnabled: isPayPalEnabled(),
      bundleIncludes: CAREER_PRO_BUNDLE.includedProducts,
    };
  },

  async activatePlan(
    userId: string,
    planKey: string,
    meta: {
      paypalSubscriptionId?: string;
      currentPeriodEnd?: Date;
    } = {}
  ) {
    const plan = normalizePlan(planKey);
    const user = await User.findById(userId).select('email paypalSubscriptionId');

    if (plan === 'free') {
      const subscriptionId = user?.paypalSubscriptionId || meta.paypalSubscriptionId;
      if (user?.email && subscriptionId) {
        await revokeCareerProBundle({
          email: user.email,
          sourceSubscriptionId: subscriptionId,
        });
      }

      await User.findByIdAndUpdate(userId, {
        subscriptionPlan: 'free',
        paypalSubscriptionId: undefined,
        subscriptionCurrentPeriodEnd: undefined,
        coachingCreditsRemaining: 0,
        coachingCreditsPeriod: undefined,
      });
      return { plan: 'free' as const, planLabel: PLAN_CATALOG.free.label };
    }

    await User.findByIdAndUpdate(userId, {
      subscriptionPlan: 'pro',
      coachingCreditsRemaining: 1,
      coachingCreditsPeriod: new Date().toISOString().slice(0, 7),
      ...(meta.paypalSubscriptionId ? { paypalSubscriptionId: meta.paypalSubscriptionId } : {}),
      ...(meta.currentPeriodEnd ? { subscriptionCurrentPeriodEnd: meta.currentPeriodEnd } : {}),
    });

    if (user?.email) {
      await grantCareerProBundle({
        email: user.email,
        sourceSubscriptionId: meta.paypalSubscriptionId,
        currentPeriodEnd: meta.currentPeriodEnd,
      });
    }

    return { plan: 'pro' as const, planLabel: PLAN_CATALOG.pro.label };
  },

  async startCheckout(
    userId: string,
    { planKey, billingCycle = 'monthly' }: { planKey?: string; billingCycle?: string }
  ) {
    if (!planKey) {
      throw new ApiError(400, 'planKey is required.');
    }

    const plan = normalizePlan(planKey);
    if (plan === 'free') {
      throw new ApiError(400, 'Cannot checkout the free plan.');
    }

    const user = await User.findById(userId).select('email');
    if (!user) throw new ApiError(404, 'User not found');

    if (isBillingDevMode()) {
      const activated = await this.activatePlan(userId, planKey);
      return {
        devMode: true,
        activated: true,
        billingCycle,
        message: `${activated.planLabel} plan activated (demo mode). Resume AI Pro and SkillCheck Pro included.`,
        ...activated,
      };
    }

    const checkout = await createCheckoutSession({
      planKey,
      billingCycle,
      userId: userId.toString(),
    });

    if (checkout.devMode) {
      const activated = await this.activatePlan(userId, planKey);
      return {
        devMode: true,
        activated: true,
        billingCycle,
        message: `${activated.planLabel} plan activated (demo mode). Resume AI Pro and SkillCheck Pro included.`,
        ...activated,
      };
    }

    return {
      devMode: false,
      subscriptionId: checkout.subscriptionId,
      url: checkout.url,
    };
  },
};
