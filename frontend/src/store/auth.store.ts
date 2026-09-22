import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  hasHydrated: boolean;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  updateTokens: (accessToken: string, refreshToken: string) => void;
  clearAuth: () => void;
  updateUser: (user: Partial<User>) => void;
  setHasHydrated: (value: boolean) => void;
}

export const TOKEN_REFRESHED_EVENT = 'careertrack-token-refreshed';

/** In-memory tokens only — never persist JWTs to localStorage. */
let memoryAccessToken: string | null = null;
let memoryRefreshToken: string | null = null;

function scrubLegacyTokenStorage() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  } catch {
    /* ignore */
  }
}

function migrateLegacyTokensOnce() {
  if (typeof window === 'undefined') return;
  try {
    const legacyAccess = localStorage.getItem('accessToken');
    const legacyRefresh = localStorage.getItem('refreshToken');
    if (legacyAccess && !memoryAccessToken) memoryAccessToken = legacyAccess;
    if (legacyRefresh && !memoryRefreshToken) memoryRefreshToken = legacyRefresh;
    scrubLegacyTokenStorage();
  } catch {
    /* ignore */
  }
}

migrateLegacyTokensOnce();

export function getStoredAccessToken(): string | null {
  if (memoryAccessToken) return memoryAccessToken;
  migrateLegacyTokensOnce();
  return memoryAccessToken;
}

export function getStoredRefreshToken(): string | null {
  if (memoryRefreshToken) return memoryRefreshToken;
  migrateLegacyTokensOnce();
  return memoryRefreshToken;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      hasHydrated: false,
      setAuth: (user, accessToken, refreshToken) => {
        memoryAccessToken = accessToken;
        memoryRefreshToken = refreshToken;
        scrubLegacyTokenStorage();
        set({ user, accessToken, refreshToken, isAuthenticated: true, hasHydrated: true });
      },
      updateTokens: (accessToken, refreshToken) => {
        memoryAccessToken = accessToken;
        memoryRefreshToken = refreshToken;
        scrubLegacyTokenStorage();
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent(TOKEN_REFRESHED_EVENT, { detail: { accessToken } })
          );
        }
        set({ accessToken, refreshToken });
      },
      clearAuth: () => {
        memoryAccessToken = null;
        memoryRefreshToken = null;
        scrubLegacyTokenStorage();
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
      },
      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),
      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: 'careertrack-auth',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error('Auth rehydration failed', error);
          return;
        }
        scrubLegacyTokenStorage();
        if (state) {
          // Tokens stay in memory / httpOnly cookies only.
          state.accessToken = memoryAccessToken;
          state.refreshToken = memoryRefreshToken;
        }
      },
    }
  )
);

function markAuthHydrated() {
  useAuthStore.setState({
    hasHydrated: true,
    accessToken: memoryAccessToken,
    refreshToken: memoryRefreshToken,
  });
}

if (typeof window !== 'undefined') {
  if (useAuthStore.persist.hasHydrated()) {
    markAuthHydrated();
  } else {
    useAuthStore.persist.onFinishHydration(markAuthHydrated);
  }
}
