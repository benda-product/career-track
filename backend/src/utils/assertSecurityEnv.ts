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

export function assertSecurityEnv(opts: { requireTurnstile?: boolean } = {}) {
  const { requireTurnstile = true } = opts;
  const production = isProduction();
  const jwtSecret = process.env.JWT_SECRET;
  const refreshSecret = process.env.JWT_REFRESH_SECRET;
  const internalKey = process.env.INTERNAL_SYNC_KEY || process.env.BENDA_INTERNAL_KEY;
  const problems: string[] = [];

  if (!jwtSecret || (production && isWeak(jwtSecret))) {
    problems.push("JWT_SECRET must be set to a unique strong value (24+ chars)");
  }
  if (production && (!refreshSecret || isWeak(refreshSecret))) {
    problems.push("JWT_REFRESH_SECRET must be set to a unique strong value");
  }
  if (!internalKey || (production && isWeak(internalKey))) {
    problems.push("INTERNAL_SYNC_KEY must be a unique strong value");
  }
  if (requireTurnstile && production && !String(process.env.TURNSTILE_SECRET_KEY || "").trim()) {
    problems.push("TURNSTILE_SECRET_KEY should be set in production");
  }

  if (problems.length) {
    const message = `[security] Refusing to start:\n- ${problems.join("\n- ")}`;
    if (production) {
      console.error(message);
      throw new Error(message);
    }
    console.warn(`${message}\n(continuing because NODE_ENV/APP_ENV is not production)`);
  }
}

export function resolveInternalSyncKey() {
  const key = String(process.env.INTERNAL_SYNC_KEY || process.env.BENDA_INTERNAL_KEY || "").trim();
  if (key) return key;
  if (isProduction()) throw new Error("INTERNAL_SYNC_KEY is required in production");
  console.warn("[security] INTERNAL_SYNC_KEY unset — using local-only fallback");
  return "dev-only-internal-sync-key-change-me";
}
