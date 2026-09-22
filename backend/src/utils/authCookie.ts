import type { Request, Response } from 'express';
import { env } from '../config/env';

export const ACCESS_COOKIE_NAME = 'ct_access';
export const REFRESH_COOKIE_NAME = 'ct_refresh';

function isSecureRequest(req?: Request) {
  if (req?.secure) return true;
  const proto = String(req?.headers?.['x-forwarded-proto'] || '')
    .split(',')[0]
    .trim()
    .toLowerCase();
  return proto === 'https' || env.nodeEnv === 'production';
}

function sameSiteMode(req?: Request): 'lax' | 'none' | 'strict' {
  const forced = String(process.env.AUTH_COOKIE_SAMESITE || '').toLowerCase();
  if (forced === 'none' || forced === 'lax' || forced === 'strict') return forced;
  try {
    const clientHost = new URL(env.clientUrl).hostname;
    const apiHost = String(req?.hostname || '').toLowerCase();
    if (clientHost && apiHost && clientHost === apiHost) return 'lax';
  } catch {
    /* ignore */
  }
  return isSecureRequest(req) ? 'none' : 'lax';
}

function buildCookieOptions(req: Request | undefined, maxAgeMs: number, clear = false) {
  const sameSite = sameSiteMode(req);
  const secure = sameSite === 'none' ? true : isSecureRequest(req);
  return {
    httpOnly: true,
    secure,
    sameSite,
    path: '/',
    ...(clear ? { maxAge: 0, expires: new Date(0) } : { maxAge: maxAgeMs }),
  };
}

export function setAuthCookies(
  res: Response,
  req: Request,
  tokens: { accessToken?: string; refreshToken?: string }
) {
  if (tokens.accessToken) {
    res.cookie(ACCESS_COOKIE_NAME, tokens.accessToken, buildCookieOptions(req, 15 * 60 * 1000));
  }
  if (tokens.refreshToken) {
    res.cookie(REFRESH_COOKIE_NAME, tokens.refreshToken, buildCookieOptions(req, 7 * 24 * 60 * 60 * 1000));
  }
}

export function clearAuthCookies(res: Response, req: Request) {
  res.cookie(ACCESS_COOKIE_NAME, '', buildCookieOptions(req, 0, true));
  res.cookie(REFRESH_COOKIE_NAME, '', buildCookieOptions(req, 0, true));
}

export function readAccessTokenFromRequest(req: Request): string | null {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    const bearer = header.slice(7).trim();
    if (bearer) return bearer;
  }
  const cookieToken = req.cookies?.[ACCESS_COOKIE_NAME];
  return cookieToken ? String(cookieToken).trim() || null : null;
}

export function readRefreshTokenFromRequest(req: Request): string | null {
  if (req.body?.refreshToken) return String(req.body.refreshToken);
  const cookieToken = req.cookies?.[REFRESH_COOKIE_NAME];
  return cookieToken ? String(cookieToken).trim() || null : null;
}
