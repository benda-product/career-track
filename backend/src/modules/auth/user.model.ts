import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import { UserRole } from '../../types';

export interface IUser extends Document {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  avatar?: string;
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  googleId?: string;
  refreshTokens: string[];
  lastLogin?: Date;
  isActive: boolean;
  authProvider?: 'local' | 'benda_infotech';
  bendaLinked?: boolean;
  subscriptionPlan?: 'free' | 'pro';
  paypalSubscriptionId?: string;
  subscriptionCurrentPeriodEnd?: Date;
  subscriptionCancelAtPeriodEnd?: boolean;
  coachingCreditsRemaining?: number;
  coachingCreditsPeriod?: string;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 8, select: false },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    role: { type: String, enum: ['candidate', 'admin'], default: 'candidate' },
    avatar: String,
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationToken: String,
    emailVerificationExpires: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    googleId: String,
    refreshTokens: [{ type: String }],
    lastLogin: Date,
    isActive: { type: Boolean, default: true },
    authProvider: { type: String, enum: ['local', 'benda_infotech'], default: 'local' },
    bendaLinked: { type: Boolean, default: false },
    subscriptionPlan: { type: String, enum: ['free', 'pro'], default: 'free' },
    paypalSubscriptionId: String,
    subscriptionCurrentPeriodEnd: Date,
    subscriptionCancelAtPeriodEnd: { type: Boolean, default: false },
    coachingCreditsRemaining: { type: Number, default: 0 },
    coachingCreditsPeriod: String,
  },
  { timestamps: true }
);

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.index({ email: 1 });
userSchema.index({ googleId: 1 });

export const User = mongoose.model<IUser>('User', userSchema);
