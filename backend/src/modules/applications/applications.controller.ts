import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { applicationRepository } from '../../repositories/application.repository';
import { planService } from '../../services/plan.service';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response';
import { ApiError } from '../../utils/apiError';
import { ApplicationStage } from '../../types';
import { getParam } from '../../utils/params';
import { backfillUserApplicationsFromAts } from '../../services/applicationBackfill.service';
import { userRepository } from '../../repositories/user.repository';

export class ApplicationsController {
  getApplications = asyncHandler(async (req: AuthRequest, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const stage = req.query.stage as ApplicationStage | undefined;
    const userId = req.user!.userId;
    const email = req.user!.email;

    const shouldSync =
      req.query.sync === 'true' ||
      req.query.sync === '1' ||
      req.query.refresh === 'true';

    let { applications, total } = await applicationRepository.findByUserId(
      userId,
      page,
      limit,
      stage
    );

    if (email && (shouldSync || total === 0)) {
      const user = await userRepository.findById(userId);
      const fullName = user
        ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
        : undefined;
      await backfillUserApplicationsFromAts(userId, email, fullName);
      ({ applications, total } = await applicationRepository.findByUserId(
        userId,
        page,
        limit,
        stage
      ));
    }

    sendSuccess(res, applications, 'Success', 200, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  });

  getApplication = asyncHandler(async (req: AuthRequest, res: Response) => {
    const application = await applicationRepository.findById(getParam(req.params.id));
    if (!application || application.userId.toString() !== req.user!.userId) {
      throw new ApiError(404, 'Application not found');
    }
    sendSuccess(res, application);
  });

  getAnalytics = asyncHandler(async (req: AuthRequest, res: Response) => {
    await planService.assertFeature(req.user!.userId, 'advanced_analytics');
    const analytics = await applicationRepository.getAnalytics(req.user!.userId);
    sendSuccess(res, analytics);
  });

  updateStage = asyncHandler(async (req: AuthRequest, res: Response) => {
    const application = await applicationRepository.findById(getParam(req.params.id));
    if (!application || application.userId.toString() !== req.user!.userId) {
      throw new ApiError(404, 'Application not found');
    }

    // Applications linked to Talent Desk (ATS) are recruiter-owned; candidates track only.
    if (application.atsApplicationId) {
      throw new ApiError(
        403,
        'Application status is managed by the recruiter and syncs automatically from Talent Desk'
      );
    }

    const updated = await applicationRepository.updateStage(
      getParam(req.params.id),
      req.body.stage,
      req.body.note
    );
    sendSuccess(res, updated, 'Application stage updated');
  });
}

export const applicationsController = new ApplicationsController();
