import { z } from 'zod';

const locationSchema = z.object({
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
});

const workExperienceSchema = z.object({
  company: z.string().optional(),
  designation: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  currentlyWorking: z.boolean().optional(),
  description: z.string().optional(),
});

const educationSchema = z.object({
  degree: z.string().optional(),
  specialization: z.string().optional(),
  institute: z.string().optional(),
  startYear: z.number().optional(),
  endYear: z.number().optional(),
});

const certificationSchema = z.object({
  name: z.string().optional(),
  issuingOrganization: z.string().optional(),
  issueDate: z.string().optional(),
  expiryDate: z.string().optional(),
  credentialId: z.string().optional(),
});

export const updateProfileSchema = z.object({
  body: z
    .object({
      _id: z.string().optional(),
      email: z.string().optional(),
      fullName: z.string().optional(),
      name: z.string().optional(),
      phoneNumber: z.string().optional(),
      phone: z.string().optional(),
      location: locationSchema.optional(),
      linkedinProfile: z.string().optional(),
      portfolioLinks: z.object({ linkedin: z.string().optional() }).optional(),
      currentCompany: z.string().optional(),
      designation: z.string().optional(),
      totalExperienceYears: z.coerce.number().min(0).max(50).optional(),
      openToWork: z.boolean().optional(),
      skills: z.array(z.string()).optional(),
      technicalSkills: z.array(z.string()).optional(),
      softSkills: z.array(z.string()).optional(),
      workExperiences: z.array(workExperienceSchema).optional(),
      educations: z.array(educationSchema).optional(),
      certifications: z.array(certificationSchema).optional(),
      profilePhoto: z.string().optional(),
      emailVerified: z.boolean().optional(),
      profileCompletion: z.number().optional(),
      experienceYears: z.number().optional(),
    })
    .passthrough(),
});
