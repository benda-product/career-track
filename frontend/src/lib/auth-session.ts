import axios from 'axios';
import { getApiUrl } from '@/constants';
import { isPublicJobBrowsePath } from '@/lib/job-auth';
import {
  getStoredAccessToken,
  getStoredRefreshToken,
  useAuthStore,
} from '@/store/auth.store';
import type { User, UserRole } from '@/types';

type SessionUser = {
  id?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  isEmailVerified?: boolean;
};

let pending: Promise<boolean> | null = null;

function toUser(user: SessionUser): User | null {
  if (!user.id || !user.email) return null;
  return {
    id: String(user.id),
    email: user.email,
    firstName: user.firstName || 'User',
    lastName: user.lastName || 'User',
    role: user.role || 'candidate',
    isEmailVerified: Boolean(user.isEmailVerified),
  };
}

/** Exchanges the httpOnly session cookie (or an in-memory refresh token) for a new access token. */
export function refreshAuthSession(): Promise<boolean> {
  if (pending) return pending;

  const refreshToken = getStoredRefreshToken() || useAuthStore.getState().refreshToken;
  pending = axios
    .post(
      `${getApiUrl()}/auth/refresh-token`,
      refreshToken ? { refreshToken } : {},
      { withCredentials: true }
    )
    .then(({ data }) => {
      const accessToken = data?.data?.accessToken as string | undefined;
      const nextRefresh = data?.data?.refreshToken as string | undefined;
      const user = toUser((data?.data?.user || {}) as SessionUser);
      if (!accessToken || !nextRefresh) {
        if (useAuthStore.getState().isAuthenticated) useAuthStore.getState().clearAuth();
        return false;
      }
      const store = useAuthStore.getState();
      if (user) {
        store.setAuth(user, accessToken, nextRefresh);
      } else if (store.user) {
        store.updateTokens(accessToken, nextRefresh);
      } else {
        store.clearAuth();
        return false;
      }
      return true;
    })
    .catch(() => {
      if (useAuthStore.getState().isAuthenticated) useAuthStore.getState().clearAuth();
      return false;
    })
    .finally(() => {
      pending = null;
    });

  return pending;
}

/** Restores a Career Track session after a new tab, refresh, or redirect. */
export function restoreAuthSession(): Promise<boolean> {
  if (getStoredAccessToken() || useAuthStore.getState().accessToken) {
    return Promise.resolve(useAuthStore.getState().isAuthenticated);
  }
  return refreshAuthSession();
}

export function shouldRedirectToLogin(pathname?: string | null) {
  const path = pathname || (typeof window !== 'undefined' ? window.location.pathname : '');
  if (!path || path.startsWith('/auth/')) return false;
  if (isPublicJobBrowsePath(path)) return false;
  return true;
}
