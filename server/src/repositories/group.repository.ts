import { Group, GroupMember, Role } from '@prisma/client';
import { prisma } from '../utils/prisma';

export class GroupRepository {
  // Create group with owner membership
  async createGroup(name: string, ownerId: string): Promise<Group> {
    return prisma.group.create({
      data: {
        name,
        createdById: ownerId,
        members: {
          create: {
            userId: ownerId,
            role: Role.OWNER,
          },
        },
      },
    });
  }

  // Find group by ID
  async findById(id: string) {
    return prisma.group.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: {
            joinedAt: 'asc',
          },
        },
        _count: {
          select: {
            members: true,
            expenses: true,
          },
        },
      },
    });
  }

  // Update group name
  async updateGroup(id: string, name: string): Promise<Group> {
    return prisma.group.update({
      where: { id },
      data: { name },
    });
  }

  // Delete group (cascade handled by Prisma)
  async deleteGroup(id: string): Promise<Group> {
    return prisma.group.delete({
      where: { id },
    });
  }

  // Add member to group
  async addMember(groupId: string, userId: string): Promise<GroupMember> {
    return prisma.groupMember.create({
      data: {
        groupId,
        userId,
        role: Role.MEMBER,
      },
    });
  }

  // Remove member from group
  async removeMember(groupId: string, userId: string): Promise<GroupMember> {
    return prisma.groupMember.delete({
      where: {
        groupId_userId: {
          groupId,
          userId,
        },
      },
    });
  }

  // Transfer ownership
  async transferOwnership(
    groupId: string,
    currentOwnerId: string,
    newOwnerId: string
  ): Promise<void> {
    await prisma.$transaction([
      // Demote current owner to member
      prisma.groupMember.update({
        where: {
          groupId_userId: {
            groupId,
            userId: currentOwnerId,
          },
        },
        data: { role: Role.MEMBER },
      }),
      // Promote new owner
      prisma.groupMember.update({
        where: {
          groupId_userId: {
            groupId,
            userId: newOwnerId,
          },
        },
        data: { role: Role.OWNER },
      }),
    ]);
  }

  // Check if user has outstanding balance in group
  async hasOutstandingBalance(groupId: string, userId: string): Promise<boolean> {
    // Calculate user's net balance
    const [expenses, splits, settlements] = await Promise.all([
      // Amount paid by user
      prisma.expense.aggregate({
        where: {
          groupId,
          paidById: userId,
        },
        _sum: { amount: true },
      }),
      // Amount owed by user
      prisma.expenseSplit.aggregate({
        where: {
          expense: { groupId },
          userId,
        },
        _sum: { shareAmount: true },
      }),
      // Net settlements (sent - received)
      prisma.$queryRaw<[{ netSettlement: number }]>`
        SELECT 
          COALESCE(SUM(CASE WHEN "fromUserId" = ${userId} THEN -amount ELSE amount END), 0) as "netSettlement"
        FROM "Settlement"
        WHERE "groupId" = ${groupId}
          AND ("fromUserId" = ${userId} OR "toUserId" = ${userId})
      `,
    ]);

    const paid = Number(expenses._sum.amount || 0);
    const owed = Number(splits._sum.shareAmount || 0);
    const netSettlement = Number(settlements[0]?.netSettlement || 0);

    const balance = paid - owed + netSettlement;

    // Consider "outstanding" if balance is not effectively zero (within 0.01 tolerance)
    return Math.abs(balance) > 0.01;
  }

  // Check if group has any pending invites
  async hasPendingInvites(groupId: string): Promise<boolean> {
    const count = await prisma.invite.count({
      where: {
        groupId,
        status: 'PENDING',
        expiresAt: { gt: new Date() },
      },
    });
    return count > 0;
  }

  // Check if all balances in group are settled
  async allBalancesSettled(groupId: string): Promise<boolean> {
    const members = await prisma.groupMember.findMany({
      where: { groupId },
      select: { userId: true },
    });

    for (const member of members) {
      const hasBalance = await this.hasOutstandingBalance(groupId, member.userId);
      if (hasBalance) {
        return false;
      }
    }

    return true;
  }

  // Get member count
  async getMemberCount(groupId: string): Promise<number> {
    return prisma.groupMember.count({
      where: { groupId },
    });
  }
}

export const groupRepository = new GroupRepository();
