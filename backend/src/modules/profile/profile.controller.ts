import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { profileService } from './profile.service';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response';

export class ProfileController {
  getProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
    const profile = await profileService.getProfile(req.user!.userId);
    sendSuccess(res, profile);
  });

  updateProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
    const profile = await profileService.updateProfile(req.user!.userId, req.body);
    sendSuccess(res, profile, 'Profile updated');
  });

  uploadPhoto = asyncHandler(async (req: AuthRequest, res: Response) => {
    const profile = await profileService.uploadProfilePhoto(req.user!.userId, req.file!);
    sendSuccess(res, profile, 'Profile photo updated');
  });

  getCompletion = asyncHandler(async (req: AuthRequest, res: Response) => {
    const completion = await profileService.getCompletion(req.user!.userId);
    sendSuccess(res, completion);
  });
}

export const profileController = new ProfileController();
