'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import { getApiUrl } from '@/constants';
import { safeTalentJobReturn, talentReturnWithSaved } from '@/lib/talent-return';
import { authService } from '@/services/auth.service';
import {
  getStoredAccessToken,
  getStoredRefreshToken,
  useAuthStore,
} from '@/store/auth.store';

function clip(value: string | null, max: number) {
  return String(value || '')
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .trim()
    .slice(0, max);
}

async function saveWithSession(payload: {
  jobId: string;
  jobTitle: string;
  company: string;
  companyLogo?: string;
  location?: string;
  salary?: string;
  employmentType?: string;
}) {
  const store = useAuthStore.getState();
  let token = getStoredAccessToken() || store.accessToken;
  if (!token) {
    const refresh = getStoredRefreshToken() || store.refreshToken;
    const { data } = await axios.post(
      `${getApiUrl()}/auth/refresh-token`,
      refresh ? { refreshToken: refresh } : {},
      { withCredentials: true }
    );
    token = data.data.accessToken as string;
    store.updateTokens(token, data.data.refreshToken);
  }
  await axios.post(`${getApiUrl()}/jobs/save`, payload, {
    withCredentials: true,
    headers: { Authorization: `Bearer ${token}` },
  });
}

function ContinueSaveContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const jobId = clip(searchParams.get('jobId'), 64);
  const jobTitle = clip(searchParams.get('jobTitle'), 180) || 'Job';
  const company = clip(searchParams.get('company'), 180) || 'Company';
  const location = clip(searchParams.get('location'), 180);
  const salary = clip(searchParams.get('salary'), 80);
  const employmentType = clip(searchParams.get('employmentType'), 40);
  const companyLogo = clip(searchParams.get('companyLogo'), 300);
  const returnUrl = safeTalentJobReturn(searchParams.get('return'));
  const loginTarget = `/auth/login?redirect=${encodeURIComponent(`/auth/continue-save?${searchParams.toString()}`)}`;
  const started = useRef(false);

  const save = useCallback(async () => {
    if (!/^[A-Za-z0-9_-]{8,64}$/.test(jobId) || !returnUrl) {
      setError('This save link is not valid. Return to the job and try again.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await saveWithSession({
        jobId,
        jobTitle,
        company,
        ...(location ? { location } : {}),
        ...(salary ? { salary } : {}),
        ...(employmentType ? { employmentType } : {}),
        ...(companyLogo.startsWith('http://') || companyLogo.startsWith('https://')
          ? { companyLogo }
          : {}),
      });
      window.location.replace(talentReturnWithSaved(returnUrl, jobId));
    } catch {
      setSaving(false);
      setError('The job could not be saved. Please try again.');
    }
  }, [company, companyLogo, employmentType, jobId, jobTitle, location, returnUrl, salary]);

  useEffect(() => {
    if (!hasHydrated || started.current) return;
    if (!isAuthenticated || !user) {
      started.current = true;
      router.replace(loginTarget);
      return;
    }
    if (user.role !== 'candidate') return;
    started.current = true;
    void save();
  }, [hasHydrated, isAuthenticated, loginTarget, router, save, user]);

  const switchAccount = async () => {
    try {
      await authService.logout(getStoredRefreshToken() || '');
    } catch {
      /* local session is cleared next */
    }
    useAuthStore.getState().clearAuth();
    router.replace(loginTarget);
  };

  const incompatible = hasHydrated && isAuthenticated && user && user.role !== 'candidate';

  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-lg items-center px-4 py-16">
      <section className="w-full rounded-2xl border border-[var(--ct-line)] bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-[var(--ct-ink)]">
          {incompatible ? 'Job seeker account required' : 'Saving job'}
        </h1>
        <p className="mt-3 text-sm leading-6 text-[var(--ct-muted)]">
          {incompatible
            ? 'Saving jobs requires a Career Track job seeker account. Sign in with a job seeker account to save this job.'
            : error || 'Saving this job to your Career Track account.'}
        </p>
        {incompatible ? (
          <button
            type="button"
            className="mt-5 inline-flex h-11 items-center justify-center rounded-lg bg-[var(--ct-green)] px-4 text-sm font-semibold text-white"
            onClick={() => void switchAccount()}
          >
            Sign in with a job seeker account
          </button>
        ) : null}
        {error && !incompatible ? (
          <button
            type="button"
            className="mt-5 inline-flex h-11 items-center justify-center rounded-lg bg-[var(--ct-green)] px-4 text-sm font-semibold text-white disabled:opacity-60"
            onClick={() => void save()}
            disabled={saving}
          >
            {saving ? 'Saving…' : 'Try again'}
          </button>
        ) : null}
      </section>
    </main>
  );
}

export default function ContinueSavePage() {
  return (
    <Suspense fallback={null}>
      <ContinueSaveContent />
    </Suspense>
  );
}
