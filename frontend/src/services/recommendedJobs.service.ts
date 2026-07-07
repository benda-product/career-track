import apiClient from '@/lib/api-client';
import { ApiResponse, PaginatedResponse, RecommendedJob } from '@/types';

export const recommendedJobsService = {
  getRecommendedJobs: async (page = 1, limit = 10): Promise<PaginatedResponse<RecommendedJob>> => {
    const res = await apiClient.get<ApiResponse<RecommendedJob[]>>('/recommended-jobs', {
      params: { page, limit },
    });

    return {
      items: res.data.data || [],
      meta: res.data.meta || {
        page,
        limit,
        total: res.data.data?.length || 0,
        totalPages: 1,
      },
    };
  },

  getInsights: async () => {
    const res = await apiClient.get<
      ApiResponse<{
        averageScore: number;
        totalMatches: number;
        topMissingSkills: string[];
      }>
    >('/recommended-jobs/insights');
    return res.data.data!;
  },
};
