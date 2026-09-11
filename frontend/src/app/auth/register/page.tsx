'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { isAxiosError } from 'axios';
import { Loader2 } from 'lucide-react';
import { AuthShell } from '@/components/auth/auth-shell';
import { GoogleSignInButton } from '@/components/auth/google-sign-in-button';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/auth.store';
import { cn } from '@/lib/utils';
import { TurnstileField, isTurnstileEnabled } from '@/components/TurnstileField';
import { navigateAfterAuth } from '@/lib/post-auth-navigation';
import type { User, UserRole } from '@/types';

const registerSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Enter a valid email'),
  password: z
    .string()
    .min(8, 'At least 8 characters')
    .regex(/[A-Z]/, 'Must include an uppercase letter')
    .regex(/[a-z]/, 'Must include a lowercase letter')
    .regex(/[0-9]/, 'Must include a number'),
});

type RegisterForm = z.infer<typeof registerSchema>;

const fieldClass =
  'h-11 w-full rounded-lg border border-[var(--ct-line)] bg-white px-3.5 text-sm text-[var(--ct-ink)] outline-none transition placeholder:text-[var(--ct-muted)]/70 focus:border-[var(--ct-green)] focus:ring-3 focus:ring-[color-mix(in_oklab,var(--ct-green)_22%,transparent)]';

function RegisterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [accountMode, setAccountMode] = useState<'register' | 'complete' | 'active'>('register');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [turnstileKey, setTurnstileKey] = useState(0);

  const emailFromQuery = String(searchParams.get('email') || '').trim();
  const redirectPath = searchParams.get('redirect') || '/applications/status';
  const fromApply = searchParams.get('from') === 'apply';

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: emailFromQuery,
      firstName: '',
      lastName: '',
      password: '',
    },
  });

  useEffect(() => {
    let cancelled = false;

    async function loadStatus() {
      if (!emailFromQuery) {
        setCheckingStatus(false);
        return;
      }

      try {
        const status = await authService.getApplicantAccountStatus(emailFromQuery);
        if (cancelled) return;

        if (status.status === 'needs_password') {
          setAccountMode('complete');
          reset({
            email: status.email || emailFromQuery,
            firstName: status.firstName || '',
            lastName: status.lastName || '',
            password: '',
          });
        } else if (status.status === 'active') {
          setAccountMode('active');
        } else {
          setAccountMode('register');
          reset({
            email: emailFromQuery,
            firstName: '',
            lastName: '',
            password: '',
          });
        }
      } catch {
        if (!cancelled) setAccountMode('register');
      } finally {
        if (!cancelled) setCheckingStatus(false);
      }
    }

    void loadStatus();
    return () => {
      cancelled = true;
    };
  }, [emailFromQuery, reset]);

  const finishAuth = async (result: {
    user: User;
    accessToken: string;
    refreshToken: string;
  }) => {
    setAuth(
      {
        ...result.user,
        role: (result.user.role || 'candidate') as UserRole,
      },
      result.accessToken,
      result.refreshToken
    );
    await navigateAfterAuth(router, redirectPath);
  };

  const onSubmit = async (data: RegisterForm) => {
    if (isTurnstileEnabled() && !turnstileToken) {
      setError('Please complete the security check.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result =
        accountMode === 'complete'
          ? await authService.completeApplicantAccount({
              email: data.email,
              password: data.password,
              firstName: data.firstName,
              lastName: data.lastName,
              turnstileToken,
            })
          : await authService.register({ ...data, turnstileToken });
      await finishAuth(result);
    } catch (err) {
      const apiMessage = isAxiosError(err)
        ? (err.response?.data as { message?: string } | undefined)?.message
        : undefined;
      setError(apiMessage || 'Unable to create your account right now.');
    } finally {
      setLoading(false);
      setTurnstileToken('');
      setTurnstileKey((key) => key + 1);
    }
  };

  if (checkingStatus) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--ct-canvas)] text-sm text-[var(--ct-muted)]">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Preparing your account…
      </div>
    );
  }

  if (accountMode === 'active') {
    const loginParams = new URLSearchParams({
      email: emailFromQuery,
      redirect: redirectPath,
      from: 'apply',
    });
    return (
      <AuthShell
        mode="login"
        title="Account already exists"
        subtitle="This email already has a Career Track account. Sign in to continue."
      >
        <Link
          href={`/auth/login?${loginParams.toString()}`}
          className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-[var(--ct-green)] text-sm font-semibold text-white transition hover:bg-[var(--ct-green-deep)]"
        >
          Sign in to track application
        </Link>
      </AuthShell>
    );
  }

  const title =
    accountMode === 'complete'
      ? 'Create your Career Track password'
      : fromApply
        ? 'Create account to track application'
        : 'Create your account';

  const subtitle =
    accountMode === 'complete'
      ? 'Your application is saved. Set a password to activate your account, then complete your profile.'
      : fromApply
        ? 'Set up Career Track to follow your application status and complete your profile.'
        : 'For job seekers. Start free — Resume AI and SkillCheck stay one switch away.';

  return (
    <AuthShell mode="register" title={title} subtitle={subtitle}>
      <div className="space-y-5">
        <GoogleSignInButton
          disabled={loading}
          onError={setError}
          label="Continue with Google"
          onSuccess={async (idToken) => {
            setLoading(true);
            setError('');
            try {
              const result = await authService.googleLogin(idToken);
              await finishAuth(result);
            } catch (err) {
              const apiMessage = isAxiosError(err)
                ? (err.response?.data as { message?: string } | undefined)?.message
                : undefined;
              setError(apiMessage || 'Google sign-up failed');
            } finally {
              setLoading(false);
            }
          }}
        />

        <div className="flex items-center gap-3" aria-hidden>
          <div className="h-px flex-1 bg-[var(--ct-line)]" />
          <span className="text-xs font-medium uppercase tracking-[0.12em] text-[var(--ct-muted)]">or email</span>
          <div className="h-px flex-1 bg-[var(--ct-line)]" />
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error ? (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm font-medium text-red-700"
            >
              {error}
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="firstName" className="text-sm font-medium text-[var(--ct-ink)]">
                First name
              </label>
              <input
                id="firstName"
                autoComplete="given-name"
                readOnly={accountMode === 'complete'}
                className={cn(fieldClass, errors.firstName && 'border-red-400', accountMode === 'complete' && 'bg-slate-50')}
                {...register('firstName')}
              />
              {errors.firstName ? <p className="text-xs text-red-600">{errors.firstName.message}</p> : null}
            </div>
            <div className="space-y-1.5">
              <label htmlFor="lastName" className="text-sm font-medium text-[var(--ct-ink)]">
                Last name
              </label>
              <input
                id="lastName"
                autoComplete="family-name"
                readOnly={accountMode === 'complete'}
                className={cn(fieldClass, errors.lastName && 'border-red-400', accountMode === 'complete' && 'bg-slate-50')}
                {...register('lastName')}
              />
              {errors.lastName ? <p className="text-xs text-red-600">{errors.lastName.message}</p> : null}
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-medium text-[var(--ct-ink)]">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              readOnly={Boolean(emailFromQuery)}
              placeholder="you@example.com"
              className={cn(fieldClass, errors.email && 'border-red-400', emailFromQuery && 'bg-slate-50')}
              {...register('email')}
            />
            {errors.email ? <p className="text-xs text-red-600">{errors.email.message}</p> : null}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="text-sm font-medium text-[var(--ct-ink)]">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="8+ chars, upper, lower, number"
              className={cn(fieldClass, errors.password && 'border-red-400')}
              {...register('password')}
            />
            {errors.password ? <p className="text-xs text-red-600">{errors.password.message}</p> : null}
          </div>

          <TurnstileField key={turnstileKey} onToken={setTurnstileToken} />

          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[var(--ct-green)] text-sm font-semibold text-white transition hover:bg-[var(--ct-green-deep)] disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {accountMode === 'complete' ? 'Create password & continue' : 'Create account'}
          </button>
        </form>

        <p className="text-center text-sm text-[var(--ct-muted)]">
          Already have an account?{' '}
          <Link
            href={`/auth/login?${new URLSearchParams({
              ...(emailFromQuery ? { email: emailFromQuery } : {}),
              redirect: redirectPath,
              from: 'apply',
            }).toString()}`}
            className="font-semibold text-[var(--ct-green)] hover:text-[var(--ct-green-deep)]"
          >
            Sign in
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[var(--ct-canvas)] text-sm text-[var(--ct-muted)]">
          Loading…
        </div>
      }
    >
      <RegisterPageContent />
    </Suspense>
  );
}
