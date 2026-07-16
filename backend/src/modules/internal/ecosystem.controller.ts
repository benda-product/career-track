import crypto from 'crypto';
import { Response } from 'express';
import { env } from '../../config/env';
import { userRepository } from '../../repositories/user.repository';
import { profileRepository } from '../../repositories/profile.repository';
import { splitDisplayName } from '../../services/ecosystemAuth.service';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response';
import { ApiError } from '../../utils/apiError';
import { createCareerTrackSsoToken } from '../../utils/careerTrackSso';

export class EcosystemInternalController {
  createSsoSession = asyncHandler(async (req, res: Response) => {
    const { email, name, returnUrl, targetPath, sourceApp } = req.body as {
      email?: string;
      name?: string;
      returnUrl?: string;
      targetPath?: string;
      sourceApp?: string;
    };

    const normalizedEmail = String(email || '')
      .toLowerCase()
      .trim();
    if (!normalizedEmail) {
      throw new ApiError(400, 'email is required');
    }

    let user = await userRepository.findByEmail(normalizedEmail);
    if (!user) {
      const parts = splitDisplayName(name || normalizedEmail.split('@')[0]);
      user = await userRepository.create({
        email: normalizedEmail,
        password: crypto.randomBytes(32).toString('hex'),
        firstName: parts.firstName,
        lastName: parts.lastName,
        role: 'candidate',
        isEmailVerified: true,
        authProvider: 'benda_infotech',
      });
      await profileRepository.create(user._id.toString());
    }

    const token = createCareerTrackSsoToken({
      email: user.email,
      name: name || `${user.firstName} ${user.lastName}`.trim(),
      userId: user._id.toString(),
      returnUrl,
      targetPath,
      sourceApp,
    });

    const redirect = targetPath || '/dashboard';
    sendSuccess(res, {
      token,
      url: `${env.clientUrl}/auth/sso-login?token=${encodeURIComponent(token)}&redirect=${encodeURIComponent(redirect)}`,
    });
  });
}

export const ecosystemInternalController = new EcosystemInternalController();
