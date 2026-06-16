import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response';
import { ApiError } from '../../utils/apiError';
import { syncApplicationStageFromAts } from '../../services/applicationSync.service';

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
}

export const applicationInternalController = new ApplicationInternalController();
