'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import { Loader2 } from 'lucide-react';
import { getApiUrl } from '@/constants';
import { useAuthStore } from '@/store/auth.store';
import { User, UserRole } from '@/types';
import { resolveWorkspacePath } from '@/lib/post-auth-navigation';

function BendaSsoPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useAuthStore((s) => s.setAuth);

  useEffect(() => {
    const refreshToken = searchParams.get('refreshToken');
    const userId = searchParams.get('userId');
    const email = searchParams.get('email');
    const firstName = searchParams.get('firstName');
    const lastName = searchParams.get('lastName');
    const role = (searchParams.get('role') || 'candidate') as UserRole;
    const accountType = searchParams.get('accountType');
    const redirect = searchParams.get('redirect') || '/dashboard';
    window.history.replaceState(null, '', window.location.pathname);

    if (!refreshToken || !userId || !email || !firstName || !lastName) {
      router.replace('/auth/login?error=Sign-in%20from%20Benda%20failed.%20Please%20sign%20in%20with%20your%20Career%20Track%20password.');
      return;
    }

    if (accountType === 'recruiter') {
      router.replace('/auth/role-mismatch?reason=recruiter');
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const { data } = await axios.post(
          `${getApiUrl()}/auth/refresh-token`,
          { refreshToken },
          { withCredentials: true }
        );
        if (cancelled) return;
        const sessionUser = data?.data?.user || {};
        const user: User = {
          id: String(sessionUser.id || userId),
          email: sessionUser.email || email,
          firstName: sessionUser.firstName || firstName,
          lastName: sessionUser.lastName || lastName,
          role: (sessionUser.role || role) as UserRole,
          isEmailVerified: sessionUser.isEmailVerified !== false,
        };
        setAuth(user, data.data.accessToken, data.data.refreshToken);
        router.replace(resolveWorkspacePath(user.role, redirect));
      } catch {
        if (!cancelled) {
          router.replace('/auth/login?error=Sign-in%20from%20Benda%20failed.%20Please%20sign%20in%20with%20your%20Career%20Track%20password.');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router, searchParams, setAuth]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-6">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Signing you into Career Track…</p>
    </div>
  );
}

export default function BendaSsoPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center p-6 text-sm text-muted-foreground">
          Loading…
        </div>
      }
    >
      <BendaSsoPageContent />
    </Suspense>
  );
}
