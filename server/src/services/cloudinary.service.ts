import { v2 as cloudinary } from 'cloudinary';
import { env } from '../utils/env';
import { logger } from '../utils/logger';

class CloudinaryService {
  private isConfigured: boolean = false;

  constructor() {
    if (
      env.CLOUDINARY_CLOUD_NAME &&
      env.CLOUDINARY_API_KEY &&
      env.CLOUDINARY_API_SECRET
    ) {
      cloudinary.config({
        cloud_name: env.CLOUDINARY_CLOUD_NAME,
        api_key: env.CLOUDINARY_API_KEY,
        api_secret: env.CLOUDINARY_API_SECRET,
      });
      this.isConfigured = true;
      logger.info('Cloudinary service initialized');
    } else {
      logger.warn('Cloudinary service not configured - receipt uploads will not work');
    }
  }

  /**
   * Generate an upload signature for client-side uploads
   * This allows the mobile/web app to upload directly to Cloudinary
   */
  async generateUploadSignature(userId: string): Promise<{
    signature: string;
    timestamp: number;
    cloudName: string;
    apiKey: string;
    uploadPreset?: string;
    folder: string;
  }> {
    if (!this.isConfigured) {
      throw new Error('Cloudinary service not configured');
    }

    const timestamp = Math.round(new Date().getTime() / 1000);
    const folder = `splitit/receipts/${userId}`;
    
    // Parameters to sign
    const params: Record<string, string | number> = {
      timestamp,
      folder,
    };

    // Add upload preset if configured (recommended for unsigned uploads)
    if (env.CLOUDINARY_UPLOAD_PRESET) {
      params.upload_preset = env.CLOUDINARY_UPLOAD_PRESET;
    }

    // Generate signature
    const signature = cloudinary.utils.api_sign_request(
      params,
      env.CLOUDINARY_API_SECRET!
    );

    logger.info({ userId, folder }, 'Generated Cloudinary upload signature');

    return {
      signature,
      timestamp,
      cloudName: env.CLOUDINARY_CLOUD_NAME!,
      apiKey: env.CLOUDINARY_API_KEY!,
      uploadPreset: env.CLOUDINARY_UPLOAD_PRESET,
      folder,
    };
  }

  /**
   * Delete a file from Cloudinary
   * @param publicId - The public ID of the image (e.g., "splitit/receipts/user-id/filename")
   */
  async deleteFile(publicId: string): Promise<void> {
    if (!this.isConfigured) {
      logger.warn('Cloudinary service not configured - cannot delete file');
      return;
    }

    try {
      await cloudinary.uploader.destroy(publicId);
      logger.info({ publicId }, 'File deleted from Cloudinary');
    } catch (error) {
      logger.error({ error, publicId }, 'Failed to delete file from Cloudinary');
      throw error;
    }
  }

  /**
   * Extract public ID from Cloudinary URL
   * Example: https://res.cloudinary.com/demo/image/upload/v1234567890/splitit/receipts/user-id/file.jpg
   * Returns: splitit/receipts/user-id/file
   */
  extractPublicId(url: string): string | null {
    try {
      const matches = url.match(/\/v\d+\/(.+)\.\w+$/);
      return matches ? matches[1] : null;
    } catch (error) {
      logger.error({ error, url }, 'Failed to extract public ID from URL');
      return null;
    }
  }
}

export const cloudinaryService = new CloudinaryService();
