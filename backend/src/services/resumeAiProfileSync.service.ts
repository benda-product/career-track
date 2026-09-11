import axios, { AxiosInstance } from 'axios';
import FormData from 'form-data';
import { env } from '../config/env';
import { IUser } from '../modules/auth/user.model';
import { IProfile } from '../modules/profile/profile.model';
import { logger } from '../utils/logger';

interface ResumeAiSyncResponse {
  userId: string;
  resumeId: string;
  created: boolean;
}

class ResumeAiProfileSyncService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: env.resumeBuilder.apiUrl,
      timeout: 60000,
      headers: {
        'Content-Type': 'application/json',
        'x-benda-key': env.internalSyncKey,
        'x-benda-internal-key': env.internalSyncKey,
      },
    });
  }

  private buildPayload(user: IUser, profile: IProfile) {
    const fullName = `${user.firstName} ${user.lastName}`.trim();
    const locationText =
      profile.location ||
      [profile.locationDetail?.city, profile.locationDetail?.state, profile.locationDetail?.country]
        .filter(Boolean)
        .join(', ');

    const skills = profile.technicalSkills?.length
      ? profile.technicalSkills
      : (profile.skills || []).map((skill) => skill.name).filter(Boolean);

    const education = (profile.education || []).map((edu) => ({
      institute: edu.institution || '',
      degree: edu.degree || '',
      specialization: edu.field || '',
      startYear: edu.startDate ? new Date(edu.startDate).getFullYear() : undefined,
      endYear: edu.endDate ? new Date(edu.endDate).getFullYear() : undefined,
    }));

    const experience = (profile.experience || []).map((exp) => ({
      company: exp.company || '',
      designation: exp.title || '',
      startDate: exp.startDate ? new Date(exp.startDate).toISOString() : '',
      endDate: exp.endDate ? new Date(exp.endDate).toISOString() : '',
      currentlyWorking: exp.current ?? false,
      description: exp.description || '',
    }));

    const linkedin =
      profile.linkedinProfile ||
      profile.socialLinks?.find((link) => link.platform?.toLowerCase() === 'linkedin')?.url;

    return {
      email: user.email,
      name: fullName,
      profilePicture: user.avatar || '',
      resumeUrl: profile.resumeUrl || '',
      personalInfo: {
        fullName,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: profile.phone || '',
        location: locationText,
        city: profile.locationDetail?.city || '',
        state: profile.locationDetail?.state || '',
        country: profile.locationDetail?.country || '',
        summary: profile.summary || '',
        headline: profile.majorSkill || profile.designation || profile.headline || '',
        linkedin: linkedin || '',
        photoUrl: user.avatar || '',
      },
      skills,
      experience,
      education,
      domainExperiences: profile.domainExperiences || [],
      professionalMeta: {
        age: profile.age,
        visaStatus: profile.visaStatus,
        majorSkill: profile.majorSkill,
        totalExperienceBand: profile.totalExperienceBand,
        isWorking: profile.isWorking,
        willingToRelocate: profile.careerPreferences?.willingToRelocate,
        courses: profile.courses || [],
      },
    };
  }

  async syncProfile(user: IUser, profile: IProfile): Promise<void> {
    try {
      const payload = this.buildPayload(user, profile);
      await this.client.post<{ success: boolean; data: ResumeAiSyncResponse }>(
        '/internal/profile-sync-from-career-track',
        payload
      );
      logger.info('Resume AI profile sync succeeded', { email: user.email });
    } catch (error) {
      logger.error('Resume AI profile sync failed', {
        email: user.email,
        error: axios.isAxiosError(error) ? error.message : error,
      });
    }
  }

  async syncResumeUpload(user: IUser, file: Express.Multer.File): Promise<void> {
    try {
      const form = new FormData();
      form.append('email', user.email);
      form.append('name', `${user.firstName} ${user.lastName}`.trim());
      form.append('resume', file.buffer, {
        filename: file.originalname || 'resume.pdf',
        contentType: file.mimetype || 'application/pdf',
      });

      await this.client.post('/internal/resumes/upload', form, {
        headers: {
          ...form.getHeaders(),
          'x-benda-key': env.internalSyncKey,
          'x-benda-internal-key': env.internalSyncKey,
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      });
      logger.info('Resume AI resume upload sync succeeded', { email: user.email });
    } catch (error) {
      logger.error('Resume AI resume upload sync failed', {
        email: user.email,
        error: axios.isAxiosError(error) ? error.message : error,
      });
    }
  }
}

export const resumeAiProfileSyncService = new ResumeAiProfileSyncService();
