import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response';
import { authService } from '../auth/auth.service';
import { ApiError } from '../../utils/apiError';

export class BendaInfotechController {
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
