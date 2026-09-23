import apiClient from '@/lib/api-client';
import { ApiResponse, ApplicationStage } from '@/types';
import {
  AdminActivity,
  AdminApplication,
  AdminCandidate,
  AdminCandidateRecord,
  AdminJob,
  AdminOverview,
  AdminPage,
  AdminProfileDetail,
  AdminSavedJob,
} from '@/types/admin';

function unwrap<T>(response: { data: ApiResponse<T> }) {
  if (!response.data.data) throw new Error(response.data.message || 'Request failed');
  return response.data.data;
}

export const adminService = {
  getOverview: async () => {
    const res = await apiClient.get<ApiResponse<AdminOverview>>('/admin/overview');
    return unwrap(res);
  },

  getCandidates: async (params: { search?: string; page?: number; limit?: number }) => {
    const res = await apiClient.get<ApiResponse<AdminPage<AdminCandidate>>>('/admin/candidates', {
      params: { search: params.search || undefined, page: params.page, limit: params.limit },
    });
    return unwrap(res);
  },

  getCandidate: async (id: string) => {
    const res = await apiClient.get<ApiResponse<AdminCandidateRecord>>(`/admin/candidates/${id}`);
    return unwrap(res);
  },

  updateCandidate: async (id: string, isActive: boolean) => {
    const res = await apiClient.patch<ApiResponse<AdminCandidate>>(`/admin/candidates/${id}`, {
      isActive,
    });
    return unwrap(res);
  },

  getProfiles: async (params: { search?: string; page?: number; limit?: number }) => {
    const res = await apiClient.get<ApiResponse<AdminPage<AdminProfileDetail>>>('/admin/profiles', {
      params: { search: params.search || undefined, page: params.page, limit: params.limit },
    });
    return unwrap(res);
  },

  getProfile: async (userId: string) => {
    const res = await apiClient.get<ApiResponse<AdminProfileDetail>>(`/admin/profiles/${userId}`);
    return unwrap(res);
  },

  getApplications: async (params: {
    search?: string;
    page?: number;
    limit?: number;
    stage?: string;
  }) => {
    const res = await apiClient.get<ApiResponse<AdminPage<AdminApplication>>>('/admin/applications', {
      params: {
        search: params.search || undefined,
        page: params.page,
        limit: params.limit,
        stage: params.stage || undefined,
      },
    });
    return unwrap(res);
  },

  updateApplication: async (
    id: string,
    body: { stage?: ApplicationStage; note?: string; recruiterFeedback?: string }
  ) => {
    const res = await apiClient.patch<ApiResponse<AdminApplication>>(`/admin/applications/${id}`, body);
    return unwrap(res);
  },

  getSavedJobs: async (params: { search?: string; page?: number; limit?: number }) => {
    const res = await apiClient.get<ApiResponse<AdminPage<AdminSavedJob>>>('/admin/saved-jobs', {
      params: { search: params.search || undefined, page: params.page, limit: params.limit },
    });
    return unwrap(res);
  },

  deleteSavedJob: async (id: string) => {
    const res = await apiClient.delete<ApiResponse<{ id: string; deleted: boolean }>>(
      `/admin/saved-jobs/${id}`
    );
    return unwrap(res);
  },

  getJobs: async (params: { search?: string; page?: number; limit?: number }) => {
    const res = await apiClient.get<ApiResponse<AdminPage<AdminJob>>>('/admin/jobs', {
      params: { search: params.search || undefined, page: params.page, limit: params.limit },
    });
    return unwrap(res);
  },

  getJob: async (id: string) => {
    const res = await apiClient.get<ApiResponse<AdminJob>>(`/admin/jobs/${id}`);
    return unwrap(res);
  },

  getActivity: async (params: { search?: string; page?: number; limit?: number }) => {
    const res = await apiClient.get<ApiResponse<AdminPage<AdminActivity>>>('/admin/activity', {
      params: { search: params.search || undefined, page: params.page, limit: params.limit },
    });
    return unwrap(res);
  },
};
