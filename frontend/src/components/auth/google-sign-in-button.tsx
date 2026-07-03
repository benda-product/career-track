'use client';

import { useState } from 'react';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getBendaFirebaseAuth, getFirebaseAuthErrorMessage, isBendaFirebaseConfigured } from '@/lib/firebase';

type GoogleSignInButtonProps = {
  onSuccess: (idToken: string) => Promise<void>;
  onError?: (message: string) => void;
  disabled?: boolean;
};

export function GoogleSignInButton({ onSuccess, onError, disabled }: GoogleSignInButtonProps) {
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
    <Button
      type="button"
      variant="outline"
      className="w-full"
      disabled={disabled || loading}
      onClick={handleClick}
    >
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <span className="mr-2 inline-flex h-4 w-4 items-center justify-center rounded-full bg-white text-xs font-bold text-red-500">
          G
        </span>
      )}
      Continue with Google
    </Button>
  );
}
