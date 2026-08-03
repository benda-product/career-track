'use client';

import { Suspense, useState } from 'react';
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
import { getBendaForgotPasswordUrl } from '@/lib/benda-auth';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

const fieldClass =
  'h-11 w-full rounded-lg border border-[var(--ct-line)] bg-white px-3.5 text-sm text-[var(--ct-ink)] outline-none transition placeholder:text-[var(--ct-muted)]/70 focus:border-[var(--ct-green)] focus:ring-3 focus:ring-[color-mix(in_oklab,var(--ct-green)_22%,transparent)]';

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [error, setError] = useState(searchParams.get('error') || '');
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    setError('');
    try {
      const result = await authService.login(data);
      setAuth(result.user, result.accessToken, result.refreshToken);
      router.push('/dashboard');
    } catch (err) {
      const apiMessage = isAxiosError(err)
        ? (err.response?.data as { message?: string } | undefined)?.message
        : undefined;
      setError(apiMessage || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      mode="login"
      title="Sign in"
      subtitle="Job seekers only — use Google or email. Recruiters should use Talent Desk."
    >
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
              setAuth(result.user, result.accessToken, result.refreshToken);
              router.push('/dashboard');
            } catch (err) {
              const apiMessage = isAxiosError(err)
                ? (err.response?.data as { message?: string } | undefined)?.message
                : undefined;
              setError(apiMessage || 'Google sign-in failed');
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

          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-medium text-[var(--ct-ink)]">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              className={cn(fieldClass, errors.email && 'border-red-400')}
              {...register('email')}
            />
            {errors.email ? <p className="text-xs text-red-600">{errors.email.message}</p> : null}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-3">
              <label htmlFor="password" className="text-sm font-medium text-[var(--ct-ink)]">
                Password
              </label>
              <Link
                href={getBendaForgotPasswordUrl()}
                className="text-xs font-semibold text-[var(--ct-green)] hover:text-[var(--ct-green-deep)]"
              >
                Forgot password?
              </Link>
            </div>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              className={cn(fieldClass, errors.password && 'border-red-400')}
              {...register('password')}
            />
            {errors.password ? <p className="text-xs text-red-600">{errors.password.message}</p> : null}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[var(--ct-green)] text-sm font-semibold text-white transition hover:bg-[var(--ct-green-deep)] disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Sign in
          </button>
        </form>

        <p className="pt-1 text-center text-xs leading-relaxed text-[var(--ct-muted)]">
          By continuing you agree to use CareerTrack for your own job search.
        </p>
      </div>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[var(--ct-canvas)] text-sm text-[var(--ct-muted)]">
          Loading…
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
