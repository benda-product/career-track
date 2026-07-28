const BENDA_URL = process.env.NEXT_PUBLIC_BENDA_URL || 'http://localhost:3004';

export function getBendaSignInUrl(product: 'career_track' | 'talent_desk' = 'career_track') {
  return `${BENDA_URL}/sign-in?product=${product}`;
}

export function getBendaSignUpUrl(
  product: 'career_track' | 'talent_desk' = 'career_track',
  options?: { plan?: string; billing?: 'monthly' | 'annual' }
) {
  const params = new URLSearchParams({ product });
  if (options?.plan) params.set('plan', options.plan);
  if (options?.billing) params.set('billing', options.billing);
  return `${BENDA_URL}/signup?${params.toString()}`;
}

export function redirectToBendaSignIn(product: 'career_track' | 'talent_desk' = 'career_track') {
  if (typeof window === 'undefined') return;
  window.location.assign(getBendaSignInUrl(product));
}
