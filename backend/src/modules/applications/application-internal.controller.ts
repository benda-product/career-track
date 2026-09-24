import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response';
import { ApiError } from '../../utils/apiError';
import { syncApplicationStageFromAts } from '../../services/applicationSync.service';
import { provisionApplicationFromAtsApply } from '../../services/applicationProvision.service';
import { notifyRecruiterMessageFromAts } from '../../services/recruiterMessageSync.service';

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

  notifyRecruiterMessage = asyncHandler(async (req: Request, res: Response) => {
    const {
      atsApplicationId,
      candidateEmail,
      subject,
      preview,
      jobTitle,
      companyName,
      recruiterName,
      communicationId,
      threadId,
      channel,
    } = req.body as {
      atsApplicationId?: string;
      candidateEmail?: string;
      subject?: string;
      preview?: string;
      jobTitle?: string;
      companyName?: string;
      recruiterName?: string;
      communicationId?: string;
      threadId?: string;
      channel?: string;
    };

    if (!atsApplicationId && !candidateEmail) {
      throw new ApiError(400, 'atsApplicationId or candidateEmail is required');
    }

    const result = await notifyRecruiterMessageFromAts({
      atsApplicationId,
      candidateEmail,
      subject,
      preview,
      jobTitle,
      companyName,
      recruiterName,
      communicationId,
      threadId,
      channel,
    });

    sendSuccess(
      res,
      result,
      result.notified ? 'Career Track candidate notified' : 'No Career Track candidate matched'
    );
  });
}

export const applicationInternalController = new ApplicationInternalController();
