import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { getApiUrl } from '@/constants';
import { refreshAuthSession, shouldRedirectToLogin } from '@/lib/auth-session';
import { getStoredAccessToken, useAuthStore } from '@/store/auth.store';

const apiClient = axios.create({
  baseURL: getApiUrl(),
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token!);
  });
  failedQueue = [];
};

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  config.baseURL = getApiUrl();
  config.withCredentials = true;
  if (typeof window !== 'undefined') {
    const token = getStoredAccessToken() || useAuthStore.getState().accessToken;
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const AUTH_BYPASS_PATHS = [
  '/auth/login',
  '/auth/register',
  '/auth/logout',
  '/auth/refresh-token',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/verify-email',
];

function shouldBypassAuthInterceptor(url?: string) {
  if (!url) return false;
  return AUTH_BYPASS_PATHS.some((path) => url.includes(path));
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !shouldBypassAuthInterceptor(originalRequest.url)
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(apiClient(originalRequest));
            },
            reject,
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const restored = await refreshAuthSession();
        const newToken = getStoredAccessToken() || useAuthStore.getState().accessToken;
        if (!restored || !newToken) {
          throw new Error('Session expired');
        }
        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        useAuthStore.getState().clearAuth();
        if (shouldRedirectToLogin()) window.location.href = '/auth/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
