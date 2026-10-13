import { userRepository } from '../../repositories/user.repository';
import { User, type IUser } from './user.model';
import { resolveInternalSyncKey } from '../../utils/assertSecurityEnv';
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
import { backfillUserApplicationsFromAts } from '../../services/applicationBackfill.service';
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
import { verifyCareerTrackSsoToken } from '../../utils/careerTrackSso';

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
  /** Guest apply flow: create application row but require Benda password before SSO login. */
  pendingPasswordSetup?: boolean;
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

  async getApplicantAccountStatus(email: string) {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await userRepository.findByEmail(normalizedEmail);
    if (!user) {
      return { status: 'none' as const };
    }
    if (user.passwordSetupRequired && !user.bendaLinked) {
      return {
        status: 'needs_password' as const,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      };
    }
    return {
      status: 'active' as const,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    };
  }

  async completeApplicantAccount(dto: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }) {
    const normalizedEmail = dto.email.toLowerCase().trim();
    const user = await userRepository.findByEmail(normalizedEmail);
    if (!user) {
      throw new ApiError(
        404,
        'No applicant profile found for this email. Submit a job application first.'
      );
    }
    if (!user.passwordSetupRequired || user.bendaLinked) {
      throw new ApiError(409, 'Account already active. Please sign in instead.');
    }

    user.password = dto.password;
    user.passwordSetupRequired = false;
    user.bendaLinked = true;
    user.authProvider = 'local';
    user.isEmailVerified = true;
    user.firstName = dto.firstName?.trim() || user.firstName;
    user.lastName = dto.lastName?.trim() || user.lastName;
    user.lastLogin = new Date();
    await user.save();

    const tokens = this.buildTokens(user);
    await userRepository.addRefreshToken(user._id.toString(), tokens.refreshToken);

    void ensureLocalUserInCentralAuth(CENTRAL_AUTH_PRODUCTS.CAREER_TRACK, user, {
      password: dto.password,
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

  async register(dto: RegisterDto) {
    const found = await userRepository.findByEmail(dto.email);
    const existing = await dropCareerTrackUserIfHubDeleted(found);
    if (existing) {
      if (existing.passwordSetupRequired && !existing.bendaLinked) {
        throw new ApiError(
          409,
          'Finish setting your password to activate the account created from your job application.'
        );
      }
      throw new ApiError(409, 'Email already registered');
    }

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

    if (user?.passwordSetupRequired && !user.bendaLinked) {
      throw new ApiError(
        403,
        'Create your Career Track password first to finish account setup from your job application.'
      );
    }

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
    if (!user || !user.isActive || !user.refreshTokens.includes(token)) {
      throw new ApiError(401, 'Invalid refresh token');
    }

    const tokens = this.buildTokens({
      _id: user._id,
      email: user.email,
      role: payload.role === 'support' ? 'support' : user.role,
    });
    await userRepository.removeRefreshToken(user._id.toString(), token);
    await userRepository.addRefreshToken(user._id.toString(), tokens.refreshToken);

    return tokens;
  }

  async logout(refreshToken: string) {
    const user = await userRepository.findByRefreshToken(refreshToken);
    if (!user) return;
    await userRepository.removeRefreshToken(user._id.toString(), refreshToken);
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
        'Career Track is for job seekers. Use Talent by Benda Infotech for recruiter accounts.',
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
          bendaLinked: true,
          passwordSetupRequired: false,
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
    let created = false;

    if (!user) {
      created = true;
      user = await userRepository.create({
        email,
        password: crypto.randomBytes(32).toString('hex'),
        firstName: dto.firstName.trim() || 'User',
        lastName: dto.lastName.trim() || '',
        role: 'candidate',
        avatar: dto.photoUrl || undefined,
        isEmailVerified: true,
        authProvider: 'benda_infotech',
        bendaLinked: !dto.pendingPasswordSetup,
        passwordSetupRequired: Boolean(dto.pendingPasswordSetup),
      });
      await profileRepository.create(user._id.toString());
      void syncCandidateToTalentPool(user._id.toString());
    } else {
      const nextFirst = dto.firstName.trim();
      const nextLast = dto.lastName.trim();
      const storedName = `${user.firstName || ''} ${user.lastName || ''}`.trim().toLowerCase();
      const storedIsPlaceholder =
        !user.firstName?.trim() ||
        user.firstName.trim().toLowerCase() === 'user' ||
        storedName === 'user user' ||
        storedName === 'user account';
      const incomingIsReal = Boolean(nextFirst) && nextFirst.toLowerCase() !== 'user';
      await userRepository.update(user._id.toString(), {
        lastLogin: new Date(),
        bendaLinked: user.bendaLinked || !dto.pendingPasswordSetup,
        isEmailVerified: user.isEmailVerified || true,
        ...(dto.photoUrl && !user.avatar ? { avatar: dto.photoUrl } : {}),
        ...(storedIsPlaceholder && incomingIsReal
          ? {
              firstName: nextFirst,
              lastName: nextLast.toLowerCase() === 'user' || nextLast.toLowerCase() === 'account' ? '' : nextLast,
            }
          : {}),
      });
    }

    const tokens = this.buildTokens(user);
    if (!dto.pendingPasswordSetup || !created) {
      await userRepository.addRefreshToken(user._id.toString(), tokens.refreshToken);
    }

    return {
      created,
      passwordSetupRequired: Boolean(user.passwordSetupRequired),
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

  async ssoLogin(token: string, redirect = '/dashboard') {
    try {
      return await this.ssoLoginFromCentralAuth(token, redirect);
    } catch (error) {
      if (!(error instanceof ApiError) || error.statusCode !== 401) {
        throw error;
      }
      return this.ssoLoginFromCareerTrackSso(token, redirect);
    }
  }

  async ssoLoginFromCentralAuth(token: string, redirect = '/dashboard') {
    const payload = await verifyCentralAuthToken(token, {
      requiredProduct: CENTRAL_AUTH_PRODUCTS.CAREER_TRACK,
    });

    const user = await this.resolveUserFromCentralPayload(payload);
    const tokens = this.buildTokens(user);
    await userRepository.addRefreshToken(user._id.toString(), tokens.refreshToken);
    const safeRedirect =
      user.role === 'support'
        ? '/support-desk'
        : user.role === 'admin' && (!redirect || redirect === '/dashboard')
          ? '/admin'
          : redirect;

    return {
      success: true,
      redirect: safeRedirect,
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

  async ssoLoginFromCareerTrackSso(token: string, redirect = '/dashboard') {
    const payload = verifyCareerTrackSsoToken(token);
    const email = payload.email.toLowerCase().trim();
    let user = payload.userId ? await userRepository.findById(payload.userId) : null;

    if (!user || user.email.toLowerCase() !== email) {
      user = await userRepository.findByEmail(email);
    }

    if (!user) {
      const parts = splitDisplayName(payload.name || email.split('@')[0]);
      user = await userRepository.create({
        email,
        password: crypto.randomBytes(32).toString('hex'),
        firstName: parts.firstName,
        lastName: parts.lastName,
        role: 'candidate',
        isEmailVerified: true,
        authProvider: 'benda_infotech',
        passwordSetupRequired: true,
        bendaLinked: false,
      });
      await profileRepository.create(user._id.toString());
      void syncCandidateToTalentPool(user._id.toString());
    } else {
      await userRepository.update(user._id.toString(), { lastLogin: new Date() });
    }

    if (user.passwordSetupRequired && !user.bendaLinked) {
      throw new ApiError(
        403,
        'Finish creating your Benda Infotech password before opening Career Track.'
      );
    }

    void backfillUserApplicationsFromAts(
      user._id.toString(),
      user.email,
      `${user.firstName || ''} ${user.lastName || ''}`.trim()
    );

    const tokens = this.buildTokens(user);
    await userRepository.addRefreshToken(user._id.toString(), tokens.refreshToken);

    return {
      success: true,
      redirect: payload.targetPath || redirect,
      returnUrl: payload.returnUrl,
      sourceApp: payload.sourceApp,
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

  async lookupSupportAccount(email: string) {
    const normalized = String(email || '').toLowerCase().trim();
    if (!normalized) {
      throw new ApiError(400, 'Email is required.');
    }
    const user = await userRepository.findByEmail(normalized);
    if (!user || user.role === 'support') {
      return { found: false };
    }
    return {
      found: true,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive,
      isEmailVerified: user.isEmailVerified,
      lastLogin: user.lastLogin || null,
    };
  }

  private async resolveSupportUser(email: string, firstName: string, lastName: string) {
    const existing = await userRepository.findByEmail(email);
    if (!existing) {
      return userRepository.create({
        email,
        password: crypto.randomBytes(32).toString('hex'),
        firstName,
        lastName,
        role: 'support',
        isEmailVerified: true,
        authProvider: 'benda_infotech',
        bendaLinked: true,
        isActive: true,
      });
    }

    if (!existing.isActive) {
      throw new ApiError(403, 'This support account is deactivated.');
    }

    // The stored customer role stays as it is. This sign-in is only a support session.
    await userRepository.update(existing._id.toString(), { lastLogin: new Date() });
    return {
      _id: existing._id,
      email: existing.email,
      firstName: existing.firstName || firstName,
      lastName: existing.lastName || lastName,
      role: 'support' as const,
      isEmailVerified: true,
    };
  }

  private async resolveAssignedApplicationRole(
    email: string,
    firstName: string,
    lastName: string,
    role: 'candidate' | 'admin' | 'support'
  ) {
    let user = await userRepository.findByEmail(email);
    if (!user) {
      user = await userRepository.create({
        email,
        password: crypto.randomBytes(32).toString('hex'),
        firstName,
        lastName,
        role,
        isEmailVerified: true,
        authProvider: 'benda_infotech',
      });
      await profileRepository.create(user._id.toString());
      if (role === 'candidate') void syncCandidateToTalentPool(user._id.toString());
      return user;
    }
    if (!user.isActive) {
      throw new ApiError(403, 'This account is deactivated.');
    }
    const updates: Record<string, unknown> = { lastLogin: new Date(), bendaLinked: true };
    if (user.role !== role) updates.role = role;
    await userRepository.update(user._id.toString(), updates);
    user.role = role;
    if (role === 'candidate') void syncCandidateToTalentPool(user._id.toString());
    return user;
  }

  private async resolveUserFromCentralPayload(payload: CentralAuthPayload) {
    const email = payload.email.toLowerCase().trim();
    const hubRoles = payload.roles || [];
    const supportOnly =
      hubRoles.includes('SUPPORT') &&
      !hubRoles.includes('ADMIN') &&
      !hubRoles.includes('MANAGER') &&
      !hubRoles.includes('RECRUITER') &&
      !hubRoles.includes('BUSINESS');
    const firstName =
      payload.firstName || payload.name?.split(' ')[0] || 'User';
    const lastName =
      payload.lastName || payload.name?.split(' ').slice(1).join(' ') || '';

    const isHubAdmin =
      hubRoles.includes('ADMIN') || hubRoles.includes('MANAGER');

    if (!isHubAdmin && payload.applicationRoles?.configured) {
      const assigned = payload.applicationRoles.CAREER_TRACK || 'none';
      if (assigned === 'none') {
        throw new ApiError(403, 'Career Track access is not assigned.');
      }
      if (assigned !== 'candidate' && assigned !== 'admin' && assigned !== 'support') {
        throw new ApiError(403, 'This Career Track role is not available.');
      }
      return this.resolveAssignedApplicationRole(email, firstName, lastName || 'User', assigned);
    }

    if (supportOnly) {
      if (payload.supportAccess?.CAREER_TRACK !== 'support') {
        throw new ApiError(403, 'Career Track support access is not assigned.');
      }
      return this.resolveSupportUser(email, firstName, lastName || 'Support');
    }

    let user = await userRepository.findByEmail(email);

    if (!user) {
      user = await userRepository.create({
        email,
        password: crypto.randomBytes(32).toString('hex'),
        firstName,
        lastName,
        role: isHubAdmin ? 'admin' : 'candidate',
        isEmailVerified: true,
        authProvider: 'benda_infotech',
      });
      await profileRepository.create(user._id.toString());
      void syncCandidateToTalentPool(user._id.toString());
    } else {
      const updates: Record<string, unknown> = {
        lastLogin: new Date(),
        bendaLinked: true,
        isEmailVerified: user.isEmailVerified || true,
      };
      if (isHubAdmin && user.role !== 'admin') {
        updates.role = 'admin';
      }
      await userRepository.update(user._id.toString(), updates);
      if (isHubAdmin && user.role !== 'admin') {
        user.role = 'admin';
      }
    }

    void ensureLocalUserInCentralAuth(CENTRAL_AUTH_PRODUCTS.CAREER_TRACK, user, {
      roles: payload.roles || ['JOB_SEEKER'],
      products: payload.products || [CENTRAL_AUTH_PRODUCTS.CAREER_TRACK],
      sourceProduct: CENTRAL_AUTH_PRODUCTS.CAREER_TRACK,
    });

    void backfillUserApplicationsFromAts(
      user._id.toString(),
      user.email,
      `${user.firstName || ''} ${user.lastName || ''}`.trim()
    );

    return user;
  }
}

async function hubAccountExists(email: string) {
  const bases = [
    ...new Set(
      [process.env.BENDA_API_URL, process.env.BENDA_INFOTECH_API_URL, 'http://localhost:5004/api']
        .map((value) => String(value || '').replace(/\/$/, ''))
        .filter(Boolean)
    ),
  ];
  for (const base of bases) {
    try {
      const response = await fetch(
        `${base}/internal/account-exists?email=${encodeURIComponent(email)}`,
        {
          headers: { 'x-benda-key': resolveInternalSyncKey() },
          signal: AbortSignal.timeout(2500),
        }
      );
      if (!response.ok) continue;
      const payload = (await response.json().catch(() => ({}))) as { data?: { exists?: boolean } };
      return Boolean(payload?.data?.exists);
    } catch {
      continue;
    }
  }
  return null;
}

async function dropCareerTrackUserIfHubDeleted(user: IUser | null) {
  if (!user) return user;
  const email = String(user.email || '').toLowerCase().trim();
  if (!email) return user;
  const onHub = await hubAccountExists(email);
  if (onHub !== false) return user;
  await User.deleteOne({ _id: user._id });
  return null;
}

export const authService = new AuthService();
