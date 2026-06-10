import { Profile, IProfile } from '../modules/profile/profile.model';

export class ProfileRepository {
  async findByUserId(userId: string): Promise<IProfile | null> {
    return Profile.findOne({ userId });
  }

  async create(userId: string): Promise<IProfile> {
    return Profile.create({
      userId,
      skills: [],
      experience: [],
      education: [],
      projects: [],
      certifications: [],
      achievements: [],
      portfolio: [],
      socialLinks: [],
      careerPreferences: {
        desiredRoles: [],
        desiredLocations: [],
        employmentTypes: [],
        industries: [],
        remotePreference: 'any',
        willingToRelocate: false,
      },
      completionScore: 0,
    });
  }

  async update(userId: string, data: Partial<IProfile>): Promise<IProfile | null> {
    return Profile.findOneAndUpdate({ userId }, data, { new: true, runValidators: true });
  }

  async getOrCreate(userId: string): Promise<IProfile> {
    let profile = await this.findByUserId(userId);
    if (!profile) profile = await this.create(userId);
    return profile;
  }
}

export const profileRepository = new ProfileRepository();
