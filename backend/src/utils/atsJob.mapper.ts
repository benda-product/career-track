import type { RecommendedAssessment } from './recommendedAssessment';

export interface NormalizedJob {
  id: string;
  title: string;
  company: string;
  companyLogo?: string;
  location?: string;
  city?: string;
  state?: string;
  country?: string;
  department?: string;
  salary?: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  employmentType?: string;
  experienceLevel?: string;
  remote?: boolean;
  hybrid?: boolean;
  description?: string;
  responsibilities?: string;
  qualificationsText?: string;
  benefits?: string[];
  skills?: string[];
  openings?: number;
  jobReferenceId?: string;
  postedAt?: string;
  minExperience?: number;
  maxExperience?: number;
  hasApplied?: boolean;
  appliedResumeId?: string;
  appliedResumeTitle?: string;
  recommendedAssessment?: RecommendedAssessment | null;
  applyUrl?: string;
}

function formatSalaryAmount(amount: number, currency = 'USD'): string {
  if (!Number.isFinite(amount)) return '';
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${amount.toLocaleString('en-US')} ${currency}`;
  }
}

function isPayPeriodLabel(value: string) {
  return /^(annual|annually|yearly|monthly|hourly|weekly|daily)$/i.test(value.trim());
}

function formatJobSalary(raw: Record<string, unknown>): string | undefined {
  const currency = String(raw.salaryCurrency || 'USD');
  const salaryMin = typeof raw.salaryMin === 'number' ? raw.salaryMin : undefined;
  const salaryMax = typeof raw.salaryMax === 'number' ? raw.salaryMax : undefined;

  if (salaryMin != null && salaryMax != null) {
    return `${formatSalaryAmount(salaryMin, currency)} – ${formatSalaryAmount(salaryMax, currency)}`;
  }
  if (salaryMin != null) return `From ${formatSalaryAmount(salaryMin, currency)}`;
  if (salaryMax != null) return `Up to ${formatSalaryAmount(salaryMax, currency)}`;

  const legacy = String(raw.salary || '').trim();
  if (legacy && !isPayPeriodLabel(legacy)) return legacy;
  return undefined;
}

function formatJobLocation(raw: Record<string, unknown>) {
  const city = String(raw.city || '').trim();
  const state = String(raw.state || '').trim();
  const country = String(raw.country || '').trim();
  const place = [city, state, country].filter(Boolean).join(', ');
  if (place) return place;
  const broad = String(raw.location || '').trim();
  return broad || undefined;
}

export function normalizeAtsJob(raw: Record<string, unknown>): NormalizedJob {
  const companyRef = raw.companyId as { name?: string } | undefined;
  const remoteMode = raw.remoteMode as string | undefined;

  const city = String(raw.city || '').trim() || undefined;
  const state = String(raw.state || '').trim() || undefined;
  const country = String(raw.country || '').trim() || undefined;
  const companyRecord = companyRef as { name?: string; logoUrl?: string } | undefined;

  return {
    id: String(raw._id ?? raw.id ?? ''),
    title: (raw.title as string) || 'Untitled',
    company: companyRecord?.name || (typeof raw.company === 'string' ? raw.company : '') || 'Company',
    companyLogo: companyRecord?.logoUrl || (typeof raw.companyLogo === 'string' ? raw.companyLogo : undefined),
    location: formatJobLocation(raw),
    city,
    state,
    country,
    department: (raw.department as string) || undefined,
    salary: formatJobSalary(raw),
    salaryMin: typeof raw.salaryMin === 'number' ? raw.salaryMin : undefined,
    salaryMax: typeof raw.salaryMax === 'number' ? raw.salaryMax : undefined,
    salaryCurrency: (raw.salaryCurrency as string) || undefined,
    employmentType: (raw.jobType as string) || (raw.employmentType as string),
    experienceLevel: (raw.experienceLevel as string) || undefined,
    remote: remoteMode === 'remote',
    hybrid: remoteMode === 'hybrid',
    description: (raw.description as string) || undefined,
    responsibilities: (raw.responsibilities as string) || undefined,
    qualificationsText: (raw.qualificationsText as string) || undefined,
    benefits: Array.isArray(raw.benefits)
      ? raw.benefits.map((benefit) => String(benefit || '').trim()).filter(Boolean)
      : undefined,
    skills: [
      ...new Set(
        [...((raw.skills as string[]) || []), ...((raw.requiredSkills as string[]) || [])]
          .map((skill) => String(skill || '').trim())
          .filter(Boolean)
      ),
    ],
    openings: typeof raw.openings === 'number' ? raw.openings : undefined,
    jobReferenceId: (raw.jobReferenceId as string) || undefined,
    postedAt: String(raw.publishedAt ?? raw.postedAt ?? raw.createdAt ?? '') || undefined,
    minExperience:
      typeof raw.minimumExperience === 'number'
        ? raw.minimumExperience
        : typeof raw.minExperience === 'number'
          ? raw.minExperience
          : typeof raw.experienceMin === 'number'
            ? raw.experienceMin
            : undefined,
    maxExperience:
      typeof raw.maximumExperience === 'number'
        ? raw.maximumExperience
        : typeof raw.maxExperience === 'number'
          ? raw.maxExperience
          : typeof raw.experienceMax === 'number'
            ? raw.experienceMax
            : undefined,
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
