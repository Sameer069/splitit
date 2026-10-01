import { Invite, InviteStatus } from '@prisma/client';
import { prisma } from '../utils/prisma';

export class InviteRepository {
  // Create invite
  async createInvite(data: {
    groupId: string;
    email: string;
    token: string;
    invitedById: string;
    expiresAt: Date;
  }): Promise<Invite> {
    return prisma.invite.create({
      data,
    });
  }

  // Find invite by token
  async findByToken(token: string) {
    return prisma.invite.findUnique({
      where: { token },
      include: {
        group: {
          select: {
            id: true,
            name: true,
          },
        },
        invitedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  // Update invite status
  async updateStatus(id: string, status: InviteStatus): Promise<Invite> {
    return prisma.invite.update({
      where: { id },
      data: { status },
    });
  }

  // Find pending invites by email
  async findPendingByEmail(email: string) {
    return prisma.invite.findMany({
      where: {
        email,
        status: InviteStatus.PENDING,
        expiresAt: { gt: new Date() },
      },
      include: {
        group: {
          select: {
            id: true,
            name: true,
          },
        },
        invitedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  // Check if invite exists for email in group
  async findPendingInvite(groupId: string, email: string) {
    return prisma.invite.findFirst({
      where: {
        groupId,
        email,
        status: InviteStatus.PENDING,
        expiresAt: { gt: new Date() },
      },
    });
  }

  // Get all invites for a group
  async findByGroupId(groupId: string) {
    return prisma.invite.findMany({
      where: { groupId },
      include: {
        invitedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // Delete expired invites (maintenance)
  async deleteExpiredInvites(): Promise<void> {
    await prisma.invite.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { status: InviteStatus.ACCEPTED },
        ],
      },
    });
  }

  // Mark expired invites
  async markExpiredInvites(): Promise<void> {
    await prisma.invite.updateMany({
      where: {
        status: InviteStatus.PENDING,
        expiresAt: { lt: new Date() },
      },
      data: {
        status: InviteStatus.EXPIRED,
      },
    });
  }
}

export const inviteRepository = new InviteRepository();
