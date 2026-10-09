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

function isPlaceholderNamePart(value: string) {
  const text = value.trim().toLowerCase();
  return !text || text === 'user' || text === 'account' || text === 'applicant';
}

function splitDisplayName(
  emailOrName: string,
  profile?: { name?: string; firstName?: string; lastName?: string },
) {
  const raw = String(emailOrName || '').trim();
  const profileName = String(profile?.name || '').trim();
  const directName = raw.includes('@') ? '' : raw;
  const fromName = profileName || directName;

  if (fromName && !isPlaceholderNamePart(fromName)) {
    const parts = fromName.split(/\s+/).filter(Boolean);
    return {
      firstName: parts[0],
      lastName: parts.slice(1).join(' '),
    };
  }

  const firstName = String(profile?.firstName || '').trim();
  const lastName = String(profile?.lastName || '').trim();
  if (firstName && !isPlaceholderNamePart(firstName)) {
    return {
      firstName,
      lastName: isPlaceholderNamePart(lastName) ? '' : lastName,
    };
  }

  if (raw.includes('@')) {
    const localPart = raw.split('@')[0]?.trim();
    if (localPart) return { firstName: localPart, lastName: '' };
  }

  return { firstName: fromName || 'Applicant', lastName: '' };
}

export { splitDisplayName };
