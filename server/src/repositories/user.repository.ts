import { User } from '@prisma/client';
import { prisma } from '../utils/prisma';

export class UserRepository {
  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  async updateProfile(
    id: string,
    data: {
      name?: string;
      avatarUrl?: string | null;
    }
  ): Promise<User> {
    return prisma.user.update({
      where: { id },
      data,
    });
  }

  async getUserGroups(userId: string) {
    return prisma.groupMember.findMany({
      where: { userId },
      include: {
        group: {
          include: {
            _count: {
              select: {
                members: true,
                expenses: true,
              },
            },
          },
        },
      },
      orderBy: {
        joinedAt: 'desc',
      },
    });
  }
}

export const userRepository = new UserRepository();
