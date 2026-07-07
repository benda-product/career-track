import { Router, Response } from 'express';
import { AuthRequest, authenticate, authorize } from '../middlewares/auth.middleware';
import { profileService } from '../modules/profile/profile.service';
import { applicationRepository } from '../repositories/application.repository';
import { jobsService } from '../modules/jobs/jobs.service';
import { recommendationService } from '../modules/jobs/recommendation.service';
import { Notification } from '../modules/notifications/notification.model';
import { planService } from '../services/plan.service';
import { hasPlanFeature } from '../constants/plans';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';

const router = Router();

router.get(
  '/',
  authenticate,
  authorize('candidate'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const plan = await planService.getUserPlan(userId);
    const advancedAnalytics = hasPlanFeature(plan, 'advanced_analytics');

    const [completion, analytics, savedJobs, recommended, recentNotifications] =
      await Promise.all([
        profileService.getCompletion(userId),
        advancedAnalytics
          ? applicationRepository.getAnalytics(userId)
          : applicationRepository.getBasicAnalytics(userId),
        jobsService.getSavedJobs(userId, 1, 5),
        recommendationService.getRecommendedJobs(userId, 1, 4),
        Notification.find({ userId }).sort({ createdAt: -1 }).limit(10),
      ]);

    sendSuccess(res, {
      profileCompletion: completion,
      applicationAnalytics: analytics,
      savedJobs: savedJobs.jobs,
      recommendedJobs: advancedAnalytics
        ? recommended.jobs
        : recommended.jobs.map((job) => ({ ...job, missingSkills: [] })),
      recentActivity: recentNotifications,
      featureFlags: {
        advancedAnalytics,
        priorityInsights: hasPlanFeature(plan, 'priority_insights'),
        coachingCredits: hasPlanFeature(plan, 'coaching_credits'),
      },
      widgets: {
        profileCompletion: completion.score,
        appliedJobs: analytics.totalApplications,
        savedJobs: savedJobs.total,
        interviews: analytics.interviews,
        offers: analytics.offers,
        successRate: analytics.successRate,
      },
    });
  })
);

export default router;
