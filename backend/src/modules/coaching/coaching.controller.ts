import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { coachingService } from '../../services/coaching.service';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response';

export class CoachingController {
  getEntitlements = asyncHandler(async (req: AuthRequest, res: Response) => {
    const data = await coachingService.getEntitlements(req.user!.userId);
    sendSuccess(res, data);
  });

  requestSession = asyncHandler(async (req: AuthRequest, res: Response) => {
    const data = await coachingService.requestSession(req.user!.userId, req.body);
    sendSuccess(res, data, 'Mock interview request submitted', 201);
  });
}

export const coachingController = new CoachingController();
