export function normalizeSkill(skill: string): string {
  return skill.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function uniqueSkills(skills: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const skill of skills) {
    const normalized = normalizeSkill(skill);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(skill.trim());
  }
  return result;
}

function skillsMatch(candidateSkill: string, jobSkill: string): boolean {
  const a = normalizeSkill(candidateSkill);
  const b = normalizeSkill(jobSkill);
  if (!a || !b) return false;
  return a === b || a.includes(b) || b.includes(a);
}

export function calculateSkillMatch(jobSkills: string[], candidateSkills: string[]) {
  const normalizedJob = jobSkills.map(normalizeSkill).filter(Boolean);
  const candidates = uniqueSkills(candidateSkills);

  if (!normalizedJob.length) {
    return { score: 40, matched: [] as string[], missing: [] as string[] };
  }

  const matched: string[] = [];
  const missing: string[] = [];

  for (const jobSkill of jobSkills) {
    const hit = candidates.some((candidate) => skillsMatch(candidate, jobSkill));
    if (hit) matched.push(jobSkill);
    else missing.push(jobSkill);
  }

  const score = Math.round((matched.length / normalizedJob.length) * 100);
  return { score, matched: uniqueSkills(matched), missing: uniqueSkills(missing) };
}

export function calculateExperienceMatch(minExperience: number | undefined, candidateYears: number) {
  if (minExperience == null || Number.isNaN(minExperience)) return 70;
  if (candidateYears >= minExperience) return 100;
  const gap = minExperience - candidateYears;
  if (gap <= 1) return 80;
  if (gap <= 2) return 60;
  if (gap <= 3) return 45;
  return 25;
}

export function calculateTitleRelevance(
  jobTitle: string,
  designation?: string,
  savedTitles: string[] = []
): number {
  const titleWords = tokenize(jobTitle);
  if (!titleWords.length) return 50;

  const sources = [designation, ...savedTitles].filter(Boolean) as string[];
  if (!sources.length) return 50;

  let best = 0;
  for (const source of sources) {
    const sourceWords = tokenize(source);
    if (!sourceWords.length) continue;
    const overlap = titleWords.filter((word) =>
      sourceWords.some((sw) => sw.includes(word) || word.includes(sw))
    ).length;
    best = Math.max(best, Math.round((overlap / titleWords.length) * 100));
  }
  return best;
}

export function calculateSavedAffinity(
  company: string,
  location: string | undefined,
  savedCompanies: string[],
  savedLocations: string[]
): number {
  let score = 0;
  const companyNorm = company.trim().toLowerCase();
  if (savedCompanies.some((c) => c.toLowerCase() === companyNorm)) score += 70;
  if (location && savedLocations.some((l) => location.toLowerCase().includes(l.toLowerCase()))) {
    score += 30;
  }
  return Math.min(100, score);
}

function tokenize(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[^a-z0-9+#.]+/)
    .map((part) => part.trim())
    .filter((part) => part.length > 2);
}

export interface JobMatchInput {
  jobSkills: string[];
  minExperience?: number;
  title: string;
  company: string;
  location?: string;
}

export interface CandidateMatchInput {
  skills: string[];
  experienceYears: number;
  designation?: string;
  savedCompanies: string[];
  savedTitles: string[];
  savedLocations: string[];
  profileSkillCount: number;
}

export function scoreJobMatch(job: JobMatchInput, candidate: CandidateMatchInput) {
  const skillResult = calculateSkillMatch(job.jobSkills, candidate.skills);
  const experienceScore = calculateExperienceMatch(job.minExperience, candidate.experienceYears);
  const titleScore = calculateTitleRelevance(job.title, candidate.designation, candidate.savedTitles);
  const savedAffinity = calculateSavedAffinity(
    job.company,
    job.location,
    candidate.savedCompanies,
    candidate.savedLocations
  );
  const profileBonus = Math.min(100, candidate.profileSkillCount * 20);

  const matchScore = Math.min(
    100,
    Math.round(
      skillResult.score * 0.55 +
        experienceScore * 0.2 +
        titleScore * 0.1 +
        savedAffinity * 0.1 +
        profileBonus * 0.05
    )
  );

  return {
    matchScore,
    matchedSkills: skillResult.matched,
    missingSkills: skillResult.missing,
  };
}
