import axios, { AxiosInstance } from 'axios';
import { env } from '../config/env';
import { ApiError } from '../utils/apiError';
import { logger } from '../utils/logger';

class ResumeBuilderService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: env.resumeBuilder.apiUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  private async request<T>(method: string, url: string, data?: unknown): Promise<T> {
    try {
      const response = await this.client.request<T>({ method, url, data });
      return response.data;
    } catch (error) {
      logger.error('Resume Builder API error', { url, error });
      if (axios.isAxiosError(error)) {
        throw new ApiError(
          error.response?.status || 502,
          error.response?.data?.message || 'Resume Builder service unavailable'
        );
      }
      throw new ApiError(502, 'Resume Builder service unavailable');
    }
  }

  async getResumes(userId: string) {
    return this.request('GET', `/resumes?userId=${userId}`);
  }

  async getResume(resumeId: string) {
    return this.request('GET', `/resumes/${resumeId}`);
  }

  async createResume(userId: string, data: Record<string, unknown>) {
    return this.request('POST', '/resumes', { userId, ...data });
  }

  async updateResume(resumeId: string, data: Record<string, unknown>) {
    return this.request('PUT', `/resumes/${resumeId}`, data);
  }

  async deleteResume(resumeId: string) {
    return this.request('DELETE', `/resumes/${resumeId}`);
  }

  async getTemplates() {
    return this.request('GET', '/templates');
  }

  async getTemplate(templateId: string) {
    return this.request('GET', `/templates/${templateId}`);
  }

  async downloadPdf(resumeId: string) {
    return this.request<{ url: string }>('GET', `/resumes/${resumeId}/pdf`);
  }

  async getScore(resumeId: string) {
    return this.request('GET', `/resumes/${resumeId}/score`);
  }

  async getAnalytics(resumeId: string) {
    return this.request('GET', `/resumes/${resumeId}/analytics`);
  }

  async getSuggestions(resumeId: string) {
    return this.request('GET', `/resumes/${resumeId}/suggestions`);
  }

  async getVersions(resumeId: string) {
    return this.request('GET', `/resumes/${resumeId}/versions`);
  }

  async getPreview(resumeId: string) {
    return this.request('GET', `/resumes/${resumeId}/preview`);
  }
}

export const resumeBuilderService = new ResumeBuilderService();
