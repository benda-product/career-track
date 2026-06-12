'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { resumeService } from '@/services/resume.service';

export default function CreateResumePage() {
  const [error, setError] = useState('');

  useEffect(() => {
    const returnUrl = `${window.location.origin}/resume`;
    resumeService
      .openInResumeBuilder({ type: 'create', returnUrl })
      .catch((err: Error) => setError(err.message || 'Failed to open Resume Builder'));
  }, []);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="Create Resume"
        description="Opening Resume Builder to create your resume"
      />
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      ) : (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Redirecting to Resume Builder…
        </div>
      )}
    </div>
  );
}
