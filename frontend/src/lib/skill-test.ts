export const SKILL_TEST_URL =
  process.env.NEXT_PUBLIC_SKILL_TEST_URL || 'http://localhost:3005';

export function getSkillTestPath(action: 'take' | 'my-tests' | 'certificates' | 'upgrade-plans') {
  switch (action) {
    case 'take':
      return '/selectSkill';
    case 'my-tests':
      return '/dashboard?tab=tests';
    case 'certificates':
      return '/dashboard?tab=tests';
    case 'upgrade-plans':
      return '/candidatePlans';
    default:
      return '/selectSkill';
  }
}
