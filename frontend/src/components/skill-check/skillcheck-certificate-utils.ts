export function getCourseModules(courseName: string) {
  const c = courseName.toLowerCase();
  if (c.includes('business analyst')) {
    return 'Market Research, Sales Strategies, Client Relationship Management, and Business Analysis';
  }
  if (c.includes('data')) {
    return 'Data Cleaning, SQL Queries, Statistical Analysis, and Visualization';
  }
  if (c.includes('java')) {
    return 'OOP Concepts, Data Structures, Exception Handling, and Multi-threading';
  }
  if (c.includes('ui/ux')) {
    return 'User Research, Wireframing, Prototyping, and Usability Testing';
  }
  return 'Fundamental Concepts, Practical Applications, Strategic Implementation, and Problem Solving';
}

export function getDisplayCourse(course: string, category?: string, language = '') {
  if (course) return course;

  const key = (category || language || '').toLowerCase();
  const map: Record<string, string> = {
    java: 'Java',
    dataanalyst: 'Data Analyst',
    businessanalyst: 'Business Analyst',
    businessintelligence: 'Business Intelligence',
    financialanalyst: 'Financial Analyst',
    uiux: 'UI/UX',
  };

  return map[key] || category || language || 'Skill Assessment';
}

export type SkillcheckCertificateData = {
  name: string;
  course?: string;
  score: number;
  certificateId: string;
  issuedDate: string;
  level?: string;
  category?: string;
};
