import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response';
import { ApiError } from '../../utils/apiError';
import { User } from '../auth/user.model';
import { atsService } from '../../services/ats.service';

async function requireCandidateEmail(userId: string) {
  const user = await User.findById(userId).select('email role').lean();
  if (!user?.email) throw new ApiError(404, 'Candidate account not found');
  return String(user.email).toLowerCase();
}

export class MessagesController {
  listThreads = asyncHandler(async (req: AuthRequest, res: Response) => {
    const email = await requireCandidateEmail(req.user!.userId);
    const result = await atsService.listCandidateMessageThreads(email);
    sendSuccess(res, result, 'Message threads loaded');
  });

  listMessages = asyncHandler(async (req: AuthRequest, res: Response) => {
    const email = await requireCandidateEmail(req.user!.userId);
    const threadId = String(req.params.threadId || '');
    if (!threadId) throw new ApiError(400, 'threadId is required');
    const result = await atsService.listCandidateThreadMessages(email, threadId);
    sendSuccess(res, result, 'Messages loaded');
  });

  reply = asyncHandler(async (req: AuthRequest, res: Response) => {
    const email = await requireCandidateEmail(req.user!.userId);
    const body = String(req.body?.body || '').trim();
    const threadId = req.body?.threadId ? String(req.body.threadId) : undefined;
    const applicationId = req.body?.applicationId ? String(req.body.applicationId) : undefined;
    if (!body) throw new ApiError(400, 'Message body is required');
    if (!threadId && !applicationId) {
      throw new ApiError(400, 'threadId or applicationId is required');
    }
    const result = await atsService.replyCandidateMessage({
      email,
      body,
      threadId,
      applicationId,
    });
    sendSuccess(res, result, 'Reply sent', 201);
  });

  markRead = asyncHandler(async (req: AuthRequest, res: Response) => {
    const email = await requireCandidateEmail(req.user!.userId);
    const threadId = String(req.params.threadId || '');
    if (!threadId) throw new ApiError(400, 'threadId is required');
    const result = await atsService.markCandidateThreadRead(email, threadId);
    sendSuccess(res, result, 'Thread marked as read');
  });
}

export const messagesController = new MessagesController();
