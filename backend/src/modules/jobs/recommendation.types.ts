export interface RecommendedJob {
  id: string;
  title: string;
  company: string;
  companyLogo?: string;
  location?: string;
  salary?: string;
  employmentType?: string;
  remote?: boolean;
  hybrid?: boolean;
  postedAt?: string;
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  isSaved: boolean;
  alreadyApplied: boolean;
}

export interface RecommendedJobsResult {
  jobs: RecommendedJob[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
