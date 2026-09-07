import { env } from '../config/env';

export function buildTalentDeskApplyUrl(jobId: string): string {
  const base = env.talentDesk.publicUrl.replace(/\/$/, '');
  const params = new URLSearchParams({
    utm_source: 'career_track',
    utm_medium: 'job_board',
    source: 'career_track',
  });
  return `${base}/apply/${encodeURIComponent(jobId)}?${params.toString()}`;
}
