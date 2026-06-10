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
  appliedAt: string;
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
  recommendedJobs: Job[];
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
