import apiClient from '@/lib/api-client';
import { ApiResponse, DashboardData } from '@/types';

export const dashboardService = {
  getDashboard: async () => {
    const res = await apiClient.get<ApiResponse<DashboardData>>('/dashboard');
    return res.data.data!;
  },
};
