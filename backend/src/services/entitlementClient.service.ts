import { ENTITLEMENT_SOURCES } from '../constants/bundles';

export type HubGrant = {
  product: string;
  tier: string;
  source: string;
  status: string;
  bundleKey?: string;
  currentPeriodEnd?: string;
};

const INTERNAL_KEY =
  process.env.INTERNAL_SYNC_KEY ||
  process.env.BENDA_INTERNAL_KEY ||
  'internal_secret_key';

function uniqueUrls(urls: string[]) {
  return [...new Set(urls.filter(Boolean))];
}

function bendaApiBases(): string[] {
  return uniqueUrls([
    process.env.BENDA_INFOTECH_API_URL || '',
    process.env.BENDA_AUTH_URL ? `${process.env.BENDA_AUTH_URL.replace(/\/$/, '')}/api` : '',
    'http://benda-infotech-backend:5004/api',
    'http://host.docker.internal:5004/api',
    'http://localhost:5004/api',
  ]);
}

async function internalRequest<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T | null> {
  for (const base of bendaApiBases()) {
    const url = `${base.replace(/\/$/, '')}${path}`;
    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-benda-key': INTERNAL_KEY,
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      if (response.ok) {
        const data = (await response.json()) as { data?: T };
        return (data.data ?? data) as T;
      }
    } catch {
      // try next base URL
    }
  }

  console.warn('[entitlementClient] Benda Hub unreachable');
  return null;
}

export async function fetchActiveGrants(email: string, product?: string): Promise<HubGrant[]> {
  const params = new URLSearchParams({ email: email.trim().toLowerCase() });
  if (product) params.set('product', product);

  const result = await internalRequest<{ grants: HubGrant[] }>(
    'GET',
    `/internal/entitlements?${params.toString()}`,
  );

  return result?.grants ?? [];
}

export async function grantCareerProBundle({
  email,
  sourceSubscriptionId,
  currentPeriodEnd,
}: {
  email: string;
  sourceSubscriptionId?: string;
  currentPeriodEnd?: Date;
}) {
  return internalRequest('POST', '/internal/entitlements/grant-bundle', {
    email,
    bundleKey: 'career_pro',
    sourceSubscriptionId,
    currentPeriodEnd,
    source: ENTITLEMENT_SOURCES.CAREER_PRO_BUNDLE,
  });
}

export async function revokeCareerProBundle({
  email,
  sourceSubscriptionId,
}: {
  email: string;
  sourceSubscriptionId?: string;
}) {
  return internalRequest('POST', '/internal/entitlements/revoke-bundle', {
    email,
    sourceSubscriptionId,
    source: ENTITLEMENT_SOURCES.CAREER_PRO_BUNDLE,
    bundleKey: 'career_pro',
  });
}
