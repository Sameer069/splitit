import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '../utils/env';
import { logger } from '../utils/logger';
import crypto from 'crypto';

class StorageService {
  private s3Client: S3Client | null = null;
  private bucket: string;

  constructor() {
    this.bucket = env.S3_BUCKET;

    if (env.S3_ENDPOINT && env.S3_ACCESS_KEY_ID && env.S3_SECRET_ACCESS_KEY) {
      this.s3Client = new S3Client({
        endpoint: env.S3_ENDPOINT,
        region: env.S3_REGION,
        credentials: {
          accessKeyId: env.S3_ACCESS_KEY_ID,
          secretAccessKey: env.S3_SECRET_ACCESS_KEY,
        },
      });
      logger.info('Storage service initialized with S3-compatible storage');
    } else {
      logger.warn('Storage service not configured - receipt uploads will not work');
    }
  }

  /**
   * Generate a pre-signed upload URL for the client to upload directly to S3
   * This avoids the file passing through the server
   */
  async getUploadUrl(
    userId: string,
    fileName: string,
    contentType: string
  ): Promise<{ uploadUrl: string; fileUrl: string; key: string }> {
    if (!this.s3Client) {
      throw new Error('Storage service not configured');
    }

    // Generate unique key
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const key = `receipts/${userId}/${timestamp}-${randomString}-${sanitizedFileName}`;

    // Generate pre-signed upload URL (expires in 10 minutes)
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(this.s3Client, command, { expiresIn: 600 });

    // Construct public file URL
    const fileUrl = env.S3_PUBLIC_URL
      ? `${env.S3_PUBLIC_URL}/${key}`
      : `${env.S3_ENDPOINT}/${this.bucket}/${key}`;

    logger.info({ userId, key }, 'Generated upload URL');

    return { uploadUrl, fileUrl, key };
  }

  /**
   * Delete a file from S3
   */
  async deleteFile(key: string): Promise<void> {
    if (!this.s3Client) {
      logger.warn('Storage service not configured - cannot delete file');
      return;
    }

    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      await this.s3Client.send(command);
      logger.info({ key }, 'File deleted from storage');
    } catch (error) {
      logger.error({ error, key }, 'Failed to delete file from storage');
      throw error;
    }
  }

  /**
   * Extract key from full URL
   */
  extractKeyFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      // Handle different URL formats
      if (urlObj.pathname.startsWith(`/${this.bucket}/`)) {
        return urlObj.pathname.substring(`/${this.bucket}/`.length);
      }
      return urlObj.pathname.substring(1); // Remove leading slash
    } catch {
      return null;
    }
  }
}

export const storageService = new StorageService();
