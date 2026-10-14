import axios, { AxiosInstance } from 'axios';
import FormData from 'form-data';
import { env } from '../config/env';
import { ApiError } from '../utils/apiError';
import { logger } from '../utils/logger';

interface ResumeBuilderEnvelope<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface ResumeAtsScore {
  score: number;
  grade?: string;
  breakdown?: Record<string, number>;
  strengths?: string[];
  improvements?: string[];
  issues?: string[];
  suggestions?: string[];
  keywords?: { matched?: string[]; missing?: string[] };
  parseConfidence?: number;
}

function resumeApiBases(): string[] {
  const configured = String(env.resumeBuilder.apiUrl || '').replace(/\/$/, '');
  const local = 'http://localhost:5001/api/v1';
  const ordered =
    env.nodeEnv === 'production' ? [configured] : [local, configured, 'http://127.0.0.1:5001/api/v1'];
  return ordered.filter(Boolean).filter((base, index, all) => all.indexOf(base) === index);
}

function isUnreachable(error: unknown): boolean {
  if (!axios.isAxiosError(error) || error.response) return false;
  return (
    error.code === 'ENOTFOUND' ||
    error.code === 'ECONNREFUSED' ||
    error.code === 'ECONNABORTED' ||
    error.code === 'ETIMEDOUT' ||
    error.code === 'ERR_NETWORK'
  );
}

class ResumeBuilderService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: resumeApiBases()[0],
      timeout: 60000,
      headers: this.headers(),
    });
  }

  private headers() {
    return {
      'Content-Type': 'application/json',
      'x-benda-key': env.internalSyncKey,
      'x-benda-internal-key': env.internalSyncKey,
    };
  }

  private async request<T>(method: string, url: string, data?: unknown): Promise<T> {
    const bases = resumeApiBases();
    let lastError: unknown;

    for (const base of bases) {
      try {
        const response = await axios.request<ResumeBuilderEnvelope<T>>({
          method,
          url: `${base}${url}`,
          data,
          timeout: /resume-backend|host\.docker\.internal/i.test(base) ? 2500 : 60000,
          headers: this.headers(),
        });
        return response.data.data;
      } catch (error) {
        lastError = error;
        logger.warn('Resume Builder API request failed', {
          base,
          url,
          code: axios.isAxiosError(error) ? error.code : undefined,
          status: axios.isAxiosError(error) ? error.response?.status : undefined,
        });
        if (isUnreachable(error)) continue;
        break;
      }
    }

    const error = lastError;
    logger.error('Resume Builder API error', { url, error });
    if (axios.isAxiosError(error)) {
      const isDown = isUnreachable(error);
      const isAuthError = error.response?.status === 401;
      throw new ApiError(
        error.response?.status || 502,
        isDown
          ? 'Resume Builder is not running. Start it on port 5001 (resume-builder/backend).'
          : isAuthError
            ? 'Resume Builder sync key mismatch. Ensure INTERNAL_SYNC_KEY matches on ports 5001 and 5003.'
            : error.response?.data?.message || 'Resume Builder service unavailable'
      );
    }
    throw new ApiError(502, 'Resume Builder service unavailable');
  }

  async getResumes(email: string) {
    return this.request<unknown[]>('GET', `/internal/resumes?email=${encodeURIComponent(email)}`);
  }

  async getResume(email: string, resumeId: string) {
    return this.request('GET', `/internal/resumes/${resumeId}?email=${encodeURIComponent(email)}`);
  }

  async createResume(email: string, data: Record<string, unknown>) {
    return this.request('POST', '/internal/resumes', { email, ...data });
  }

  async updateResume(email: string, resumeId: string, data: Record<string, unknown>) {
    return this.request('PUT', `/internal/resumes/${resumeId}`, { email, ...data });
  }

  async deleteResume(email: string, resumeId: string) {
    return this.request<null>(
      'DELETE',
      `/internal/resumes/${resumeId}?email=${encodeURIComponent(email)}`
    );
  }

  async createSsoSession(input: {
    email: string;
    name?: string;
    returnUrl?: string;
    targetPath?: string;
    sourceApp?: string;
  }) {
    return this.request<{ token: string; url: string }>('POST', '/internal/sso-session', input);
  }

  async getEntitlements(email: string) {
    return this.request<{
      plan: string;
      planLabel: string;
      directPlan?: string;
      billingSource?: string;
      includedViaCareerPro?: boolean;
      maxResumes: number | null;
      resumeCount: number;
      canCreateResume: boolean;
    }>('GET', `/internal/entitlements?email=${encodeURIComponent(email)}`);
  }

  async downloadPdf(email: string, resumeId: string): Promise<Buffer> {
    try {
      const response = await this.client.get(`/internal/resumes/${resumeId}/pdf`, {
        params: { email },
        responseType: 'arraybuffer',
      });
      return Buffer.from(response.data);
    } catch (error) {
      logger.error('Resume Builder PDF export failed', { resumeId, error });
      if (axios.isAxiosError(error)) {
        throw new ApiError(
          error.response?.status || 502,
          error.response?.data?.message || 'Failed to download resume PDF'
        );
      }
      throw new ApiError(502, 'Failed to download resume PDF');
    }
  }

  async getScore(email: string, resumeId: string): Promise<ResumeAtsScore> {
    return this.request<ResumeAtsScore>(
      'GET',
      `/internal/resumes/${resumeId}/ats-score?email=${encodeURIComponent(email)}`
    );
  }

  async checkAts(email: string, resumeId: string, jobDescription?: string): Promise<ResumeAtsScore> {
    return this.request<ResumeAtsScore>(
      'POST',
      `/internal/resumes/${resumeId}/ats-check`,
      {
        email,
        jobDescription: jobDescription?.trim() || '',
      }
    );
  }

  async checkAtsUpload(
    file: Express.Multer.File,
    jobDescription?: string,
    email?: string
  ): Promise<ResumeAtsScore> {
    const form = new FormData();
    form.append('resume', file.buffer, {
      filename: file.originalname || 'resume.pdf',
      contentType: file.mimetype || 'application/pdf',
    });
    if (jobDescription?.trim()) {
      form.append('jobDescription', jobDescription.trim());
    }
    if (email?.trim()) {
      form.append('email', email.trim());
    }

    try {
      const response = await this.client.post<ResumeBuilderEnvelope<ResumeAtsScore>>(
        '/internal/ats-check-upload',
        form,
        {
          headers: {
            ...form.getHeaders(),
            'x-benda-key': env.internalSyncKey,
            'x-benda-internal-key': env.internalSyncKey,
          },
          maxBodyLength: Infinity,
          maxContentLength: Infinity,
        }
      );
      return response.data.data;
    } catch (error) {
      logger.error('Resume Builder ATS upload check failed', { error });
      if (axios.isAxiosError(error)) {
        throw new ApiError(
          error.response?.status || 502,
          error.response?.data?.message || 'ATS upload check failed'
        );
      }
      throw new ApiError(502, 'ATS upload check failed');
    }
  }

  async getTemplates() {
    return this.request('GET', '/templates');
  }

  async getTemplate(templateId: string) {
    return this.request('GET', `/templates/${templateId}`);
  }

  async getAnalytics(_resumeId: string) {
    throw new ApiError(501, 'Resume analytics is not available via service proxy');
  }

  async getSuggestions(_resumeId: string) {
    throw new ApiError(501, 'Resume suggestions are not available via service proxy');
  }

  async getVersions(_resumeId: string) {
    throw new ApiError(501, 'Resume versions are not available via service proxy');
  }

  async getPreview(_resumeId: string) {
    throw new ApiError(501, 'Resume preview is not available via service proxy');
  }
}

export const resumeBuilderService = new ResumeBuilderService();
