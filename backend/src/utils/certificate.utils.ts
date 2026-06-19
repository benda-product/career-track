import { SkillTestRecord } from '../services/skillTest.service';

export function getTestPercentage(test: Pick<SkillTestRecord, 'percentage' | 'marksObtained' | 'fullMarks'>) {
  if (typeof test.percentage === 'number') return test.percentage;
  if (!test.fullMarks) return 0;
  return Math.round((test.marksObtained / test.fullMarks) * 100);
}

export function isCertificateEligible(
  test: Pick<SkillTestRecord, 'level' | 'percentage' | 'marksObtained' | 'fullMarks'>
) {
  const level = (test.level || '').toLowerCase();
  return level === 'hard' && getTestPercentage(test) >= 80;
}

const COURSE_TITLE_MAP: Record<string, string> = {
  java: 'Java',
  dataanalyst: 'Data Analyst',
  machineLearning: 'Machine Learning & Data Science',
  machineLearningDataAnalysis: 'Machine Learning & Data Science',
  businessAnalyst: 'Business Analyst',
  businessIntelligence: 'Business Intelligence',
  python: 'Python',
  financialAnalyst: 'Financial Analyst',
  uiux: 'UI/UX',
  cyberSecurity: 'Cyber Security',
  mechanicalEngineer: 'Mechanical Engineer',
  javaBackend: 'Java Backend',
  electricalEngineer: 'Electrical Engineer',
  fullStackDeveloper: 'Full Stack Developer',
};

export function getCourseTitleFromCategory(category: string) {
  return COURSE_TITLE_MAP[category] || category || 'Skill Assessment';
}

export function listOwnedCertificates(tests: SkillTestRecord[]) {
  const eligible = tests.filter(isCertificateEligible);

  const byCategory = new Map<string, SkillTestRecord>();
  for (const test of eligible) {
    const key = (test.category || 'unknown').toLowerCase();
    const existing = byCategory.get(key);
    if (!existing) {
      byCategory.set(key, test);
      continue;
    }

    const existingScore = getTestPercentage(existing);
    const nextScore = getTestPercentage(test);
    const existingDate = new Date(existing.completedAt || 0).getTime();
    const nextDate = new Date(test.completedAt || 0).getTime();

    const preferNext =
      (test.certificateId && !existing.certificateId) ||
      nextScore > existingScore ||
      (nextScore === existingScore && nextDate > existingDate);

    if (preferNext) {
      byCategory.set(key, test);
    }
  }

  return Array.from(byCategory.values()).sort(
    (a, b) => new Date(b.completedAt || 0).getTime() - new Date(a.completedAt || 0).getTime()
  );
}

export function buildCertificateDetail(
  owned: SkillTestRecord,
  candidateName: string
) {
  const percentage = getTestPercentage(owned);
  const issuedSource = owned.certificateIssuedAt || owned.completedAt;
  const issuedDate = issuedSource
    ? new Date(issuedSource)
        .toLocaleDateString('en-GB', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        })
        .replace(/\//g, '-')
    : new Date()
        .toLocaleDateString('en-GB', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        })
        .replace(/\//g, '-');

  return {
    name: candidateName,
    course: getCourseTitleFromCategory(owned.category),
    score: percentage,
    certificateId: owned.certificateId || owned.bendaTestId,
    issuedDate,
    level: owned.level || 'hard',
    category: owned.category,
    marksObtained: owned.marksObtained,
    fullMarks: owned.fullMarks,
    isEligible: true,
  };
}
