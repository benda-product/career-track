import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { profileService } from '@/services/profile.service';

export function resolveWorkspacePath(role: string | undefined, redirectPath = '/dashboard') {
  const safeRedirect = redirectPath.startsWith('/') && !redirectPath.startsWith('//') ? redirectPath : '/dashboard';
  if (role === 'support') return '/support-desk';
  if (role === 'admin' && safeRedirect === '/dashboard') return '/admin';
  return safeRedirect;
}

/** Talent save-job handoff. It must run before profile onboarding so the job is stored. */
export function isJobSaveContinuation(path: string) {
  return path.split('?')[0] === '/auth/continue-save';
}

export function authSwitchHref(mode: 'login' | 'register', redirectPath: string | null) {
  if (!redirectPath || !redirectPath.startsWith('/') || redirectPath.startsWith('//')) {
    return `/auth/${mode}`;
  }
  return `/auth/${mode}?${new URLSearchParams({ redirect: redirectPath }).toString()}`;
}

export async function navigateAfterAuth(
  router: AppRouterInstance,
  redirectPath = '/dashboard',
  role?: string
) {
  const safeRedirect = resolveWorkspacePath(role, redirectPath);

  if (safeRedirect.startsWith('/admin') || isJobSaveContinuation(safeRedirect)) {
    router.push(safeRedirect);
    return;
  }

  try {
    const profile = await profileService.getProfile();
    if (!profile.user.professionalProfileCompleted) {
      router.push(
        `/onboarding/professional?next=${encodeURIComponent(safeRedirect)}`
      );
      return;
    }
  } catch {
    // Fall through to redirect when profile cannot be loaded yet.
  }

  router.push(safeRedirect);
}
