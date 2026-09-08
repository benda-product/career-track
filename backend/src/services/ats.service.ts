import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
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

function atsApiBases(): string[] {
  return [
    env.ats.apiUrl,
    env.ats.fallbackUrl,
    'http://ats-backend:5002/api',
    'http://localhost:5002/api',
  ]
    .map((value) => String(value || '').trim().replace(/\/$/, ''))
    .filter(Boolean)
    .filter((value, index, all) => all.indexOf(value) === index);
}

function isTransientAxiosError(error: unknown): boolean {
  if (!axios.isAxiosError(error)) return false;
  const status = error.response?.status;
  if (status === 502 || status === 503 || status === 504) return true;
  if (status) return false;
  const code = error.code;
  return (
    code === 'ECONNRESET' ||
    code === 'ECONNREFUSED' ||
    code === 'ETIMEDOUT' ||
    code === 'ECONNABORTED' ||
    code === 'ERR_NETWORK' ||
    code === 'ENOTFOUND'
  );
}

function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (axios.isAxiosError(error)) {
    const status = error.response?.status || 502;
    const message =
      (error.response?.data as { message?: string } | undefined)?.message ||
      (isTransientAxiosError(error)
        ? 'Talent Desk is temporarily unavailable. Please try again.'
        : 'ATS service unavailable');
    return new ApiError(status, message);
  }
  return new ApiError(502, 'ATS service unavailable');
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

  private async request<T>(
    method: string,
    url: string,
    data?: unknown,
    params?: Record<string, unknown>,
    extraConfig?: AxiosRequestConfig
  ): Promise<T> {
    const bases = atsApiBases();
    let lastError: unknown;

    for (const base of bases) {
      for (let attempt = 1; attempt <= 2; attempt += 1) {
        try {
          const response = await axios.request<T>({
            method,
            url: `${base}${url}`,
            data,
            params,
            timeout: 30000,
            headers: {
              'Content-Type': 'application/json',
              ...(extraConfig?.headers || {}),
            },
            ...extraConfig,
          });
          return response.data;
        } catch (error) {
          lastError = error;
          const transient = isTransientAxiosError(error);
          const status = axios.isAxiosError(error) ? error.response?.status : undefined;

          logger.warn('ATS API request failed', {
            base,
            url,
            attempt,
            status,
            code: axios.isAxiosError(error) ? error.code : undefined,
          });

          if (transient && attempt < 2) {
            await new Promise((resolve) => setTimeout(resolve, 400 * attempt));
            continue;
          }

          if (!transient) {
            throw toApiError(error);
          }
        }
      }
    }

    logger.error('ATS API error — all bases exhausted', { url, error: lastError });
    throw toApiError(lastError);
  }

  async searchJobs(filters: JobSearchFilters) {
    return this.request('GET', '/jobs', undefined, filters as Record<string, unknown>);
  }

  async getJob(jobId: string) {
    return this.request('GET', `/jobs/${encodeURIComponent(jobId)}`);
  }

  async getJobMeta(jobId: string): Promise<{
    recruiterId: string;
    companyId: string;
    status: string;
  } | null> {
    try {
      const data = await this.request<{ job?: Record<string, unknown> } | Record<string, unknown>>(
        'GET',
        `/jobs/${encodeURIComponent(jobId)}`
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
    return this.request('POST', `/jobs/${encodeURIComponent(jobId)}/apply`, {
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
  }): Promise<{ applicationId: string }> {
    const maxAttempts = 3;
    let lastError: unknown;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        const response = await this.client.post<{ applicationId?: string; application?: { _id?: string } }>(
          '/external/sync-application',
          payload,
          {
            timeout: 60000,
            headers: {
              'x-benda-key': env.internalSyncKey,
              'x-benda-internal-key': env.internalSyncKey,
            },
          }
        );
        const body = response.data;
        const applicationId =
          body.applicationId ?? body.application?._id?.toString();
        if (!applicationId) {
          throw new ApiError(502, 'ATS did not return an application id');
        }
        return { applicationId: String(applicationId) };
      } catch (error) {
        lastError = error;
        const code = axios.isAxiosError(error) ? error.code : undefined;
        const status = axios.isAxiosError(error) ? error.response?.status : undefined;
        const message = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
        const transient =
          !status &&
          (code === 'ECONNRESET' ||
            code === 'ECONNREFUSED' ||
            code === 'ETIMEDOUT' ||
            code === 'ECONNABORTED' ||
            code === 'ERR_NETWORK');

        logger.error('ATS sync-application failed', {
          jobId: payload.jobId,
          attempt,
          status,
          code,
          message,
          error,
        });

        if (error instanceof ApiError) throw error;
        if (transient && attempt < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 400 * attempt));
          continue;
        }

        throw new ApiError(
          status || 502,
          message ||
            (transient
              ? 'ATS connection dropped while syncing the application. Please try again.'
              : 'Failed to send application to ATS')
        );
      }
    }

    throw lastError instanceof ApiError
      ? lastError
      : new ApiError(502, 'Failed to send application to ATS');
  }

  async getRecommendedJobs(candidateId: string, skills: string[]) {
    return this.request('GET', '/jobs/recommended', undefined, { candidateId, skills: skills.join(',') });
  }

  async getApplicationStatus(atsApplicationId: string) {
    return this.request('GET', `/applications/${encodeURIComponent(atsApplicationId)}`);
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
