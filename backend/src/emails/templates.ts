/**
 * Career Track transactional email templates + admin preview catalog.
 * Layout matches SkillCheck format (branded hero card + footer).
 */

import {
  CAREER_TRACK_EMAIL_BRAND,
  clientBaseUrl,
  escapeEmailHtml,
  greeting,
  p,
  renderCareerTrackEmail,
} from './layout';

const b = CAREER_TRACK_EMAIL_BRAND;

export type BuiltEmail = {
  subject: string;
  text: string;
  html: string;
  fromCategory: 'general' | 'account' | 'billing' | 'security' | 'support';
};

export function buildVerificationEmail({
  firstName = 'Alex',
  verifyUrl = `${clientBaseUrl()}/auth/verify-email?token=sample`,
}: { firstName?: string; verifyUrl?: string } = {}): BuiltEmail {
  const subject = 'Verify your Career Track account';
  const text = [
    `Hi ${firstName || 'there'},`,
    '',
    'Welcome to Career Track. Click the link below to verify your email address.',
    verifyUrl,
    '',
    'If you did not create this account, you can ignore this email.',
  ].join('\n');
  const html = renderCareerTrackEmail({
    title: 'Welcome aboard',
    eyebrow: 'Account',
    preheader: 'Verify your email to finish setting up Career Track.',
    bodyHtml: [
      greeting(firstName),
      p(
        'Thank you for creating your Career Track account. Confirm your email to start exploring jobs, building your profile, and tracking applications.'
      ),
      p(
        `Or copy this link:<br><span style="word-break:break-all;font-size:13px;color:${b.muted};">${escapeEmailHtml(verifyUrl)}</span>`
      ),
    ].join(''),
    cta: { label: 'Verify email', url: verifyUrl },
  });
  return { subject, text, html, fromCategory: 'account' };
}

export function buildPasswordResetEmail({
  firstName = 'Alex',
  resetUrl = `${clientBaseUrl()}/auth/reset-password?token=sample`,
}: { firstName?: string; resetUrl?: string } = {}): BuiltEmail {
  const subject = 'Reset your Career Track password';
  const text = [
    `Hi ${firstName || 'there'},`,
    '',
    'Reset your Career Track password using this link (expires in 1 hour):',
    resetUrl,
    '',
    'If you did not request a reset, you can ignore this email.',
  ].join('\n');
  const html = renderCareerTrackEmail({
    title: 'Reset your password',
    eyebrow: 'Security',
    preheader: 'Reset your Career Track password. This link expires in 1 hour.',
    bodyHtml: [
      greeting(firstName),
      p(
        'We received a request to reset the password for your Career Track account. Use the button below to choose a new password.'
      ),
      p(
        `Or copy this link:<br><span style="word-break:break-all;font-size:13px;color:${b.muted};">${escapeEmailHtml(resetUrl)}</span>`
      ),
      p(
        'This link expires in <strong style="color:#122018;">1 hour</strong>. If you did not request a reset, you can ignore this email.'
      ),
    ].join(''),
    cta: { label: 'Reset password', url: resetUrl },
  });
  return { subject, text, html, fromCategory: 'security' };
}

type PreviewDef = {
  id: string;
  area: string;
  name: string;
  build: () => BuiltEmail;
};

const EMAIL_PREVIEW_CATALOG: PreviewDef[] = [
  {
    id: 'verify-email',
    area: 'Account',
    name: 'Email verification',
    build: () => buildVerificationEmail(),
  },
  {
    id: 'password-reset',
    area: 'Security',
    name: 'Password reset',
    build: () => buildPasswordResetEmail(),
  },
];

export function listEmailPreviews() {
  return EMAIL_PREVIEW_CATALOG.map((item) => {
    const built = item.build();
    return {
      id: item.id,
      area: item.area,
      name: item.name,
      subject: built.subject,
      fromCategory: built.fromCategory,
      brand: CAREER_TRACK_EMAIL_BRAND.fullName,
    };
  });
}

export function getEmailPreview(id: string) {
  const item = EMAIL_PREVIEW_CATALOG.find((entry) => entry.id === id);
  if (!item) return null;
  const built = item.build();
  return {
    id: item.id,
    area: item.area,
    name: item.name,
    subject: built.subject,
    fromCategory: built.fromCategory,
    brand: CAREER_TRACK_EMAIL_BRAND.fullName,
    text: built.text,
    html: built.html,
  };
}
