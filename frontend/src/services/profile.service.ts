import apiClient from '@/lib/api-client';
import { ApiResponse, CandidateProfileResponse, CandidateProfileUser } from '@/types';

export const profileService = {
  getProfile: async (): Promise<CandidateProfileResponse> => {
    const res = await apiClient.get<ApiResponse<CandidateProfileResponse>>('/profile');
    return res.data.data!;
  },

  updateProfile: async (data: Partial<CandidateProfileUser> & { skills?: string[] }): Promise<CandidateProfileResponse> => {
    const res = await apiClient.put<ApiResponse<CandidateProfileResponse>>('/profile', data);
    return res.data.data!;
  },

  getCompletion: async () => {
    const res = await apiClient.get<ApiResponse<{ score: number; missing: string[]; strength: string }>>(
      '/profile/completion'
    );
    return res.data.data!;
  },
};
