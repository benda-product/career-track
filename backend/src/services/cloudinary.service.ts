import { v2 as cloudinary } from 'cloudinary';
import { env } from '../config/env';

if (env.cloudinary.cloudName) {
  cloudinary.config({
    cloud_name: env.cloudinary.cloudName,
    api_key: env.cloudinary.apiKey,
    api_secret: env.cloudinary.apiSecret,
  });
}

export class CloudinaryService {
  static async uploadBuffer(
    buffer: Buffer,
    options: { folder: string; filename: string; mimeType?: string }
  ): Promise<{ url: string; publicId: string }> {
    const result = await cloudinary.uploader.upload(
      `data:${options.mimeType || 'application/pdf'};base64,${buffer.toString('base64')}`,
      {
        folder: options.folder,
        resource_type: 'raw',
        access_mode: 'public',
        type: 'upload',
        public_id: options.filename.endsWith('.pdf') ? options.filename : `${options.filename}.pdf`,
      }
    );
    return { url: result.secure_url, publicId: result.public_id };
  }

  static async uploadFile(
    file: string,
    folder = 'careertrack'
  ): Promise<{ url: string; publicId: string }> {
    const result = await cloudinary.uploader.upload(file, { folder });
    return { url: result.secure_url, publicId: result.public_id };
  }

  static async deleteFile(publicId: string): Promise<void> {
    await cloudinary.uploader.destroy(publicId);
  }
}
