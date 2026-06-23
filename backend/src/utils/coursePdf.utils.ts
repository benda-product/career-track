import { v2 as cloudinary } from 'cloudinary';
import { env } from '../config/env';
import { ApiError } from '../utils/apiError';

function ensureCloudinaryConfigured() {
  if (!env.cloudinary.cloudName || !env.cloudinary.apiKey || !env.cloudinary.apiSecret) {
    return false;
  }

  cloudinary.config({
    cloud_name: env.cloudinary.cloudName,
    api_key: env.cloudinary.apiKey,
    api_secret: env.cloudinary.apiSecret,
  });

  return true;
}

export function parseCloudinaryPublicId(fileUrl?: string | null) {
  if (!fileUrl?.includes('res.cloudinary.com')) return null;
  const match = String(fileUrl).match(/\/(?:image|raw)\/upload\/(?:s--[^/]+--\/)?v\d+\/(.+?)(?:\?|$)/);
  return match?.[1] || null;
}

export function getCoursePdfSignedUrl(publicId: string) {
  if (!ensureCloudinaryConfigured() || !publicId) {
    return null;
  }

  return cloudinary.utils.private_download_url(publicId, '', {
    resource_type: 'raw',
    type: 'upload',
    expires_at: Math.floor(Date.now() / 1000) + 3600,
  });
}

export function resolveCoursePdfUrl(pdfUrl?: string | null) {
  const publicId = parseCloudinaryPublicId(pdfUrl);
  if (!publicId) {
    throw new ApiError(404, 'Course PDF is not available yet.');
  }

  const url = getCoursePdfSignedUrl(publicId);
  if (!url) {
    throw new ApiError(502, 'Cloudinary is not configured.');
  }

  return url;
}
