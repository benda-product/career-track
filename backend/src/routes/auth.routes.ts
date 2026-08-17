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

const router = Router();

router.post('/register', requireTurnstile, validate(registerSchema), authController.register);
router.post('/login', requireTurnstile, validate(loginSchema), authController.login);
router.post('/refresh-token', validate(refreshTokenSchema), authController.refreshToken);
router.post('/logout', validate(logoutSchema), authController.logout);
router.get('/verify-email', authController.verifyEmail);
router.post('/forgot-password', requireTurnstile, validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', requireTurnstile, validate(resetPasswordSchema), authController.resetPassword);
router.post('/google', validate(googleLoginSchema), authController.googleLogin);
router.post('/sso-login', authController.ssoLogin);

export default router;
