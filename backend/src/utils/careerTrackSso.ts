import jwt from 'jsonwebtoken';
import { ApiError } from './apiError';
import { env } from '../config/env';

const SSO_PURPOSE = 'career-track-sso';

export interface CareerTrackSsoPayload {
  email: string;
  name?: string;
  userId: string;
  returnUrl?: string;
  targetPath?: string;
  sourceApp?: string;
  purpose: string;
}

export function createCareerTrackSsoToken(payload: {
  email: string;
  name?: string;
  userId: string;
  returnUrl?: string;
  targetPath?: string;
  sourceApp?: string;
}): string {
  return jwt.sign(
    { ...payload, purpose: SSO_PURPOSE },
    env.internalSyncKey,
    { expiresIn: '10m' },
  );
}

export function verifyCareerTrackSsoToken(token: string): CareerTrackSsoPayload {
  try {
    const decoded = jwt.verify(token, env.internalSyncKey) as CareerTrackSsoPayload;
    if (decoded.purpose !== SSO_PURPOSE) {
      throw new ApiError(401, 'Invalid SSO token');
    }
    return decoded;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(401, 'Invalid or expired SSO token');
  }
}
