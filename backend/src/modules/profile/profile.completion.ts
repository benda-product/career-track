import { CandidateProfileView } from './profile.types';

export function computeProfileCompletion(profile: CandidateProfileView): number {
  const checks = [
    Boolean(profile.fullName || profile.name),
    Boolean(profile.email),
    Boolean(profile.phoneNumber || profile.phone),
    Boolean(profile.location?.city || profile.location?.country),
    (profile.skills?.length || 0) > 0,
    (profile.educations?.length || 0) > 0,
    (profile.workExperiences?.length || 0) > 0,
    (profile.totalExperienceYears ?? 0) >= 0,
    Boolean(profile.linkedinProfile || profile.portfolioLinks?.linkedin),
  ];
  const done = checks.filter(Boolean).length;
  return Math.round((done / checks.length) * 100);
}

export function getProfileCompletionDetails(profile: CandidateProfileView) {
  const score = computeProfileCompletion(profile);
  const missing: string[] = [];

  if (!profile.fullName && !profile.name) missing.push('fullName');
  if (!profile.phoneNumber && !profile.phone) missing.push('phone');
  if (!profile.location?.city && !profile.location?.country) missing.push('location');
  if (!profile.skills?.length) missing.push('skills');
  if (!profile.educations?.length) missing.push('education');
  if (!profile.workExperiences?.length) missing.push('experience');
  if (!profile.linkedinProfile && !profile.portfolioLinks?.linkedin) missing.push('linkedin');

  return {
    score,
    missing,
    strength: score >= 80 ? 'strong' : score >= 50 ? 'moderate' : 'weak',
  };
}
