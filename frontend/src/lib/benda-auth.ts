const BENDA_URL = process.env.NEXT_PUBLIC_BENDA_URL || 'http://localhost:3004';

export function getBendaSignInUrl(product: 'career_track' | 'talent_desk' = 'career_track') {
  return `${BENDA_URL}/sign-in?product=${product}`;
}

export function getBendaSignUpUrl(product: 'career_track' | 'talent_desk' = 'career_track') {
  return `${BENDA_URL}/signup?product=${product}`;
}
