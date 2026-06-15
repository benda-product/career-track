import { resumeBuilderService } from './resumeBuilder.service';
import { CloudinaryService } from './cloudinary.service';
import { logger } from '../utils/logger';

function isResumeBuilderEditUrl(url?: string | null): boolean {
  if (!url) return false;
  return /\/dashboard\/resumes\//i.test(url);
}

function isDirectResumeFileUrl(url?: string | null): boolean {
  if (!url || !/^https?:\/\//i.test(url)) return false;
  if (isResumeBuilderEditUrl(url)) return false;
  return (
    url.includes('res.cloudinary.com') ||
    /\.pdf(\?|$)/i.test(url) ||
    url.includes('/raw/upload/')
  );
}

/**
 * Export resume PDF from Resume Builder and upload to Cloudinary for ATS recruiters.
 */
export async function buildResumePdfUrlForAts(
  email: string,
  resumeId: string
): Promise<string | undefined> {
  if (!email || !resumeId) return undefined;

  try {
    const pdf = await resumeBuilderService.downloadPdf(email, resumeId);
    const safeEmail = email.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const { url } = await CloudinaryService.uploadBuffer(pdf, {
      folder: `careertrack/applications/${safeEmail}`,
      filename: `resume-${resumeId}-${Date.now()}.pdf`,
      mimeType: 'application/pdf',
    });
    return url;
  } catch (err) {
    logger.error('Failed to export resume PDF for ATS sync', { email, resumeId, err });
    return undefined;
  }
}

export function pickApplicationResumeUrl(pdfUrl?: string): string | undefined {
  if (pdfUrl && isDirectResumeFileUrl(pdfUrl)) return pdfUrl;
  return pdfUrl;
}
