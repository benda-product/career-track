'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';
import { AuthShell } from '@/components/auth/auth-shell';

function TrackApplicationContent() {
  const searchParams = useSearchParams();
  const email = String(searchParams.get('email') || '').trim();
  const applicationId = String(searchParams.get('applicationId') || '').trim();
  const redirect = '/applications/status';

  const authParams = new URLSearchParams({
    redirect,
    from: 'apply',
  });
  if (email) authParams.set('email', email);
  if (applicationId) authParams.set('applicationId', applicationId);

  const loginHref = `/auth/login?${authParams.toString()}`;
  const registerHref = `/auth/register?${authParams.toString()}`;

  return (
    <AuthShell
      mode="login"
      title="Track your application"
      subtitle="Your job application was submitted. Sign in or create your Career Track account, complete your profile, then view application status."
    >
      <div className="space-y-6">
        <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
          <div className="space-y-1">
            <p className="font-semibold">Application received</p>
            {email ? (
              <p className="text-emerald-800">
                We saved your application for <strong>{email}</strong>.
              </p>
            ) : (
              <p className="text-emerald-800">We saved your application details.</p>
            )}
          </div>
        </div>

        <ol className="space-y-2 text-sm text-[var(--ct-muted)]">
          <li>1. Sign in if you already have Career Track, or create your account.</li>
          <li>2. Complete your personal and professional profile.</li>
          <li>3. Open your application tracker in Career Track.</li>
        </ol>

        <div className="grid gap-3">
          <Link
            href={loginHref}
            className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-[var(--ct-green)] text-sm font-semibold text-white transition hover:bg-[var(--ct-green-deep)]"
          >
            I already have an account — Sign in
          </Link>
          <Link
            href={registerHref}
            className="inline-flex h-11 w-full items-center justify-center rounded-lg border border-[var(--ct-line)] bg-white text-sm font-semibold text-[var(--ct-ink)] transition hover:bg-slate-50"
          >
            Create Career Track account
          </Link>
        </div>
      </div>
    </AuthShell>
  );
}

export default function TrackApplicationPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[var(--ct-canvas)] text-sm text-[var(--ct-muted)]">
          Loading…
        </div>
      }
    >
      <TrackApplicationContent />
    </Suspense>
  );
}
