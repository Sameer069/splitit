import { Request, Response, NextFunction } from 'express';
import { storageService } from '../services/storage.service';
import { UnauthorizedError, ValidationError } from '../utils/errors';
import { z } from 'zod';

const getUploadUrlSchema = z.object({
  fileName: z.string().min(1, 'File name is required').max(255),
  contentType: z
    .string()
    .regex(/^image\/(jpeg|jpg|png|gif|webp)$/, 'Only image files are allowed'),
});

class UploadController {
  async getUploadUrl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('User not authenticated');
      }

      const parsed = getUploadUrlSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ValidationError(parsed.error.errors[0].message);
      }

      const { fileName, contentType } = parsed.data;
      const result = await storageService.getUploadUrl(req.user.id, fileName, contentType);

      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

export const uploadController = new UploadController();
