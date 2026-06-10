import apiClient from '@/lib/api-client';
import { ApiResponse, Job, Application } from '@/types';

export interface JobFilters {
  query?: string;
  skills?: string;
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

export const jobsService = {
  searchJobs: async (filters: JobFilters = {}) => {
    const res = await apiClient.get<ApiResponse<Job[]>>('/jobs', { params: filters });
    return res.data;
  },

  getJob: async (id: string) => {
    const res = await apiClient.get<ApiResponse<Job>>(`/jobs/${id}`);
    return res.data.data!;
  },

  applyToJob: async (jobId: string, resumeId: string, coverLetter?: string) => {
    const res = await apiClient.post<ApiResponse<Application>>(`/jobs/${jobId}/apply`, {
      resumeId,
      coverLetter,
    });
    return res.data.data!;
  },

  saveJob: async (job: {
    jobId: string;
    jobTitle: string;
    company: string;
    companyLogo?: string;
    location?: string;
    salary?: string;
    employmentType?: string;
  }) => {
    const res = await apiClient.post<ApiResponse<unknown>>('/jobs/save', job);
    return res.data.data!;
  },

  unsaveJob: async (jobId: string) => {
    await apiClient.delete(`/jobs/${jobId}/save`);
  },

  getSavedJobs: async (page = 1, limit = 20) => {
    const res = await apiClient.get<ApiResponse<Job[]>>('/jobs/saved', { params: { page, limit } });
    return res.data;
  },

  getRecentlyViewed: async () => {
    const res = await apiClient.get<ApiResponse<Job[]>>('/jobs/recent');
    return res.data.data!;
  },

  getRecommended: async () => {
    const res = await apiClient.get<ApiResponse<Job[]>>('/jobs/recommended');
    return res.data.data!;
  },
};
