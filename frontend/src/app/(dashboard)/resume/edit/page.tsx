'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { resumeService } from '@/services/resume.service';

function ResumeEditRedirect() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id') || '';
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) {
      setError('Resume ID is required');
      return;
    }

    const returnUrl = `${window.location.origin}/resume`;
    resumeService
      .openInResumeBuilder({ type: 'edit', resumeId: id, returnUrl })
      .catch((err: Error) => setError(err.message || 'Failed to open Resume Builder'));
  }, [id]);

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
        {error}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" />
      Opening resume in Resume Builder…
    </div>
  );
}

export default function EditResumePage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Edit Resume" description="Opening Resume Builder editor" />
      <Suspense fallback={<Skeleton className="h-24" />}>
        <ResumeEditRedirect />
      </Suspense>
    </div>
  );
}
