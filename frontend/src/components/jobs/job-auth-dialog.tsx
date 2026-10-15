'use client';

import Link from 'next/link';
import { Bookmark } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { buttonVariants } from '@/components/ui/button';
import { jobSeekerAuthHref } from '@/lib/job-auth';
import { cn } from '@/lib/utils';
import type { Job } from '@/types';

type Mode = 'save' | 'apply' | 'incompatible';

type Props = {
  open: boolean;
  mode: Mode;
  job: Job | null;
  onOpenChange: (open: boolean) => void;
};

export function JobAuthDialog({ open, mode, job, onOpenChange }: Props) {
  const incompatible = mode === 'incompatible';
  const applying = mode === 'apply';
  const signInHref = job ? jobSeekerAuthHref('login', job, applying ? 'apply' : 'save') : '/auth/login';
  const registerHref = job ? jobSeekerAuthHref('register', job, applying ? 'apply' : 'save') : '/auth/register';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <span className="mb-2 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--ct-tint)] text-[var(--ct-green)]">
            <Bookmark className="h-5 w-5" aria-hidden />
          </span>
          <DialogTitle>
            {incompatible
              ? 'Job seeker account required'
              : applying
                ? 'Sign in to apply'
                : 'Sign in to save this job'}
          </DialogTitle>
          <DialogDescription>
            {incompatible
              ? 'Saving and applying requires a Career Track job seeker account. Sign in with a job seeker account to continue.'
              : applying
                ? 'Sign in or create a free Career Track account to apply for this job.'
                : 'Sign in or create a free Career Track account to save jobs and manage your job search.'}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link
            href={signInHref}
            className={cn(buttonVariants({ size: 'lg' }), 'h-11 flex-1 bg-[var(--ct-green)] text-white hover:bg-[var(--ct-green-deep)]')}
          >
            {incompatible ? 'Sign in with a job seeker account' : 'Sign In'}
          </Link>
          {incompatible ? null : (
            <Link
              href={registerHref}
              className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'h-11 flex-1')}
            >
              Create Account
            </Link>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
