import { ApiError } from '../utils/apiError';

export type EcosystemVerifyResult = {
  valid: boolean;
  source?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  accountType?: string | null;
  roles?: string[];
  message?: string;
  code?: string;
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

export async function verifyEcosystemCredentials(
  email: string,
  password: string,
): Promise<EcosystemVerifyResult | null> {
  const normalizedEmail = email.trim().toLowerCase();
  let sawNetworkError = false;

  for (const base of uniqueUrls(BENDA_AUTH_URLS)) {
    const url = `${base.replace(/\/$/, '')}/api/auth/ecosystem-verify`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail, password }),
      });
      const data = (await response.json().catch(() => ({}))) as EcosystemVerifyResult;

      if (response.ok && data.valid) {
        return data;
      }

      if (response.status === 503) {
        throw new ApiError(
          503,
          data.message ||
            'Unable to verify your Benda account right now. Ensure Benda Infotech is running.',
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
      'Unable to reach Benda Infotech for sign-in. Ensure benda-infotech-backend is running on port 5004.',
    );
  }

  return null;
}

function splitDisplayName(
  email: string,
  profile?: { name?: string; firstName?: string; lastName?: string },
) {
  const fromName = String(profile?.name || '').trim();
  if (fromName) {
    const parts = fromName.split(/\s+/).filter(Boolean);
    return {
      firstName: parts[0] || 'User',
      lastName: parts.slice(1).join(' ') || parts[0] || 'User',
    };
  }

  const firstName = String(profile?.firstName || '').trim() || 'User';
  const lastName = String(profile?.lastName || '').trim() || firstName;
  return { firstName, lastName };
}

export { splitDisplayName };
