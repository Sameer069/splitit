import { InviteStatus } from '@prisma/client';
import { inviteRepository } from '../repositories/invite.repository';
import { groupRepository } from '../repositories/group.repository';
import { authRepository } from '../repositories/auth.repository';
import { emailService } from './email.service';
import { generateSecureToken, hashToken } from '../utils/jwt';
import {
  NotFoundError,
  ConflictError,
  ForbiddenError,
  ValidationError,
} from '../utils/errors';
import { logger } from '../utils/logger';
import { SocketEvents } from '../socket/events';

class InviteService {
  // Create and send invite
  async createInvite(groupId: string, email: string, invitedById: string) {
    // Verify group exists
    const group = await groupRepository.findById(groupId);
    if (!group) {
      throw new NotFoundError('Group not found');
    }

    // Check if user is already a member
    const alreadyMember = group.members.some(m => m.user.email === email);
    if (alreadyMember) {
      throw new ConflictError('User is already a member of this group');
    }

    // Check if pending invite already exists
    const existingInvite = await inviteRepository.findPendingInvite(groupId, email);
    if (existingInvite) {
      throw new ConflictError('A pending invite already exists for this email');
    }

    // Get inviter info
    const inviter = await authRepository.findUserById(invitedById);
    if (!inviter) {
      throw new NotFoundError('Inviter not found');
    }

    // Generate invite token
    const token = generateSecureToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Create invite
    const invite = await inviteRepository.createInvite({
      groupId,
      email,
      token,
      invitedById,
      expiresAt,
    });

    // Send email (non-blocking)
    emailService
      .sendGroupInviteEmail(email, group.name, inviter.name, token)
      .catch(err => {
        logger.error({ err, email, groupId }, 'Failed to send invite email');
      });

    logger.info(
      {
        inviteId: invite.id,
        groupId,
        email,
        invitedById,
      },
      'Invite created and sent'
    );

    return {
      id: invite.id,
      groupId: invite.groupId,
      groupName: group.name,
      email: invite.email,
      status: invite.status,
      invitedBy: {
        id: inviter.id,
        name: inviter.name,
      },
      createdAt: invite.createdAt,
      expiresAt: invite.expiresAt,
    };
  }

  // Accept invite
  async acceptInvite(token: string, userId: string) {
    // Find invite
    const invite = await inviteRepository.findByToken(token);

    if (!invite) {
      throw new NotFoundError('Invite not found or invalid');
    }

    // Check if already accepted
    if (invite.status === InviteStatus.ACCEPTED) {
      throw new ConflictError('This invite has already been accepted');
    }

    // Check if expired
    if (invite.status === InviteStatus.EXPIRED || invite.expiresAt < new Date()) {
      // Mark as expired if not already
      if (invite.status !== InviteStatus.EXPIRED) {
        await inviteRepository.updateStatus(invite.id, InviteStatus.EXPIRED);
      }
      throw new ForbiddenError('This invite has expired');
    }

    // Get user info
    const user = await authRepository.findUserById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Verify email matches (optional - could allow accepting on behalf of someone else)
    if (user.email !== invite.email) {
      throw new ValidationError(
        `This invite was sent to ${invite.email}. Please log in with that account.`
      );
    }

    // Check if already a member
    const group = await groupRepository.findById(invite.groupId);
    if (!group) {
      throw new NotFoundError('Group not found');
    }

    const alreadyMember = group.members.some(m => m.userId === userId);
    if (alreadyMember) {
      // Mark invite as accepted anyway
      await inviteRepository.updateStatus(invite.id, InviteStatus.ACCEPTED);
      throw new ConflictError('You are already a member of this group');
    }

    // Add user to group
    await groupRepository.addMember(invite.groupId, userId);

    // Mark invite as accepted
    await inviteRepository.updateStatus(invite.id, InviteStatus.ACCEPTED);

    logger.info(
      {
        inviteId: invite.id,
        groupId: invite.groupId,
        userId,
      },
      'Invite accepted'
    );

    // Emit real-time events
    SocketEvents.inviteAccepted(invite.groupId, { userId, email: user.email });
    SocketEvents.memberJoined(invite.groupId, {
      id: '', // Will be set by DB
      userId,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      role: 'MEMBER',
      joinedAt: new Date(),
    });

    return {
      groupId: invite.group.id,
      groupName: invite.group.name,
    };
  }

  // Get invite details (for preview before accepting)
  async getInviteDetails(token: string) {
    const invite = await inviteRepository.findByToken(token);

    if (!invite) {
      throw new NotFoundError('Invite not found or invalid');
    }

    // Check if expired
    const isExpired = invite.status === InviteStatus.EXPIRED || invite.expiresAt < new Date();

    return {
      id: invite.id,
      groupId: invite.group.id,
      groupName: invite.group.name,
      email: invite.email,
      status: isExpired ? InviteStatus.EXPIRED : invite.status,
      invitedBy: {
        id: invite.invitedBy.id,
        name: invite.invitedBy.name,
      },
      createdAt: invite.createdAt,
      expiresAt: invite.expiresAt,
    };
  }

  // Get pending invites for a user
  async getPendingInvitesForUser(email: string) {
    const invites = await inviteRepository.findPendingByEmail(email);

    return invites.map(invite => ({
      id: invite.id,
      groupId: invite.group.id,
      groupName: invite.group.name,
      token: invite.token,
      invitedBy: {
        id: invite.invitedBy.id,
        name: invite.invitedBy.name,
      },
      createdAt: invite.createdAt,
      expiresAt: invite.expiresAt,
    }));
  }

  // Get invites for a group
  async getGroupInvites(groupId: string) {
    const invites = await inviteRepository.findByGroupId(groupId);

    return invites.map(invite => ({
      id: invite.id,
      email: invite.email,
      status: invite.status,
      invitedBy: {
        id: invite.invitedBy.id,
        name: invite.invitedBy.name,
      },
      createdAt: invite.createdAt,
      expiresAt: invite.expiresAt,
    }));
  }
}

export const inviteService = new InviteService();
