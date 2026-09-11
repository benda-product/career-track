import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { profileService } from '@/services/profile.service';

export async function navigateAfterAuth(
  router: AppRouterInstance,
  redirectPath = '/dashboard'
) {
  const safeRedirect = redirectPath.startsWith('/') ? redirectPath : '/dashboard';

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
