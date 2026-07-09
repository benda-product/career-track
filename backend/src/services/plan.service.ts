import { User } from '../modules/auth/user.model';
import {
  FREE_RECOMMENDED_JOBS_LIMIT,
  PLAN_CATALOG,
  PRO_RECOMMENDED_JOBS_LIMIT,
  hasPlanFeature,
  isBillingDevMode,
  isLivePayPalCheckout,
  isPayPalEnabled,
  normalizePlan,
  type PlanFeature,
  type SubscriptionPlan,
} from '../constants/plans';
import { CAREER_PRO_BUNDLE } from '../constants/bundles';
import { ApiError } from '../utils/apiError';
import { createCheckoutSession, cancelPayPalSubscription, retrievePayPalSubscription } from './paypal.service';
import {
  fetchActiveGrants,
  grantCareerProBundle,
  revokeCareerProBundle,
} from './entitlementClient.service';
import { coachingService } from './coaching.service';
import { invoiceService } from './invoice.service';
import { generateInvoicePdf } from './invoice-pdf.service';

export const planService = {
  async expireSubscriptionIfNeeded(userId: string) {
    const user = await User.findById(userId).select(
      'subscriptionPlan subscriptionCurrentPeriodEnd subscriptionCancelAtPeriodEnd'
    );
    if (!user || normalizePlan(user.subscriptionPlan) !== 'pro') return;
    if (!user.subscriptionCancelAtPeriodEnd || !user.subscriptionCurrentPeriodEnd) return;
    if (new Date() < new Date(user.subscriptionCurrentPeriodEnd)) return;

    await this.activatePlan(userId, 'free');
    await User.findByIdAndUpdate(userId, { subscriptionCancelAtPeriodEnd: false });
  },

  async getUserPlan(userId: string): Promise<SubscriptionPlan> {
    await this.expireSubscriptionIfNeeded(userId);
    const user = await User.findById(userId).select('subscriptionPlan');
    return normalizePlan(user?.subscriptionPlan);
  },

  async getEntitlements(userId: string) {
    const plan = await this.getUserPlan(userId);
    const catalog = PLAN_CATALOG[plan];
    const user = await User.findById(userId).select(
      'email subscriptionCurrentPeriodEnd subscriptionCancelAtPeriodEnd'
    );

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
      paypalEnabled: isLivePayPalCheckout(),
      devMode: isBillingDevMode(),
      featureFlags: {
        priorityInsights: hasPlanFeature(plan, 'priority_insights'),
        advancedAnalytics: hasPlanFeature(plan, 'advanced_analytics'),
        coachingCredits: hasPlanFeature(plan, 'coaching_credits'),
      },
      includedProducts,
      subscriptionCurrentPeriodEnd: user?.subscriptionCurrentPeriodEnd ?? null,
      subscriptionCancelAtPeriodEnd: user?.subscriptionCancelAtPeriodEnd ?? false,
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
      paypalEnabled: isLivePayPalCheckout(),
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
        subscriptionCancelAtPeriodEnd: false,
        coachingCreditsRemaining: 0,
        coachingCreditsPeriod: undefined,
      });
      return { plan: 'free' as const, planLabel: PLAN_CATALOG.free.label };
    }

    await User.findByIdAndUpdate(userId, {
      subscriptionPlan: 'pro',
      subscriptionCancelAtPeriodEnd: false,
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
      await invoiceService.recordPayment({
        userId: userId.toString(),
        planKey,
        billingCycle,
        paymentMethod: 'demo',
        paypalTransactionId: `demo-${userId}-${Date.now()}`,
        description: `${activated.planLabel} activation (demo mode)`,
      });
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
      await invoiceService.recordPayment({
        userId: userId.toString(),
        planKey,
        billingCycle,
        paymentMethod: 'demo',
        paypalTransactionId: `demo-${userId}-${Date.now()}`,
        description: `${activated.planLabel} activation (demo mode)`,
      });
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
      checkoutMode: checkout.checkoutMode,
      paypalClientId: checkout.paypalClientId,
      paypalPlanId: checkout.paypalPlanId,
      customId: checkout.customId,
    };
  },

  async listInvoices(userId: string) {
    return invoiceService.listForUser(userId);
  },

  async downloadInvoicePdf(userId: string, invoiceId: string) {
    const invoice = await invoiceService.getForUserById(userId, invoiceId);
    if (!invoice) throw new ApiError(404, 'Invoice not found.');

    const user = await User.findById(userId).select('firstName lastName email');
    if (!user) throw new ApiError(404, 'User not found.');

    const buffer = await generateInvoicePdf(
      'Career Track',
      {
        name: `${user.firstName} ${user.lastName}`.trim() || user.email,
        email: user.email,
      },
      {
        invoiceNumber: invoice.invoiceNumber,
        description: invoice.description,
        planLabel: invoice.planLabel,
        billingCycle: invoice.billingCycle,
        amount: invoice.amount,
        currency: invoice.currency,
        status: invoice.status,
        paymentMethod: invoice.paymentMethod,
        paidAt: new Date(invoice.paidAt),
      },
    );

    return {
      buffer,
      filename: `${invoice.invoiceNumber}.pdf`,
    };
  },

  async cancelSubscription(userId: string) {
    const user = await User.findById(userId).select(
      'subscriptionPlan paypalSubscriptionId subscriptionCurrentPeriodEnd subscriptionCancelAtPeriodEnd'
    );
    if (!user) throw new ApiError(404, 'User not found');

    if (normalizePlan(user.subscriptionPlan) !== 'pro') {
      throw new ApiError(400, 'No active Career Pro subscription to cancel.');
    }

    if (user.subscriptionCancelAtPeriodEnd) {
      throw new ApiError(400, 'Your subscription is already scheduled to cancel at the end of the billing period.');
    }

    let periodEnd = user.subscriptionCurrentPeriodEnd ? new Date(user.subscriptionCurrentPeriodEnd) : null;

    if (!periodEnd && user.paypalSubscriptionId && isLivePayPalCheckout()) {
      const subscription = await retrievePayPalSubscription(user.paypalSubscriptionId);
      if (subscription?.billing_info?.next_billing_time) {
        periodEnd = new Date(subscription.billing_info.next_billing_time);
        await User.findByIdAndUpdate(userId, { subscriptionCurrentPeriodEnd: periodEnd });
      }
    }

    if (user.paypalSubscriptionId && isLivePayPalCheckout()) {
      await cancelPayPalSubscription(user.paypalSubscriptionId);
    }

    const hasRemainingPeriod = periodEnd && periodEnd > new Date();

    if (hasRemainingPeriod) {
      await User.findByIdAndUpdate(userId, { subscriptionCancelAtPeriodEnd: true });
      const untilLabel = periodEnd.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      return {
        cancelled: true,
        cancelAtPeriodEnd: true,
        accessUntil: periodEnd,
        plan: 'pro' as const,
        planLabel: PLAN_CATALOG.pro.label,
        message: `Subscription cancelled. You keep Career Pro (including Resume AI Pro and SkillCheck Pro) until ${untilLabel}. You will not be charged again.`,
      };
    }

    const result = await this.activatePlan(userId, 'free');

    return {
      cancelled: true,
      cancelAtPeriodEnd: false,
      plan: result.plan,
      planLabel: result.planLabel,
      message:
        'Career Pro cancelled. Resume AI Pro and SkillCheck Pro access has been removed and you are back on the Free plan.',
    };
  },
};
