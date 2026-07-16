'use client';

import { useState } from 'react';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { Loader2 } from 'lucide-react';
import { getBendaFirebaseAuth, getFirebaseAuthErrorMessage, isBendaFirebaseConfigured } from '@/lib/firebase';
import { cn } from '@/lib/utils';

type GoogleSignInButtonProps = {
  onSuccess: (idToken: string) => Promise<void>;
  onError?: (message: string) => void;
  disabled?: boolean;
  className?: string;
  label?: string;
};

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z"
      />
    </svg>
  );
}

export function GoogleSignInButton({
  onSuccess,
  onError,
  disabled,
  className,
  label = 'Continue with Google',
}: GoogleSignInButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (!isBendaFirebaseConfigured()) {
      onError?.('Google sign-in is not configured. Add NEXT_PUBLIC_FIREBASE_* env vars.');
      return;
    }

    setLoading(true);
    onError?.('');

    try {
      const auth = getBendaFirebaseAuth();
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();
      await onSuccess(idToken);
    } catch (error) {
      const message = getFirebaseAuthErrorMessage(error);
      if (message) onError?.(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      disabled={disabled || loading}
      onClick={handleClick}
      className={cn(
        'inline-flex h-11 w-full items-center justify-center gap-2.5 rounded-lg border border-[var(--ct-line)] bg-white text-sm font-semibold tracking-tight text-[var(--ct-ink)] transition hover:bg-[var(--ct-tint)] disabled:pointer-events-none disabled:opacity-50',
        className,
      )}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin text-[var(--ct-muted)]" /> : <GoogleMark />}
      {label}
    </button>
  );
}
