import { PushToken } from '@prisma/client';
import { prisma } from '../utils/prisma';

export class PushTokenRepository {
  // Create token
  async createToken(data: {
    userId: string;
    token: string;
    deviceId?: string;
  }): Promise<PushToken> {
    return prisma.pushToken.create({
      data,
    });
  }

  // Find by token
  async findByToken(token: string): Promise<PushToken | null> {
    return prisma.pushToken.findUnique({
      where: { token },
    });
  }

  // Find by user ID
  async findByUserId(userId: string): Promise<PushToken[]> {
    return prisma.pushToken.findMany({
      where: { userId },
    });
  }

  // Find by multiple user IDs
  async findByUserIds(userIds: string[]): Promise<PushToken[]> {
    return prisma.pushToken.findMany({
      where: {
        userId: { in: userIds },
      },
    });
  }

  // Update user ID for a token (device switched accounts)
  async updateUserId(token: string, userId: string): Promise<PushToken> {
    return prisma.pushToken.update({
      where: { token },
      data: { userId },
    });
  }

  // Delete token
  async deleteToken(token: string): Promise<void> {
    await prisma.pushToken.delete({
      where: { token },
    });
  }

  // Delete multiple tokens
  async deleteTokens(tokens: string[]): Promise<number> {
    const result = await prisma.pushToken.deleteMany({
      where: {
        token: { in: tokens },
      },
    });
    return result.count;
  }

  // Delete all tokens for a user
  async deleteAllForUser(userId: string): Promise<number> {
    const result = await prisma.pushToken.deleteMany({
      where: { userId },
    });
    return result.count;
  }
}

export const pushTokenRepository = new PushTokenRepository();
