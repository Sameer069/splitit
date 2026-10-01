import { NotificationType } from '@prisma/client';
import { notificationRepository } from '../repositories/notification.repository';
import { NotFoundError } from '../utils/errors';
import { logger } from '../utils/logger';
import { SocketEvents } from '../socket/events';
import { getSocketService } from '../socket';

class NotificationService {
  /**
   * Create in-app notification
   */
  async createNotification(data: {
    userId: string;
    groupId: string | null;
    type: NotificationType;
    title: string;
    body: string;
    data?: Record<string, unknown>;
  }) {
    const notification = await notificationRepository.createNotification(data);

    logger.info(
      { notificationId: notification.id, userId: data.userId, type: data.type },
      'Notification created'
    );

    // Emit real-time event
    SocketEvents.notificationCreated(data.userId, {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      body: notification.body,
      data: notification.data,
      isRead: notification.isRead,
      createdAt: notification.createdAt,
    });

    return notification;
  }

  /**
   * Create notifications for multiple users (batch)
   */
  async createBatchNotifications(
    userIds: string[],
    data: {
      groupId: string | null;
      type: NotificationType;
      title: string;
      body: string;
      data?: Record<string, unknown>;
    }
  ) {
    const notifications = await notificationRepository.createBatchNotifications(
      userIds,
      data
    );

    logger.info(
      { count: notifications.length, type: data.type },
      'Batch notifications created'
    );

    // Emit real-time events
    const notificationData = notifications.map(n => ({
      id: n.id,
      type: n.type,
      title: n.title,
      body: n.body,
      data: n.data,
      isRead: n.isRead,
      createdAt: n.createdAt,
    }));

    userIds.forEach((userId, index) => {
      SocketEvents.notificationCreated(userId, notificationData[index]);
    });

    return notifications;
  }

  /**
   * Get user notifications with pagination
   */
  async getUserNotifications(userId: string, page: number = 1, limit: number = 20) {
    const { notifications, total } = await notificationRepository.findByUserId(
      userId,
      page,
      limit
    );

    return {
      notifications: notifications.map(n => ({
        id: n.id,
        type: n.type,
        title: n.title,
        body: n.body,
        data: n.data,
        groupId: n.groupId,
        isRead: n.isRead,
        createdAt: n.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get unread count for user
   */
  async getUnreadCount(userId: string): Promise<number> {
    return notificationRepository.getUnreadCount(userId);
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string) {
    const notification = await notificationRepository.findById(notificationId);

    if (!notification) {
      throw new NotFoundError('Notification not found');
    }

    if (notification.userId !== userId) {
      throw new NotFoundError('Notification not found');
    }

    await notificationRepository.markAsRead(notificationId);

    logger.debug({ notificationId, userId }, 'Notification marked as read');
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string) {
    const count = await notificationRepository.markAllAsRead(userId);

    logger.info({ userId, count }, 'All notifications marked as read');

    return count;
  }

  /**
   * Delete old read notifications (maintenance)
   */
  async deleteOldReadNotifications(daysOld: number = 30) {
    const count = await notificationRepository.deleteOldRead(daysOld);

    logger.info({ count, daysOld }, 'Deleted old read notifications');

    return count;
  }
}

export const notificationService = new NotificationService();
