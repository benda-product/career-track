import { profileRepository } from '../../repositories/profile.repository';
import { IProfile } from './profile.model';

const COMPLETION_WEIGHTS = {
  headline: 5,
  summary: 10,
  phone: 5,
  location: 5,
  skills: 15,
  experience: 20,
  education: 15,
  projects: 10,
  certifications: 5,
  socialLinks: 5,
  resumeId: 5,
};

export class ProfileService {
  calculateCompletionScore(profile: IProfile): number {
    let score = 0;
    if (profile.headline) score += COMPLETION_WEIGHTS.headline;
    if (profile.summary) score += COMPLETION_WEIGHTS.summary;
    if (profile.phone) score += COMPLETION_WEIGHTS.phone;
    if (profile.location) score += COMPLETION_WEIGHTS.location;
    if (profile.skills?.length > 0) score += COMPLETION_WEIGHTS.skills;
    if (profile.experience?.length > 0) score += COMPLETION_WEIGHTS.experience;
    if (profile.education?.length > 0) score += COMPLETION_WEIGHTS.education;
    if (profile.projects?.length > 0) score += COMPLETION_WEIGHTS.projects;
    if (profile.certifications?.length > 0) score += COMPLETION_WEIGHTS.certifications;
    if (profile.socialLinks?.length > 0) score += COMPLETION_WEIGHTS.socialLinks;
    if (profile.resumeId) score += COMPLETION_WEIGHTS.resumeId;
    return Math.min(score, 100);
  }

  async getProfile(userId: string) {
    return profileRepository.getOrCreate(userId);
  }

  async updateProfile(userId: string, data: Partial<IProfile>) {
    const profile = await profileRepository.getOrCreate(userId);
    const updated = await profileRepository.update(userId, {
      ...data,
      userId: profile.userId,
    });
    if (!updated) return profile;

    const completionScore = this.calculateCompletionScore(updated);
    return profileRepository.update(userId, { completionScore });
  }

  async getCompletion(userId: string) {
    const profile = await profileRepository.getOrCreate(userId);
    const score = this.calculateCompletionScore(profile);
    const missing: string[] = [];

    if (!profile.headline) missing.push('headline');
    if (!profile.summary) missing.push('summary');
    if (!profile.skills?.length) missing.push('skills');
    if (!profile.experience?.length) missing.push('experience');
    if (!profile.education?.length) missing.push('education');
    if (!profile.resumeId) missing.push('resume');

    return { score, missing, strength: score >= 80 ? 'strong' : score >= 50 ? 'moderate' : 'weak' };
  }
}

export const profileService = new ProfileService();
