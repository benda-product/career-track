import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export function isBendaFirebaseConfigured() {
  return Object.values(firebaseConfig).every(Boolean);
}

export function getBendaFirebaseAuth() {
  if (!isBendaFirebaseConfigured()) {
    throw new Error('Firebase is not configured. Add NEXT_PUBLIC_FIREBASE_* env vars.');
  }
  const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  return getAuth(app);
}

export function getFirebaseAuthErrorMessage(error: unknown) {
  const code = (error as { code?: string })?.code || '';

  if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
    return '';
  }

  if (code === 'auth/popup-blocked') {
    return 'The sign-in popup was blocked. Allow popups and try again.';
  }

  return (error as Error)?.message || 'Unable to continue with Google sign-in.';
}
