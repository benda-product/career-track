import { userRepository } from '../../repositories/user.repository';
import { profileRepository } from '../../repositories/profile.repository';
import crypto from 'crypto';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  generateEmailVerificationToken,
  generatePasswordResetToken,
} from '../../utils/token';
import { EmailService } from '../../services/email.service';
import { syncCandidateToTalentPool } from '../../services/talentPool.service';
import { ApiError } from '../../utils/apiError';
import { JwtPayload } from '../../types';

interface RegisterDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

interface LoginDto {
  email: string;
  password: string;
}

interface BendaProvisionDto {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  photoUrl?: string | null;
}

export class AuthService {
  private buildTokens(user: { _id: { toString(): string }; email: string; role: string }) {
    const payload: JwtPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role as JwtPayload['role'],
    };
    return {
      accessToken: generateAccessToken(payload),
      refreshToken: generateRefreshToken(payload),
    };
  }

  async register(dto: RegisterDto) {
    const existing = await userRepository.findByEmail(dto.email);
    if (existing) throw new ApiError(409, 'Email already registered');

    const verificationToken = generateEmailVerificationToken();
    const user = await userRepository.create({
      ...dto,
      emailVerificationToken: verificationToken,
      emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    await profileRepository.create(user._id.toString());
    void syncCandidateToTalentPool(user._id.toString());
    await EmailService.sendVerificationEmail(user.email, verificationToken);

    const tokens = this.buildTokens(user);
    await userRepository.addRefreshToken(user._id.toString(), tokens.refreshToken);

    return {
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
      },
      ...tokens,
    };
  }

  async login(dto: LoginDto) {
    const user = await userRepository.findByEmail(dto.email);
    if (!user || !user.isActive) throw new ApiError(401, 'Invalid credentials');

    const isMatch = await user.comparePassword(dto.password);
    if (!isMatch) throw new ApiError(401, 'Invalid credentials');

    await userRepository.update(user._id.toString(), { lastLogin: new Date() });

    const tokens = this.buildTokens(user);
    await userRepository.addRefreshToken(user._id.toString(), tokens.refreshToken);

    return {
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
      },
      ...tokens,
    };
  }

  async refreshToken(token: string) {
    const payload = verifyRefreshToken(token);
    const user = await userRepository.findById(payload.userId);
    if (!user || !user.refreshTokens.includes(token)) {
      throw new ApiError(401, 'Invalid refresh token');
    }

    const tokens = this.buildTokens(user);
    await userRepository.removeRefreshToken(user._id.toString(), token);
    await userRepository.addRefreshToken(user._id.toString(), tokens.refreshToken);

    return tokens;
  }

  async logout(userId: string, refreshToken: string) {
    await userRepository.removeRefreshToken(userId, refreshToken);
  }

  async verifyEmail(token: string) {
    const user = await userRepository.findByVerificationToken(token);
    if (!user) throw new ApiError(400, 'Invalid or expired verification token');

    await userRepository.update(user._id.toString(), {
      isEmailVerified: true,
      emailVerificationToken: undefined,
      emailVerificationExpires: undefined,
    });
  }

  async forgotPassword(email: string) {
    const user = await userRepository.findByEmail(email);
    if (!user) return;

    const resetToken = generatePasswordResetToken();
    await userRepository.update(user._id.toString(), {
      passwordResetToken: resetToken,
      passwordResetExpires: new Date(Date.now() + 60 * 60 * 1000),
    });
    await EmailService.sendPasswordResetEmail(user.email, resetToken);
  }

  async resetPassword(token: string, password: string) {
    const user = await userRepository.findByResetToken(token);
    if (!user) throw new ApiError(400, 'Invalid or expired reset token');

    await userRepository.update(user._id.toString(), {
      password,
      passwordResetToken: undefined,
      passwordResetExpires: undefined,
    });
  }

  async googleLogin(idToken: string) {
    // In production, verify idToken with Google OAuth2 API
    // For now, decode basic payload structure
    try {
      const payload = JSON.parse(Buffer.from(idToken.split('.')[1], 'base64').toString());
      const { sub: googleId, email, given_name: firstName, family_name: lastName } = payload;

      let user = await userRepository.findByGoogleId(googleId);
      if (!user) {
        user = await userRepository.findByEmail(email);
        if (user) {
          await userRepository.update(user._id.toString(), { googleId, isEmailVerified: true });
        } else {
          user = await userRepository.create({
            email,
            password: generateEmailVerificationToken(),
            firstName: firstName || 'User',
            lastName: lastName || '',
            googleId,
            isEmailVerified: true,
          });
          await profileRepository.create(user._id.toString());
        }
      }

      const tokens = this.buildTokens(user);
      await userRepository.addRefreshToken(user._id.toString(), tokens.refreshToken);

      return {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
        },
        ...tokens,
      };
    } catch {
      throw new ApiError(401, 'Invalid Google token');
    }
  }

  async provisionFromBendaInfotech(dto: BendaProvisionDto) {
    const email = dto.email.toLowerCase().trim();
    let user = await userRepository.findByEmail(email);

    if (!user) {
      user = await userRepository.create({
        email,
        password: crypto.randomBytes(32).toString('hex'),
        firstName: dto.firstName.trim() || 'User',
        lastName: dto.lastName.trim() || '',
        role: 'candidate',
        avatar: dto.photoUrl || undefined,
        isEmailVerified: true,
      });
      await profileRepository.create(user._id.toString());
      void syncCandidateToTalentPool(user._id.toString());
    } else {
      await userRepository.update(user._id.toString(), { lastLogin: new Date() });
    }

    const tokens = this.buildTokens(user);
    await userRepository.addRefreshToken(user._id.toString(), tokens.refreshToken);

    return {
      user: {
        id: user._id.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
      },
      ...tokens,
    };
  }
}

export const authService = new AuthService();
