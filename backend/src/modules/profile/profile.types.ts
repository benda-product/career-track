export interface LocationDetail {
  city?: string;
  state?: string;
  country?: string;
}

export interface WorkExperienceView {
  company: string;
  designation: string;
  startDate: string;
  endDate?: string;
  currentlyWorking: boolean;
  description: string;
}

export interface EducationView {
  degree: string;
  specialization: string;
  institute: string;
  startYear?: number;
  endYear?: number;
}

export interface CertificationView {
  name: string;
  issuingOrganization: string;
  issueDate: string;
  expiryDate?: string;
  credentialId?: string;
}

export interface CandidateProfileView {
  _id: string;
  fullName: string;
  name: string;
  email: string;
  phoneNumber: string;
  phone?: string;
  location?: LocationDetail;
  skills: string[];
  technicalSkills: string[];
  softSkills: string[];
  totalExperienceYears: number;
  experienceYears?: number;
  workExperiences: WorkExperienceView[];
  educations: EducationView[];
  certifications: CertificationView[];
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
  noticePeriodDays?: number;
  employmentStatus?: 'actively_looking' | 'open_to_opportunities' | 'not_looking';
}

export interface CandidateProfileResponse {
  user: CandidateProfileView;
  profileCompletion: number;
}
