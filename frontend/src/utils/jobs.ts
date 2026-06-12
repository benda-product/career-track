import { Job } from '@/types';

export function normalizeJobsPayload(data: unknown): Job[] {
  if (Array.isArray(data)) return data as Job[];
  if (data && typeof data === 'object' && Array.isArray((data as { jobs?: unknown }).jobs)) {
    return (data as { jobs: Job[] }).jobs;
  }
  return [];
}

export function normalizeSavedJob(raw: Record<string, unknown>): Job {
  return {
    id: String(raw.jobId ?? raw.id ?? ''),
    title: String(raw.jobTitle ?? raw.title ?? 'Job Title'),
    company: String(raw.company ?? 'Company'),
    companyLogo: raw.companyLogo as string | undefined,
    location: raw.location as string | undefined,
    salary: raw.salary as string | undefined,
    employmentType: raw.employmentType as string | undefined,
    remote: raw.remote as boolean | undefined,
    hybrid: raw.hybrid as boolean | undefined,
    postedAt: raw.savedAt ? String(raw.savedAt) : undefined,
  };
}

export function normalizeSavedJobs(data: unknown): Job[] {
  if (!Array.isArray(data)) return [];
  return data.map((item) => normalizeSavedJob(item as Record<string, unknown>));
}

export function jobToSavePayload(job: Job) {
  return {
    jobId: job.id,
    jobTitle: job.title || 'Job Title',
    company: job.company || 'Company',
    companyLogo: job.companyLogo,
    location: job.location,
    salary: job.salary,
    employmentType: job.employmentType,
  };
}
