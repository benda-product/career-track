import apiClient from '@/lib/api-client';
import { ApiResponse } from '@/types';

export const resumeService = {
  getResumes: async () => {
    const res = await apiClient.get<ApiResponse<unknown[]>>('/resume');
    return res.data.data!;
  },

  getResume: async (id: string) => {
    const res = await apiClient.get<ApiResponse<unknown>>(`/resume/${id}`);
    return res.data.data!;
  },

  createResume: async (data: Record<string, unknown>) => {
    const res = await apiClient.post<ApiResponse<unknown>>('/resume/create', data);
    return res.data.data!;
  },

  updateResume: async (id: string, data: Record<string, unknown>) => {
    const res = await apiClient.put<ApiResponse<unknown>>(`/resume/update/${id}`, data);
    return res.data.data!;
  },

  getScore: async (id: string) => {
    const res = await apiClient.get<ApiResponse<{ score: number; suggestions?: string[] }>>(
      `/resume/score/${id}`
    );
    return res.data.data!;
  },

  getTemplates: async () => {
    const res = await apiClient.get<ApiResponse<unknown[]>>('/resume/templates');
    return res.data.data!;
  },

  downloadPdf: async (id: string) => {
    const res = await apiClient.get<ApiResponse<{ url: string }>>(`/resume/${id}/pdf`);
    return res.data.data!;
  },

  getAnalytics: async (id: string) => {
    const res = await apiClient.get<ApiResponse<unknown>>(`/resume/${id}/analytics`);
    return res.data.data!;
  },

  getSuggestions: async (id: string) => {
    const res = await apiClient.get<ApiResponse<unknown>>(`/resume/${id}/suggestions`);
    return res.data.data!;
  },

  getPreview: async (id: string) => {
    const res = await apiClient.get<ApiResponse<unknown>>(`/resume/${id}/preview`);
    return res.data.data!;
  },
};
