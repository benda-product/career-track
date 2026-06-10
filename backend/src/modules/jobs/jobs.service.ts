import mongoose from 'mongoose';
import { atsService, JobSearchFilters } from '../../services/ats.service';
import { SavedJob } from './savedJob.model';
import { RecentlyViewed } from './recentlyViewed.model';
import { applicationRepository } from '../../repositories/application.repository';
import { profileRepository } from '../../repositories/profile.repository';
import { ApiError } from '../../utils/apiError';
import { extractJob, extractJobsList, NormalizedJob } from '../../utils/atsJob.mapper';

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

    return job;
  }

  async applyToJob(userId: string, jobId: string, resumeId: string, coverLetter?: string) {
    const existing = await applicationRepository.findByUserAndJob(userId, jobId);
    if (existing && !existing.isSaved) {
      throw new ApiError(409, 'Already applied to this job');
    }

    const job = await this.getJob(jobId);

    const atsResult = await atsService.applyToJob(jobId, userId, resumeId, coverLetter) as {
      applicationId?: string;
      application?: { _id?: string };
    };

    const application = await applicationRepository.create({
      userId: new mongoose.Types.ObjectId(userId),
      jobId,
      jobTitle: job.title,
      company: job.company,
      companyLogo: job.companyLogo,
      location: job.location,
      salary: job.salary,
      atsApplicationId: atsResult.applicationId ?? atsResult.application?._id?.toString(),
    });

    return application;
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

  async getRecommendedJobs(userId: string): Promise<NormalizedJob[]> {
    const profile = await profileRepository.getOrCreate(userId);
    const skills = profile.skills.map((s) => s.name);
    try {
      const result = await atsService.getRecommendedJobs(userId, skills);
      return extractJobsList(result);
    } catch {
      return this.searchJobs({ skills: skills.join(','), limit: 10 });
    }
  }
}

export const jobsService = new JobsService();
