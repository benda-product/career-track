/**
 * Career Track transactional email shell — SkillCheck-format layout
 * with Career Track green palette (candidate product).
 */

export function escapeEmailHtml(value = ''): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export const CAREER_TRACK_EMAIL_BRAND = {
  product: 'Career Track',
  productBy: 'by Benda Infotech',
  fullName: 'Career Track by Benda Infotech',
  supportEmail: 'contact@bendainfotech.com',
  canvas: '#F3F7F4',
  surface: '#FFFFFF',
  ink: '#122018',
  muted: '#5B6B61',
  line: '#D7E2DA',
  tint: '#E8F3EB',
  accent: '#1F8A45',
  accentBright: '#2A9D52',
  heroFrom: '#0D1A12',
  heroTo: '#176B35',
  heroMuted: '#D6F0DE',
  footerMuted: '#8A9A90',
  ctaDefault: 'Open Career Track',
  footerNoteDefault:
    'This is a transactional message related to your Career Track (candidate) account. Please do not reply directly to this email.',
};

const b = CAREER_TRACK_EMAIL_BRAND;

export function clientBaseUrl(): string {
  return (
    process.env.CLIENT_URL ||
    process.env.CAREER_TRACK_CLIENT_URL ||
    'http://localhost:3003'
  ).replace(/\/$/, '');
}

export function greeting(name?: string): string {
  return `<p style="margin:0 0 8px;font-size:16px;line-height:1.5;color:${b.ink};">Hello ${escapeEmailHtml(name || 'there')},</p>`;
}

export function p(text: string): string {
  return `<p style="margin:0 0 20px;font-size:15px;line-height:1.65;color:${b.muted};">${text}</p>`;
}

export function heading(text: string): string {
  return `<p style="margin:0 0 8px;font-size:16px;line-height:1.4;font-weight:700;color:${b.ink};">${escapeEmailHtml(text)}</p>`;
}

export function codeBlock(code: string): string {
  return `
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;border:1px solid ${b.line};border-radius:6px;background-color:${b.tint};">
                <tr>
                  <td align="center" style="padding:22px 20px;font-family:Arial,Helvetica,sans-serif;">
                    <p style="margin:0;font-size:32px;font-weight:700;letter-spacing:8px;color:${b.ink};font-family:'Courier New',Courier,monospace;">
                      ${escapeEmailHtml(code)}
                    </p>
                  </td>
                </tr>
              </table>`;
}

export function infoCard(rowsHtml: string): string {
  return `
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 28px;border:1px solid ${b.line};border-radius:6px;background-color:${b.tint};">
                <tr>
                  <td style="padding:18px 20px;font-family:Arial,Helvetica,sans-serif;">
                    ${rowsHtml}
                  </td>
                </tr>
              </table>`;
}

export type CareerTrackEmailRenderOpts = {
  title: string;
  eyebrow?: string;
  preheader?: string;
  bodyHtml: string;
  cta?: { label: string; url: string } | null;
  footerNote?: string;
};

/** SkillCheck-format email shell for Career Track. */
export function renderCareerTrackEmail({
  title,
  eyebrow = 'Career Track',
  preheader = '',
  bodyHtml,
  cta = null,
  footerNote,
}: CareerTrackEmailRenderOpts): string {
  const baseUrl = clientBaseUrl();
  const safeTitle = escapeEmailHtml(title);
  const safeEyebrow = escapeEmailHtml(eyebrow);
  const safePreheader = escapeEmailHtml(preheader);
  const safeFooter = escapeEmailHtml(footerNote || b.footerNoteDefault);
  const support = escapeEmailHtml(b.supportEmail);
  const fullName = escapeEmailHtml(b.fullName);
  const productLine = escapeEmailHtml(`${b.product} ${b.productBy}`);

  const ctaBlock = cta?.url
    ? `
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 28px;">
                <tr>
                  <td align="center" bgcolor="${b.accent}" style="border-radius:6px;background-color:${b.accent};">
                    <a href="${escapeEmailHtml(cta.url)}" target="_blank" style="display:inline-block;padding:14px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:6px;background-color:${b.accent};">
                      ${escapeEmailHtml(cta.label || b.ctaDefault)}
                    </a>
                  </td>
                </tr>
              </table>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${safeTitle}</title>
  <!--[if mso]><style type="text/css">body,table,td{font-family:Arial,Helvetica,sans-serif!important;}</style><![endif]-->
</head>
<body style="margin:0;padding:0;background-color:${b.canvas};-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${safePreheader}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${b.canvas};margin:0;padding:0;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background-color:${b.surface};border:1px solid ${b.line};border-radius:8px;overflow:hidden;">
          <tr>
            <td align="center" style="background-color:${b.accent};background:linear-gradient(145deg,${b.heroFrom} 0%,${b.heroTo} 55%,${b.accentBright} 100%);padding:28px 32px;">
              <p style="margin:0 0 6px;font-family:Arial,Helvetica,sans-serif;font-size:13px;letter-spacing:0.14em;text-transform:uppercase;color:${b.heroMuted};font-weight:700;">
                ${safeEyebrow}
              </p>
              <h1 style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:26px;line-height:1.3;font-weight:700;color:#ffffff;">
                ${safeTitle}
              </h1>
              <p style="margin:10px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.5;color:${b.heroMuted};">
                ${productLine}
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:36px 40px 8px;font-family:Arial,Helvetica,sans-serif;color:${b.ink};">
              ${bodyHtml}
              ${ctaBlock}
              <p style="margin:0 0 8px;font-size:15px;line-height:1.65;color:${b.muted};">
                Questions? Contact us at
                <a href="mailto:${support}" style="color:${b.accent};font-weight:700;text-decoration:none;">${support}</a>
                — our team is happy to help.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 40px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="border-top:1px solid ${b.line};font-size:0;line-height:0;">&nbsp;</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:24px 40px 32px;font-family:Arial,Helvetica,sans-serif;">
              <p style="margin:0 0 6px;font-size:13px;line-height:1.5;color:${b.muted};">
                Thank you for using <strong style="color:${b.ink};">${fullName}</strong>.
              </p>
              <p style="margin:0 0 12px;font-size:13px;line-height:1.5;">
                <a href="${escapeEmailHtml(baseUrl)}" target="_blank" style="color:${b.accent};font-weight:700;text-decoration:none;">careertrack.bendainfotech.com</a>
              </p>
              <p style="margin:0;font-size:11px;line-height:1.5;color:${b.footerMuted};">
                ${safeFooter}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
