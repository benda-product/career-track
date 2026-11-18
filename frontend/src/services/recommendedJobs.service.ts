import apiClient from '@/lib/api-client';
import { ApiResponse, PaginatedResponse, RecommendedJob } from '@/types';

export const recommendedJobsService = {
  getRecommendedJobs: async (
    page = 1,
    limit = 10,
    market?: string
  ): Promise<PaginatedResponse<RecommendedJob>> => {
    const res = await apiClient.get<ApiResponse<RecommendedJob[]>>('/recommended-jobs', {
      params: { page, limit, ...(market ? { market } : { market: 'all' }) },
    });

    const items = res.data.data || [];
    const meta = res.data.meta;
    return {
      items,
      meta: {
        page: meta?.page ?? page,
        limit: meta?.limit ?? limit,
        total: meta?.total ?? items.length,
        totalPages: meta?.totalPages ?? 1,
        market: meta?.market,
        marketSource: meta?.marketSource,
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
