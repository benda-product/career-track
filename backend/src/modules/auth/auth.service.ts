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
import {
  verifyCentralAuthToken,
  ensureLocalUserInCentralAuth,
  CENTRAL_AUTH_PRODUCTS,
  CentralAuthPayload,
} from '../../utils/centralAuthSso';
import { verifyGoogleEcosystemCredentials } from '../../services/ecosystemGoogleAuth.service';
import {
  verifyEcosystemCredentials,
  splitDisplayName,
} from '../../services/ecosystemAuth.service';

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

/** Career Track requires 8+ char passwords locally; Benda/product creds may be shorter. */
function localPasswordForEcosystemLink(verifiedPassword: string) {
  const password = String(verifiedPassword || '');
  if (password.length >= 8) return password;
  return crypto.randomBytes(32).toString('hex');
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
      authProvider: 'local',
      emailVerificationToken: verificationToken,
      emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    await profileRepository.create(user._id.toString());
    void syncCandidateToTalentPool(user._id.toString());
    ensureLocalUserInCentralAuth(CENTRAL_AUTH_PRODUCTS.CAREER_TRACK, user, {
      password: dto.password,
      roles: ['JOB_SEEKER'],
      products: [CENTRAL_AUTH_PRODUCTS.CAREER_TRACK],
      sourceProduct: CENTRAL_AUTH_PRODUCTS.CAREER_TRACK,
    });
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
    const normalizedEmail = dto.email.toLowerCase().trim();
    let user = await userRepository.findByEmail(normalizedEmail);

    if (user?.isActive) {
      const isMatch = await user.comparePassword(dto.password);
      if (isMatch) {
        await userRepository.update(user._id.toString(), { lastLogin: new Date() });

        ensureLocalUserInCentralAuth(CENTRAL_AUTH_PRODUCTS.CAREER_TRACK, user, {
          password: dto.password,
          roles: ['JOB_SEEKER'],
          products: [CENTRAL_AUTH_PRODUCTS.CAREER_TRACK],
          sourceProduct: CENTRAL_AUTH_PRODUCTS.CAREER_TRACK,
        });

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
    }

    const ecosystem = await verifyEcosystemCredentials(normalizedEmail, dto.password);
    if (!ecosystem?.valid) {
      throw new ApiError(401, 'Invalid credentials');
    }

    const { firstName, lastName } = splitDisplayName(normalizedEmail, ecosystem);
    const localPassword = localPasswordForEcosystemLink(dto.password);

    if (!user) {
      user = await userRepository.create({
        email: normalizedEmail,
        password: localPassword,
        firstName,
        lastName,
        role: 'candidate',
        isEmailVerified: true,
        authProvider: 'benda_infotech',
        bendaLinked: true,
      });
      await profileRepository.create(user._id.toString());
      void syncCandidateToTalentPool(user._id.toString());
    } else if (!user.isActive) {
      throw new ApiError(401, 'Invalid credentials');
    } else {
      user.password = localPassword;
      user.bendaLinked = true;
      user.isEmailVerified = user.isEmailVerified || true;
      user.authProvider = user.authProvider || 'benda_infotech';
      user.lastLogin = new Date();
      if (!user.firstName?.trim()) user.firstName = firstName;
      if (!user.lastName?.trim()) user.lastName = lastName;
      await user.save();
    }

    ensureLocalUserInCentralAuth(CENTRAL_AUTH_PRODUCTS.CAREER_TRACK, user, {
      password: dto.password,
      roles: ['JOB_SEEKER'],
      products: [CENTRAL_AUTH_PRODUCTS.CAREER_TRACK],
      sourceProduct: CENTRAL_AUTH_PRODUCTS.CAREER_TRACK,
    });

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

  async verifyCredentialsForBenda(dto: LoginDto) {
    const user = await userRepository.findByEmail(dto.email);
    if (!user || !user.isActive) return null;

    const isMatch = await user.comparePassword(dto.password);
    if (!isMatch) return null;

    const firstName = String(user.firstName || '').trim() || 'User';
    const lastName = String(user.lastName || '').trim() || firstName;

    return {
      valid: true,
      product: 'career_track',
      accountType: 'job_seeker' as const,
      email: user.email,
      firstName,
      lastName,
      role: user.role,
      userId: user._id.toString(),
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
    const hub = await verifyGoogleEcosystemCredentials(idToken);
    if (!hub?.valid) {
      throw new ApiError(401, 'Invalid Google sign-in');
    }

    const roles = Array.isArray(hub.roles) ? hub.roles : [];
    const isRecruiter =
      hub.accountType === 'recruiter' ||
      hub.accountType === 'business' ||
      roles.includes('RECRUITER') ||
      roles.includes('BUSINESS');

    if (hub.hasBendaAccount && isRecruiter) {
      throw new ApiError(
        403,
        'Career Track is for job seekers. Use Talent Desk (ATS) for recruiter accounts.',
      );
    }

    const email = hub.email.toLowerCase().trim();
    const firstName = hub.firstName || 'User';
    const lastName = hub.lastName || '';
    const googleId = hub.firebaseUid || email;

    let user = await userRepository.findByGoogleId(googleId);
    if (!user) {
      user = await userRepository.findByEmail(email);
      if (user) {
        await userRepository.update(user._id.toString(), {
          googleId,
          isEmailVerified: true,
          bendaLinked: user.bendaLinked || hub.hasBendaAccount,
          ...(hub.photoUrl && !user.avatar ? { avatar: hub.photoUrl } : {}),
        });
      } else {
        user = await userRepository.create({
          email,
          password: crypto.randomBytes(32).toString('hex'),
          firstName,
          lastName,
          googleId,
          isEmailVerified: true,
          authProvider: hub.hasBendaAccount ? 'benda_infotech' : 'local',
          bendaLinked: hub.hasBendaAccount,
          ...(hub.photoUrl ? { avatar: hub.photoUrl } : {}),
        });
        await profileRepository.create(user._id.toString());
        void syncCandidateToTalentPool(user._id.toString());
      }
    }

    await userRepository.update(user._id.toString(), { lastLogin: new Date() });

    const tokens = this.buildTokens(user);
    await userRepository.addRefreshToken(user._id.toString(), tokens.refreshToken);

    void ensureLocalUserInCentralAuth(CENTRAL_AUTH_PRODUCTS.CAREER_TRACK, user, {
      roles: ['JOB_SEEKER'],
      products: [CENTRAL_AUTH_PRODUCTS.CAREER_TRACK],
      sourceProduct: CENTRAL_AUTH_PRODUCTS.CAREER_TRACK,
    });

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
        authProvider: 'benda_infotech',
      });
      await profileRepository.create(user._id.toString());
      void syncCandidateToTalentPool(user._id.toString());
    } else {
      await userRepository.update(user._id.toString(), {
        lastLogin: new Date(),
        bendaLinked: true,
        isEmailVerified: user.isEmailVerified || true,
        ...(dto.photoUrl && !user.avatar ? { avatar: dto.photoUrl } : {}),
      });
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

  async ssoLoginFromCentralAuth(token: string, redirect = '/dashboard') {
    const payload = await verifyCentralAuthToken(token, {
      requiredProduct: CENTRAL_AUTH_PRODUCTS.CAREER_TRACK,
    });

    const user = await this.resolveUserFromCentralPayload(payload);
    const tokens = this.buildTokens(user);
    await userRepository.addRefreshToken(user._id.toString(), tokens.refreshToken);

    return {
      success: true,
      redirect,
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

  private async resolveUserFromCentralPayload(payload: CentralAuthPayload) {
    const email = payload.email.toLowerCase().trim();
    let user = await userRepository.findByEmail(email);

    const firstName =
      payload.firstName || payload.name?.split(' ')[0] || 'User';
    const lastName =
      payload.lastName || payload.name?.split(' ').slice(1).join(' ') || '';

    if (!user) {
      user = await userRepository.create({
        email,
        password: crypto.randomBytes(32).toString('hex'),
        firstName,
        lastName,
        role: 'candidate',
        isEmailVerified: true,
        authProvider: 'benda_infotech',
      });
      await profileRepository.create(user._id.toString());
      void syncCandidateToTalentPool(user._id.toString());
    } else {
      await userRepository.update(user._id.toString(), {
        lastLogin: new Date(),
        bendaLinked: true,
        isEmailVerified: user.isEmailVerified || true,
      });
    }

    void ensureLocalUserInCentralAuth(CENTRAL_AUTH_PRODUCTS.CAREER_TRACK, user, {
      roles: payload.roles || ['JOB_SEEKER'],
      products: payload.products || [CENTRAL_AUTH_PRODUCTS.CAREER_TRACK],
      sourceProduct: CENTRAL_AUTH_PRODUCTS.CAREER_TRACK,
    });

    return user;
  }
}

export const authService = new AuthService();
