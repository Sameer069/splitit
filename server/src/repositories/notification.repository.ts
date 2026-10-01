import { Notification, NotificationType, Prisma } from '@prisma/client';
import { prisma } from '../utils/prisma';

export class NotificationRepository {
  // Create single notification
  async createNotification(data: {
    userId: string;
    groupId: string | null;
    type: NotificationType;
    title: string;
    body: string;
    data?: Record<string, unknown>;
  }): Promise<Notification> {
    return prisma.notification.create({
      data: {
        userId: data.userId,
        groupId: data.groupId,
        type: data.type,
        title: data.title,
        body: data.body,
        data: data.data ? (data.data as Prisma.InputJsonValue) : Prisma.JsonNull,
      },
    });
  }

  // Create batch notifications
  async createBatchNotifications(
    userIds: string[],
    data: {
      groupId: string | null;
      type: NotificationType;
      title: string;
      body: string;
      data?: Record<string, unknown>;
    }
  ): Promise<Notification[]> {
    const notifications = await prisma.$transaction(
      userIds.map(userId =>
        prisma.notification.create({
          data: {
            userId,
            groupId: data.groupId,
            type: data.type,
            title: data.title,
            body: data.body,
            data: data.data ? (data.data as Prisma.InputJsonValue) : Prisma.JsonNull,
          },
        })
      )
    );

    return notifications;
  }

  // Find by ID
  async findById(id: string): Promise<Notification | null> {
    return prisma.notification.findUnique({
      where: { id },
    });
  }

  // Find by user with pagination
  async findByUserId(userId: string, page: number, limit: number) {
    const where: Prisma.NotificationWhereInput = { userId };

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.notification.count({ where }),
    ]);

    return { notifications, total };
  }

  // Get unread count
  async getUnreadCount(userId: string): Promise<number> {
    return prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });
  }

  // Mark as read
  async markAsRead(id: string): Promise<Notification> {
    return prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  // Mark all as read for user
  async markAllAsRead(userId: string): Promise<number> {
    const result = await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: { isRead: true },
    });

    return result.count;
  }

  // Delete old read notifications (maintenance)
  async deleteOldRead(daysOld: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await prisma.notification.deleteMany({
      where: {
        isRead: true,
        createdAt: { lt: cutoffDate },
      },
    });

    return result.count;
  }
}

export const notificationRepository = new NotificationRepository();
