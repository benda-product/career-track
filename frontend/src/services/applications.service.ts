import apiClient from '@/lib/api-client';
import { ApiResponse, Application, ApplicationStage } from '@/types';

export const applicationsService = {
  getApplications: async (page = 1, limit = 20, stage?: ApplicationStage) => {
    const res = await apiClient.get<ApiResponse<Application[]>>('/applications', {
      params: { page, limit, stage },
    });
    return res.data;
  },

  getApplication: async (id: string) => {
    const res = await apiClient.get<ApiResponse<Application>>(`/applications/${id}`);
    return res.data.data!;
  },

  getAnalytics: async () => {
    const res = await apiClient.get<
      ApiResponse<{
        totalApplications: number;
        shortlisted: number;
        interviews: number;
        offers: number;
        successRate: number;
        byStage: Record<string, number>;
      }>
    >('/applications/analytics');
    return res.data.data!;
  },

  updateStage: async (id: string, stage: ApplicationStage, note?: string) => {
    const res = await apiClient.patch<ApiResponse<Application>>(`/applications/${id}/stage`, {
      stage,
      note,
    });
    return res.data.data!;
  },
};
