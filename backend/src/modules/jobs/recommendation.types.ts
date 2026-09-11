export interface RecommendedJob {
  id: string;
  title: string;
  company: string;
  companyLogo?: string;
  location?: string;
  department?: string;
  salary?: string;
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
  minExperience?: number;
  maxExperience?: number;
  postedAt?: string;
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  isSaved: boolean;
  alreadyApplied: boolean;
  applyUrl: string;
}

export interface RecommendedJobsResult {
  jobs: RecommendedJob[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface JobInsights {
  averageScore: number;
  totalMatches: number;
  topMissingSkills: string[];
}
