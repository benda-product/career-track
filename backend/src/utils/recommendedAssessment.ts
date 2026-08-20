export interface SkillCatalogItem {
  id: string;
  name: string;
  bendaLanguage: string;
  targetPath?: string;
  prerequisite?: string;
  levels?: string[];
  active?: boolean;
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

const STOPWORDS = new Set([
  'senior',
  'junior',
  'lead',
  'principal',
  'staff',
  'intern',
  'associate',
  'specialist',
  'consultant',
  'developer',
  'engineer',
  'programmer',
  'role',
  'job',
  'and',
  'the',
  'with',
  'for',
  'using',
]);

const ALIASES: Record<string, string[]> = {
  java: ['java', 'j2ee', 'spring', 'springboot'],
  javaBackend: ['java backend', 'backend java', 'spring boot'],
  python: ['python', 'django', 'flask', 'fastapi'],
  sql: ['sql', 'mysql', 'postgresql', 'postgres', 'oracle'],
  dataanalyst: ['data analyst', 'data analytics', 'power bi'],
  machineLearning: ['machine learning', 'data science', 'ml engineer', 'ai engineer'],
  businessAnalyst: ['business analyst'],
  businessIntelligence: ['business intelligence', 'bi analyst'],
  financialAnalyst: ['financial analyst', 'finance analyst'],
  uiux: ['ui/ux', 'ui ux', 'ux designer', 'product designer', 'ui designer'],
  cyberSecurity: ['cyber security', 'cybersecurity', 'infosec'],
  mechanicalEngineer: ['mechanical engineer'],
  electricalEngineer: ['electrical engineer'],
  fullStackDeveloper: ['full stack', 'fullstack', 'full-stack', 'react', 'nodejs', 'node.js', 'javascript', 'mern'],
  projectManagement: ['project manager', 'project management', 'scrum master'],
  cpp: ['c++', 'cpp'],
};

export const FALLBACK_SKILL_CATALOG: SkillCatalogItem[] = [
  { id: 'java', name: 'JAVA Developer', bendaLanguage: 'java', prerequisite: 'Basic JAVA', levels: ['easy', 'medium', 'hard'] },
  { id: 'python', name: 'PYTHON Developer', bendaLanguage: 'python', prerequisite: 'Python', levels: ['easy', 'medium', 'hard'] },
  { id: 'sql', name: 'SQL Developer', bendaLanguage: 'sql', prerequisite: 'Database Concepts, Querying, Joins, Indexing', levels: ['easy', 'medium', 'hard'] },
  { id: 'dataanalyst', name: 'Data Analyst', bendaLanguage: 'dataanalyst', prerequisite: 'Power BI, Python, Excel, SQL', levels: ['easy', 'medium', 'hard'] },
  { id: 'machineLearning', name: 'Machine Learning & Data Science', bendaLanguage: 'machineLearning', levels: ['easy', 'medium', 'hard'] },
  { id: 'businessAnalyst', name: 'Business Analyst', bendaLanguage: 'businessAnalyst', levels: ['easy', 'medium', 'hard'] },
  { id: 'businessIntelligence', name: 'Business Intelligence', bendaLanguage: 'businessIntelligence', levels: ['easy', 'medium', 'hard'] },
  { id: 'financialAnalyst', name: 'Financial Analyst', bendaLanguage: 'financialAnalyst', levels: ['easy', 'medium', 'hard'] },
  { id: 'uiux', name: 'UI/UX', bendaLanguage: 'uiux', levels: ['easy', 'medium', 'hard'] },
  { id: 'cyberSecurity', name: 'Cyber Security', bendaLanguage: 'cyberSecurity', levels: ['easy', 'medium', 'hard'] },
  { id: 'mechanicalEngineer', name: 'Mechanical Engineer', bendaLanguage: 'mechanicalEngineer', levels: ['easy', 'medium', 'hard'] },
  { id: 'electricalEngineer', name: 'Electrical Engineer', bendaLanguage: 'electricalEngineer', levels: ['easy', 'medium', 'hard'] },
  { id: 'javaBackend', name: 'Backend Using Java', bendaLanguage: 'javaBackend', levels: ['easy', 'medium', 'hard'] },
  { id: 'fullStackDeveloper', name: 'Full Stack Developer', bendaLanguage: 'fullStackDeveloper', levels: ['easy', 'medium', 'hard'] },
  { id: 'projectManagement', name: 'Project Management', bendaLanguage: 'projectManagement', levels: ['easy', 'medium', 'hard'] },
  { id: 'cpp', name: 'C++ Developer', bendaLanguage: 'cpp', levels: ['easy', 'medium', 'hard'] },
];

const SCORE_THRESHOLD = 60;

function normalize(value: unknown) {
  return String(value || '')
    .toLowerCase()
    .replace(/\+/g, 'plus')
    .replace(/[#.]/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function includesPhrase(haystack: string, phrase?: string | null) {
  if (!phrase) return false;
  const escaped = phrase
    .toLowerCase()
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    .replace(/\s+/g, '\\s+');
  if (!escaped) return false;
  return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, 'i').test(haystack);
}

function splitIdentifierWords(value: string) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function titleCaseName(name: string) {
  const spaced = splitIdentifierWords(name.replace(/\s+assessment$/i, '').trim());
  return spaced
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => {
      const lower = word.toLowerCase();
      if (lower === 'ui/ux') return 'UI/UX';
      if (lower === 'c++' || lower === 'cpp') return 'C++';
      if (lower === 'sql') return 'SQL';
      if (lower === 'java') return 'Java';
      if (lower === 'python') return 'Python';
      if (lower === 'aws') return 'AWS';
      if (lower === 'fullstack') return 'Fullstack';
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ')
    .replace(/\bFullstack\b/gi, 'Fullstack')
    .replace(/\bFull Stack\b/gi, 'Full Stack');
}

function assessmentTitle(name: string, id?: string, language?: string) {
  const key = String(id || language || '').trim();
  const fallback = FALLBACK_SKILL_CATALOG.find(
    (item) =>
      item.id.toLowerCase() === key.toLowerCase() ||
      item.bendaLanguage.toLowerCase() === key.toLowerCase()
  );

  let preferred = fallback?.name || name;
  if (
    key.toLowerCase() === 'fullstackdeveloper' ||
    /fullstack\s*developer/i.test(preferred) ||
    /^fullstackdeveloper$/i.test(preferred.replace(/\s+/g, ''))
  ) {
    preferred = 'Fullstack Developer';
  }

  const cleaned = titleCaseName(preferred)
    .replace(/\bFull\s*Stack\s*Developer\b/gi, 'Fullstack Developer')
    .replace(/\bFullstackdeveloper\b/gi, 'Fullstack Developer');

  return /assessment$/i.test(cleaned) ? cleaned : `${cleaned} Assessment`;
}

function scoreCatalogItem(
  item: SkillCatalogItem,
  title: string,
  skills: string[],
  haystack: string
) {
  const name = item.name || item.id || item.bendaLanguage;
  const id = item.id || item.bendaLanguage || '';
  const language = item.bendaLanguage || item.id || '';
  if (!name || !id) return 0;

  let score = 0;
  const normalizedName = normalize(name);
  const skillText = skills.join(' ');

  if (includesPhrase(title, name) || (normalizedName && includesPhrase(haystack, normalizedName))) {
    score += 90 + Math.min(name.length, 20);
  }

  if (includesPhrase(title, id) || includesPhrase(title, language)) {
    score += 75;
  }

  for (const skill of skills) {
    const n = normalize(skill);
    if (!n) continue;
    if (n === normalizedName || n === id.toLowerCase() || n === language.toLowerCase() || n === normalize(name)) {
      score += 85;
      break;
    }
  }

  for (const alias of ALIASES[item.id] || ALIASES[language] || []) {
    if (includesPhrase(title, alias) || includesPhrase(skillText, alias)) {
      score += alias.includes(' ') ? 80 : 70;
      break;
    }
  }

  const nameTokens = normalizedName.split(' ').filter((token) => token.length > 2 && !STOPWORDS.has(token));
  const titleTokens = new Set(normalize(title).split(' ').filter(Boolean));
  const overlap = nameTokens.filter((token) => titleTokens.has(token)).length;
  if (overlap > 0) score += overlap * 14;

  return score;
}

export function recommendAssessmentForJob(
  job: { title?: string; skills?: string[] },
  catalog: SkillCatalogItem[] = FALLBACK_SKILL_CATALOG
): RecommendedAssessment | null {
  const title = (job.title || '').trim();
  if (!title) return null;

  const skills = (job.skills || []).filter((skill): skill is string => Boolean(skill));
  const haystack = `${title} ${skills.join(' ')}`;
  const source = (catalog?.length ? catalog : FALLBACK_SKILL_CATALOG).filter(
    (item) => item && (item.name || item.id || item.bendaLanguage)
  );

  let best: { item: SkillCatalogItem; score: number } | null = null;
  for (const item of source) {
    if (item.active === false) continue;
    const score = scoreCatalogItem(item, title, skills, haystack);
    if (!best || score > best.score) best = { item, score };
  }

  if (!best || best.score < SCORE_THRESHOLD) return null;

  const item = best.item;
  const language = item.bendaLanguage || item.id;
  const displayName = item.name || item.id || language;
  if (!language || !displayName) return null;

  return {
    id: item.id || language,
    name: displayName,
    title: assessmentTitle(displayName, item.id, language),
    recommendedFor: title,
    bendaLanguage: language,
    targetPath: item.targetPath || `/testOptions?language=${encodeURIComponent(language)}`,
    prerequisite: item.prerequisite || undefined,
    levels: item.levels?.length ? item.levels : ['easy', 'medium', 'hard'],
    optional: true,
  };
}
