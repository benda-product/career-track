import { User, IUser } from '../modules/auth/user.model';

export class UserRepository {
  async findByEmail(email: string): Promise<IUser | null> {
    return User.findOne({ email }).select('+password');
  }

  async findById(id: string): Promise<IUser | null> {
    return User.findById(id);
  }

  async findByGoogleId(googleId: string): Promise<IUser | null> {
    return User.findOne({ googleId });
  }

  async create(data: Partial<IUser>): Promise<IUser> {
    return User.create(data);
  }

  async update(id: string, data: Partial<IUser>): Promise<IUser | null> {
    return User.findByIdAndUpdate(id, data, { new: true });
  }

  async addRefreshToken(id: string, token: string): Promise<void> {
    await User.findByIdAndUpdate(id, { $push: { refreshTokens: token } });
  }

  async removeRefreshToken(id: string, token: string): Promise<void> {
    await User.findByIdAndUpdate(id, { $pull: { refreshTokens: token } });
  }

  async findByVerificationToken(token: string): Promise<IUser | null> {
    return User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: new Date() },
    });
  }

  async findByResetToken(token: string): Promise<IUser | null> {
    return User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: new Date() },
    });
  }
}

export const userRepository = new UserRepository();
