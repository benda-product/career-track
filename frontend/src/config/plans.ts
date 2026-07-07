export const PLAN_CATALOG = [
  {
    key: 'free',
    label: 'Free',
    priceMonthly: 0,
    tag: 'Included with Benda Job Seeker',
    subtitle: 'Core job search and application tools.',
    featured: false,
    features: [
      'Job search and saved jobs',
      'Application tracker',
      'Profile and resume integration',
      'Resume AI & SkillCheck free tiers via ecosystem',
      'Up to 20 recommended job matches',
      'Email support',
    ],
  },
  {
    key: 'pro',
    label: 'Career Pro',
    priceMonthly: 19.99,
    tag: 'Active job seekers',
    subtitle: 'One plan: Career Track + Resume AI Pro + SkillCheck Pro.',
    featured: true,
    features: [
      'Everything in Free',
      'Resume AI Pro included',
      'SkillCheck Pro included',
      'Priority job insights',
      'Advanced analytics dashboard',
      '1 mock interview credit per month',
      'Up to 100 recommended job matches',
      'Priority email support',
    ],
  },
] as const;

export type PlanKey = (typeof PLAN_CATALOG)[number]['key'];
