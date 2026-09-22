import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { authService } from './auth.service';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response';
import {
  clearAuthCookies,
  readRefreshTokenFromRequest,
  setAuthCookies,
} from '../../utils/authCookie';

function attachAuthCookies(
  req: AuthRequest,
  res: Response,
  result: { accessToken?: string; refreshToken?: string } | null | undefined
) {
  if (result?.accessToken || result?.refreshToken) {
    setAuthCookies(res, req, {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
  }
}

export class AuthController {
  register = asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await authService.register(req.body);
    attachAuthCookies(req, res, result);
    sendSuccess(res, result, 'Registration successful', 201);
  });

  login = asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await authService.login(req.body);
    attachAuthCookies(req, res, result);
    sendSuccess(res, result, 'Login successful');
  });

  refreshToken = asyncHandler(async (req: AuthRequest, res: Response) => {
    const refresh = readRefreshTokenFromRequest(req);
    if (!refresh) {
      return res.status(401).json({ success: false, message: 'Refresh token required' });
    }
    const tokens = await authService.refreshToken(refresh);
    attachAuthCookies(req, res, tokens);
    sendSuccess(res, tokens, 'Token refreshed');
  });

  logout = asyncHandler(async (req: AuthRequest, res: Response) => {
    const refresh = readRefreshTokenFromRequest(req);
    if (refresh) {
      await authService.logout(refresh);
    }
    clearAuthCookies(res, req);
    sendSuccess(res, null, 'Logged out successfully');
  });

  verifyEmail = asyncHandler(async (req: AuthRequest, res: Response) => {
    await authService.verifyEmail(req.query.token as string);
    sendSuccess(res, null, 'Email verified successfully');
  });

  forgotPassword = asyncHandler(async (req: AuthRequest, res: Response) => {
    await authService.forgotPassword(req.body.email);
    sendSuccess(res, null, 'If the email exists, a reset link has been sent');
  });

  resetPassword = asyncHandler(async (req: AuthRequest, res: Response) => {
    await authService.resetPassword(req.body.token, req.body.password);
    sendSuccess(res, null, 'Password reset successful');
  });

  googleLogin = asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await authService.googleLogin(req.body.idToken);
    attachAuthCookies(req, res, result);
    sendSuccess(res, result, 'Google login successful');
  });

  ssoLogin = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { token, redirect } = req.body as { token?: string; redirect?: string };
    if (!token) {
      return res.status(400).json({ success: false, message: 'SSO token is required' });
    }
    const result = await authService.ssoLogin(token, redirect || '/dashboard');
    attachAuthCookies(req, res, result);
    sendSuccess(res, result, 'SSO login successful');
  });

  applicantAccountStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
    const email = String(req.query.email || '');
    const result = await authService.getApplicantAccountStatus(email);
    sendSuccess(res, result);
  });

  completeApplicantAccount = asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await authService.completeApplicantAccount(req.body);
    attachAuthCookies(req, res, result);
    sendSuccess(res, result, 'Account activated', 201);
  });
}

export const authController = new AuthController();
