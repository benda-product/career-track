import { Application } from '../applications/application.model';
import { profileRepository } from '../../repositories/profile.repository';
import { userRepository } from '../../repositories/user.repository';
import { atsService } from '../../services/ats.service';
import { resumeBuilderService } from '../../services/resumeBuilder.service';
import { ApiError } from '../../utils/apiError';
import { extractJobsList, NormalizedJob } from '../../utils/atsJob.mapper';
import { calculateTotalExperienceYears } from '../../utils/experience.util';
import { scoreJobMatch, uniqueSkills } from '../../utils/jobMatch.util';
import { logger } from '../../utils/logger';
import { SavedJob } from './savedJob.model';
import { RecommendedJob, RecommendedJobsResult } from './recommendation.types';

interface CandidateContext {
  skills: string[];
  experienceYears: number;
  designation?: string;
  appliedJobIds: Set<string>;
  savedJobIds: Set<string>;
  savedCompanies: string[];
  savedTitles: string[];
  savedLocations: string[];
  profileSkillCount: number;
}

function dedupeJobs(jobs: NormalizedJob[]): NormalizedJob[] {
  const seen = new Set<string>();
  return jobs.filter((job) => {
    if (!job.id || seen.has(job.id)) return false;
    seen.add(job.id);
    return true;
  });
}

function toIsoDate(value?: string | Date): string | undefined {
  if (!value) return undefined;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

export class RecommendationService {
  private async fetchResumeSkills(email: string): Promise<string[]> {
    try {
      const resumes = (await resumeBuilderService.getResumes(email)) as Array<{
        id?: string;
        _id?: string;
        isDefault?: boolean;
      }>;
      if (!resumes?.length) return [];

      const resumeMeta = resumes.find((resume) => resume.isDefault) || resumes[0];
      const resumeId = resumeMeta.id || resumeMeta._id;
      if (!resumeId) return [];

      const resume = (await resumeBuilderService.getResume(email, resumeId)) as {
        skills?: string[];
      };
      return resume.skills || [];
    } catch (error) {
      logger.warn('Resume skills unavailable for recommendations', { email, error });
      return [];
    }
  }

  private async buildCandidateContext(userId: string): Promise<CandidateContext> {
    const [user, profile, savedJobs, applications] = await Promise.all([
      userRepository.findById(userId),
      profileRepository.getOrCreate(userId),
      SavedJob.find({ userId }).sort({ savedAt: -1 }).limit(50).lean(),
      Application.find({ userId, isSaved: false }).select('jobId').lean(),
    ]);

    const profileSkills = [
      ...(profile.technicalSkills || []),
      ...(profile.softSkills || []),
      ...(profile.skills || []).map((skill) => skill.name),
    ];

    const resumeSkills = user?.email ? await this.fetchResumeSkills(user.email) : [];
    const skills = uniqueSkills([...profileSkills, ...resumeSkills]);

    const experienceYears =
      profile.totalExperienceYears ??
      calculateTotalExperienceYears(
        (profile.experience || []).map((exp) => ({
          startDate: exp.startDate,
          endDate: exp.endDate,
          currentlyWorking: exp.current,
        }))
      );

    return {
      skills,
      experienceYears,
      designation: profile.designation || profile.headline,
      appliedJobIds: new Set(applications.map((app) => app.jobId)),
      savedJobIds: new Set(savedJobs.map((job) => job.jobId)),
      savedCompanies: savedJobs.map((job) => job.company).filter(Boolean),
      savedTitles: savedJobs.map((job) => job.jobTitle).filter(Boolean),
      savedLocations: savedJobs.map((job) => job.location).filter(Boolean) as string[],
      profileSkillCount: uniqueSkills(profileSkills).length,
    };
  }

  private async fetchJobPool(skills: string[]): Promise<NormalizedJob[]> {
    const pools: NormalizedJob[] = [];

    try {
      if (skills.length) {
        const skillResult = await atsService.searchJobs({
          skills: skills.slice(0, 10).join(','),
          limit: 50,
        });
        pools.push(...extractJobsList(skillResult));
      }

      if (pools.length < 25) {
        const generalResult = await atsService.searchJobs({ limit: 50 });
        pools.push(...extractJobsList(generalResult));
      }
    } catch (error) {
      logger.error('ATS job fetch failed for recommendations', { error });
      throw new ApiError(502, 'Unable to fetch jobs for recommendations');
    }

    return dedupeJobs(pools);
  }

  private mapRecommendedJob(
    job: NormalizedJob,
    context: CandidateContext,
    scoring: { matchScore: number; matchedSkills: string[]; missingSkills: string[] }
  ): RecommendedJob {
    return {
      id: job.id,
      title: job.title,
      company: job.company,
      companyLogo: job.companyLogo,
      location: job.location,
      salary: job.salary,
      employmentType: job.employmentType,
      remote: job.remote,
      hybrid: job.hybrid,
      postedAt: toIsoDate(job.postedAt),
      matchScore: scoring.matchScore,
      matchedSkills: scoring.matchedSkills,
      missingSkills: scoring.missingSkills,
      isSaved: context.savedJobIds.has(job.id),
      alreadyApplied: context.appliedJobIds.has(job.id),
    };
  }

  async getRecommendedJobs(userId: string, page = 1, limit = 10): Promise<RecommendedJobsResult> {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(Math.max(1, limit), 50);

    const context = await this.buildCandidateContext(userId);
    const pool = await this.fetchJobPool(context.skills);

    const scored = pool
      .filter((job) => !context.appliedJobIds.has(job.id))
      .map((job) => {
        const scoring = scoreJobMatch(
          {
            jobSkills: job.skills || [],
            minExperience: job.minExperience,
            title: job.title,
            company: job.company,
            location: job.location,
          },
          context
        );
        return { job, scoring };
      })
      .sort((a, b) => b.scoring.matchScore - a.scoring.matchScore);

    const total = scored.length;
    const offset = (safePage - 1) * safeLimit;
    const pageItems = scored.slice(offset, offset + safeLimit);

    return {
      jobs: pageItems.map(({ job, scoring }) => this.mapRecommendedJob(job, context, scoring)),
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit) || 0,
    };
  }
}

export const recommendationService = new RecommendationService();
