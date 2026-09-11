import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response';
import { ApiError } from '../../utils/apiError';
import { syncApplicationStageFromAts } from '../../services/applicationSync.service';
import { provisionApplicationFromAtsApply } from '../../services/applicationProvision.service';

export class ApplicationInternalController {
  syncStageFromAts = asyncHandler(async (req: Request, res: Response) => {
    const {
      atsApplicationId,
      stage,
      previousStage,
      note,
      jobTitle,
      recruiterName,
    } = req.body as {
      atsApplicationId?: string;
      stage?: string;
      previousStage?: string;
      note?: string;
      jobTitle?: string;
      recruiterName?: string;
    };

    if (!atsApplicationId || !stage) {
      throw new ApiError(400, 'atsApplicationId and stage are required');
    }

    const result = await syncApplicationStageFromAts({
      atsApplicationId,
      stage,
      previousStage,
      note,
      jobTitle,
      recruiterName,
    });

    sendSuccess(res, result, result.synced ? 'Application stage synced' : 'No sync required');
  });

  createFromAtsApply = asyncHandler(async (req: Request, res: Response) => {
    const result = await provisionApplicationFromAtsApply(req.body || {});

    if (!result.ok) {
      throw new ApiError(400, result.reason || 'Unable to provision Career Track application');
    }

    sendSuccess(res, result, 'Career Track application ready');
  });
}

export const applicationInternalController = new ApplicationInternalController();
