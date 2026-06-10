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

  async applyToJob(jobId: string, candidateId: string, resumeId: string, coverLetter?: string) {
    return this.request('POST', `/jobs/${jobId}/apply`, {
      candidateId,
      resumeId,
      coverLetter,
    });
  }

  async getRecommendedJobs(candidateId: string, skills: string[]) {
    return this.request('GET', '/jobs/recommended', undefined, { candidateId, skills: skills.join(',') });
  }

  async getApplicationStatus(atsApplicationId: string) {
    return this.request('GET', `/applications/${atsApplicationId}`);
  }
}

export const atsService = new AtsService();
