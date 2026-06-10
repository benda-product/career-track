import { Request, Response, NextFunction } from 'express';
import { sanitize } from 'express-mongo-sanitize';

/**
 * Express 5 makes req.query (and sometimes req.params) read-only.
 * express-mongo-sanitize assigns req[key] = target, which throws.
 * This middleware sanitizes in place without reassigning those properties.
 */
export const mongoSanitizeMiddleware = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitize(req.body);
  }

  sanitizeInPlace(req.params as Record<string, unknown>);
  sanitizeInPlace(req.query as Record<string, unknown>);

  next();
};

function sanitizeInPlace(obj: Record<string, unknown>): void {
  if (!obj || typeof obj !== 'object') return;

  const cleaned = sanitize({ ...obj }) as Record<string, unknown>;

  for (const key of Object.keys(obj)) {
    if (!(key in cleaned)) {
      delete obj[key];
    }
  }
  Object.assign(obj, cleaned);
}
