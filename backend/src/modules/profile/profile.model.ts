import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ISkill {
  name: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  yearsOfExperience?: number;
}

export interface IExperience {
  company: string;
  title: string;
  location?: string;
  startDate: Date;
  endDate?: Date;
  current: boolean;
  description?: string;
}

export interface IEducation {
  institution: string;
  degree: string;
  field: string;
  startDate: Date;
  endDate?: Date;
  gpa?: string;
}

export interface IProject {
  title: string;
  description: string;
  url?: string;
  technologies: string[];
  startDate?: Date;
  endDate?: Date;
}

export interface ICertification {
  name: string;
  issuer: string;
  issueDate: Date;
  expiryDate?: Date;
  credentialId?: string;
  url?: string;
}

export interface IAchievement {
  title: string;
  description?: string;
  date?: Date;
}

export interface ISocialLink {
  platform: string;
  url: string;
}

export interface ICareerPreferences {
  desiredRoles: string[];
  desiredLocations: string[];
  employmentTypes: string[];
  remotePreference: 'remote' | 'hybrid' | 'onsite' | 'any';
  expectedSalary?: { min: number; max: number; currency: string };
  industries: string[];
  willingToRelocate: boolean;
}

export interface IProfile extends Document {
  userId: Types.ObjectId;
  headline?: string;
  summary?: string;
  phone?: string;
  location?: string;
  dateOfBirth?: Date;
  skills: ISkill[];
  experience: IExperience[];
  education: IEducation[];
  projects: IProject[];
  certifications: ICertification[];
  achievements: IAchievement[];
  portfolio: { title: string; url: string; type: string }[];
  socialLinks: ISocialLink[];
  resumeId?: string;
  resumeUrl?: string;
  careerPreferences: ICareerPreferences;
  completionScore: number;
}

const profileSchema = new Schema<IProfile>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    headline: String,
    summary: String,
    phone: String,
    location: String,
    dateOfBirth: Date,
    skills: [
      {
        name: String,
        level: { type: String, enum: ['beginner', 'intermediate', 'advanced', 'expert'] },
        yearsOfExperience: Number,
      },
    ],
    experience: [
      {
        company: String,
        title: String,
        location: String,
        startDate: Date,
        endDate: Date,
        current: { type: Boolean, default: false },
        description: String,
      },
    ],
    education: [
      {
        institution: String,
        degree: String,
        field: String,
        startDate: Date,
        endDate: Date,
        gpa: String,
      },
    ],
    projects: [
      {
        title: String,
        description: String,
        url: String,
        technologies: [String],
        startDate: Date,
        endDate: Date,
      },
    ],
    certifications: [
      {
        name: String,
        issuer: String,
        issueDate: Date,
        expiryDate: Date,
        credentialId: String,
        url: String,
      },
    ],
    achievements: [{ title: String, description: String, date: Date }],
    portfolio: [{ title: String, url: String, type: String }],
    socialLinks: [{ platform: String, url: String }],
    resumeId: String,
    resumeUrl: String,
    careerPreferences: {
      desiredRoles: [String],
      desiredLocations: [String],
      employmentTypes: [String],
      remotePreference: {
        type: String,
        enum: ['remote', 'hybrid', 'onsite', 'any'],
        default: 'any',
      },
      expectedSalary: { min: Number, max: Number, currency: { type: String, default: 'USD' } },
      industries: [String],
      willingToRelocate: { type: Boolean, default: false },
    },
    completionScore: { type: Number, default: 0, min: 0, max: 100 },
  },
  { timestamps: true }
);

profileSchema.index({ userId: 1 });
profileSchema.index({ 'skills.name': 1 });

export const Profile = mongoose.model<IProfile>('Profile', profileSchema);
