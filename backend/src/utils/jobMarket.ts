/**
 * Resolve Career Track job-market filter for ATS geo visibility.
 * - Explicit `all` / `global` / `*` → no market filter (show every CT-approved job)
 * - Explicit country / ISO code → filter
 * - Missing → optional profile-country default
 */

const ALL_MARKET_TOKENS = new Set(['', 'all', 'any', 'global', '*', 'worldwide']);

export function isAllMarketsToken(value?: string | null): boolean {
  return ALL_MARKET_TOKENS.has(String(value || '').trim().toLowerCase());
}

export function normalizeMarketParam(value?: string | null): string {
  const raw = String(value || '').trim();
  if (!raw || isAllMarketsToken(raw)) return '';
  return raw;
}

export async function resolveViewerMarket(options: {
  market?: string | null;
  viewerCountry?: string | null;
  userId?: string;
  /** When true and market omitted, use profile country. */
  defaultFromProfile?: boolean;
}): Promise<{ market?: string; source: 'explicit' | 'profile' | 'all' | 'none' }> {
  const marketProvided = options.market !== undefined && options.market !== null;
  const viewerProvided = options.viewerCountry !== undefined && options.viewerCountry !== null;
  const explicitProvided = marketProvided || viewerProvided;
  const explicitRaw = String(
    marketProvided ? options.market : viewerProvided ? options.viewerCountry : ''
  ).trim();

  // Client sent market/viewerCountry (including "" or "all") → never fall back to profile.
  if (explicitProvided) {
    if (isAllMarketsToken(explicitRaw)) {
      return { market: undefined, source: 'all' };
    }
    const explicit = normalizeMarketParam(explicitRaw);
    if (explicit) {
      return { market: explicit, source: 'explicit' };
    }
    return { market: undefined, source: 'all' };
  }

  if (options.defaultFromProfile && options.userId) {
    try {
      const { profileRepository } = await import('../repositories/profile.repository');
      const profile = await profileRepository.findByUserId(options.userId);
      const country =
        profile?.locationDetail?.country ||
        String(profile?.location || '')
          .split(',')
          .map((part: string) => part.trim())
          .filter(Boolean)
          .pop() ||
        '';
      const fromProfile = normalizeMarketParam(country);
      if (fromProfile) {
        return { market: fromProfile, source: 'profile' };
      }
    } catch {
      // best-effort
    }
  }

  return { market: undefined, source: 'none' };
}
