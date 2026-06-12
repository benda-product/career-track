import { env } from '../config/env';
import { userRepository } from '../repositories/user.repository';
import { profileRepository } from '../repositories/profile.repository';
import { toCandidateProfileView } from '../modules/profile/profile.mapper';
import { atsService } from './ats.service';
import { logger } from '../utils/logger';

export async function syncCandidateToTalentPool(userId: string): Promise<void> {
  try {
    const user = await userRepository.findById(userId);
    if (!user) return;

    const profile = await profileRepository.getOrCreate(userId);
    const view = toCandidateProfileView(user, profile);
    const location = view.location || { city: '', state: '', country: '' };

    await atsService.syncCandidate({
      careerTrackUserId: userId,
      email: user.email,
      name: view.fullName,
      phone: view.phone,
      skills: view.skills,
      technicalSkills: view.technicalSkills,
      softSkills: view.softSkills,
      totalExperienceYears: view.totalExperienceYears,
      experience: view.totalExperienceYears,
      location,
      locationText: [location.city, location.state, location.country].filter(Boolean).join(', '),
      noticePeriodDays: profile.noticePeriodDays,
      employmentStatus: profile.employmentStatus,
      openToWork: view.openToWork,
      workExperiences: view.workExperiences,
      educations: view.educations,
      certifications: view.certifications,
      currentCompany: view.currentCompany,
      designation: view.designation,
      linkedinProfile: view.linkedinProfile,
      resumeUrl: view.resumeUrl,
      resumeId: view.resumeId,
      profileUrl: `${env.clientUrl}/profile`,
      preferredLocations: profile.careerPreferences?.desiredLocations || [],
    });
  } catch (err) {
    logger.error('Talent pool sync failed', { userId, err });
  }
}

export function buildApplicationCandidateData(
  user: NonNullable<Awaited<ReturnType<typeof userRepository.findById>>>,
  profile: Awaited<ReturnType<typeof profileRepository.getOrCreate>>
) {
  const view = toCandidateProfileView(user, profile);

  const location = view.location || { city: '', state: '', country: '' };

  return {
    name: view.fullName,
    email: user.email,
    phone: view.phone,
    skills: view.skills,
    technicalSkills: view.technicalSkills,
    totalExperienceYears: view.totalExperienceYears,
    location,
    locationText: [location.city, location.state, location.country].filter(Boolean).join(', '),
    noticePeriodDays: profile.noticePeriodDays,
    employmentStatus: profile.employmentStatus,
    openToWork: view.openToWork,
    workExperiences: view.workExperiences,
    educations: view.educations,
    currentCompany: view.currentCompany,
    designation: view.designation,
    careerTrackUserId: String(profile.userId),
  };
}
