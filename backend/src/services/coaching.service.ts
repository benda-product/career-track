import { User } from '../modules/auth/user.model';
import { CoachingRequest } from '../modules/coaching/coaching.model';
import {
  PRO_COACHING_CREDITS_PER_MONTH,
  hasPlanFeature,
  normalizePlan,
} from '../constants/plans';
import { ApiError } from '../utils/apiError';

function currentPeriodKey(date = new Date()): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

async function syncCoachingCredits(userId: string) {
  const user = await User.findById(userId).select(
    'subscriptionPlan coachingCreditsRemaining coachingCreditsPeriod'
  );
  if (!user) throw new ApiError(404, 'User not found');

  const plan = normalizePlan(user.subscriptionPlan);
  const period = currentPeriodKey();

  if (!hasPlanFeature(plan, 'coaching_credits')) {
    if (user.coachingCreditsRemaining !== 0 || user.coachingCreditsPeriod) {
      user.coachingCreditsRemaining = 0;
      user.coachingCreditsPeriod = undefined;
      await user.save();
    }
    return { remaining: 0, allowance: 0, period };
  }

  if (user.coachingCreditsPeriod !== period) {
    user.coachingCreditsPeriod = period;
    user.coachingCreditsRemaining = PRO_COACHING_CREDITS_PER_MONTH;
    await user.save();
  }

  return {
    remaining: user.coachingCreditsRemaining ?? 0,
    allowance: PRO_COACHING_CREDITS_PER_MONTH,
    period,
  };
}

export const coachingService = {
  async getEntitlements(userId: string) {
    const user = await User.findById(userId).select('subscriptionPlan');
    const plan = normalizePlan(user?.subscriptionPlan);
    const hasFeature = hasPlanFeature(plan, 'coaching_credits');

    if (!hasFeature) {
      return {
        hasFeature: false,
        creditsRemaining: 0,
        creditsAllowance: 0,
        period: currentPeriodKey(),
        recentRequests: [],
      };
    }

    const credits = await syncCoachingCredits(userId);
    const recentRequests = await CoachingRequest.find({ userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('topic status createdAt')
      .lean();

    return {
      hasFeature: true,
      creditsRemaining: credits.remaining,
      creditsAllowance: credits.allowance,
      period: credits.period,
      recentRequests,
    };
  },

  async requestSession(
    userId: string,
    input: { topic?: string; message?: string }
  ) {
    const user = await User.findById(userId).select('subscriptionPlan');
    const plan = normalizePlan(user?.subscriptionPlan);
    if (!hasPlanFeature(plan, 'coaching_credits')) {
      throw new ApiError(403, 'Career Pro plan required for this feature. Upgrade in Billing.');
    }

    const topic = String(input.topic || '').trim();
    const message = String(input.message || '').trim();
    if (!topic) throw new ApiError(400, 'topic is required');
    if (!message) throw new ApiError(400, 'message is required');

    const credits = await syncCoachingCredits(userId);
    if (credits.remaining <= 0) {
      throw new ApiError(
        402,
        'No mock interview credits remaining this month. Credits renew on your next billing cycle.'
      );
    }

    const request = await CoachingRequest.create({
      userId,
      topic,
      message,
      status: 'pending',
    });

    await User.findByIdAndUpdate(userId, {
      $inc: { coachingCreditsRemaining: -1 },
    });

    const updated = await syncCoachingCredits(userId);

    return {
      request,
      creditsRemaining: updated.remaining,
      creditsAllowance: updated.allowance,
    };
  },
};
