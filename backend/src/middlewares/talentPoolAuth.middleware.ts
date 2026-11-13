import crypto from 'crypto';
import type { NextFunction, Request, Response } from 'express';
import { ApiError } from '../utils/apiError';
import { resolveInternalSyncKey } from '../utils/assertSecurityEnv';

const WEAK_KEYS = new Set([
  'internal_secret_key',
  'internal-sync-key',
  'dev-only-internal-sync-key-change-me',
]);

function isProduction() {
  const appEnv = String(process.env.APP_ENV || process.env.NODE_ENV || '').toLowerCase();
  return appEnv === 'production' || appEnv === 'prod';
}

function safeEqual(a: string, b: string) {
  const left = crypto.createHash('sha256').update(a).digest();
  const right = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(left, right);
}

function header(req: Request, name: string) {
  const value = req.headers[name];
  return Array.isArray(value) ? value[0] : value;
}

/**
 * Service-to-service auth for the read-only Talent Desk talent pool API.
 * Prefers a dedicated TALENT_POOL_API_KEY (sent as x-talent-pool-key) so the
 * caller does not need the broader internal sync key.
 */
export function requireTalentPoolKey(req: Request, res: Response, next: NextFunction) {
  const dedicated = String(process.env.TALENT_POOL_API_KEY || '').trim();
  let expected = dedicated;
  if (!expected) {
    try {
      expected = String(resolveInternalSyncKey() || '').trim();
    } catch {
      expected = '';
    }
  }

  if (!expected || (isProduction() && (expected.length < 24 || WEAK_KEYS.has(expected)))) {
    return next(new ApiError(503, 'Talent pool API key is not configured'));
  }

  const provided = dedicated
    ? header(req, 'x-talent-pool-key')
    : header(req, 'x-talent-pool-key') || header(req, 'x-benda-internal-key') || header(req, 'x-benda-key');

  if (!provided || !safeEqual(String(provided), expected)) {
    return next(new ApiError(401, 'Invalid or missing talent pool API key'));
  }

  res.set('Cache-Control', 'no-store');
  next();
}
