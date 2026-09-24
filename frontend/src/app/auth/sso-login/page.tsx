'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { UserRole } from '@/types';
import { resolveWorkspacePath } from '@/lib/post-auth-navigation';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5003/api/v1';

function SsoLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [error, setError] = useState('');

  const token = searchParams.get('token');
  const redirect = searchParams.get('redirect') || '/dashboard';

  useEffect(() => {
    if (!token) {
      router.replace('/auth/login');
      return;
    }

    let cancelled = false;

    async function completeSso() {
      try {
        const response = await fetch(`${API_BASE}/auth/sso-login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ token, redirect }),
        });
        const json = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(json.message || 'Unable to complete sign in.');
        }
        const data = json.data ?? json;
        if (cancelled) return;

        const role = (data.user?.role || 'candidate') as UserRole;
        if (data.accessToken && data.user) {
          setAuth(
            {
              id: String(data.user.id),
              email: data.user.email,
              firstName: data.user.firstName,
              lastName: data.user.lastName,
              role,
              isEmailVerified: Boolean(data.user.isEmailVerified),
            },
            data.accessToken,
            data.refreshToken,
          );
        }
        // Soft navigate so in-memory tokens survive; cookies cover hard refresh.
        router.replace(resolveWorkspacePath(role, data.redirect || redirect));
      } catch (err) {
        if (cancelled) return;
        const message =
          err instanceof Error ? err.message : 'Unable to sign in from Benda Infotech.';
        setError(message);
      }
    }

    void completeSso();
    return () => {
      cancelled = true;
    };
  }, [router, token, redirect, setAuth]);

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="text-red-600">{error}</p>
        <button
          type="button"
          className="text-sm text-blue-600 underline"
          onClick={() => router.replace('/auth/login')}
        >
          Go to sign in
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-6">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-gray-600">Signing you into Career Track…</p>
    </div>
  );
}

export default function SsoLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-6">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        </div>
      }
    >
      <SsoLoginContent />
    </Suspense>
  );
}
