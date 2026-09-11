import { Types } from 'mongoose';
import { authService } from '../modules/auth/auth.service';
import { userRepository } from '../repositories/user.repository';
import { applicationRepository } from '../repositories/application.repository';
import { splitDisplayName } from './ecosystemAuth.service';
import { createCareerTrackSsoToken } from '../utils/careerTrackSso';
import { env } from '../config/env';
import { logger } from '../utils/logger';

export type ProvisionApplicationFromAtsInput = {
  email: string;
  fullName: string;
  phone?: string;
  atsApplicationId: string;
  atsJobId: string;
  jobTitle: string;
  company: string;
  companyLogo?: string;
  location?: string;
  atsStage?: string;
  source?: string;
  jobReferenceId?: string;
  /** When set (e.g. backfill for signed-in user), applications attach to this Career Track user. */
  targetUserId?: string;
};

export async function provisionApplicationFromAtsApply(input: ProvisionApplicationFromAtsInput) {
  const email = String(input.email || '').toLowerCase().trim();
  const atsApplicationId = String(input.atsApplicationId || '').trim();
  const atsJobId = String(input.atsJobId || '').trim();

  if (!email || !atsApplicationId || !atsJobId || !input.jobTitle || !input.company) {
    return {
      ok: false,
      reason: 'invalid_payload' as const,
    };
  }

  const nameParts = splitDisplayName(input.fullName || email.split('@')[0] || 'Applicant');

  const existingUser = await userRepository.findByEmail(email);

  const provision = await authService.provisionFromBendaInfotech({
    email,
    firstName: nameParts.firstName,
    lastName: nameParts.lastName,
    phone: input.phone,
  });

  const provisionUserId = provision.user.id;
  const userId = input.targetUserId || provisionUserId;
  const accountCreated = !existingUser;

  let application =
    (await applicationRepository.findByAtsApplicationId(atsApplicationId)) ||
    (await applicationRepository.findByUserAndJob(userId, atsJobId));

  if (!application) {
    try {
      application = await applicationRepository.create({
        userId: new Types.ObjectId(userId),
        jobId: atsJobId,
        jobTitle: input.jobTitle,
        company: input.company,
        companyLogo: input.companyLogo,
        location: input.location,
        stage: 'applied',
        atsApplicationId,
        atsStage: input.atsStage || 'applied',
        appliedAt: new Date(),
        isSaved: false,
        notes: input.jobReferenceId ? `Ref: ${input.jobReferenceId}` : undefined,
      });
    } catch (error) {
      const duplicate =
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code?: number }).code === 11000;
      if (duplicate) {
        application = await applicationRepository.findByUserAndJob(userId, atsJobId);
      } else {
        throw error;
      }
    }
  } else {
    const updates: Record<string, unknown> = {};
    if (application.userId.toString() !== userId) {
      updates.userId = new Types.ObjectId(userId);
    }
    if (!application.atsApplicationId) updates.atsApplicationId = atsApplicationId;
    if (!application.atsStage && input.atsStage) updates.atsStage = input.atsStage;
    if (Object.keys(updates).length) {
      application = await applicationRepository.update(application._id.toString(), updates);
    }
  }

  if (!application) {
    return { ok: false, reason: 'application_create_failed' as const };
  }

  const targetPath = '/applications/status';
  const token = createCareerTrackSsoToken({
    email,
    name: input.fullName,
    userId,
    targetPath,
    sourceApp: input.source || 'talent_desk_apply',
  });

  const careerTrackUrl = `${env.clientUrl}/auth/sso-login?token=${encodeURIComponent(
    token
  )}&redirect=${encodeURIComponent(targetPath)}`;

  logger.info('Career Track application provisioned from ATS apply', {
    atsApplicationId,
    careerTrackApplicationId: application._id.toString(),
    userId,
    source: input.source,
  });

  return {
    ok: true,
    userId,
    applicationId: application._id.toString(),
    accountCreated,
    careerTrackUrl,
    loginUrl: `${env.clientUrl}/auth/login?email=${encodeURIComponent(email)}`,
    signupUrl: `https://bendainfotech.com/signup?product=career_track&redirect=${encodeURIComponent('/applications/status')}&email=${encodeURIComponent(email)}`,
  };
}
