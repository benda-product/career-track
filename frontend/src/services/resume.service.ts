import apiClient from '@/lib/api-client';
import { getResumeBuilderPath } from '@/lib/resume-builder';
import { ApiResponse } from '@/types';

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

export interface ResumeItem {
  id?: string;
  _id?: string;
  title?: string;
  score?: number;
  isViewable?: boolean;
  updatedAt?: string | Date;
  template?: string;
  // These fields exist on the resume-builder Resume model but were missing from the frontend type.
  skills?: string[];
  education?: unknown[];
  experience?: unknown[];
  projects?: unknown[];
  personalInfo?: {
    summary?: string;
  };
}

export function getResumeId(resume: ResumeItem): string {
  return resume.id || resume._id || '';
}

export function getPrimaryResumeId(resumes: ResumeItem[] | undefined): string | null {
  if (!resumes?.length) return null;
  return getResumeId(resumes[0]);
}

export const resumeService = {
  getResumes: async () => {
    const res = await apiClient.get<ApiResponse<ResumeItem[]>>('/resume');
    return res.data.data!;
  },

  getResume: async (id: string) => {
    const res = await apiClient.get<ApiResponse<unknown>>(`/resume/${id}`);
    return res.data.data!;
  },

  getSsoRedirect: async (options: { returnUrl?: string; targetPath?: string }) => {
    const res = await apiClient.get<ApiResponse<{ token: string; url: string }>>('/resume/sso-url', {
      params: {
        returnUrl: options.returnUrl,
        targetPath: options.targetPath,
      },
    });
    return res.data.data!;
  },

  openInResumeBuilder: async (options: {
    type: 'create' | 'edit' | 'ats';
    resumeId?: string;
    returnUrl?: string;
  }) => {
    const targetPath = getResumeBuilderPath(options.type, options.resumeId);
    const session = await resumeService.getSsoRedirect({
      targetPath,
      returnUrl: options.returnUrl,
    });
    window.location.href = session.url;
  },

  createResume: async (data: Record<string, unknown>) => {
    const res = await apiClient.post<ApiResponse<unknown>>('/resume/create', data);
    return res.data.data!;
  },

  updateResume: async (id: string, data: Record<string, unknown>) => {
    const res = await apiClient.put<ApiResponse<unknown>>(`/resume/update/${id}`, data);
    return res.data.data!;
  },

  deleteResume: async (id: string) => {
    const res = await apiClient.delete<ApiResponse<null>>(`/resume/${id}`);
    return res.data;
  },

  getScore: async (id: string) => {
    const res = await apiClient.get<ApiResponse<ResumeAtsScore>>(`/resume/score/${id}`);
    return res.data.data!;
  },

  checkAts: async (id: string, jobDescription: string) => {
    const res = await apiClient.post<ApiResponse<ResumeAtsScore>>(`/resume/ats/check/${id}`, {
      jobDescription,
    });
    return res.data.data!;
  },

  checkAtsUpload: async (file: File, jobDescription?: string) => {
    const form = new FormData();
    form.append('resume', file);
    if (jobDescription?.trim()) {
      form.append('jobDescription', jobDescription.trim());
    }
    const res = await apiClient.post<ApiResponse<ResumeAtsScore>>('/resume/ats/check-upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000,
    });
    return res.data.data!;
  },

  viewPdf: async (id: string) => {
    const res = await apiClient.get(`/resume/${id}/pdf`, {
      params: { inline: '1' },
      responseType: 'blob',
    });
    const blob = new Blob([res.data], { type: 'application/pdf' });
    return URL.createObjectURL(blob);
  },

  downloadPdf: async (id: string, filename?: string) => {
    const res = await apiClient.get(`/resume/${id}/pdf`, { responseType: 'blob' });
    const blob = new Blob([res.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `resume-${id}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  setViewable: async (id: string, viewable: boolean) => {
    const res = await apiClient.patch<ApiResponse<{ resumeId?: string; resumeUrl?: string; viewable: boolean }>>(
      `/resume/${id}/viewable`,
      { viewable }
    );
    return res.data.data!;
  },

  getTemplates: async () => {
    const res = await apiClient.get<ApiResponse<unknown[]>>('/resume/templates');
    return res.data.data!;
  },
};
