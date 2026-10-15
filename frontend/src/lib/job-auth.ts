import type { Job } from '@/types';

export function isPublicJobBrowsePath(pathname: string | null | undefined) {
  if (!pathname) return false;
  if (pathname === '/jobs') return true;
  return /^\/jobs\/[A-Za-z0-9_-]{8,64}$/.test(pathname);
}

function clip(value: string | undefined, max: number) {
  return String(value || '')
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .trim()
    .slice(0, max);
}

export function currentJobReturnPath(jobId: string) {
  if (typeof window === 'undefined') return jobId ? `/jobs/${jobId}` : '/jobs';
  const path = window.location.pathname;
  if (path === '/jobs' || path === `/jobs/${jobId}`) return path;
  return jobId ? `/jobs/${jobId}` : '/jobs';
}

export function jobSeekerAuthHref(mode: 'login' | 'register', job: Job, intent: 'save' | 'apply') {
  const returnPath = currentJobReturnPath(job.id);
  if (intent === 'apply') {
    const next = job.id ? `/jobs/${job.id}` : returnPath;
    return `/auth/${mode}?${new URLSearchParams({ redirect: next }).toString()}`;
  }

  const params = new URLSearchParams();
  params.set('jobId', clip(job.id, 64));
  params.set('jobTitle', clip(job.title, 180) || 'Job');
  params.set('company', clip(job.company, 180) || 'Company');
  const location = clip(job.location, 180);
  const salary = clip(job.salary, 80);
  const employmentType = clip(job.employmentType, 40);
  const companyLogo = clip(job.companyLogo, 300);
  if (location) params.set('location', location);
  if (salary) params.set('salary', salary);
  if (employmentType) params.set('employmentType', employmentType);
  if (/^https?:\/\//i.test(companyLogo)) params.set('companyLogo', companyLogo);
  params.set('return', returnPath);
  const next = `/auth/continue-save?${params.toString()}`;
  return `/auth/${mode}?${new URLSearchParams({ redirect: next }).toString()}`;
}
