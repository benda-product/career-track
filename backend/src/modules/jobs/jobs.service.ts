import { Types } from 'mongoose';
import { atsService, JobSearchFilters } from '../../services/ats.service';
import { SavedJob } from './savedJob.model';
import { RecentlyViewed } from './recentlyViewed.model';
import { applicationRepository } from '../../repositories/application.repository';
import { userRepository } from '../../repositories/user.repository';
import { profileRepository } from '../../repositories/profile.repository';
import { IApplication } from '../applications/application.model';
import { logger } from '../../utils/logger';
import { extractJob, extractJobsList, NormalizedJob } from '../../utils/atsJob.mapper';
import { recommendationService } from './recommendation.service';
import { skillTestService } from '../../services/skillTest.service';
import { resumeBuilderService } from '../../services/resumeBuilder.service';
import {
  buildApplicationCandidateData,
  syncCandidateToTalentPool,
} from '../../services/talentPool.service';
import {
  FALLBACK_SKILL_CATALOG,
  recommendAssessmentForJob,
  type SkillCatalogItem,
} from '../../utils/recommendedAssessment';
import { buildTalentDeskApplyUrl } from '../../utils/talentDeskApply';
import { ApiError } from '../../utils/apiError';

let skillCatalogCache: SkillCatalogItem[] | null = null;
let skillCatalogCacheAt = 0;
const SKILL_CATALOG_TTL_MS = 5 * 60 * 1000;

async function loadSkillCatalog(): Promise<SkillCatalogItem[]> {
  const now = Date.now();
  if (skillCatalogCache && now - skillCatalogCacheAt < SKILL_CATALOG_TTL_MS) {
    return skillCatalogCache;
  }

  try {
    const catalog = await skillTestService.getCatalog();
    if (Array.isArray(catalog) && catalog.length) {
      skillCatalogCache = catalog.map((item) => ({
        id: item.id || item.bendaLanguage || '',
        name: item.name || item.id || item.bendaLanguage || '',
        bendaLanguage: item.bendaLanguage || item.id || '',
        targetPath: item.targetPath,
        prerequisite: item.prerequisite,
        levels: Array.isArray(item.levels) ? item.levels : undefined,
        active: item.active,
      })).filter((item) => item.id || item.name || item.bendaLanguage);
      skillCatalogCacheAt = now;
      return skillCatalogCache;
    }
  } catch (error) {
    logger.warn('SkillCheck catalog unavailable for job assessment recommendation', {
      error: error instanceof Error ? error.message : String(error),
    });
  }

  return FALLBACK_SKILL_CATALOG;
}

const EMPLOYMENT_TYPE_TO_ATS: Record<string, string> = {
  'full-time': 'full-time',
  'part-time': 'part-time',
  contract: 'contract',
  internship: 'internship',
  freelance: 'contract',
};

function normalizeEmploymentType(value?: string): string | undefined {
  if (!value || value === 'All' || value === 'all') return undefined;
  const normalized = value.trim().toLowerCase();
  return EMPLOYMENT_TYPE_TO_ATS[normalized] || normalized.replace(/\s+/g, '-');
}

function toAtsQuery(filters: JobSearchFilters): Record<string, unknown> {
  const params: Record<string, unknown> = {
    channel: 'careerTrack',
  };

  if (filters.query?.trim()) {
    params.search = filters.query.trim();
    params.title = filters.query.trim();
  }
  if (filters.location?.trim()) {
    params.location = filters.location.trim();
  }
  const jobType = normalizeEmploymentType(filters.employmentType);
  if (jobType) {
    params.jobType = jobType;
  }
  if (filters.experience) params.experienceLevel = filters.experience;
  if (filters.salaryMin != null) params.salaryMin = filters.salaryMin;
  if (filters.salaryMax != null) params.salaryMax = filters.salaryMax;
  if (filters.industry) params.domain = filters.industry;
  if (filters.remote) params.remoteMode = 'remote';
  if (filters.hybrid) params.remoteMode = 'hybrid';
  if (filters.page != null) params.page = filters.page;
  if (filters.limit != null) params.limit = filters.limit;
  if (Array.isArray(filters.skills)) {
    params.skills = filters.skills.join(',');
  } else if (typeof filters.skills === 'string' && filters.skills.trim()) {
    params.skills = filters.skills.trim();
  }

  return params;
}

function withTalentDeskApplyUrl<T extends { id: string }>(job: T): T & { applyUrl: string } {
  return { ...job, applyUrl: buildTalentDeskApplyUrl(job.id) };
}

export class JobsService {
  async searchJobs(filters: JobSearchFilters): Promise<NormalizedJob[]> {
    const result = await atsService.searchJobs(toAtsQuery(filters) as JobSearchFilters);
    return extractJobsList(result).map(withTalentDeskApplyUrl);
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

    const recommendedAssessment = await this.getRecommendedAssessment(job);

    return withTalentDeskApplyUrl({
      ...job,
      hasApplied,
      appliedResumeId,
      appliedResumeTitle,
      recommendedAssessment,
    });
  }

  private async getRecommendedAssessment(job: NormalizedJob) {
    try {
      return recommendAssessmentForJob(
        { title: job.title, skills: job.skills },
        await loadSkillCatalog()
      );
    } catch (error) {
      logger.warn('Failed to resolve recommended SkillCheck assessment', {
        jobId: job.id,
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  private async resolveResumeForApply(
    email: string,
    resumeId: string,
    profile: Awaited<ReturnType<typeof profileRepository.getOrCreate>>
  ): Promise<{ resumeId: string; resumeTitle: string }> {
    const selectedId = String(resumeId || profile.resumeId || '').trim();
    if (!selectedId) {
      throw new ApiError(
        400,
        'Select a resume to apply. Create one in Resume Builder or upload a resume in your profile.'
      );
    }

    try {
      const resume = (await resumeBuilderService.getResume(email, selectedId)) as {
        title?: string;
        id?: string;
        _id?: string;
      };
      return {
        resumeId: String(resume.id || resume._id || selectedId),
        resumeTitle: resume.title?.trim() || 'Resume',
      };
    } catch (err) {
      if (err instanceof ApiError) throw err;
      throw new ApiError(404, 'Selected resume was not found. Choose another resume or create a new one.');
    }
  }

  async applyToJob(
    userId: string,
    jobId: string,
    resumeId: string,
    coverLetter?: string
  ): Promise<{ application: IApplication; created: boolean }> {
    const user = await userRepository.findById(userId);
    if (!user) throw new ApiError(404, 'User not found');

    const profile = await profileRepository.getOrCreate(userId);
    const existing = await applicationRepository.findByUserAndJob(userId, jobId);
    if (existing && !existing.isSaved) {
      return { application: existing, created: false };
    }

    const job = extractJob(await atsService.getJob(jobId));
    const atsJobMeta = await atsService.getJobMeta(jobId);
    if (!atsJobMeta?.recruiterId) {
      throw new ApiError(
        422,
        'This job cannot accept applications right now. Confirm the job is published in Talent Desk.'
      );
    }

    await syncCandidateToTalentPool(userId);

    const candidateName = `${user.firstName} ${user.lastName}`.trim() || user.email;
    const { resumeId: resolvedResumeId, resumeTitle } = await this.resolveResumeForApply(
      user.email,
      resumeId,
      profile
    );

    const { applicationId } = await atsService.syncApplication({
      jobId,
      candidateName,
      candidateEmail: user.email,
      resumeId: resolvedResumeId,
      resumeTitle,
      resumeUrl: profile.resumeUrl || undefined,
      appliedAt: new Date().toISOString(),
      recruiterId: atsJobMeta.recruiterId,
      companyId: atsJobMeta.companyId,
      candidateData: buildApplicationCandidateData(user, profile),
      coverLetter,
    });

    let application = existing;
    if (!application) {
      application = await applicationRepository.create({
        userId: new Types.ObjectId(userId),
        jobId,
        jobTitle: job.title,
        company: job.company,
        companyLogo: job.companyLogo,
        location: job.location,
        salary: job.salary,
        stage: 'applied',
        atsApplicationId: applicationId,
        atsStage: 'applied',
        appliedAt: new Date(),
        resumeId: resolvedResumeId,
        resumeTitle,
        isSaved: false,
      });
    } else {
      application =
        (await applicationRepository.update(application._id.toString(), {
          isSaved: false,
          jobTitle: job.title,
          company: job.company,
          companyLogo: job.companyLogo,
          location: job.location,
          salary: job.salary,
          stage: 'applied',
          atsApplicationId: applicationId,
          atsStage: 'applied',
          appliedAt: new Date(),
          resumeId: resolvedResumeId,
          resumeTitle,
        })) || application;
    }

    return { application, created: !existing || existing.isSaved };
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
