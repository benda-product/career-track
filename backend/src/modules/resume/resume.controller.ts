import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { resumeBuilderService } from '../../services/resumeBuilder.service';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response';
import { getParam } from '../../utils/params';

export class ResumeController {
  getResumes = asyncHandler(async (req: AuthRequest, res: Response) => {
    const resumes = await resumeBuilderService.getResumes(req.user!.userId);
    sendSuccess(res, resumes);
  });

  getResume = asyncHandler(async (req: AuthRequest, res: Response) => {
    const resume = await resumeBuilderService.getResume(getParam(req.params.id));
    sendSuccess(res, resume);
  });

  createResume = asyncHandler(async (req: AuthRequest, res: Response) => {
    const resume = await resumeBuilderService.createResume(req.user!.userId, req.body);
    sendSuccess(res, resume, 'Resume created', 201);
  });

  updateResume = asyncHandler(async (req: AuthRequest, res: Response) => {
    const resume = await resumeBuilderService.updateResume(getParam(req.params.id), req.body);
    sendSuccess(res, resume, 'Resume updated');
  });

  getScore = asyncHandler(async (req: AuthRequest, res: Response) => {
    const score = await resumeBuilderService.getScore(getParam(req.params.id));
    sendSuccess(res, score);
  });

  getTemplates = asyncHandler(async (_req: AuthRequest, res: Response) => {
    const templates = await resumeBuilderService.getTemplates();
    sendSuccess(res, templates);
  });

  getTemplate = asyncHandler(async (req: AuthRequest, res: Response) => {
    const template = await resumeBuilderService.getTemplate(getParam(req.params.id));
    sendSuccess(res, template);
  });

  downloadPdf = asyncHandler(async (req: AuthRequest, res: Response) => {
    const pdf = await resumeBuilderService.downloadPdf(getParam(req.params.id));
    sendSuccess(res, pdf);
  });

  getAnalytics = asyncHandler(async (req: AuthRequest, res: Response) => {
    const analytics = await resumeBuilderService.getAnalytics(getParam(req.params.id));
    sendSuccess(res, analytics);
  });

  getSuggestions = asyncHandler(async (req: AuthRequest, res: Response) => {
    const suggestions = await resumeBuilderService.getSuggestions(getParam(req.params.id));
    sendSuccess(res, suggestions);
  });

  getVersions = asyncHandler(async (req: AuthRequest, res: Response) => {
    const versions = await resumeBuilderService.getVersions(getParam(req.params.id));
    sendSuccess(res, versions);
  });

  getPreview = asyncHandler(async (req: AuthRequest, res: Response) => {
    const preview = await resumeBuilderService.getPreview(getParam(req.params.id));
    sendSuccess(res, preview);
  });
}

export const resumeController = new ResumeController();
