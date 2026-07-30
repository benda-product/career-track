/**
 * Switch App → purchase deep-links for Career Track.
 */

const PURCHASE_INTENT_KEY = 'career-track.purchaseIntent';

export function isPlanGateError(message: unknown, status?: number) {
  const text = String(message || '');
  return (
    status === 403 ||
    /plan required|upgrade in billing|upgrade to|subscription required|not entitled/i.test(text)
  );
}

export function storePurchaseIntent(intent: Record<string, unknown>) {
  try {
    sessionStorage.setItem(
      PURCHASE_INTENT_KEY,
      JSON.stringify({ ...intent, createdAt: Date.now() })
    );
  } catch {
    /* ignore */
  }
}

export function careerProBillingHref(billing: 'monthly' | 'annual' = 'monthly') {
  const params = new URLSearchParams({ plan: 'pro', billing });
  return `/billing?${params.toString()}`;
}

export function startCareerProPurchase(billing: 'monthly' | 'annual' = 'monthly') {
  storePurchaseIntent({ product: 'career-pro', plan: 'pro', billing });
  window.location.assign(careerProBillingHref(billing));
}
