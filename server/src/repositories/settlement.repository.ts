import { Settlement, Prisma } from '@prisma/client';
import { prisma } from '../utils/prisma';

export class SettlementRepository {
  // Create settlement
  async createSettlement(data: {
    groupId: string;
    fromUserId: string;
    toUserId: string;
    amount: number;
    note?: string;
  }): Promise<Settlement> {
    return prisma.settlement.create({
      data,
    });
  }

  // List settlements for a group with pagination
  async listSettlements(
    groupId: string,
    options: {
      page: number;
      limit: number;
    }
  ) {
    const where: Prisma.SettlementWhereInput = {
      groupId,
    };

    const [settlements, total] = await Promise.all([
      prisma.settlement.findMany({
        where,
        orderBy: {
          settledAt: 'desc',
        },
        skip: (options.page - 1) * options.limit,
        take: options.limit,
      }),
      prisma.settlement.count({ where }),
    ]);

    return { settlements, total };
  }

  // Get settlement by ID
  async findById(id: string) {
    return prisma.settlement.findUnique({
      where: { id },
    });
  }

  // Get user info for settlements
  async getSettlementsWithUserInfo(groupId: string, page: number, limit: number) {
    const settlements = await prisma.settlement.findMany({
      where: { groupId },
      include: {
        group: {
          include: {
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    avatarUrl: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        settledAt: 'desc',
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    const total = await prisma.settlement.count({
      where: { groupId },
    });

    return { settlements, total };
  }
}

export const settlementRepository = new SettlementRepository();
