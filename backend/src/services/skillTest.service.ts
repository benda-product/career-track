import axios, { AxiosInstance } from 'axios';
import { env } from '../config/env';
import { ApiError } from '../utils/apiError';
import { logger } from '../utils/logger';

interface SkillTestEnvelope<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface SkillTestRecord {
  bendaTestId: string;
  category: string;
  level: string;
  marksObtained: number;
  fullMarks: number;
  percentage: number;
  passed: boolean;
  certificateId?: string | null;
  certificateIssuedAt?: string | Date | null;
  completedAt?: string | Date;
  rightMCQs?: number | null;
  rightCodings?: number | null;
  numOfMcq?: number | null;
  numOfCoding?: number | null;
  timeTaken?: string | null;
  totalTime?: number | null;
}

class SkillTestService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: env.skillTest.apiUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'x-benda-key': env.internalSyncKey,
        'x-benda-internal-key': env.internalSyncKey,
      },
    });
  }

  private async request<T>(method: string, url: string, data?: unknown): Promise<T> {
    try {
      const response = await this.client.request<SkillTestEnvelope<T>>({ method, url, data });
      return response.data.data;
    } catch (error) {
      logger.error('Skill Test API error', { url, error });
      if (axios.isAxiosError(error)) {
        const isDown = error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND';
        const isAuthError = error.response?.status === 401;
        throw new ApiError(
          error.response?.status || 502,
          isDown
            ? 'Benda Test Platform is not running. Start it on port 5005 (benda-project/backend).'
            : isAuthError
              ? 'Skill Test sync key mismatch. Ensure INTERNAL_SYNC_KEY matches on ports 5003 and 5005.'
              : (error.response?.data as { message?: string })?.message ||
                'Benda Test Platform service unavailable'
        );
      }
      throw new ApiError(502, 'Benda Test Platform service unavailable');
    }
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

  async getTestsByEmail(email: string) {
    return this.request<SkillTestRecord[]>(
      'GET',
      `/internal/tests?email=${encodeURIComponent(email)}`
    );
  }

  async getCandidateEntitlements(email: string) {
    return this.request<{
      planType: string;
      planLabel: string;
      unlimitedRetakes: boolean;
      attemptsPerLevel: number | null;
      billingSource: string;
      includedViaCareerPro: boolean;
      directPlanType: string;
      currentPeriodEnd?: string | null;
    }>('GET', `/internal/candidate-entitlements?email=${encodeURIComponent(email)}`);
  }

  async getPassedTestsByEmail(email: string) {
    return this.request<SkillTestRecord[]>(
      'GET',
      `/internal/tests/passed?email=${encodeURIComponent(email)}`
    );
  }

  async getCertificateData(testId: string) {
    try {
      const response = await axios.get(
        `${env.skillTest.apiUrl}/nodemailer/certificateData/${encodeURIComponent(testId)}`,
        { timeout: 30000 }
      );
      return response.data as {
        name: string;
        course: string;
        score: number;
        certificateId: string;
        issuedDate: string;
        level: string;
        category: string;
        marksObtained: number;
        fullMarks: number;
        isEligible: boolean;
      };
    } catch (error) {
      logger.error('Skill Test certificate data error', { testId, error });
      if (axios.isAxiosError(error)) {
        throw new ApiError(
          error.response?.status || 502,
          (error.response?.data as { message?: string })?.message ||
            'Failed to load certificate'
        );
      }
      throw new ApiError(502, 'Failed to load certificate');
    }
  }

  async verifyCertificate(certificateId: string) {
    try {
      const response = await axios.get(
        `${env.skillTest.apiUrl}/nodemailer/verifyCertificate/${encodeURIComponent(certificateId)}`,
        { timeout: 30000 }
      );
      return response.data as {
        valid: boolean;
        message: string;
        certificate?: {
          certificateId: string;
          name: string;
          course: string;
          category: string;
          level: string;
          score: number;
          marksObtained: number;
          fullMarks: number;
          issuedDate: string | null;
          passed: boolean;
        };
      };
    } catch (error) {
      logger.error('Skill Test certificate verify error', { certificateId, error });
      if (axios.isAxiosError(error)) {
        throw new ApiError(
          error.response?.status || 502,
          (error.response?.data as { message?: string })?.message ||
            'Failed to verify certificate'
        );
      }
      throw new ApiError(502, 'Failed to verify certificate');
    }
  }

  async getCatalog() {
    return this.request<
      Array<{
        id: string;
        name: string;
        bendaLanguage: string;
        targetPath: string;
        prerequisite?: string;
        levels: string[];
        active?: boolean;
      }>
    >('GET', '/internal/catalog');
  }

  async getRankings(params: { category?: string; emails?: string; limit?: number }) {
    const query = new URLSearchParams();
    if (params.category) query.set('category', params.category);
    if (params.emails) query.set('emails', params.emails);
    if (params.limit) query.set('limit', String(params.limit));
    return this.request<{ category: string | null; total: number; rankings: unknown[] }>(
      'GET',
      `/internal/rankings?${query.toString()}`
    );
  }

  async compareCandidates(emails: string[], category?: string) {
    return this.request<{ category: string | null; candidates: unknown[] }>(
      'POST',
      '/internal/compare',
      { emails, category }
    );
  }
}

export const skillTestService = new SkillTestService();
