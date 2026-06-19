import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { resumeBuilderService } from '../../services/resumeBuilder.service';
import { userRepository } from '../../repositories/user.repository';
import { clearResumeViewable, setResumeViewable } from '../../services/resumeViewable.service';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response';
import { getParam } from '../../utils/params';

export class ResumeController {
  getResumes = asyncHandler(async (req: AuthRequest, res: Response) => {
    const resumes = await resumeBuilderService.getResumes(req.user!.email);
    sendSuccess(res, resumes);
  });

  getResume = asyncHandler(async (req: AuthRequest, res: Response) => {
    const resume = await resumeBuilderService.getResume(req.user!.email, getParam(req.params.id));
    sendSuccess(res, resume);
  });

  createResume = asyncHandler(async (req: AuthRequest, res: Response) => {
    const resume = await resumeBuilderService.createResume(req.user!.email, req.body);
    sendSuccess(res, resume, 'Resume created', 201);
  });

  updateResume = asyncHandler(async (req: AuthRequest, res: Response) => {
    const resume = await resumeBuilderService.updateResume(
      req.user!.email,
      getParam(req.params.id),
      req.body
    );
    sendSuccess(res, resume, 'Resume updated');
  });

  deleteResume = asyncHandler(async (req: AuthRequest, res: Response) => {
    await resumeBuilderService.deleteResume(req.user!.email, getParam(req.params.id));
    sendSuccess(res, null, 'Resume deleted');
  });

  getSsoUrl = asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = await userRepository.findById(req.user!.userId);
    const returnUrl = String(req.query.returnUrl || '');
    const targetPath = String(req.query.targetPath || '');

    const session = await resumeBuilderService.createSsoSession({
      email: req.user!.email,
      name: user ? `${user.firstName} ${user.lastName}`.trim() : undefined,
      returnUrl: returnUrl || undefined,
      targetPath: targetPath || undefined,
    });

    sendSuccess(res, session);
  });

  getScore = asyncHandler(async (req: AuthRequest, res: Response) => {
    const score = await resumeBuilderService.getScore(
      req.user!.email,
      getParam(req.params.id)
    );
    sendSuccess(res, score);
  });

  checkAts = asyncHandler(async (req: AuthRequest, res: Response) => {
    const jobDescription = String(req.body?.jobDescription || '');
    const result = await resumeBuilderService.checkAts(
      req.user!.email,
      getParam(req.params.id),
      jobDescription
    );
    sendSuccess(res, result);
  });

  checkAtsUpload = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Resume file is required' });
    }
    const jobDescription = String(req.body?.jobDescription || '');
    const result = await resumeBuilderService.checkAtsUpload(req.file, jobDescription);
    sendSuccess(res, result);
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
    const resumeId = getParam(req.params.id);
    const pdf = await resumeBuilderService.downloadPdf(req.user!.email, resumeId);
    const inline = req.query.inline === '1';
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `${inline ? 'inline' : 'attachment'}; filename="resume-${resumeId}.pdf"`
    );
    res.send(pdf);
  });

  setViewable = asyncHandler(async (req: AuthRequest, res: Response) => {
    const resumeId = getParam(req.params.id);
    const viewable = req.body?.viewable !== false;

    const result = viewable
      ? await setResumeViewable(req.user!.userId, req.user!.email, resumeId)
      : await clearResumeViewable(req.user!.userId, resumeId);

    sendSuccess(res, result, viewable ? 'Resume is visible to recruiters' : 'Resume hidden from recruiters');
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
