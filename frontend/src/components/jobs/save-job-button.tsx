'use client';

import { useState } from 'react';
import { Bookmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { JobAuthDialog } from '@/components/jobs/job-auth-dialog';
import { useSavedJobs } from '@/hooks/use-saved-jobs';
import { useAuthStore } from '@/store/auth.store';
import { Job } from '@/types';
import { cn } from '@/lib/utils';

interface SaveJobButtonProps {
  job: Job;
  size?: 'sm' | 'default' | 'icon';
  variant?: 'ghost' | 'outline' | 'secondary';
  showLabel?: boolean;
  className?: string;
  appearance?: 'default' | 'board';
}

export function SaveJobButton({
  job,
  size = 'sm',
  variant = 'ghost',
  showLabel = false,
  className,
  appearance = 'default',
}: SaveJobButtonProps) {
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const role = useAuthStore((state) => state.user?.role);
  const { isSaved, toggleSave, isToggling } = useSavedJobs();
  const [prompt, setPrompt] = useState<'save' | 'incompatible' | null>(null);
  const saved = isAuthenticated && role === 'candidate' && isSaved(job.id);
  const pending = isToggling(job.id);

  if (appearance === 'board') {
    return (
      <>
        <button
          type="button"
          className={cn('save-button', saved && 'is-saved', className)}
          disabled={pending || !job.id || !hasHydrated}
          onClick={() => {
            if (!hasHydrated) return;
            if (!isAuthenticated) {
              setPrompt('save');
              return;
            }
            if (role !== 'candidate') {
              setPrompt('incompatible');
              return;
            }
            void toggleSave(job);
          }}
          aria-label={`${saved ? 'Saved' : 'Save'} ${job.title || 'job'}`}
          aria-pressed={saved}
        >
          <Bookmark className={cn('save-icon', saved && 'is-filled')} aria-hidden="true" />
          {saved ? 'Saved' : 'Save'}
        </button>
        <JobAuthDialog
          open={Boolean(prompt)}
          mode={prompt || 'save'}
          job={job}
          onOpenChange={(open) => {
            if (!open) setPrompt(null);
          }}
        />
      </>
    );
  }

  return (
    <>
      <Button
        type="button"
        size={size}
        variant={variant}
        className={cn(saved && 'text-primary', className)}
        disabled={pending || !job.id || !hasHydrated}
        onClick={() => {
          if (!hasHydrated) return;
          if (!isAuthenticated) {
            setPrompt('save');
            return;
          }
          if (role !== 'candidate') {
            setPrompt('incompatible');
            return;
          }
          void toggleSave(job);
        }}
        aria-label={saved ? 'Remove from saved jobs' : 'Save job'}
        title={saved ? 'Remove from saved jobs' : 'Save job'}
      >
        <Bookmark className={cn('h-4 w-4', saved && 'fill-current')} />
        {showLabel && <span className="ml-1">{saved ? 'Saved' : 'Save'}</span>}
      </Button>
      <JobAuthDialog
        open={Boolean(prompt)}
        mode={prompt || 'save'}
        job={job}
        onOpenChange={(open) => {
          if (!open) setPrompt(null);
        }}
      />
    </>
  );
}
