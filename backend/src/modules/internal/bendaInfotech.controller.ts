import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response';
import { authService } from '../auth/auth.service';
import { ApiError } from '../../utils/apiError';
import { User } from '../auth/user.model';
import { userRepository } from '../../repositories/user.repository';

export class BendaInfotechController {
  accountLookup = asyncHandler(async (req: Request, res: Response) => {
    const email = String(req.query.email || '')
      .toLowerCase()
      .trim();

    if (!email) {
      throw new ApiError(400, 'email is required');
    }

    const user = await User.findOne({ email });
    if (!user) {
      sendSuccess(res, { exists: false });
      return;
    }

    sendSuccess(res, {
      exists: true,
      product: 'career_track',
      userId: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      authProvider: user.authProvider,
      bendaLinked: Boolean(user.bendaLinked),
    });
  });

  linkAccount = asyncHandler(async (req: Request, res: Response) => {
    const { email, firstName, lastName } = req.body || {};
    const normalizedEmail = String(email || '').toLowerCase().trim();

    if (!normalizedEmail) {
      throw new ApiError(400, 'email is required');
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      sendSuccess(res, { linked: false, exists: false });
      return;
    }

    await userRepository.update(user._id.toString(), {
      bendaLinked: true,
      isEmailVerified: user.isEmailVerified || true,
      ...(firstName && !user.firstName ? { firstName: String(firstName).trim() } : {}),
      ...(lastName && !user.lastName ? { lastName: String(lastName).trim() } : {}),
    });

    sendSuccess(res, {
      linked: true,
      exists: true,
      userId: user._id.toString(),
      role: user.role,
    });
  });

  verifyCredentials = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body || {};

    if (!email || !password) {
      throw new ApiError(400, 'email and password are required');
    }

    const result = await authService.verifyCredentialsForBenda({
      email: String(email),
      password: String(password),
    });

    if (!result) {
      sendSuccess(res, { valid: false });
      return;
    }

    sendSuccess(res, result);
  });

  provisionJobSeeker = asyncHandler(async (req: Request, res: Response) => {
    const { email, firstName, lastName, accountType } = req.body || {};

    if (!email || !firstName || !lastName) {
      throw new ApiError(400, 'email, firstName, and lastName are required');
    }

    if (accountType === 'recruiter') {
      throw new ApiError(
        403,
        'Career Track is for Job Seekers. Recruiter accounts should use Talent Desk.'
      );
    }

    const result = await authService.provisionFromBendaInfotech({
      email: String(email),
      firstName: String(firstName),
      lastName: String(lastName),
      phone: req.body.phone ? String(req.body.phone) : undefined,
      photoUrl: req.body.photoUrl ? String(req.body.photoUrl) : null,
    });

    sendSuccess(res, result);
  });
}

export const bendaInfotechController = new BendaInfotechController();
