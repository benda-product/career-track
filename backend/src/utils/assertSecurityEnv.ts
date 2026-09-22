const WEAK_DEFAULTS = new Set([
  "internal_secret_key",
  "dev_jwt_secret_change_before_production",
  "dev_jwt_secret_change_in_production",
  "dev-jwt-secret",
  "dev-refresh-secret",
  "change-this-to-a-long-random-secret",
  "change-me-in-production",
  "dev-only-internal-sync-key-change-me",
  "dev-only-integration-secret-change-me",
]);

function isProduction() {
  const appEnv = String(process.env.APP_ENV || process.env.NODE_ENV || "").toLowerCase();
  return appEnv === "production" || appEnv === "prod";
}

function isWeak(value: string | undefined) {
  const v = String(value || "").trim();
  if (!v) return true;
  if (v.length < 24) return true;
  return WEAK_DEFAULTS.has(v);
}

/** Boot-time secret checks — warn only (never refuse boot / 502 crash-loop). */
export function assertSecurityEnv(opts: { requireTurnstile?: boolean } = {}) {
  const { requireTurnstile = true } = opts;
  const production = isProduction();
  const jwtSecret = process.env.JWT_SECRET;
  const refreshSecret = process.env.JWT_REFRESH_SECRET;
  const internalKey = process.env.INTERNAL_SYNC_KEY || process.env.BENDA_INTERNAL_KEY;
  const warnings: string[] = [];

  if (!String(jwtSecret || "").trim()) {
    warnings.push("JWT_SECRET is unset");
  } else if (production && isWeak(jwtSecret)) {
    warnings.push("JWT_SECRET is weak/default — rotate to a unique 24+ char secret");
  }

  if (production && (!refreshSecret || isWeak(refreshSecret))) {
    warnings.push("JWT_REFRESH_SECRET is missing/weak");
  }
  if (!internalKey || (production && isWeak(internalKey))) {
    warnings.push("INTERNAL_SYNC_KEY is missing/weak — set a unique strong value");
  }
  if (requireTurnstile && production && !String(process.env.TURNSTILE_SECRET_KEY || "").trim()) {
    warnings.push("TURNSTILE_SECRET_KEY is unset (bot protection disabled)");
  }

  if (warnings.length) {
    const message = `[security] ${warnings.join("; ")}`;
    if (production) console.error(message);
    else console.warn(message);
  }
}

export function resolveInternalSyncKey() {
  const key = String(process.env.INTERNAL_SYNC_KEY || process.env.BENDA_INTERNAL_KEY || "").trim();
  if (key) return key;
  console.warn("[security] INTERNAL_SYNC_KEY unset — using local-only fallback");
  return "dev-only-internal-sync-key-change-me";
}
