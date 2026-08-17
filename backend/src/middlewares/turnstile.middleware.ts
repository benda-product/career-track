import { Request, Response, NextFunction } from 'express';

const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

function extractTurnstileToken(req: Request) {
  const body = (req.body || {}) as Record<string, unknown>;
  return String(
    body.turnstileToken ||
      body['cf-turnstile-response'] ||
      req.headers['x-turnstile-token'] ||
      ''
  );
}

export async function requireTurnstile(req: Request, res: Response, next: NextFunction) {
  try {
    const secret = String(process.env.TURNSTILE_SECRET_KEY || '').trim();
    if (!secret) return next();

    const token = extractTurnstileToken(req).trim();
    if (!token) {
      return res.status(400).json({ message: 'Please complete the security check.' });
    }

    const body = new URLSearchParams();
    body.set('secret', secret);
    body.set('response', token);
    const ip = req.headers['cf-connecting-ip'] || req.ip;
    if (ip) body.set('remoteip', String(ip));

    const response = await fetch(SITEVERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    const data = (await response.json().catch(() => ({}))) as { success?: boolean };
    if (!data?.success) {
      return res.status(400).json({ message: 'Security check failed. Refresh the page and try again.' });
    }
    return next();
  } catch (error) {
    console.error('Turnstile verify error:', error);
    return res.status(502).json({ message: 'Unable to verify security check.' });
  }
}
