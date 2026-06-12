import { Router, Response } from 'express';
import { AuthRequest, authenticate, authorize } from '../middlewares/auth.middleware';
import { profileService } from '../modules/profile/profile.service';
import { applicationRepository } from '../repositories/application.repository';
import { jobsService } from '../modules/jobs/jobs.service';
import { recommendationService } from '../modules/jobs/recommendation.service';
import { Notification } from '../modules/notifications/notification.model';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/response';

const router = Router();

router.get(
  '/',
  authenticate,
  authorize('candidate'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;

    const [completion, analytics, savedJobs, recommended, recentNotifications] =
      await Promise.all([
        profileService.getCompletion(userId),
        applicationRepository.getAnalytics(userId),
        jobsService.getSavedJobs(userId, 1, 5),
        recommendationService.getRecommendedJobs(userId, 1, 4),
        Notification.find({ userId }).sort({ createdAt: -1 }).limit(10),
      ]);

    sendSuccess(res, {
      profileCompletion: completion,
      applicationAnalytics: analytics,
      savedJobs: savedJobs.jobs,
      recommendedJobs: recommended.jobs,
      recentActivity: recentNotifications,
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
