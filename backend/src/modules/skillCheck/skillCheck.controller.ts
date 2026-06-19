import { Request, Response } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response';
import { userRepository } from '../../repositories/user.repository';
import { profileRepository } from '../../repositories/profile.repository';
import { toCandidateProfileView } from '../profile/profile.mapper';
import { skillTestService } from '../../services/skillTest.service';
import {
  applySkillAssessmentSync,
  refreshSkillAssessmentsFromPlatform,
  SkillAssessmentInput,
} from '../../services/skillCheckSync.service';
import {
  createSkillCheckAssignment,
  listSkillCheckAssignments,
} from './skillCheckAssignment.service';
import { ApiError } from '../../utils/apiError';
import {
  buildCertificateDetail,
  isCertificateEligible,
  listOwnedCertificates,
} from '../../utils/certificate.utils';

export class SkillCheckController {
  getSsoUrl = asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = await userRepository.findById(req.user!.userId);
    const returnUrl = String(req.query.returnUrl || '');
    const targetPath = String(req.query.targetPath || '');

    const session = await skillTestService.createSsoSession({
      email: req.user!.email,
      name: user ? `${user.firstName} ${user.lastName}`.trim() : undefined,
      returnUrl: returnUrl || undefined,
      targetPath: targetPath || undefined,
      sourceApp: 'Career Track',
    });

    sendSuccess(res, session);
  });

  getSummary = asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = await userRepository.findById(req.user!.userId);
    if (!user) {
      sendSuccess(res, { skillAssessments: [], certifications: [] });
      return;
    }

    const profile = await profileRepository.getOrCreate(req.user!.userId);
    const view = toCandidateProfileView(user, profile);

    sendSuccess(res, {
      skillAssessments: view.skillAssessments,
      certifications: view.certifications,
    });
  });

  getAssignments = asyncHandler(async (req: AuthRequest, res: Response) => {
    const assignments = await listSkillCheckAssignments(req.user!.userId);
    sendSuccess(res, assignments);
  });

  getHistory = asyncHandler(async (req: AuthRequest, res: Response) => {
    const tests = await skillTestService.getTestsByEmail(req.user!.email);
    sendSuccess(res, tests);
  });

  getCertificates = asyncHandler(async (req: AuthRequest, res: Response) => {
    const tests = await skillTestService.getTestsByEmail(req.user!.email);
    sendSuccess(res, listOwnedCertificates(tests));
  });

  getCertificateDetail = asyncHandler(async (req: AuthRequest, res: Response) => {
    const testId = String(req.params.testId || '');
    if (!testId) {
      throw new ApiError(400, 'testId is required');
    }

    const user = await userRepository.findById(req.user!.userId);
    const tests = await skillTestService.getTestsByEmail(req.user!.email);
    const owned = tests.find((test) => test.bendaTestId === testId);
    if (!owned) {
      throw new ApiError(404, 'Certificate not found');
    }

    if (!isCertificateEligible(owned)) {
      throw new ApiError(400, 'Certificate is only available for hard level tests with score >= 80%.');
    }

    const candidateName = user ? `${user.firstName} ${user.lastName}`.trim() : 'Candidate';

    try {
      const detail = await skillTestService.getCertificateData(testId);
      sendSuccess(res, detail);
      return;
    } catch (error) {
      if (!(error instanceof ApiError) || error.statusCode !== 400) {
        throw error;
      }
    }

    sendSuccess(res, buildCertificateDetail(owned, candidateName));
  });

  verifyCertificate = asyncHandler(async (req: AuthRequest, res: Response) => {
    const certificateId = String(req.params.certificateId || '').trim();
    if (!certificateId) {
      throw new ApiError(400, 'certificateId is required');
    }

    const result = await skillTestService.verifyCertificate(certificateId);
    sendSuccess(res, result);
  });

  refreshFromPlatform = asyncHandler(async (req: AuthRequest, res: Response) => {
    await refreshSkillAssessmentsFromPlatform(req.user!.email);
    const user = await userRepository.findById(req.user!.userId);
    const profile = await profileRepository.getOrCreate(req.user!.userId);
    const view = user ? toCandidateProfileView(user, profile) : null;

    sendSuccess(res, {
      skillAssessments: view?.skillAssessments || [],
      certifications: view?.certifications || [],
    });
  });

  syncResults = asyncHandler(async (req: Request, res: Response) => {
    const { email, test } = req.body as {
      email?: string;
      test?: SkillAssessmentInput;
    };

    if (!email || !test?.bendaTestId) {
      res.status(400).json({ success: false, message: 'email and test.bendaTestId are required' });
      return;
    }

    await applySkillAssessmentSync(email, test);
    sendSuccess(res, { synced: true });
  });

  assignFromAts = asyncHandler(async (req: Request, res: Response) => {
    const {
      email,
      name,
      category,
      bendaLanguage,
      targetPath,
      level,
      recruiterId,
      recruiterName,
      atsAssignmentId,
      jobId,
      dueDate,
      notes,
    } = req.body as {
      email?: string;
      name?: string;
      category?: string;
      bendaLanguage?: string;
      targetPath?: string;
      level?: string;
      recruiterId?: string;
      recruiterName?: string;
      atsAssignmentId?: string;
      jobId?: string;
      dueDate?: string;
      notes?: string;
    };

    if (!email || !category) {
      throw new ApiError(400, 'email and category are required');
    }

    const assignment = await createSkillCheckAssignment({
      email,
      name,
      category,
      bendaLanguage,
      targetPath,
      level,
      recruiterId,
      recruiterName,
      atsAssignmentId,
      jobId,
      dueDate,
      notes,
    });

    sendSuccess(res, assignment, 'Skill check assigned', 201);
  });
}

export const skillCheckController = new SkillCheckController();
