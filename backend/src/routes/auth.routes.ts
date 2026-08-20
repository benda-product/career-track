import { Router } from 'express';
import { authController } from '../modules/auth/auth.controller';
import { validate } from '../middlewares/validate.middleware';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  logoutSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  googleLoginSchema,
} from '../validators/auth.validator';
import { requireTurnstile } from '../middlewares/turnstile.middleware';
import { authRateLimiter, forgotPasswordRateLimiter } from '../middlewares/rateLimit.middleware';

const router = Router();

router.post('/register', authRateLimiter, requireTurnstile, validate(registerSchema), authController.register);
router.post('/login', authRateLimiter, requireTurnstile, validate(loginSchema), authController.login);
router.post('/refresh-token', authRateLimiter, validate(refreshTokenSchema), authController.refreshToken);
router.post('/logout', validate(logoutSchema), authController.logout);
router.get('/verify-email', authController.verifyEmail);
router.post(
  '/forgot-password',
  forgotPasswordRateLimiter,
  requireTurnstile,
  validate(forgotPasswordSchema),
  authController.forgotPassword
);
router.post(
  '/reset-password',
  authRateLimiter,
  requireTurnstile,
  validate(resetPasswordSchema),
  authController.resetPassword
);
router.post('/google', authRateLimiter, validate(googleLoginSchema), authController.googleLogin);
router.post('/sso-login', authRateLimiter, authController.ssoLogin);

export default router;
