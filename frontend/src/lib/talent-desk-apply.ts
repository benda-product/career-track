const TALENT_DESK_URL = process.env.NEXT_PUBLIC_TALENT_DESK_URL || 'http://localhost:3002';

export function buildTalentDeskApplyUrl(jobId: string): string {
  const base = TALENT_DESK_URL.replace(/\/$/, '');
  const params = new URLSearchParams({
    utm_source: 'career_track',
    utm_medium: 'job_board',
    source: 'career_track',
  });
  return `${base}/apply/${encodeURIComponent(jobId)}?${params.toString()}`;
}

export function openTalentDeskApply(jobId: string, applyUrl?: string): void {
  const target = applyUrl || buildTalentDeskApplyUrl(jobId);
  window.open(target, '_blank', 'noopener,noreferrer');
}
