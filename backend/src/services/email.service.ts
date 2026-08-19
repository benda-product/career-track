import nodemailer from 'nodemailer';
import { env } from '../config/env';
import { logger } from '../utils/logger';

const SMTP_CONNECTION_TIMEOUT_MS = 8000;
const SMTP_SOCKET_TIMEOUT_MS = 12000;

const resendApiKey = String(process.env.RESEND_API_KEY || '').trim();

function useResend() {
  return Boolean(resendApiKey);
}

function parseFromAddress(from: string) {
  const match = from.trim().match(/^(.+?)\s*<([^>]+)>$/);
  if (match) return { name: match[1].trim(), email: match[2].trim() };
  return { email: from.trim() };
}

function formatFrom() {
  const p = parseFromAddress(env.email.from);
  return p.name ? `${p.name} <${p.email}>` : p.email;
}

async function sendViaResend(to: string, subject: string, html: string): Promise<void> {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: formatFrom(),
      to: [to],
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(
      `Resend API failed (${response.status})${body ? `: ${body.slice(0, 240)}` : ''}`
    );
  }
}

let transporterInstance: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!transporterInstance) {
    transporterInstance = nodemailer.createTransport({
      host: env.email.host,
      port: env.email.port,
      secure: env.email.port === 465,
      connectionTimeout: SMTP_CONNECTION_TIMEOUT_MS,
      socketTimeout: SMTP_SOCKET_TIMEOUT_MS,
      ...(env.email.port === 587 ? { requireTLS: true } : {}),
      auth: { user: env.email.user, pass: env.email.pass },
    });
  }
  return transporterInstance;
}

export class EmailService {
  static async sendEmail(to: string, subject: string, html: string): Promise<void> {
    if (!env.email.user && !useResend()) {
      logger.warn('Email not configured, skipping send', { to, subject });
      return;
    }

    try {
      if (useResend()) {
        await sendViaResend(to, subject, html);
      } else {
        await getTransporter().sendMail({ from: env.email.from, to, subject, html });
      }
    } catch (err) {
      logger.error('Failed to send email', { to, subject, error: (err as Error).message });
      throw err;
    }
  }

  static async sendVerificationEmail(to: string, token: string): Promise<void> {
    const url = `${env.clientUrl}/auth/verify-email?token=${token}`;
    await this.sendEmail(
      to,
      'Verify your CareerTrack account',
      `<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;color:#1f2937">
        <h2 style="color:#2563eb">Welcome to CareerTrack!</h2>
        <p>Click the button below to verify your email address.</p>
        <p style="margin:28px 0">
          <a href="${url}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600">Verify Email</a>
        </p>
        <p style="color:#6b7280;font-size:14px">Or copy this link: ${url}</p>
      </div>`
    );
  }

  static async sendPasswordResetEmail(to: string, token: string): Promise<void> {
    const url = `${env.clientUrl}/auth/reset-password?token=${token}`;
    await this.sendEmail(
      to,
      'Reset your CareerTrack password',
      `<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;color:#1f2937">
        <h2 style="color:#2563eb">Reset your password</h2>
        <p>Click the button below to reset your CareerTrack password. This link expires in 1 hour.</p>
        <p style="margin:28px 0">
          <a href="${url}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600">Reset Password</a>
        </p>
        <p style="color:#6b7280;font-size:14px">Or copy this link: ${url}</p>
      </div>`
    );
  }
}
