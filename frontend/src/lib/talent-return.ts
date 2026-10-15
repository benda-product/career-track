import { getTalentDeskBaseUrl } from '@/lib/talent-desk-apply';

const EXTRA_ORIGINS = [
  'http://localhost:3002',
  'http://127.0.0.1:3002',
  'https://talent.bendainfotech.com',
  'https://ats.bendainfotech.com',
];

const SAFE_PATH = /^\/(?:jobs|company)\/[A-Za-z0-9_-]{8,64}$/;

function allowedOrigins() {
  const origins = new Set(EXTRA_ORIGINS);
  try {
    origins.add(new URL(getTalentDeskBaseUrl()).origin);
  } catch {
    /* ignore a malformed configured origin */
  }
  return origins;
}

/** Talent job or company page on an allowed origin. Query and hash are dropped. */
export function safeTalentJobReturn(raw: string | null): string | null {
  if (!raw) return null;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.username || url.password) return null;
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
  if (!allowedOrigins().has(url.origin)) return null;
  if (!SAFE_PATH.test(url.pathname)) return null;
  return `${url.origin}${url.pathname}`;
}

export function talentReturnWithSaved(returnUrl: string, jobId: string) {
  const url = new URL(returnUrl);
  url.searchParams.set('saved', '1');
  if (url.pathname.startsWith('/company/')) url.searchParams.set('jobId', jobId);
  return url.toString();
}
