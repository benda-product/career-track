import nodemailer from 'nodemailer';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { buildPasswordResetEmail, buildVerificationEmail } from '../emails/templates';

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

function formatFrom(fromValue: string) {
  const p = parseFromAddress(fromValue);
  return p.name ? `${p.name} <${p.email}>` : p.email;
}

function fromForCategory(fromCategory: 'general' | 'account' | 'billing' | 'security' | 'support' = 'general') {
  switch (fromCategory) {
    case 'account':
      return env.email.fromAccount || env.email.from;
    case 'billing':
      return env.email.fromBilling || env.email.from;
    case 'security':
      return env.email.fromSecurity || env.email.from;
    case 'support':
      return env.email.fromSupport || env.email.from;
    case 'general':
    default:
      return env.email.fromGeneral || env.email.from;
  }
}

async function sendViaResend(to: string, subject: string, html: string, fromValue: string): Promise<void> {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: formatFrom(fromValue),
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
  static async sendEmail(
    to: string,
    subject: string,
    html: string,
    fromCategory: 'general' | 'account' | 'billing' | 'security' | 'support' = 'general'
  ): Promise<void> {
    if (!env.email.user && !useResend()) {
      logger.warn('Email not configured, skipping send', { to, subject });
      return;
    }

    try {
      const fromValue = fromForCategory(fromCategory);
      if (useResend()) {
        await sendViaResend(to, subject, html, fromValue);
      } else {
        await getTransporter().sendMail({ from: fromValue, to, subject, html });
      }
    } catch (err) {
      logger.error('Failed to send email', { to, subject, error: (err as Error).message });
      throw err;
    }
  }

  static async sendVerificationEmail(to: string, token: string, firstName?: string): Promise<void> {
    const verifyUrl = `${env.clientUrl}/auth/verify-email?token=${token}`;
    const { subject, html, fromCategory } = buildVerificationEmail({ firstName, verifyUrl });
    await this.sendEmail(to, subject, html, fromCategory);
  }

  static async sendPasswordResetEmail(to: string, token: string, firstName?: string): Promise<void> {
    const resetUrl = `${env.clientUrl}/auth/reset-password?token=${token}`;
    const { subject, html, fromCategory } = buildPasswordResetEmail({ firstName, resetUrl });
    await this.sendEmail(to, subject, html, fromCategory);
  }
}
