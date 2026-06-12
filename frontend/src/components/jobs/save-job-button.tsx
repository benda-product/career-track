'use client';

import { Bookmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSavedJobs } from '@/hooks/use-saved-jobs';
import { Job } from '@/types';
import { cn } from '@/lib/utils';

interface SaveJobButtonProps {
  job: Job;
  size?: 'sm' | 'default' | 'icon';
  variant?: 'ghost' | 'outline' | 'secondary';
  showLabel?: boolean;
  className?: string;
}

export function SaveJobButton({
  job,
  size = 'sm',
  variant = 'ghost',
  showLabel = false,
  className,
}: SaveJobButtonProps) {
  const { isSaved, toggleSave, isToggling } = useSavedJobs();
  const saved = isSaved(job.id);
  const pending = isToggling(job.id);

  return (
    <Button
      type="button"
      size={size}
      variant={variant}
      className={cn(saved && 'text-primary', className)}
      disabled={pending || !job.id}
      onClick={() => toggleSave(job)}
      aria-label={saved ? 'Remove from saved jobs' : 'Save job'}
      title={saved ? 'Remove from saved jobs' : 'Save job'}
    >
      <Bookmark className={cn('h-4 w-4', saved && 'fill-current')} />
      {showLabel && <span className="ml-1">{saved ? 'Saved' : 'Save'}</span>}
    </Button>
  );
}
