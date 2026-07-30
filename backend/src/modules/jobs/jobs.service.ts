import mongoose from 'mongoose';
import { atsService, JobSearchFilters } from '../../services/ats.service';
import { SavedJob } from './savedJob.model';
import { RecentlyViewed } from './recentlyViewed.model';
import { applicationRepository } from '../../repositories/application.repository';
import { profileRepository } from '../../repositories/profile.repository';
import { userRepository } from '../../repositories/user.repository';
import { IApplication } from '../applications/application.model';
import { logger } from '../../utils/logger';
import { buildApplicationCandidateData } from '../../services/talentPool.service';
import {
  buildResumePdfUrlForAts,
  pickApplicationResumeUrl,
} from '../../services/applicationResume.service';
import { extractJob, extractJobsList, NormalizedJob } from '../../utils/atsJob.mapper';
import { recommendationService } from './recommendation.service';
import { resumeBuilderService } from '../../services/resumeBuilder.service';
import { ApiError } from '../../utils/apiError';

function toAtsQuery(filters: JobSearchFilters): Record<string, unknown> {
  const params: Record<string, unknown> = { ...filters };
  if (filters.query) {
    params.search = filters.query;
    params.title = filters.query;
    delete params.query;
  }
  if (filters.employmentType) {
    params.jobType = filters.employmentType;
    delete params.employmentType;
  }
  if (Array.isArray(filters.skills)) {
    params.skills = filters.skills.join(',');
  }
  return params;
}

export class JobsService {
  async searchJobs(filters: JobSearchFilters): Promise<NormalizedJob[]> {
    const result = await atsService.searchJobs(toAtsQuery(filters) as JobSearchFilters);
    return extractJobsList(result);
  }

  async getJob(jobId: string, userId?: string): Promise<NormalizedJob> {
    const result = await atsService.getJob(jobId);
    const job = extractJob(result);

    if (userId) {
      await RecentlyViewed.findOneAndUpdate(
        { userId, jobId },
        {
          userId,
          jobId,
          jobTitle: job.title,
          company: job.company,
          viewedAt: new Date(),
        },
        { upsert: true, new: true }
      );
    }

    let hasApplied = false;
    let appliedResumeId: string | undefined;
    let appliedResumeTitle: string | undefined;
    if (userId) {
      const existing = await applicationRepository.findByUserAndJob(userId, jobId);
      if (existing && !existing.isSaved) {
        hasApplied = true;
        appliedResumeId = existing.resumeId;
        appliedResumeTitle = existing.resumeTitle;
      }
    }

    return { ...job, hasApplied, appliedResumeId, appliedResumeTitle };
  }

  private async resolveResumeForApply(email: string, resumeId?: string) {
    if (!resumeId?.trim()) {
      throw new ApiError(400, 'Please select a resume to submit with your application.');
    }

    try {
      const resume = (await resumeBuilderService.getResume(email, resumeId)) as {
        title?: string;
        id?: string;
        _id?: string;
      };
      return {
        resumeId: String(resume.id || resume._id || resumeId),
        resumeTitle: resume.title?.trim() || 'Resume',
      };
    } catch (err) {
      if (err instanceof ApiError) throw err;
      throw new ApiError(404, 'Selected resume was not found. Choose another resume or create a new one.');
    }
  }

  private async syncApplicationWithAts(
    userId: string,
    jobId: string,
    resumeId: string,
    application: IApplication
  ): Promise<IApplication> {
    const [user, profile, atsJobMeta] = await Promise.all([
      userRepository.findById(userId),
      profileRepository.findByUserId(userId),
      atsService.getJobMeta(jobId),
    ]);

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    if (!atsJobMeta?.recruiterId) {
      throw new ApiError(
        422,
        'This job cannot accept applications right now (ATS job metadata unavailable or missing recruiter). Confirm the job is published in Talent Desk.'
      );
    }

    const effectiveResumeId = resumeId || application.resumeId || profile?.resumeId;
    let resumeUrl: string | undefined;
    try {
      const resumePdfUrl = effectiveResumeId
        ? await buildResumePdfUrlForAts(user.email, effectiveResumeId)
        : undefined;
      resumeUrl = pickApplicationResumeUrl(resumePdfUrl);
    } catch (err) {
      logger.warn('Resume PDF export for ATS failed; syncing without resume file', {
        userId,
        jobId,
        err,
      });
    }

    const candidateData = profile ? buildApplicationCandidateData(user, profile) : undefined;
    const appliedAt = application.appliedAt || new Date();

    // Required: application must land on the posting recruiter's ATS pipeline
    const atsResult = await atsService.syncApplication({
      jobId,
      candidateName: `${user.firstName} ${user.lastName}`.trim(),
      candidateEmail: user.email,
      resumeId: effectiveResumeId,
      resumeUrl,
      resumeTitle: application.resumeTitle,
      appliedAt: appliedAt.toISOString(),
      recruiterId: atsJobMeta.recruiterId,
      companyId: atsJobMeta.companyId || undefined,
      candidateData,
    });

    const updates: Partial<IApplication> = {
      atsApplicationId: atsResult.applicationId,
    };
    if (effectiveResumeId) {
      updates.resumeId = effectiveResumeId;
    }

    const updated = await applicationRepository.update(application._id.toString(), updates);
    if (updated) return updated;
    Object.assign(application, updates);
    return application;
  }

  async applyToJob(
    userId: string,
    jobId: string,
    resumeId: string,
    _coverLetter?: string
  ): Promise<{ application: IApplication; created: boolean }> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    const { resumeId: selectedResumeId, resumeTitle } = await this.resolveResumeForApply(
      user.email,
      resumeId
    );

    const existing = await applicationRepository.findByUserAndJob(userId, jobId);
    if (existing && !existing.isSaved) {
      const updated =
        (await applicationRepository.update(existing._id.toString(), {
          resumeId: selectedResumeId,
          resumeTitle,
        })) || existing;
      updated.resumeId = selectedResumeId;
      updated.resumeTitle = resumeTitle;
      const application = await this.syncApplicationWithAts(
        userId,
        jobId,
        selectedResumeId,
        updated
      );
      return { application, created: false };
    }

    const job = await this.getJob(jobId);

    const application = await applicationRepository.create({
      userId: new mongoose.Types.ObjectId(userId),
      jobId,
      jobTitle: job.title,
      company: job.company,
      companyLogo: job.companyLogo,
      location: job.location,
      salary: job.salary,
      resumeId: selectedResumeId,
      resumeTitle,
      appliedAt: new Date(),
    });

    try {
      const synced = await this.syncApplicationWithAts(userId, jobId, selectedResumeId, application);
      return { application: synced, created: true };
    } catch (err) {
      // Do not leave a Career Track-only apply if ATS never received it
      try {
        await applicationRepository.delete(application._id.toString());
      } catch (deleteErr) {
        logger.error('Failed to roll back Career Track application after ATS sync failure', {
          applicationId: application._id.toString(),
          deleteErr,
        });
      }
      throw err;
    }
  }

  async saveJob(userId: string, jobData: {
    jobId: string;
    jobTitle: string;
    company: string;
    companyLogo?: string;
    location?: string;
    salary?: string;
    employmentType?: string;
  }) {
    const saved = await SavedJob.findOneAndUpdate(
      { userId, jobId: jobData.jobId },
      { ...jobData, userId, savedAt: new Date() },
      { upsert: true, new: true }
    );
    return saved;
  }

  async unsaveJob(userId: string, jobId: string) {
    await SavedJob.deleteOne({ userId, jobId });
  }

  async getSavedJobs(userId: string, page = 1, limit = 20) {
    const [jobs, total] = await Promise.all([
      SavedJob.find({ userId })
        .sort({ savedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      SavedJob.countDocuments({ userId }),
    ]);
    return { jobs, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getRecentlyViewed(userId: string, limit = 10) {
    return RecentlyViewed.find({ userId }).sort({ viewedAt: -1 }).limit(limit);
  }

  async getRecommendedJobs(userId: string, page = 1, limit = 10) {
    return recommendationService.getRecommendedJobs(userId, page, limit);
  }
}

export const jobsService = new JobsService();
