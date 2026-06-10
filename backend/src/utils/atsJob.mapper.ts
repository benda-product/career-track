export interface NormalizedJob {
  id: string;
  title: string;
  company: string;
  companyLogo?: string;
  location?: string;
  salary?: string;
  employmentType?: string;
  remote?: boolean;
  hybrid?: boolean;
  description?: string;
  skills?: string[];
}

export function normalizeAtsJob(raw: Record<string, unknown>): NormalizedJob {
  const companyRef = raw.companyId as { name?: string } | undefined;
  const remoteMode = raw.remoteMode as string | undefined;

  return {
    id: String(raw._id ?? raw.id ?? ''),
    title: (raw.title as string) || 'Untitled',
    company: companyRef?.name ?? (raw.company as string) ?? 'Unknown',
    companyLogo: raw.companyLogo as string | undefined,
    location:
      (raw.location as string) ||
      [raw.city, raw.state].filter(Boolean).join(', ') ||
      undefined,
    salary: raw.salary as string | undefined,
    employmentType: (raw.jobType as string) || (raw.employmentType as string),
    remote: remoteMode === 'remote',
    hybrid: remoteMode === 'hybrid',
    description: raw.description as string | undefined,
    skills: [
      ...((raw.skills as string[]) || []),
      ...((raw.requiredSkills as string[]) || []),
    ],
  };
}

export function extractJobsList(data: unknown): NormalizedJob[] {
  if (Array.isArray(data)) {
    return data.map((item) => normalizeAtsJob(item as Record<string, unknown>));
  }
  if (data && typeof data === 'object' && Array.isArray((data as { jobs?: unknown }).jobs)) {
    return (data as { jobs: Record<string, unknown>[] }).jobs.map(normalizeAtsJob);
  }
  return [];
}

export function extractJob(data: unknown): NormalizedJob {
  if (data && typeof data === 'object' && (data as { job?: unknown }).job) {
    return normalizeAtsJob((data as { job: Record<string, unknown> }).job);
  }
  return normalizeAtsJob(data as Record<string, unknown>);
}
