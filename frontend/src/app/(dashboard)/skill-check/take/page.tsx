'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { skillCheckService } from '@/services/skillCheck.service';

export default function TakeTestPage() {
  const [error, setError] = useState('');

  useEffect(() => {
    const returnUrl = `${window.location.origin}/skill-check`;
    skillCheckService
      .openInSkillTest({ action: 'take', returnUrl })
      .catch((err: unknown) => {
        const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
        setError(
          axiosErr.response?.data?.message ||
            axiosErr.message ||
            'Failed to open Benda Test Platform'
        );
      });
  }, []);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="Take Test"
        description="Opening Benda Test Platform to start a skill assessment"
      />
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      ) : (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Redirecting to Benda Test Platform…
        </div>
      )}
    </div>
  );
}
