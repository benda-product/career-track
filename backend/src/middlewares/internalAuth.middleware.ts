import type { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/apiError';
import { env } from '../config/env';

export function requireInternalKey(req: Request, _res: Response, next: NextFunction) {
  const provided = req.headers['x-benda-key'] || req.headers['x-benda-internal-key'];

  if (!provided || provided !== env.internalSyncKey) {
    return next(new ApiError(401, 'Invalid or missing internal API key'));
  }

  next();
}
