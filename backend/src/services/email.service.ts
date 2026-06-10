import nodemailer from 'nodemailer';
import { env } from '../config/env';
import { logger } from '../utils/logger';

const transporter = nodemailer.createTransport({
  host: env.email.host,
  port: env.email.port,
  secure: false,
  auth: { user: env.email.user, pass: env.email.pass },
});

export class EmailService {
  static async sendEmail(to: string, subject: string, html: string): Promise<void> {
    if (!env.email.user) {
      logger.warn('Email not configured, skipping send', { to, subject });
      return;
    }
    await transporter.sendMail({ from: env.email.from, to, subject, html });
  }

  static async sendVerificationEmail(to: string, token: string): Promise<void> {
    const url = `${env.clientUrl}/auth/verify-email?token=${token}`;
    await this.sendEmail(
      to,
      'Verify your CareerTrack account',
      `<h2>Welcome to CareerTrack!</h2><p>Click <a href="${url}">here</a> to verify your email.</p>`
    );
  }

  static async sendPasswordResetEmail(to: string, token: string): Promise<void> {
    const url = `${env.clientUrl}/auth/reset-password?token=${token}`;
    await this.sendEmail(
      to,
      'Reset your CareerTrack password',
      `<h2>Password Reset</h2><p>Click <a href="${url}">here</a> to reset your password. Link expires in 1 hour.</p>`
    );
  }
}
