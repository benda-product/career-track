import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response';
import { recommendationService } from './recommendation.service';
import { planService } from '../../services/plan.service';
import {
  FREE_RECOMMENDED_JOBS_LIMIT,
  PRO_RECOMMENDED_JOBS_LIMIT,
  hasPlanFeature,
} from '../../constants/plans';

function stripPriorityInsights<T extends { missingSkills?: string[] }>(jobs: T[]): T[] {
  return jobs.map((job) => ({ ...job, missingSkills: [] }));
}

export class RecommendationController {
  getRecommendedJobs = asyncHandler(async (req: AuthRequest, res: Response) => {
    const page = parseInt(req.query.page as string, 10) || 1;
    let limit = parseInt(req.query.limit as string, 10) || 10;
    const userId = req.user!.userId;
    const plan = await planService.getUserPlan(userId);
    const maxLimit = plan === 'pro' ? PRO_RECOMMENDED_JOBS_LIMIT : FREE_RECOMMENDED_JOBS_LIMIT;
    limit = Math.min(limit, maxLimit);
    const result = await recommendationService.getRecommendedJobs(userId, page, limit);
    const jobs = hasPlanFeature(plan, 'priority_insights')
      ? result.jobs
      : stripPriorityInsights(result.jobs);

    sendSuccess(res, jobs, 'Recommended jobs fetched', 200, {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
    });
  });

  getInsights = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    await planService.assertFeature(userId, 'priority_insights');

    const plan = await planService.getUserPlan(userId);
    const limit = plan === 'pro' ? PRO_RECOMMENDED_JOBS_LIMIT : FREE_RECOMMENDED_JOBS_LIMIT;
    const result = await recommendationService.getRecommendedJobs(userId, 1, limit);
    const insights = recommendationService.computeInsights(result.jobs);

    sendSuccess(res, insights);
  });
}

export const recommendationController = new RecommendationController();
