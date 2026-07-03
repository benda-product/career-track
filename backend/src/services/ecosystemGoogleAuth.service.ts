import { ApiError } from '../utils/apiError';

export type GoogleEcosystemVerifyResult = {
  valid: boolean;
  source?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  photoUrl?: string | null;
  firebaseUid?: string;
  accountType?: string | null;
  roles?: string[];
  bendaUserId?: string | null;
  hasBendaAccount?: boolean;
  needsRoleSelection?: boolean;
  message?: string;
};

const BENDA_AUTH_URLS = [
  process.env.BENDA_AUTH_URL,
  process.env.BENDA_AUTH_FALLBACK_URL,
  'http://benda-infotech-backend:5004',
  'http://host.docker.internal:5004',
  'http://localhost:5004',
].filter(Boolean) as string[];

function uniqueUrls(urls: string[]) {
  return [...new Set(urls)];
}

export async function verifyGoogleEcosystemCredentials(
  idToken: string,
): Promise<GoogleEcosystemVerifyResult | null> {
  if (!idToken) return null;

  let sawNetworkError = false;

  for (const base of uniqueUrls(BENDA_AUTH_URLS)) {
    const url = `${base.replace(/\/$/, '')}/api/auth/ecosystem-google-verify`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });
      const data = (await response.json().catch(() => ({}))) as GoogleEcosystemVerifyResult;

      if (response.ok && data.valid) {
        return data;
      }

      if (response.status === 503) {
        throw new ApiError(
          503,
          data.message ||
            'Unable to verify Google sign-in right now. Ensure Benda Infotech is running.',
        );
      }

      if (response.status === 401) {
        return null;
      }
    } catch (error) {
      if (error instanceof ApiError) throw error;
      sawNetworkError = true;
    }
  }

  if (sawNetworkError) {
    throw new ApiError(
      503,
      'Unable to reach Benda Infotech for Google sign-in. Ensure benda-infotech-backend is running on port 5004.',
    );
  }

  return null;
}
