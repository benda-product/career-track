import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { authService } from './auth.service';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response';

export class AuthController {
  register = asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await authService.register(req.body);
    sendSuccess(res, result, 'Registration successful', 201);
  });

  login = asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await authService.login(req.body);
    sendSuccess(res, result, 'Login successful');
  });

  refreshToken = asyncHandler(async (req: AuthRequest, res: Response) => {
    const tokens = await authService.refreshToken(req.body.refreshToken);
    sendSuccess(res, tokens, 'Token refreshed');
  });

  logout = asyncHandler(async (req: AuthRequest, res: Response) => {
    await authService.logout(req.body.refreshToken);
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
    sendSuccess(res, result, 'Google login successful');
  });

  ssoLogin = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { token, redirect } = req.body as { token?: string; redirect?: string };
    if (!token) {
      return res.status(400).json({ success: false, message: 'SSO token is required' });
    }
    const result = await authService.ssoLogin(token, redirect || '/dashboard');
    sendSuccess(res, result, 'SSO login successful');
  });
}

export const authController = new AuthController();
