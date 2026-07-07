import apiClient from '@/lib/api-client';
import { ApiResponse } from '@/types';

export interface CoachingEntitlements {
  hasFeature: boolean;
  creditsRemaining: number;
  creditsAllowance: number;
  period: string;
  recentRequests: Array<{
    topic: string;
    status: string;
    createdAt: string;
  }>;
}

export const coachingService = {
  getEntitlements: async () => {
    const res = await apiClient.get<ApiResponse<CoachingEntitlements>>('/mock-interview/entitlements');
    return res.data.data!;
  },

  requestSession: async (payload: { topic: string; message: string }) => {
    const res = await apiClient.post<ApiResponse<unknown>>('/mock-interview/request', payload);
    return res.data.data;
  },
};
