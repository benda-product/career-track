import { profileRepository } from '../../repositories/profile.repository';
import { userRepository } from '../../repositories/user.repository';
import { syncCandidateToTalentPool } from '../../services/talentPool.service';
import { CloudinaryService } from '../../services/cloudinary.service';
import { env } from '../../config/env';
import { ApiError } from '../../utils/apiError';
import { computeProfileCompletion, getProfileCompletionDetails } from './profile.completion';
import { mapUpdatePayload, toCandidateProfileView } from './profile.mapper';
import { CandidateProfileResponse } from './profile.types';

export class ProfileService {
  private async buildProfileResponse(userId: string): Promise<CandidateProfileResponse> {
    const [user, profile] = await Promise.all([
      userRepository.findById(userId),
      profileRepository.getOrCreate(userId),
    ]);

    if (!user) {
      throw new Error('User not found');
    }

    const candidateProfile = toCandidateProfileView(user, profile);
    const profileCompletion = computeProfileCompletion(candidateProfile);

    return {
      user: { ...candidateProfile, profileCompletion },
      profileCompletion,
    };
  }

  async getProfile(userId: string): Promise<CandidateProfileResponse> {
    return this.buildProfileResponse(userId);
  }

  async updateProfile(userId: string, body: Record<string, unknown>): Promise<CandidateProfileResponse> {
    const { userUpdates, profileUpdates } = mapUpdatePayload(body);

    if (Object.keys(userUpdates).length > 0) {
      await userRepository.update(userId, userUpdates);
    }

    const profile = await profileRepository.getOrCreate(userId);

    if (profileUpdates.linkedinProfile !== undefined) {
      const otherLinks = (profile.socialLinks || []).filter(
        (link) => link.platform?.toLowerCase() !== 'linkedin'
      );
      profileUpdates.socialLinks = profileUpdates.linkedinProfile
        ? [...otherLinks, { platform: 'linkedin', url: profileUpdates.linkedinProfile }]
        : otherLinks;
    }

    await profileRepository.update(userId, {
      ...profileUpdates,
      userId: profile.userId,
    });

    const response = await this.buildProfileResponse(userId);
    const completionScore = response.profileCompletion;
    await profileRepository.update(userId, { completionScore });

    void syncCandidateToTalentPool(userId);

    return response;
  }

  async uploadProfilePhoto(
    userId: string,
    file: Express.Multer.File
  ): Promise<CandidateProfileResponse> {
    if (!file) {
      throw new ApiError(400, 'Profile photo is required');
    }

    if (!env.cloudinary.cloudName) {
      throw new ApiError(503, 'Image upload is not configured');
    }

    const extension = file.mimetype === 'image/png' ? 'png' : file.mimetype === 'image/webp' ? 'webp' : 'jpg';
    const filename = `candidate-${userId}-${Date.now()}.${extension}`;

    const { url } = await CloudinaryService.uploadImageBuffer(file.buffer, {
      folder: 'careertrack/profile-photos',
      filename,
      mimeType: file.mimetype,
    });

    await userRepository.update(userId, { avatar: url });

    const response = await this.buildProfileResponse(userId);
    const completionScore = response.profileCompletion;
    await profileRepository.update(userId, { completionScore });

    void syncCandidateToTalentPool(userId);

    return response;
  }

  async getCompletion(userId: string) {
    const response = await this.buildProfileResponse(userId);
    return getProfileCompletionDetails(response.user);
  }
}

export const profileService = new ProfileService();
