import { NotificationType } from '@prisma/client';
import { pushTokenRepository } from '../repositories/push-token.repository';
import { env } from '../utils/env';
import { logger } from '../utils/logger';
import { getSocketService } from '../socket';

interface OneSignalNotification {
  app_id: string | undefined;
  include_player_ids: string[];
  headings: { en: string };
  contents: { en: string };
  data?: Record<string, unknown>;
}

class PushService {
  private readonly appId: string | undefined;
  private readonly restApiKey: string | undefined;

  constructor() {
    this.appId = env.ONESIGNAL_APP_ID;
    this.restApiKey = env.ONESIGNAL_REST_API_KEY;
  }

  /**
   * Send push notification via OneSignal
   * Only sends if user is NOT currently connected via Socket.io (avoid double notification)
   */
  async sendPushNotification(
    userIds: string[],
    title: string,
    body: string,
    data?: Record<string, unknown>
  ): Promise<void> {
    try {
      // Filter out users who are currently connected via Socket.io
      const socketService = getSocketService();
      const disconnectedUserIds: string[] = [];

      for (const userId of userIds) {
        const isConnected = await socketService.isUserConnected(userId);
        if (!isConnected) {
          disconnectedUserIds.push(userId);
        }
      }

      if (disconnectedUserIds.length === 0) {
        logger.debug(
          { userIds },
          'All users are connected via Socket.io, skipping push notification'
        );
        return;
      }

      // Get push tokens for disconnected users
      const tokens = await pushTokenRepository.findByUserIds(disconnectedUserIds);

      if (tokens.length === 0) {
        logger.debug(
          { disconnectedUserIds },
          'No push tokens found for disconnected users'
        );
        return;
      }

      // Prepare OneSignal notification
      const notification: OneSignalNotification = {
        app_id: this.appId,
        include_player_ids: tokens.map(t => t.token),
        headings: { en: title },
        contents: { en: body },
        data,
      };

      // Send to OneSignal
      const response = await fetch('https://onesignal.com/api/v1/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${this.restApiKey}`,
        },
        body: JSON.stringify(notification),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OneSignal API error: ${response.status} - ${errorText}`);
      }

      const result: unknown = await response.json();

      logger.info(
        {
          recipients: tokens.length,
          disconnectedUsers: disconnectedUserIds.length,
          oneSignalId: (result as any).id,
        },
        'Push notification sent via OneSignal'
      );
    } catch (error) {
      logger.error({ error, userIds }, 'Failed to send push notification');
      // Don't throw - push notifications are best-effort, shouldn't break the app
    }
  }

  /**
   * Register push token for a user
   */
  async registerPushToken(userId: string, token: string, deviceId?: string) {
    // Check if token already exists
    const existing = await pushTokenRepository.findByToken(token);

    if (existing) {
      // Token exists but might be for a different user (device switched accounts)
      if (existing.userId !== userId) {
        await pushTokenRepository.updateUserId(token, userId);
        logger.info({ token, oldUserId: existing.userId, newUserId: userId }, 'Push token reassigned');
      }
      return existing;
    }

    // Create new token
    const pushToken = await pushTokenRepository.createToken({
      userId,
      token,
      deviceId,
    });

    logger.info({ userId, token, deviceId }, 'Push token registered');

    return pushToken;
  }

  /**
   * Unregister push token
   */
  async unregisterPushToken(token: string) {
    await pushTokenRepository.deleteToken(token);
    logger.info({ token }, 'Push token unregistered');
  }

  /**
   * Clean up invalid tokens reported by OneSignal
   */
  async cleanupInvalidTokens(tokens: string[]) {
    const count = await pushTokenRepository.deleteTokens(tokens);
    logger.info({ count, tokens }, 'Cleaned up invalid push tokens');
    return count;
  }
}

export const pushService = new PushService();
