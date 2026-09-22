'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import axios from 'axios';
import { Sidebar } from '@/components/resume/Sidebar';
import { TopNavbar } from '@/components/resume/TopNavbar';
import { SocketProvider } from '@/components/providers/socket-provider';
import { getStoredAccessToken, useAuthStore } from '@/store/auth.store';
import { profileService } from '@/services/profile.service';
import { getApiUrl } from '@/constants';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const updateTokens = useAuthStore((s) => s.updateTokens);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const [profileChecked, setProfileChecked] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    if (hasHydrated && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [hasHydrated, isAuthenticated, router]);

  // After refresh, JWTs live only in httpOnly cookies — restore memory Bearer for sockets.
  useEffect(() => {
    if (!hasHydrated || !isAuthenticated) return;
    if (getStoredAccessToken() || useAuthStore.getState().accessToken) {
      setSessionReady(true);
      return;
    }

    let cancelled = false;
    axios
      .post(`${getApiUrl()}/auth/refresh-token`, {}, { withCredentials: true })
      .then(({ data }) => {
        if (cancelled) return;
        const accessToken = data?.data?.accessToken;
        const refreshToken = data?.data?.refreshToken;
        if (accessToken && refreshToken) {
          updateTokens(accessToken, refreshToken);
          setSessionReady(true);
        } else {
          clearAuth();
          router.push('/auth/login');
        }
      })
      .catch(() => {
        if (cancelled) return;
        clearAuth();
        router.push('/auth/login');
      });

    return () => {
      cancelled = true;
    };
  }, [hasHydrated, isAuthenticated, updateTokens, clearAuth, router]);

  useEffect(() => {
    if (!hasHydrated || !isAuthenticated || !sessionReady) return;
    if (pathname?.startsWith('/onboarding')) {
      setProfileChecked(true);
      return;
    }

    profileService
      .getProfile()
      .then((res) => {
        if (!res.user.professionalProfileCompleted) {
          router.replace('/onboarding/professional');
          return;
        }
        setProfileChecked(true);
      })
      .catch(() => setProfileChecked(true));
  }, [hasHydrated, isAuthenticated, sessionReady, pathname, router]);

  if (!hasHydrated || (isAuthenticated && !sessionReady)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  if (!profileChecked && !pathname?.startsWith('/onboarding')) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const bendaHubUrl = process.env.NEXT_PUBLIC_BENDA_URL || 'http://localhost:3004';
  const isOnboarding = pathname?.startsWith('/onboarding');

  return (
    <SocketProvider>
      <div className="flex min-h-screen bg-slate-50/50">
        {!isOnboarding && <Sidebar className="hidden lg:flex" />}
        <div className="flex flex-1 flex-col">
          {!isOnboarding && <TopNavbar />}
          <main className="flex-1 overflow-auto p-4 lg:p-6 bg-slate-50/30">
            {children}
          </main>
          <footer className="border-t border-slate-200/60 bg-white/50 px-6 py-3.5 text-center text-[11px] font-medium text-slate-400">
            <span>
              © {new Date().getFullYear()} CareerTrack • Powered by{' '}
              <a
                href={bendaHubUrl}
                target="_blank"
                rel="noreferrer"
                className="text-slate-500 transition-colors hover:text-primary"
              >
                Benda Infotech
              </a>
              .
            </span>
          </footer>
        </div>
      </div>
    </SocketProvider>
  );
}
