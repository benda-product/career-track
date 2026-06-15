import apiClient from '@/lib/api-client';
import { getSkillTestPath } from '@/lib/skill-test';
import { ApiResponse } from '@/types';

export interface SkillAssessmentItem {
  bendaTestId: string;
  category: string;
  level: string;
  marksObtained: number;
  fullMarks: number;
  percentage: number;
  passed: boolean;
  certificateId?: string;
  completedAt: string;
  platform: 'benda-test';
}

export interface CertificationItem {
  name: string;
  issuingOrganization: string;
  issueDate: string;
  expiryDate?: string;
  credentialId?: string;
}

export interface SkillCheckSummary {
  skillAssessments: SkillAssessmentItem[];
  certifications: CertificationItem[];
}

export interface SkillCheckAssignmentItem {
  _id: string;
  category: string;
  level: string;
  status: string;
  recruiterName?: string;
  assignedAt: string;
  dueDate?: string;
  targetPath: string;
}

export const skillCheckService = {
  getSsoRedirect: async (options: { returnUrl?: string; targetPath?: string }) => {
    const res = await apiClient.get<ApiResponse<{ token: string; url: string }>>(
      '/skill-check/sso-url',
      {
        params: {
          returnUrl: options.returnUrl,
          targetPath: options.targetPath,
        },
      }
    );
    return res.data.data!;
  },

  openInSkillTest: async (options: {
    action: 'take' | 'my-tests' | 'certificates';
    returnUrl?: string;
  }) => {
    const targetPath = getSkillTestPath(options.action);
    const session = await skillCheckService.getSsoRedirect({
      targetPath,
      returnUrl: options.returnUrl,
    });
    window.location.href = session.url;
  },

  getSummary: async () => {
    const res = await apiClient.get<ApiResponse<SkillCheckSummary>>('/skill-check/summary');
    return res.data.data!;
  },

  refreshFromPlatform: async () => {
    const res = await apiClient.post<ApiResponse<SkillCheckSummary>>('/skill-check/refresh');
    return res.data.data!;
  },

  getAssignments: async () => {
    const res = await apiClient.get<ApiResponse<SkillCheckAssignmentItem[]>>('/skill-check/assignments');
    return res.data.data!;
  },
};
