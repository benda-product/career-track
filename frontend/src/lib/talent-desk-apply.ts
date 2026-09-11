const DEFAULT_LOCAL_TALENT_DESK_URL = 'http://localhost:3002';
const DEFAULT_PROD_TALENT_DESK_URL = 'https://talentdesk.bendainfotech.com';

function isLocalHost(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1';
}

export function getTalentDeskBaseUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_TALENT_DESK_URL?.replace(/\/$/, '');
  if (fromEnv && !fromEnv.includes('localhost') && !fromEnv.includes('127.0.0.1')) {
    return fromEnv;
  }

  if (typeof window !== 'undefined') {
    if (!isLocalHost(window.location.hostname)) {
      return DEFAULT_PROD_TALENT_DESK_URL;
    }
    if (fromEnv) return fromEnv;
  }

  return fromEnv || DEFAULT_LOCAL_TALENT_DESK_URL;
}

function normalizeApplyUrl(applyUrl?: string): string | undefined {
  if (!applyUrl) return undefined;

  if (typeof window === 'undefined' || isLocalHost(window.location.hostname)) {
    return applyUrl;
  }

  if (!/localhost|127\.0\.0\.1/.test(applyUrl)) {
    return applyUrl;
  }

  try {
    const parsed = new URL(applyUrl);
    const base = getTalentDeskBaseUrl();
    return `${base}${parsed.pathname}${parsed.search}`;
  } catch {
    return undefined;
  }
}

export function buildTalentDeskApplyUrl(jobId: string): string {
  const base = getTalentDeskBaseUrl();
  const params = new URLSearchParams({
    utm_source: 'career_track',
    utm_medium: 'job_board',
    source: 'career_track',
  });
  return `${base}/apply/${encodeURIComponent(jobId)}?${params.toString()}`;
}

export function openTalentDeskApply(jobId: string, applyUrl?: string): void {
  const target = normalizeApplyUrl(applyUrl) || buildTalentDeskApplyUrl(jobId);
  window.open(target, '_blank', 'noopener,noreferrer');
}
