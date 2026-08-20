export type UserRole = 'candidate' | 'admin';

export type ApplicationStage =
  | 'applied'
  | 'screening'
  | 'shortlisted'
  | 'interview'
  | 'offer'
  | 'rejected'
  | 'hired';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isEmailVerified: boolean;
  avatar?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CandidateProfileUser {
  _id: string;
  fullName: string;
  name: string;
  email: string;
  phoneNumber: string;
  phone?: string;
  location?: {
    city: string;
    state: string;
    country: string;
  };
  skills: string[];
  technicalSkills?: string[];
  softSkills?: string[];
  totalExperienceYears: number;
  experienceYears?: number;
  workExperiences?: {
    company: string;
    designation: string;
    startDate: string;
    endDate?: string;
    currentlyWorking: boolean;
    description: string;
  }[];
  educations?: {
    degree: string;
    specialization: string;
    institute: string;
    startYear?: number;
    endYear?: number;
  }[];
  certifications?: {
    name: string;
    issuingOrganization: string;
    issueDate: string;
    expiryDate?: string;
    credentialId?: string;
  }[];
  currentCompany?: string;
  designation?: string;
  linkedinProfile?: string;
  portfolioLinks?: { github?: string; linkedin?: string; website?: string };
  openToWork?: boolean;
  profilePhoto?: string;
  emailVerified?: boolean;
  profileCompletion?: number;
  resumeId?: string;
  resumeUrl?: string;
}

export interface CandidateProfileResponse {
  user: CandidateProfileUser;
  profileCompletion: number;
}

export interface Profile {
  _id: string;
  userId: string;
  headline?: string;
  summary?: string;
  phone?: string;
  location?: string;
  skills: { name: string; level: string; yearsOfExperience?: number }[];
  experience: {
    company: string;
    title: string;
    location?: string;
    startDate: string;
    endDate?: string;
    current: boolean;
    description?: string;
  }[];
  education: {
    institution: string;
    degree: string;
    field: string;
    startDate: string;
    endDate?: string;
  }[];
  projects: { title: string; description: string; url?: string; technologies: string[] }[];
  certifications: { name: string; issuer: string; issueDate: string }[];
  achievements: { title: string; description?: string }[];
  portfolio: { title: string; url: string; type: string }[];
  socialLinks: { platform: string; url: string }[];
  resumeId?: string;
  completionScore: number;
  careerPreferences: {
    desiredRoles: string[];
    desiredLocations: string[];
    employmentTypes: string[];
    remotePreference: string;
    industries: string[];
  };
}

export interface RecommendedAssessment {
  id: string;
  name: string;
  title: string;
  recommendedFor: string;
  bendaLanguage: string;
  targetPath: string;
  prerequisite?: string;
  levels: string[];
  optional: true;
}

export interface Job {
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
  industry?: string;
  postedAt?: string;
  hasApplied?: boolean;
  appliedResumeId?: string;
  appliedResumeTitle?: string;
  recommendedAssessment?: RecommendedAssessment | null;
}

export interface RecommendedJob extends Job {
  matchScore: number;
  matchedSkills: string[];
  missingSkills?: string[];
  isSaved?: boolean;
  alreadyApplied?: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface Application {
  _id: string;
  jobId: string;
  jobTitle: string;
  company: string;
  companyLogo?: string;
  location?: string;
  salary?: string;
  stage: ApplicationStage;
  /** Fine-grained Talent Desk stage when synced from ATS. */
  atsStage?: string;
  atsApplicationId?: string;
  appliedAt: string;
  resumeId?: string;
  resumeTitle?: string;
  timeline: { stage: ApplicationStage; date: string; note?: string }[];
  recruiterFeedback?: string;
  notes?: string;
}

export interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  data?: Record<string, unknown>;
}

export interface DashboardData {
  profileCompletion: { score: number; missing: string[]; strength: string };
  applicationAnalytics: {
    totalApplications: number;
    shortlisted: number;
    interviews: number;
    offers: number;
    successRate: number;
    byStage: Record<string, number>;
  };
  savedJobs: Job[];
  recommendedJobs: RecommendedJob[];
  recentActivity: Notification[];
  widgets: {
    profileCompletion: number;
    appliedJobs: number;
    savedJobs: number;
    interviews: number;
    offers: number;
    successRate: number;
  };
}
