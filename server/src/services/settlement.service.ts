import { settlementRepository } from '../repositories/settlement.repository';
import { groupRepository } from '../repositories/group.repository';
import { balanceService } from './balance.service';
import { NotFoundError, ValidationError } from '../utils/errors';
import { logger } from '../utils/logger';
import { SocketEvents } from '../socket/events';

class SettlementService {
  // Create settlement
  async createSettlement(
    groupId: string,
    data: {
      fromUserId: string;
      toUserId: string;
      amount: number;
      note?: string;
    }
  ) {
    // Verify group exists
    const group = await groupRepository.findById(groupId);
    if (!group) {
      throw new NotFoundError('Group not found');
    }

    // Verify both users are members
    const memberIds = group.members.map(m => m.userId);
    if (!memberIds.includes(data.fromUserId)) {
      throw new ValidationError('From user is not a member of this group');
    }
    if (!memberIds.includes(data.toUserId)) {
      throw new ValidationError('To user is not a member of this group');
    }

    // Get user names for response
    const fromMember = group.members.find(m => m.userId === data.fromUserId);
    const toMember = group.members.find(m => m.userId === data.toUserId);

    if (!fromMember || !toMember) {
      throw new NotFoundError('Member information not found');
    }

    // Create settlement
    const settlement = await settlementRepository.createSettlement({
      groupId,
      ...data,
    });

    logger.info(
      {
        settlementId: settlement.id,
        groupId,
        from: data.fromUserId,
        to: data.toUserId,
        amount: data.amount,
      },
      'Settlement created'
    );

    const response = {
      id: settlement.id,
      groupId: settlement.groupId,
      fromUserId: settlement.fromUserId,
      fromUserName: fromMember.user.name,
      toUserId: settlement.toUserId,
      toUserName: toMember.user.name,
      amount: Number(settlement.amount),
      note: settlement.note,
      settledAt: settlement.settledAt,
    };

    // Emit real-time event
    SocketEvents.settlementCreated(groupId, response);

    return response;
  }

  // List settlements with pagination
  async listSettlements(
    groupId: string,
    options: {
      page: number;
      limit: number;
    }
  ) {
    const { settlements, total } = await settlementRepository.getSettlementsWithUserInfo(
      groupId,
      options.page,
      options.limit
    );

    const formattedSettlements = settlements.map(s => {
      const fromMember = s.group.members.find(m => m.userId === s.fromUserId);
      const toMember = s.group.members.find(m => m.userId === s.toUserId);

      return {
        id: s.id,
        groupId: s.groupId,
        fromUserId: s.fromUserId,
        fromUserName: fromMember?.user.name || 'Unknown',
        toUserId: s.toUserId,
        toUserName: toMember?.user.name || 'Unknown',
        amount: Number(s.amount),
        note: s.note,
        settledAt: s.settledAt,
      };
    });

    return {
      settlements: formattedSettlements,
      pagination: {
        page: options.page,
        limit: options.limit,
        total,
        totalPages: Math.ceil(total / options.limit),
      },
    };
  }

  // Get balance summary for group
  async getGroupBalances(groupId: string) {
    // Verify group exists
    const group = await groupRepository.findById(groupId);
    if (!group) {
      throw new NotFoundError('Group not found');
    }

    const summary = await balanceService.getBalanceSummary(groupId);

    // Verify balance integrity
    const isValid = balanceService.verifyBalancesSum(summary.balances);
    if (!isValid) {
      logger.warn({ groupId }, 'Balance calculation integrity check failed');
    }

    return summary;
  }
}

export const settlementService = new SettlementService();
