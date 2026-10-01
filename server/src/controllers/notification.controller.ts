import { Request, Response, NextFunction } from 'express';
import { notificationService } from '../services/notification.service';
import { pushService } from '../services/push.service';
import { UnauthorizedError, ValidationError } from '../utils/errors';
import { z } from 'zod';

const registerPushTokenSchema = z.object({
  token: z.string().min(1, 'Push token is required'),
  deviceId: z.string().optional(),
});

class NotificationController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('User not authenticated');
      }

      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 20;

      const result = await notificationService.getUserNotifications(
        req.user.id,
        page,
        limit
      );

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getUnreadCount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('User not authenticated');
      }

      const count = await notificationService.getUnreadCount(req.user.id);

      res.json({ count });
    } catch (error) {
      next(error);
    }
  }

  async markAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('User not authenticated');
      }

      const { id } = req.params;
      await notificationService.markAsRead(String(id), req.user.id);

      res.json({ message: 'Notification marked as read' });
    } catch (error) {
      next(error);
    }
  }

  async markAllAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('User not authenticated');
      }

      const count = await notificationService.markAllAsRead(req.user.id);

      res.json({ message: 'All notifications marked as read', count });
    } catch (error) {
      next(error);
    }
  }

  async registerPushToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('User not authenticated');
      }

      const parsed = registerPushTokenSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ValidationError(parsed.error.errors[0].message);
      }

      const { token, deviceId } = parsed.data;
      await pushService.registerPushToken(req.user.id, token, deviceId);

      res.json({ message: 'Push token registered successfully' });
    } catch (error) {
      next(error);
    }
  }

  async unregisterPushToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token } = req.params;
      await pushService.unregisterPushToken(String(token));

      res.json({ message: 'Push token unregistered successfully' });
    } catch (error) {
      next(error);
    }
  }
}

export const notificationController = new NotificationController();
