'use client';

import { useEffect } from 'react';
import { getBendaForgotPasswordUrl } from '@/lib/benda-auth';

export default function ForgotPasswordPage() {
  useEffect(() => {
    window.location.replace(getBendaForgotPasswordUrl());
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <p className="text-sm text-muted-foreground">
        Redirecting to Benda Infotech password reset…
      </p>
    </div>
  );
}
