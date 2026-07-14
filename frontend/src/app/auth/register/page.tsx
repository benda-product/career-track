'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { isAxiosError } from 'axios';
import { Loader2 } from 'lucide-react';
import { CareerTrackLogo } from '@/components/brand/career-track-logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { GoogleSignInButton } from '@/components/auth/google-sign-in-button';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/auth.store';

const registerSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email'),
  password: z
    .string()
    .min(8, 'At least 8 characters')
    .regex(/[A-Z]/, 'Must contain uppercase')
    .regex(/[a-z]/, 'Must contain lowercase')
    .regex(/[0-9]/, 'Must contain number'),
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true);
    setError('');
    try {
      const result = await authService.register(data);
      setAuth(result.user, result.accessToken, result.refreshToken);
      router.push('/dashboard');
    } catch {
      setError('Registration failed. Email may already be in use.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted/30 p-4">
      <Card className="w-full max-w-md border-border/40 bg-card/80 shadow-xl backdrop-blur-xl">
        <CardHeader className="text-center">
          <CareerTrackLogo size="xl" className="mx-auto mb-4 justify-center" />
          <CardTitle className="text-2xl">Create your account</CardTitle>
          <CardDescription>
            Career Track is for job seekers. Sign up with Google or email. Recruiters should use
            Talent Desk instead.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {error && (
              <div
                role="alert"
                className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm font-medium text-destructive"
              >
                {error}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First name</Label>
                <Input id="firstName" {...register('firstName')} />
                {errors.firstName && <p className="text-xs text-destructive">{errors.firstName.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last name</Label>
                <Input id="lastName" {...register('lastName')} />
                {errors.lastName && <p className="text-xs text-destructive">{errors.lastName.message}</p>}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register('email')} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" {...register('password')} />
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <GoogleSignInButton
              disabled={loading}
              onError={setError}
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
            <div className="relative w-full text-center text-xs text-muted-foreground">
              <span className="bg-card px-2 relative z-10">or continue with email</span>
              <div className="absolute inset-x-0 top-1/2 h-px bg-border" aria-hidden />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create account
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-primary hover:underline">Sign in</Link>
            </p>
            <p className="text-center text-sm text-muted-foreground">
              Hiring?{' '}
              <a
                href={process.env.NEXT_PUBLIC_TALENT_DESK_URL || 'http://localhost:3002'}
                className="text-primary hover:underline"
              >
                Use Talent Desk
              </a>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
