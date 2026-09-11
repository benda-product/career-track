import axios, { AxiosInstance } from 'axios';
import { env } from '../config/env';
import { IUser } from '../modules/auth/user.model';
import { IProfile } from '../modules/profile/profile.model';
import { logger } from '../utils/logger';

interface SkillCheckSyncResponse {
  userId: string;
}

class SkillCheckProfileSyncService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: env.skillTest.apiUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'x-benda-key': env.internalSyncKey,
        'x-benda-internal-key': env.internalSyncKey,
      },
    });
  }

  private buildPayload(user: IUser, profile: IProfile) {
    const fullName = `${user.firstName} ${user.lastName}`.trim();
    const education = profile.education?.[0];
    const locationText =
      profile.location ||
      [profile.locationDetail?.city, profile.locationDetail?.state, profile.locationDetail?.country]
        .filter(Boolean)
        .join(', ');

    return {
      email: user.email,
      name: fullName,
      bendaUserId: String(user._id),
      majorSkill: profile.majorSkill || profile.designation || '',
      profilePicture: user.avatar || '',
      resumeUrl: profile.resumeUrl || '',
      userInfo: {
        bio: profile.summary || '',
        phoneNumber: profile.phone || '',
        age: profile.age || '18-24',
        location: locationText || 'Unknown',
        skills: profile.technicalSkills?.length
          ? profile.technicalSkills
          : (profile.skills || []).map((skill) => skill.name).filter(Boolean),
        visaStatus: profile.visaStatus || 'Other',
        mostRecentDegree: education
          ? {
              collageName: education.institution || '',
              degreeName: education.degree || '',
              startYear: education.startDate || undefined,
              endYear: education.endDate || undefined,
            }
          : undefined,
        relocate: profile.careerPreferences?.willingToRelocate ?? false,
        experience: (profile.domainExperiences || []).map((exp) => ({
          domain: exp.domain,
          yearsOfExperience: exp.yearsOfExperience,
        })),
        totalYearsOfExperience: profile.totalExperienceBand || String(profile.totalExperienceYears ?? ''),
        isWorking: profile.isWorking ?? false,
        courses: profile.courses || [],
      },
    };
  }

  async syncProfile(user: IUser, profile: IProfile): Promise<void> {
    try {
      const payload = this.buildPayload(user, profile);
      await this.client.post<{ success: boolean; data: SkillCheckSyncResponse }>(
        '/internal/profile-sync-from-career-track',
        payload
      );
      logger.info('SkillCheck profile sync succeeded', { email: user.email });
    } catch (error) {
      logger.error('SkillCheck profile sync failed', {
        email: user.email,
        error: axios.isAxiosError(error) ? error.message : error,
      });
    }
  }
}

export const skillCheckProfileSyncService = new SkillCheckProfileSyncService();
