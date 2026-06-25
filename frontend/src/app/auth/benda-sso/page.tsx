'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { User, UserRole } from '@/types';

export default function BendaSsoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useAuthStore((s) => s.setAuth);

  useEffect(() => {
    const accessToken = searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');
    const userId = searchParams.get('userId');
    const email = searchParams.get('email');
    const firstName = searchParams.get('firstName');
    const lastName = searchParams.get('lastName');
    const role = (searchParams.get('role') || 'candidate') as UserRole;
    const accountType = searchParams.get('accountType');
    const redirect = searchParams.get('redirect') || '/dashboard';

    if (!accessToken || !refreshToken || !userId || !email || !firstName || !lastName) {
      router.replace('/auth/login?error=Sign-in%20from%20Benda%20failed.%20Please%20sign%20in%20with%20your%20Career%20Track%20password.');
      return;
    }

    if (accountType === 'recruiter') {
      router.replace('/auth/role-mismatch?reason=recruiter');
      return;
    }

    const user: User = {
      id: userId,
      email,
      firstName,
      lastName,
      role,
      isEmailVerified: true,
    };

    setAuth(user, accessToken, refreshToken);
    router.replace(redirect);
  }, [router, searchParams, setAuth]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-6">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Signing you into Career Track…</p>
    </div>
  );
}
