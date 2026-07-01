import { ApiError } from './apiError';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const ecosystemAuth = require('@benda/ecosystem-auth');

export const CENTRAL_AUTH_PRODUCTS = ecosystemAuth.CENTRAL_AUTH_PRODUCTS;

export interface CentralAuthPayload {
  sub: string;
  userId?: string;
  email: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  roles?: string[];
  products?: string[];
  organizationId?: string | null;
  companyName?: string | null;
}

function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  const err = error as Error & { statusCode?: number; code?: string };
  return new ApiError(err.statusCode || 401, err.message || 'Authentication failed');
}

export async function verifyCentralAuthToken(
  token: string,
  options: { requiredProduct?: string } = {},
): Promise<CentralAuthPayload> {
  try {
    return (await ecosystemAuth.verifyCentralAuthToken(token, options)) as CentralAuthPayload;
  } catch (error) {
    throw toApiError(error);
  }
}

export const syncUserToCentralAuth = ecosystemAuth.syncUserToCentralAuth;
export const provisionUserToCentralAuth = ecosystemAuth.provisionUserToCentralAuth;
export const buildSyncPayload = ecosystemAuth.buildSyncPayload;
export const syncLocalUserToCentralAuth = ecosystemAuth.syncLocalUserToCentralAuth;
