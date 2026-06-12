import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response';
import { recommendationService } from './recommendation.service';

export class RecommendationController {
  getRecommendedJobs = asyncHandler(async (req: AuthRequest, res: Response) => {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const result = await recommendationService.getRecommendedJobs(req.user!.userId, page, limit);

    sendSuccess(res, result.jobs, 'Recommended jobs fetched', 200, {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
    });
  });
}

export const recommendationController = new RecommendationController();
