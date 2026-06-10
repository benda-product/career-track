import apiClient from '@/lib/api-client';
import { ApiResponse, User } from '@/types';

export const authService = {
  register: async (data: { email: string; password: string; firstName: string; lastName: string }) => {
    const res = await apiClient.post<ApiResponse<{ user: User; accessToken: string; refreshToken: string }>>(
      '/auth/register',
      data
    );
    return res.data.data!;
  },

  login: async (data: { email: string; password: string }) => {
    const res = await apiClient.post<ApiResponse<{ user: User; accessToken: string; refreshToken: string }>>(
      '/auth/login',
      data
    );
    return res.data.data!;
  },

  logout: async (refreshToken: string) => {
    await apiClient.post('/auth/logout', { refreshToken });
  },

  forgotPassword: async (email: string) => {
    await apiClient.post('/auth/forgot-password', { email });
  },

  resetPassword: async (token: string, password: string) => {
    await apiClient.post('/auth/reset-password', { token, password });
  },

  googleLogin: async (idToken: string) => {
    const res = await apiClient.post<ApiResponse<{ user: User; accessToken: string; refreshToken: string }>>(
      '/auth/google',
      { idToken }
    );
    return res.data.data!;
  },

  verifyEmail: async (token: string) => {
    await apiClient.get(`/auth/verify-email?token=${token}`);
  },
};
