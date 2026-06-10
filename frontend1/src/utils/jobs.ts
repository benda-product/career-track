import { Job } from '@/types';

export function normalizeJobsPayload(data: unknown): Job[] {
  if (Array.isArray(data)) return data as Job[];
  if (data && typeof data === 'object' && Array.isArray((data as { jobs?: unknown }).jobs)) {
    return (data as { jobs: Job[] }).jobs;
  }
  return [];
}
