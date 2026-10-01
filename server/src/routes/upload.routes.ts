import { Router } from 'express';
import { uploadController } from '../controllers/upload.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

/**
 * POST /api/upload/presigned-url
 * Get a pre-signed URL for uploading a receipt image
 * Client uploads directly to S3, then uses the returned fileUrl in expense creation
 */
router.post('/presigned-url', authenticate, uploadController.getUploadUrl);

export default router;
