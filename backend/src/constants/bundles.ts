export const ENTITLEMENT_SOURCES = {
  DIRECT: 'direct',
  CAREER_PRO_BUNDLE: 'career_pro_bundle',
} as const;

export const CAREER_PRO_BUNDLE = {
  key: 'career_pro',
  label: 'Career Pro',
  includedProducts: [
    { product: 'resume_ai', tier: 'pro', label: 'Resume AI Pro' },
    { product: 'skillcheck', tier: 'pro', label: 'SkillCheck Pro' },
  ],
} as const;
