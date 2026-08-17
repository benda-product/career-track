'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');
  const [turnstileKey, setTurnstileKey] = useState(0);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    if (isTurnstileEnabled() && !turnstileToken) {
      setError('Please complete the security check.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await authService.register({ ...data, turnstileToken });
      setAuth(result.user, result.accessToken, result.refreshToken);
      router.push('/dashboard');
    } catch {
      setError('Registration failed. Email may already be in use.');
    } finally {
      setLoading(false);
      setTurnstileToken('');
      setTurnstileKey((key) => key + 1);
    }
  };

  return (
    <AuthShell
      mode="register"
      title="Create your account"
      subtitle="For job seekers. Start free — Resume AI and SkillCheck stay one switch away."
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
                className={cn(fieldClass, errors.firstName && 'border-red-400')}
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
                className={cn(fieldClass, errors.lastName && 'border-red-400')}
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
              placeholder="you@example.com"
              className={cn(fieldClass, errors.email && 'border-red-400')}
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
            Create account
          </button>
        </form>

        <p className="pt-1 text-center text-xs leading-relaxed text-[var(--ct-muted)]">
          Free to start. Same Google identity works with Benda Infotech Hub products.
        </p>
      </div>
    </AuthShell>
  );
}
