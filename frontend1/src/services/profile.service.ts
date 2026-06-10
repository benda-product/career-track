import apiClient from '@/lib/api-client';
import { ApiResponse, Profile } from '@/types';

export const profileService = {
  getProfile: async () => {
    const res = await apiClient.get<ApiResponse<Profile>>('/profile');
    return res.data.data!;
  },

  updateProfile: async (data: Partial<Profile>) => {
    const res = await apiClient.put<ApiResponse<Profile>>('/profile', data);
    return res.data.data!;
  },

  getCompletion: async () => {
    const res = await apiClient.get<ApiResponse<{ score: number; missing: string[]; strength: string }>>(
      '/profile/completion'
    );
    return res.data.data!;
  },
};
