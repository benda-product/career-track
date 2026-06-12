import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { jobsService } from './jobs.service';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response';
import { getParam } from '../../utils/params';

export class JobsController {
  searchJobs = asyncHandler(async (req: AuthRequest, res: Response) => {
    const jobs = await jobsService.searchJobs(req.query as never);
    sendSuccess(res, jobs);
  });

  getJob = asyncHandler(async (req: AuthRequest, res: Response) => {
    const job = await jobsService.getJob(getParam(req.params.id), req.user?.userId);
    sendSuccess(res, job);
  });

  applyToJob = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { application, created } = await jobsService.applyToJob(
      req.user!.userId,
      getParam(req.params.id),
      req.body.resumeId,
      req.body.coverLetter
    );
    sendSuccess(
      res,
      application,
      created ? 'Application submitted' : 'You have already applied to this job',
      created ? 201 : 200
    );
  });

  saveJob = asyncHandler(async (req: AuthRequest, res: Response) => {
    const saved = await jobsService.saveJob(req.user!.userId, req.body);
    sendSuccess(res, saved, 'Job saved');
  });

  unsaveJob = asyncHandler(async (req: AuthRequest, res: Response) => {
    await jobsService.unsaveJob(req.user!.userId, getParam(req.params.id));
    sendSuccess(res, null, 'Job unsaved');
  });

  getSavedJobs = asyncHandler(async (req: AuthRequest, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await jobsService.getSavedJobs(req.user!.userId, page, limit);
    sendSuccess(res, result.jobs, 'Success', 200, {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
    });
  });

  getRecentlyViewed = asyncHandler(async (req: AuthRequest, res: Response) => {
    const jobs = await jobsService.getRecentlyViewed(req.user!.userId);
    sendSuccess(res, jobs);
  });

  getRecommended = asyncHandler(async (req: AuthRequest, res: Response) => {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const result = await jobsService.getRecommendedJobs(req.user!.userId, page, limit);
    sendSuccess(res, result.jobs, 'Recommended jobs fetched', 200, {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
    });
  });
}

export const jobsController = new JobsController();
