import { profileRepository } from '../repositories/profile.repository';
import { userRepository } from '../repositories/user.repository';
import { resumeBuilderService } from './resumeBuilder.service';
import { buildResumePdfUrlForAts } from './applicationResume.service';
import { syncCandidateToTalentPool } from './talentPool.service';
import { ApiError } from '../utils/apiError';
import { logger } from '../utils/logger';

async function assertResumeOwnership(email: string, resumeId: string) {
  try {
    await resumeBuilderService.getResume(email, resumeId);
  } catch {
    throw new ApiError(404, 'Resume not found');
  }
}

export async function setResumeViewable(userId: string, email: string, resumeId: string) {
  await assertResumeOwnership(email, resumeId);

  const resumeUrl = await buildResumePdfUrlForAts(email, resumeId);
  if (!resumeUrl) {
    throw new ApiError(422, 'Could not publish resume PDF. Ensure Resume Builder is running.');
  }

  await profileRepository.update(userId, { resumeId, resumeUrl });

  try {
    await syncCandidateToTalentPool(userId);
  } catch (err) {
    logger.error('Talent pool sync after making resume viewable failed', { userId, resumeId, err });
  }

  return { resumeId, resumeUrl, viewable: true };
}

export async function clearResumeViewable(userId: string, resumeId: string) {
  const profile = await profileRepository.findByUserId(userId);
  if (!profile || profile.resumeId !== resumeId) {
    return { viewable: false };
  }

  await profileRepository.update(userId, { resumeId: undefined, resumeUrl: undefined });

  const user = await userRepository.findById(userId);
  if (user) {
    try {
      await syncCandidateToTalentPool(userId);
    } catch (err) {
      logger.error('Talent pool sync after clearing viewable resume failed', { userId, err });
    }
  }

  return { viewable: false };
}
