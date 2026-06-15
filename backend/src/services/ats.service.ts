import axios, { AxiosInstance } from 'axios';
import { env } from '../config/env';
import { ApiError } from '../utils/apiError';
import { logger } from '../utils/logger';

export interface JobSearchFilters {
  query?: string;
  skills?: string[] | string;
  experience?: string;
  salaryMin?: number;
  salaryMax?: number;
  location?: string;
  employmentType?: string;
  remote?: boolean;
  hybrid?: boolean;
  industry?: string;
  page?: number;
  limit?: number;
}

class AtsService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: env.ats.apiUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  private async request<T>(method: string, url: string, data?: unknown, params?: Record<string, unknown>): Promise<T> {
    try {
      const response = await this.client.request<T>({ method, url, data, params });
      return response.data;
    } catch (error) {
      logger.error('ATS API error', { url, error });
      if (axios.isAxiosError(error)) {
        throw new ApiError(
          error.response?.status || 502,
          error.response?.data?.message || 'ATS service unavailable'
        );
      }
      throw new ApiError(502, 'ATS service unavailable');
    }
  }

  async searchJobs(filters: JobSearchFilters) {
    return this.request('GET', '/jobs', undefined, filters as Record<string, unknown>);
  }

  async getJob(jobId: string) {
    return this.request('GET', `/jobs/${jobId}`);
  }

  async getJobMeta(jobId: string): Promise<{
    recruiterId: string;
    companyId: string;
    status: string;
  } | null> {
    try {
      const data = await this.request<{ job?: Record<string, unknown> } | Record<string, unknown>>(
        'GET',
        `/jobs/${jobId}`
      );
      const raw =
        data && typeof data === 'object' && 'job' in data && data.job
          ? (data.job as Record<string, unknown>)
          : (data as Record<string, unknown>);
      const recruiterRef = raw.recruiterId as string | { _id?: string } | undefined;
      const companyRef = raw.companyId as string | { _id?: string } | undefined;
      return {
        recruiterId: String(
          typeof recruiterRef === 'object' ? recruiterRef?._id : recruiterRef ?? ''
        ),
        companyId: String(typeof companyRef === 'object' ? companyRef?._id : companyRef ?? ''),
        status: String(raw.status ?? ''),
      };
    } catch (error) {
      logger.error('ATS getJobMeta failed', { jobId, error });
      return null;
    }
  }

  async applyToJob(jobId: string, candidateId: string, resumeId: string, coverLetter?: string) {
    return this.request('POST', `/jobs/${jobId}/apply`, {
      candidateId,
      resumeId,
      coverLetter,
    });
  }

  async syncApplication(payload: {
    jobId: string;
    candidateName: string;
    candidateEmail: string;
    resumeId?: string;
    resumeUrl?: string;
    resumeTitle?: string;
    appliedAt: string;
    recruiterId?: string;
    companyId?: string;
    candidateData?: Record<string, unknown>;
  }): Promise<{ applicationId?: string } | null> {
    try {
      const response = await this.client.post<{ applicationId?: string; application?: { _id?: string } }>(
        '/external/sync-application',
        payload,
        {
          headers: {
            'x-benda-key': env.internalSyncKey,
            'x-benda-internal-key': env.internalSyncKey,
          },
        }
      );
      const body = response.data;
      return {
        applicationId:
          body.applicationId ?? body.application?._id?.toString(),
      };
    } catch (error) {
      const message =
        axios.isAxiosError(error) ? error.response?.data?.message : undefined;
      logger.error('ATS sync-application failed', {
        jobId: payload.jobId,
        status: axios.isAxiosError(error) ? error.response?.status : undefined,
        message,
        error,
      });
      return null;
    }
  }

  async getRecommendedJobs(candidateId: string, skills: string[]) {
    return this.request('GET', '/jobs/recommended', undefined, { candidateId, skills: skills.join(',') });
  }

  async getApplicationStatus(atsApplicationId: string) {
    return this.request('GET', `/applications/${atsApplicationId}`);
  }

  async syncCandidate(payload: Record<string, unknown>): Promise<void> {
    try {
      await this.client.post('/external/sync-candidate', payload, {
        headers: {
          'x-benda-key': env.internalSyncKey,
          'x-benda-internal-key': env.internalSyncKey,
        },
      });
    } catch (error) {
      const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
      logger.error('ATS sync-candidate failed', {
        email: payload.email,
        status: axios.isAxiosError(error) ? error.response?.status : undefined,
        message,
        error,
      });
      throw error;
    }
  }
}

export const atsService = new AtsService();
