import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { profileService } from '@/services/profile.service';

export function resolveWorkspacePath(role: string | undefined, redirectPath = '/dashboard') {
  const safeRedirect = redirectPath.startsWith('/') ? redirectPath : '/dashboard';
  if (role === 'admin' && safeRedirect === '/dashboard') return '/admin';
  return safeRedirect;
}

export async function navigateAfterAuth(
  router: AppRouterInstance,
  redirectPath = '/dashboard',
  role?: string
) {
  const safeRedirect = resolveWorkspacePath(role, redirectPath);

  if (safeRedirect.startsWith('/admin')) {
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
