import type { ApplicationStage } from '@/types';

export type AdminProfileSnapshot = {
  headline: string;
  location: string;
  designation: string;
  currentCompany: string;
  completionScore: number;
  professionalProfileCompleted: boolean;
  openToWork: boolean;
};

export type AdminCandidate = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'candidate' | 'admin';
  avatar?: string;
  isActive: boolean;
  isEmailVerified: boolean;
  subscriptionPlan: 'free' | 'pro';
  lastLogin?: string;
  createdAt?: string;
  profile: AdminProfileSnapshot | null;
};

export type AdminProfile = {
  id: string;
  userId: string;
  candidateName: string;
  email: string;
  headline: string;
  summary: string;
  phone: string;
  location: string;
  designation: string;
  currentCompany: string;
  totalExperienceYears: number;
  completionScore: number;
  professionalProfileCompleted: boolean;
  openToWork: boolean;
  employmentStatus: string;
  skills: string[];
  updatedAt?: string;
};

export type AdminProfileDetail = AdminProfile & {
  technicalSkills: string[];
  softSkills: string[];
  linkedinProfile: string;
  resumeUrl: string;
  majorSkill: string;
  experience: {
    company: string;
    title: string;
    current: boolean;
    startDate?: string;
    endDate?: string;
  }[];
  education: { institution: string; degree: string; field: string }[];
};

export type AdminTimelineEntry = {
  stage: string;
  date?: string;
  note: string;
  updatedBy: string;
};

export type AdminApplication = {
  id: string;
  userId: string;
  candidateName: string;
  candidateEmail: string;
  jobId: string;
  jobTitle: string;
  company: string;
  location: string;
  salary: string;
  stage: ApplicationStage;
  atsStage: string;
  appliedAt?: string;
  notes: string;
  recruiterFeedback: string;
  resumeTitle: string;
  timeline: AdminTimelineEntry[];
};

export type AdminSavedJob = {
  id: string;
  userId: string;
  candidateName: string;
  candidateEmail: string;
  jobId: string;
  jobTitle: string;
  company: string;
  location: string;
  salary: string;
  employmentType: string;
  savedAt?: string;
};

export type AdminJob = {
  id: string;
  title: string;
  company: string;
  companyLogo?: string;
  location: string;
  salary: string;
  employmentType: string;
  experienceLevel: string;
  remote: boolean;
  hybrid: boolean;
  skills: string[];
  openings?: number;
  postedAt: string;
  department: string;
  description: string;
};

export type AdminActivity = {
  id: string;
  kind: string;
  title: string;
  message: string;
  at: string;
  href?: string;
  actor?: string;
};

export type AdminPage<T> = {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  unavailable?: boolean;
};

export type AdminOverview = {
  counts: {
    candidates: number;
    activeCandidates: number;
    profiles: number;
    completedProfiles: number;
    applications: number;
    savedJobs: number;
    notifications: number;
    openToWork: number;
    jobs: number | null;
  };
  jobsUnavailable: boolean;
  byStage: Record<string, number>;
  trends: { month: string; applications: number; candidates: number }[];
  recentApplications: AdminApplication[];
  recentCandidates: AdminCandidate[];
  recentActivity: AdminActivity[];
};

export type AdminCandidateRecord = {
  candidate: AdminCandidate;
  profile: AdminProfileDetail | null;
  applications: AdminApplication[];
  savedJobs: AdminSavedJob[];
  activity: AdminActivity[];
};
