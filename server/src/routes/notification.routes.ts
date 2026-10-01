import { Router } from 'express';
import { notificationController } from '../controllers/notification.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All notification routes require authentication
router.use(authenticate);

/**
 * GET /api/notifications
 * Get paginated list of notifications for current user
 * Query params: page, limit
 */
router.get('/', notificationController.list);

/**
 * GET /api/notifications/unread-count
 * Get unread notification count for current user
 */
router.get('/unread-count', notificationController.getUnreadCount);

/**
 * PATCH /api/notifications/:id/read
 * Mark a specific notification as read
 */
router.patch('/:id/read', notificationController.markAsRead);

/**
 * PATCH /api/notifications/read-all
 * Mark all notifications as read for current user
 */
router.patch('/read-all', notificationController.markAllAsRead);

/**
 * POST /api/push-tokens
 * Register a push notification token (OneSignal subscription ID)
 */
router.post('/push-tokens', notificationController.registerPushToken);

/**
 * DELETE /api/push-tokens/:token
 * Unregister a push notification token
 */
router.delete('/push-tokens/:token', notificationController.unregisterPushToken);

export default router;
