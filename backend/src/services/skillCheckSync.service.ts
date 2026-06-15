import { env } from '../config/env';
import { userRepository } from '../repositories/user.repository';
import { profileRepository } from '../repositories/profile.repository';
import { IProfile } from '../modules/profile/profile.model';
import { syncCandidateToTalentPool } from './talentPool.service';
import { logger } from '../utils/logger';

export interface SkillAssessmentInput {
  bendaTestId: string;
  category: string;
  level: string;
  marksObtained: number;
  fullMarks: number;
  percentage?: number;
  passed: boolean;
  certificateId?: string | null;
  completedAt?: string | Date;
}

function toDate(value?: string | Date): Date {
  if (!value) return new Date();
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function buildCertificationName(category: string, level: string) {
  const levelLabel = level ? `${level.charAt(0).toUpperCase()}${level.slice(1)}` : '';
  return levelLabel ? `${category} (${levelLabel}) Skill Certificate` : `${category} Skill Certificate`;
}

function mergeSkillAssessment(
  existing: IProfile['skillAssessments'],
  incoming: SkillAssessmentInput
) {
  const assessments = [...(existing || [])];
  const percentage =
    incoming.percentage ??
    (incoming.fullMarks > 0
      ? Math.round((incoming.marksObtained / incoming.fullMarks) * 100)
      : 0);

  const next = {
    bendaTestId: incoming.bendaTestId,
    category: incoming.category,
    level: incoming.level,
    marksObtained: incoming.marksObtained,
    fullMarks: incoming.fullMarks,
    percentage,
    passed: incoming.passed,
    certificateId: incoming.certificateId || undefined,
    completedAt: toDate(incoming.completedAt),
    platform: 'benda-test' as const,
  };

  const index = assessments.findIndex(
    (item) =>
      item.bendaTestId === incoming.bendaTestId ||
      (item.category === incoming.category && item.level === incoming.level)
  );

  if (index >= 0) {
    const current = assessments[index];
    if ((current.percentage || 0) > percentage && current.passed) {
      return assessments;
    }
    assessments[index] = { ...current, ...next };
    return assessments;
  }

  assessments.push(next);
  return assessments;
}

function mergeCertification(profile: IProfile, assessment: SkillAssessmentInput) {
  if (!assessment.passed) return profile.certifications || [];

  const certifications = [...(profile.certifications || [])];
  const certName = buildCertificationName(assessment.category, assessment.level);
  const verifyUrl = assessment.certificateId
    ? `${env.skillTest.clientUrl}/verify-certificate`
    : undefined;

  const existingIndex = certifications.findIndex(
    (cert) =>
      cert.credentialId === assessment.certificateId ||
      cert.name === certName
  );

  const nextCert = {
    name: certName,
    issuer: 'Benda Test Platform',
    issueDate: toDate(assessment.completedAt),
    credentialId: assessment.certificateId || assessment.bendaTestId,
    url: verifyUrl,
  };

  if (existingIndex >= 0) {
    certifications[existingIndex] = { ...certifications[existingIndex], ...nextCert };
    return certifications;
  }

  certifications.push(nextCert);
  return certifications;
}

function mergeVerifiedSkills(profile: IProfile, assessment: SkillAssessmentInput) {
  if (!assessment.passed) return profile.technicalSkills || [];

  const skills = [...(profile.technicalSkills || [])];
  const category = assessment.category?.trim();
  if (!category) return skills;

  if (!skills.some((skill) => skill.toLowerCase() === category.toLowerCase())) {
    skills.push(category);
  }

  return skills;
}

export async function applySkillAssessmentSync(
  email: string,
  assessment: SkillAssessmentInput
): Promise<void> {
  const user = await userRepository.findByEmail(email.toLowerCase().trim());
  if (!user) {
    logger.warn('Skill assessment sync skipped: user not found', { email });
    return;
  }

  const profile = await profileRepository.getOrCreate(String(user._id));
  profile.skillAssessments = mergeSkillAssessment(profile.skillAssessments, assessment);
  profile.certifications = mergeCertification(profile, assessment);
  profile.technicalSkills = mergeVerifiedSkills(profile, assessment);
  await profile.save();

  const { completeMatchingAssignments } = await import(
    '../modules/skillCheck/skillCheckAssignment.service'
  );
  await completeMatchingAssignments(email, {
    category: assessment.category,
    level: assessment.level,
    bendaTestId: assessment.bendaTestId,
    percentage:
      assessment.percentage ??
      (assessment.fullMarks > 0
        ? Math.round((assessment.marksObtained / assessment.fullMarks) * 100)
        : 0),
    passed: assessment.passed,
    certificateId: assessment.certificateId,
  });

  await syncCandidateToTalentPool(String(user._id));
}

export async function refreshSkillAssessmentsFromPlatform(email: string): Promise<void> {
  const user = await userRepository.findByEmail(email.toLowerCase().trim());
  if (!user) return;

  const { skillTestService } = await import('./skillTest.service');
  const tests = await skillTestService.getTestsByEmail(email);

  const profile = await profileRepository.getOrCreate(String(user._id));
  let nextAssessments = profile.skillAssessments || [];
  let nextCerts = profile.certifications || [];
  let nextSkills = profile.technicalSkills || [];

  for (const test of tests) {
    nextAssessments = mergeSkillAssessment(nextAssessments, test);
    const tempProfile = {
      ...profile.toObject(),
      certifications: nextCerts,
      technicalSkills: nextSkills,
    } as IProfile;
    nextCerts = mergeCertification(tempProfile, test);
    nextSkills = mergeVerifiedSkills(tempProfile, test);
  }

  profile.skillAssessments = nextAssessments;
  profile.certifications = nextCerts;
  profile.technicalSkills = nextSkills;
  await profile.save();
  await syncCandidateToTalentPool(String(user._id));
}
