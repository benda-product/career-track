import { IUser } from '../auth/user.model';
import { IProfile } from './profile.model';
import {
  CandidateProfileView,
  CertificationView,
  EducationView,
  WorkExperienceView,
} from './profile.types';
import { calculateTotalExperienceYears } from '../../utils/experience.util';

function toIsoDate(value?: Date | string | null): string {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString();
}

function toYear(value?: Date | string | null): number | undefined {
  if (!value) return undefined;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.getFullYear();
}

function yearToDate(year?: number): Date | undefined {
  if (!year) return undefined;
  return new Date(year, 0, 1);
}

function splitFullName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: '', lastName: '' };
  if (parts.length === 1) return { firstName: parts[0], lastName: parts[0] };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

function buildFullName(user: IUser): string {
  return `${user.firstName} ${user.lastName}`.trim();
}

function mapWorkExperiences(profile: IProfile): WorkExperienceView[] {
  return (profile.experience || []).map((exp) => ({
    company: exp.company || '',
    designation: exp.title || '',
    startDate: toIsoDate(exp.startDate),
    endDate: exp.current ? undefined : toIsoDate(exp.endDate),
    currentlyWorking: exp.current ?? false,
    description: exp.description || '',
  }));
}

function mapEducations(profile: IProfile): EducationView[] {
  return (profile.education || []).map((edu) => ({
    degree: edu.degree || '',
    specialization: edu.field || '',
    institute: edu.institution || '',
    startYear: toYear(edu.startDate),
    endYear: toYear(edu.endDate),
  }));
}

function mapCertifications(profile: IProfile): CertificationView[] {
  return (profile.certifications || []).map((cert) => ({
    name: cert.name || '',
    issuingOrganization: cert.issuer || '',
    issueDate: toIsoDate(cert.issueDate),
    expiryDate: cert.expiryDate ? toIsoDate(cert.expiryDate) : undefined,
    credentialId: cert.credentialId,
  }));
}

function getSkillNames(profile: IProfile): string[] {
  const technical = profile.technicalSkills || [];
  const soft = profile.softSkills || [];
  const combined = [...technical, ...soft];
  if (combined.length > 0) return combined;
  return (profile.skills || []).map((skill) => skill.name).filter(Boolean);
}

function getLocation(profile: IProfile) {
  if (profile.locationDetail?.city || profile.locationDetail?.state || profile.locationDetail?.country) {
    return {
      city: profile.locationDetail.city || '',
      state: profile.locationDetail.state || '',
      country: profile.locationDetail.country || '',
    };
  }

  if (profile.location) {
    const parts = profile.location.split(',').map((part) => part.trim());
    if (parts.length >= 3) {
      return { city: parts[0], state: parts[1], country: parts.slice(2).join(', ') };
    }
    if (parts.length === 2) {
      return { city: parts[0], state: parts[1], country: '' };
    }
    return { city: parts[0] || '', state: '', country: '' };
  }

  return { city: '', state: '', country: '' };
}

export function toCandidateProfileView(user: IUser, profile: IProfile): CandidateProfileView {
  const fullName = buildFullName(user);
  const workExperiences = mapWorkExperiences(profile);
  const technicalSkills = profile.technicalSkills?.length
    ? profile.technicalSkills
    : getSkillNames(profile);
  const softSkills = profile.softSkills || [];
  const skills = [...technicalSkills, ...softSkills].filter(
    (skill, index, list) => skill && list.indexOf(skill) === index
  );
  const linkedinProfile =
    profile.linkedinProfile ||
    profile.socialLinks?.find((link) => link.platform?.toLowerCase() === 'linkedin')?.url;

  const totalExperienceYears =
    profile.totalExperienceYears ??
    calculateTotalExperienceYears(
      workExperiences.map((exp) => ({
        startDate: exp.startDate,
        endDate: exp.endDate,
        currentlyWorking: exp.currentlyWorking,
      }))
    );

  return {
    _id: String(profile._id),
    fullName,
    name: fullName,
    email: user.email,
    phoneNumber: profile.phone || '',
    phone: profile.phone || '',
    location: getLocation(profile),
    skills,
    technicalSkills,
    softSkills,
    totalExperienceYears,
    experienceYears: totalExperienceYears,
    workExperiences,
    educations: mapEducations(profile),
    certifications: mapCertifications(profile),
    currentCompany: profile.currentCompany,
    designation: profile.designation || profile.headline,
    linkedinProfile,
    portfolioLinks: {
      linkedin: linkedinProfile,
      github: profile.socialLinks?.find((link) => link.platform?.toLowerCase() === 'github')?.url,
      website: profile.socialLinks?.find((link) => link.platform?.toLowerCase() === 'website')?.url,
    },
    openToWork: profile.openToWork ?? true,
    profilePhoto: user.avatar,
    emailVerified: user.isEmailVerified,
    resumeId: profile.resumeId,
    resumeUrl: profile.resumeUrl,
    noticePeriodDays: profile.noticePeriodDays,
    employmentStatus: profile.employmentStatus,
  };
}

export function mapUpdatePayload(
  body: Record<string, unknown>
): { userUpdates: { firstName?: string; lastName?: string; avatar?: string }; profileUpdates: Partial<IProfile> } {
  const profileUpdates: Partial<IProfile> = {};
  const userUpdates: { firstName?: string; lastName?: string; avatar?: string } = {};

  const fullName = (body.fullName || body.name) as string | undefined;
  if (fullName?.trim()) {
    const parsed = splitFullName(fullName);
    userUpdates.firstName = parsed.firstName;
    userUpdates.lastName = parsed.lastName;
  }

  if (body.profilePhoto !== undefined) {
    userUpdates.avatar = String(body.profilePhoto || '');
  }

  const phone = (body.phoneNumber || body.phone) as string | undefined;
  if (phone !== undefined) profileUpdates.phone = phone;

  if (body.currentCompany !== undefined) profileUpdates.currentCompany = String(body.currentCompany || '');
  if (body.designation !== undefined) {
    profileUpdates.designation = String(body.designation || '');
    profileUpdates.headline = String(body.designation || '');
  }
  if (body.openToWork !== undefined) profileUpdates.openToWork = Boolean(body.openToWork);

  if (body.noticePeriodDays !== undefined) {
    profileUpdates.noticePeriodDays = Number(body.noticePeriodDays) || 0;
  }

  if (body.employmentStatus !== undefined) {
    const status = String(body.employmentStatus);
    if (['actively_looking', 'open_to_opportunities', 'not_looking'].includes(status)) {
      profileUpdates.employmentStatus = status as IProfile['employmentStatus'];
    }
  }

  if (body.location && typeof body.location === 'object') {
    const location = body.location as { city?: string; state?: string; country?: string };
    profileUpdates.locationDetail = {
      city: location.city || '',
      state: location.state || '',
      country: location.country || '',
    };
    profileUpdates.location = [location.city, location.state, location.country].filter(Boolean).join(', ');
  }

  const linkedin = (body.linkedinProfile ||
    (body.portfolioLinks as { linkedin?: string } | undefined)?.linkedin) as string | undefined;
  if (linkedin !== undefined) {
    profileUpdates.linkedinProfile = linkedin;
  }

  const technicalSkills = body.technicalSkills as string[] | undefined;
  const softSkills = body.softSkills as string[] | undefined;
  const skills = body.skills as string[] | undefined;

  if (technicalSkills || softSkills || skills) {
    const nextTechnical = technicalSkills ?? skills ?? [];
    const nextSoft = softSkills ?? [];
    profileUpdates.technicalSkills = nextTechnical;
    profileUpdates.softSkills = nextSoft;
    const mergedSkills = [...nextTechnical, ...nextSoft].filter(
      (skill, index, list) => skill?.trim() && list.indexOf(skill) === index
    );
    profileUpdates.skills = mergedSkills.map((name) => ({
      name,
      level: 'intermediate' as const,
    }));
  }

  if (Array.isArray(body.workExperiences)) {
    profileUpdates.experience = (body.workExperiences as WorkExperienceView[]).map((exp) => ({
      company: exp.company || '',
      title: exp.designation || '',
      startDate: exp.startDate ? new Date(exp.startDate) : new Date(),
      endDate: exp.currentlyWorking || !exp.endDate ? undefined : new Date(exp.endDate),
      current: exp.currentlyWorking ?? false,
      description: exp.description || '',
    }));

    if (body.totalExperienceYears === undefined) {
      profileUpdates.totalExperienceYears = calculateTotalExperienceYears(
        body.workExperiences as WorkExperienceView[]
      );
    }
  }

  if (body.totalExperienceYears !== undefined) {
    profileUpdates.totalExperienceYears = Number(body.totalExperienceYears) || 0;
  }

  if (Array.isArray(body.educations)) {
    profileUpdates.education = (body.educations as EducationView[]).map((edu) => ({
      institution: edu.institute || '',
      degree: edu.degree || '',
      field: edu.specialization || '',
      startDate: yearToDate(edu.startYear) || new Date(),
      endDate: yearToDate(edu.endYear),
    }));
  }

  if (Array.isArray(body.certifications)) {
    profileUpdates.certifications = (body.certifications as CertificationView[]).map((cert) => ({
      name: cert.name || '',
      issuer: cert.issuingOrganization || '',
      issueDate: cert.issueDate ? new Date(cert.issueDate) : new Date(),
      expiryDate: cert.expiryDate ? new Date(cert.expiryDate) : undefined,
      credentialId: cert.credentialId,
    }));
  }

  return { userUpdates, profileUpdates };
}
