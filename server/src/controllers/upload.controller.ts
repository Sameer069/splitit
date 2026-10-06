import { Request, Response, NextFunction } from 'express';
import { cloudinaryService } from '../services/cloudinary.service';
import { UnauthorizedError } from '../utils/errors';

class UploadController {
  async getUploadUrl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('User not authenticated');
      }

      const uploadConfig = await cloudinaryService.generateUploadSignature(req.user.id);

      res.json(uploadConfig);
    } catch (error) {
      next(error);
    }
  }
}

export const uploadController = new UploadController();
