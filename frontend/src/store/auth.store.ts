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
  clearAuth: () => void;
  updateUser: (user: Partial<User>) => void;
  setHasHydrated: (value: boolean) => void;
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
        if (typeof window !== 'undefined') {
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', refreshToken);
        }
        set({ user, accessToken, refreshToken, isAuthenticated: true, hasHydrated: true });
      },
      clearAuth: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        }
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
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error('Auth rehydration failed', error);
          return;
        }
        if (state && typeof window !== 'undefined') {
          if (state.accessToken) localStorage.setItem('accessToken', state.accessToken);
          if (state.refreshToken) localStorage.setItem('refreshToken', state.refreshToken);
        }
      },
    }
  )
);

function markAuthHydrated() {
  useAuthStore.setState({ hasHydrated: true });
}

if (typeof window !== 'undefined') {
  if (useAuthStore.persist.hasHydrated()) {
    markAuthHydrated();
  } else {
    useAuthStore.persist.onFinishHydration(markAuthHydrated);
  }
}
