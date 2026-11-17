import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { jobsService } from './jobs.service';
import { planService } from '../../services/plan.service';
import { hasPlanFeature, FREE_RECOMMENDED_JOBS_LIMIT, PRO_RECOMMENDED_JOBS_LIMIT } from '../../constants/plans';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response';
import { getParam } from '../../utils/params';
import { resolveViewerMarket } from '../../utils/jobMarket';

export class JobsController {
  searchJobs = asyncHandler(async (req: AuthRequest, res: Response) => {
    const {
      query,
      location,
      market,
      viewerCountry,
      employmentType,
      skills,
      experience,
      industry,
      remote,
      hybrid,
      page,
      limit,
    } = req.query;

    const resolved = await resolveViewerMarket({
      market: typeof market === 'string' ? market : undefined,
      viewerCountry: typeof viewerCountry === 'string' ? viewerCountry : undefined,
      userId: req.user?.userId,
      // Only default from profile when the client omitted market entirely.
      defaultFromProfile: market === undefined && viewerCountry === undefined,
    });

    const jobs = await jobsService.searchJobs({
      query: typeof query === 'string' ? query : undefined,
      location: typeof location === 'string' ? location : undefined,
      market: resolved.market,
      employmentType: typeof employmentType === 'string' ? employmentType : undefined,
      skills: typeof skills === 'string' ? skills : undefined,
      experience: typeof experience === 'string' ? experience : undefined,
      industry: typeof industry === 'string' ? industry : undefined,
      remote: remote === 'true' ? true : undefined,
      hybrid: hybrid === 'true' ? true : undefined,
      page: page != null ? Number(page) : undefined,
      limit: limit != null ? Number(limit) : undefined,
    });
    sendSuccess(res, jobs, 'Success', 200, {
      market: resolved.market || null,
      marketSource: resolved.source,
    });
  });

  getJob = asyncHandler(async (req: AuthRequest, res: Response) => {
    const resolved = await resolveViewerMarket({
      market: typeof req.query.market === 'string' ? req.query.market : undefined,
      viewerCountry:
        typeof req.query.viewerCountry === 'string' ? req.query.viewerCountry : undefined,
      userId: req.user?.userId,
      defaultFromProfile: false,
    });
    const job = await jobsService.getJob(
      getParam(req.params.id),
      req.user?.userId,
      resolved.market
    );
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
    let limit = parseInt(req.query.limit as string, 10) || 10;
    const plan = await planService.getUserPlan(req.user!.userId);
    const maxLimit = plan === 'pro' ? PRO_RECOMMENDED_JOBS_LIMIT : FREE_RECOMMENDED_JOBS_LIMIT;
    limit = Math.min(limit, maxLimit);
    const resolved = await resolveViewerMarket({
      market: typeof req.query.market === 'string' ? req.query.market : undefined,
      viewerCountry:
        typeof req.query.viewerCountry === 'string' ? req.query.viewerCountry : undefined,
      userId: req.user!.userId,
      defaultFromProfile: req.query.market === undefined && req.query.viewerCountry === undefined,
    });
    const result = await jobsService.getRecommendedJobs(
      req.user!.userId,
      page,
      limit,
      resolved.market
    );
    const jobs = hasPlanFeature(plan, 'priority_insights')
      ? result.jobs
      : result.jobs.map((job) => ({ ...job, missingSkills: [] }));
    sendSuccess(res, jobs, 'Recommended jobs fetched', 200, {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
      market: resolved.market || null,
      marketSource: resolved.source,
    });
  });
}

export const jobsController = new JobsController();
