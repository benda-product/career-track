import type { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/apiError';
import { resolveInternalSyncKey } from '../utils/assertSecurityEnv';

export function requireInternalKey(req: Request, _res: Response, next: NextFunction) {
  let expected: string;
  try {
    expected = resolveInternalSyncKey();
  } catch (err) {
    return next(new ApiError(503, (err as Error).message || 'Internal auth is not configured'));
  }

  const provided = req.headers['x-benda-key'] || req.headers['x-benda-internal-key'];

  if (!provided || provided !== expected) {
    return next(new ApiError(401, 'Invalid or missing internal API key'));
  }

  next();
}
