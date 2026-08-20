import rateLimit from 'express-rate-limit';
import { env } from '../config/env';

const production = env.nodeEnv === 'production';

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: production ? 40 : 400,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many auth requests, please try again later' },
});

export const forgotPasswordRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: production ? 5 : 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many password reset requests, please try again later',
  },
});
