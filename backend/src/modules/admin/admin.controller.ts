import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { adminService } from './admin.service';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response';
import { ApiError } from '../../utils/apiError';

function queryText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function queryPage(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

function listQuery(req: AuthRequest) {
  return {
    search: queryText(req.query.search || req.query.q),
    page: queryPage(req.query.page, 1),
    limit: queryPage(req.query.limit, 20),
    stage: queryText(req.query.stage),
  };
}

export const getOverview = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const data = await adminService.getOverview();
  sendSuccess(res, data);
});

export const listCandidates = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await adminService.listCandidates(listQuery(req));
  sendSuccess(res, data, 'Candidates', 200, {
    page: data.page,
    limit: data.limit,
    total: data.total,
    totalPages: data.totalPages,
  });
});

export const getCandidate = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await adminService.getCandidate(String(req.params.id || ''));
  sendSuccess(res, data);
});

export const updateCandidate = asyncHandler(async (req: AuthRequest, res: Response) => {
  const isActive = req.body?.isActive;
  if (typeof isActive !== 'boolean') throw new ApiError(400, 'Active status is required');
  const data = await adminService.updateCandidate(String(req.params.id || ''), isActive);
  sendSuccess(res, data, isActive ? 'Candidate activated' : 'Candidate deactivated');
});

export const listProfiles = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await adminService.listProfiles(listQuery(req));
  sendSuccess(res, data, 'Profiles', 200, {
    page: data.page,
    limit: data.limit,
    total: data.total,
    totalPages: data.totalPages,
  });
});

export const getProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await adminService.getProfile(String(req.params.userId || ''));
  sendSuccess(res, data);
});

export const listApplications = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await adminService.listApplications(listQuery(req));
  sendSuccess(res, data, 'Applications', 200, {
    page: data.page,
    limit: data.limit,
    total: data.total,
    totalPages: data.totalPages,
  });
});

export const updateApplication = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await adminService.updateApplication(
    String(req.params.id || ''),
    {
      stage: typeof req.body?.stage === 'string' ? req.body.stage : undefined,
      note: typeof req.body?.note === 'string' ? req.body.note : undefined,
      recruiterFeedback:
        typeof req.body?.recruiterFeedback === 'string' ? req.body.recruiterFeedback : undefined,
    },
    req.user?.email || 'admin'
  );
  sendSuccess(res, data, 'Application updated');
});

export const listSavedJobs = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await adminService.listSavedJobs(listQuery(req));
  sendSuccess(res, data, 'Saved jobs', 200, {
    page: data.page,
    limit: data.limit,
    total: data.total,
    totalPages: data.totalPages,
  });
});

export const deleteSavedJob = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await adminService.deleteSavedJob(String(req.params.id || ''));
  sendSuccess(res, data, 'Saved job removed');
});

export const listJobs = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await adminService.listJobs(listQuery(req));
  sendSuccess(res, data, 'Jobs', 200, {
    page: data.page,
    limit: data.limit,
    total: data.total,
    totalPages: data.totalPages,
  });
});

export const getJob = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await adminService.getJob(String(req.params.id || ''));
  sendSuccess(res, data);
});

export const listActivity = asyncHandler(async (req: AuthRequest, res: Response) => {
  const data = await adminService.listActivity(listQuery(req));
  sendSuccess(res, data, 'Activity', 200, {
    page: data.page,
    limit: data.limit,
    total: data.total,
    totalPages: data.totalPages,
  });
});
