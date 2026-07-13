'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Briefcase } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const TALENT_DESK_URL = process.env.NEXT_PUBLIC_TALENT_DESK_URL || 'http://localhost:3002';
const BENDA_URL = process.env.NEXT_PUBLIC_BENDA_URL || 'http://localhost:3004';

function RoleMismatchPageContent() {
  const searchParams = useSearchParams();
  const reason = searchParams.get('reason') || 'recruiter';

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted/30 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            <Briefcase className="h-7 w-7" />
          </div>
          <CardTitle className="text-2xl">Wrong workspace</CardTitle>
          <CardDescription className="text-base leading-relaxed">
            {reason === 'recruiter'
              ? 'Career Track is built for job seekers — learning, applications, and career growth. Your Benda account is registered as a Recruiter.'
              : 'This area is for job seekers. Recruiter accounts should use Talent Desk for hiring workflows.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <a
            href={`${TALENT_DESK_URL}/recruiter`}
            className={cn(buttonVariants({ variant: 'default', size: 'lg' }), 'w-full')}
          >
            Open Talent Desk
          </a>
          <a
            href={BENDA_URL}
            className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'w-full')}
          >
            Back to Benda Infotech
          </a>
          <p className="pt-2 text-center text-sm text-muted-foreground">
            Need a job seeker account too?{' '}
            <Link href="/auth/login" className="font-medium text-primary hover:underline">
              Sign in with a different email
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function RoleMismatchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center p-6 text-sm text-muted-foreground">
          Loading…
        </div>
      }
    >
      <RoleMismatchPageContent />
    </Suspense>
  );
}
