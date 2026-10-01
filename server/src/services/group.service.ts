import { groupRepository } from '../repositories/group.repository';
import { authRepository } from '../repositories/auth.repository';
import {
  NotFoundError,
  ConflictError,
  ForbiddenError,
  ValidationError,
} from '../utils/errors';
import { logger } from '../utils/logger';
import { SocketEvents } from '../socket/events';

class GroupService {
  // Create new group
  async createGroup(name: string, ownerId: string) {
    const group = await groupRepository.createGroup(name, ownerId);

    logger.info({ groupId: group.id, ownerId }, 'Group created');

    return {
      id: group.id,
      name: group.name,
      createdById: group.createdById,
      createdAt: group.createdAt,
    };
  }

  // Get group detail with members
  async getGroupDetail(groupId: string) {
    const group = await groupRepository.findById(groupId);

    if (!group) {
      throw new NotFoundError('Group not found');
    }

    return {
      id: group.id,
      name: group.name,
      createdById: group.createdById,
      createdAt: group.createdAt,
      memberCount: group._count.members,
      expenseCount: group._count.expenses,
      members: group.members.map(m => ({
        id: m.id,
        userId: m.user.id,
        name: m.user.name,
        email: m.user.email,
        avatarUrl: m.user.avatarUrl,
        role: m.role,
        joinedAt: m.joinedAt,
      })),
    };
  }

  // Update group name
  async updateGroup(groupId: string, name: string) {
    const group = await groupRepository.updateGroup(groupId, name);

    logger.info({ groupId }, 'Group updated');

    const response = {
      id: group.id,
      name: group.name,
      createdById: group.createdById,
      createdAt: group.createdAt,
    };

    // Emit real-time event
    SocketEvents.groupUpdated(groupId, response);

    return response;
  }

  // Delete group
  async deleteGroup(groupId: string, force: boolean = false) {
    // Check if all balances are settled
    if (!force) {
      const allSettled = await groupRepository.allBalancesSettled(groupId);
      if (!allSettled) {
        throw new ForbiddenError(
          'Cannot delete group with outstanding balances. All members must settle up first.'
        );
      }

      // Check for pending invites
      const hasPending = await groupRepository.hasPendingInvites(groupId);
      if (hasPending) {
        throw new ForbiddenError(
          'Cannot delete group with pending invites. Cancel or wait for invites to expire first.'
        );
      }
    }

    await groupRepository.deleteGroup(groupId);

    logger.info({ groupId, force }, 'Group deleted');
  }

  // Add member by email
  async addMember(groupId: string, email: string, inviterId: string) {
    // Find user by email
    const user = await authRepository.findUserByEmail(email);

    if (!user) {
      throw new NotFoundError(
        `No user found with email ${email}. They must register first or use the invite system.`
      );
    }

    // Check if user is already a member
    const group = await groupRepository.findById(groupId);
    if (!group) {
      throw new NotFoundError('Group not found');
    }

    const alreadyMember = group.members.some(m => m.userId === user.id);
    if (alreadyMember) {
      throw new ConflictError('User is already a member of this group');
    }

    // Add member
    const membership = await groupRepository.addMember(groupId, user.id);

    logger.info({ groupId, userId: user.id, inviterId }, 'Member added to group');

    const response = {
      id: membership.id,
      userId: user.id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      role: membership.role,
      joinedAt: membership.joinedAt,
    };

    // Emit real-time event
    SocketEvents.memberJoined(groupId, response);

    return response;
  }

  // Remove member
  async removeMember(groupId: string, userIdToRemove: string, requesterId: string) {
    // Check if trying to remove themselves
    const isSelfRemoval = userIdToRemove === requesterId;

    // If removing themselves, check for outstanding balance
    if (isSelfRemoval) {
      const hasBalance = await groupRepository.hasOutstandingBalance(
        groupId,
        userIdToRemove
      );
      if (hasBalance) {
        throw new ForbiddenError(
          'Cannot leave group with outstanding balance. Settle up first.'
        );
      }
    }

    // Check if last member
    const memberCount = await groupRepository.getMemberCount(groupId);
    if (memberCount === 1) {
      throw new ForbiddenError(
        'Cannot remove the last member. Delete the group instead.'
      );
    }

    // Remove member
    await groupRepository.removeMember(groupId, userIdToRemove);

    logger.info(
      { groupId, removedUserId: userIdToRemove, requesterId, isSelfRemoval },
      'Member removed from group'
    );

    // Emit real-time event
    SocketEvents.memberLeft(groupId, userIdToRemove);
  }

  // Transfer ownership
  async transferOwnership(groupId: string, currentOwnerId: string, newOwnerId: string) {
    // Verify new owner is a member
    const group = await groupRepository.findById(groupId);
    if (!group) {
      throw new NotFoundError('Group not found');
    }

    const newOwnerMembership = group.members.find(m => m.userId === newOwnerId);
    if (!newOwnerMembership) {
      throw new ValidationError('New owner must be a member of the group');
    }

    if (newOwnerMembership.userId === currentOwnerId) {
      throw new ValidationError('You are already the owner');
    }

    // Transfer ownership
    await groupRepository.transferOwnership(groupId, currentOwnerId, newOwnerId);

    logger.info({ groupId, currentOwnerId, newOwnerId }, 'Group ownership transferred');
  }
}

export const groupService = new GroupService();
