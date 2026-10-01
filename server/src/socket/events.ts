import { getSocketService } from './index';
import { logger } from '../utils/logger';

/**
 * Real-time event emitters for various app actions
 * These should be called from service layer after database operations complete
 */

export class SocketEvents {
  // Expense events
  static expenseCreated(groupId: string, expense: unknown) {
    try {
      const socket = getSocketService();
      socket.emitToGroup(groupId, 'expense:created', expense);
      // Also emit balance update since balances always change with expenses
      this.triggerBalanceUpdate(groupId);
    } catch (error) {
      logger.warn({ error }, 'Failed to emit expense:created event');
    }
  }

  static expenseUpdated(groupId: string, expense: unknown) {
    try {
      const socket = getSocketService();
      socket.emitToGroup(groupId, 'expense:updated', expense);
      this.triggerBalanceUpdate(groupId);
    } catch (error) {
      logger.warn({ error }, 'Failed to emit expense:updated event');
    }
  }

  static expenseDeleted(groupId: string, expenseId: string) {
    try {
      const socket = getSocketService();
      socket.emitToGroup(groupId, 'expense:deleted', { expenseId });
      this.triggerBalanceUpdate(groupId);
    } catch (error) {
      logger.warn({ error }, 'Failed to emit expense:deleted event');
    }
  }

  // Comment events
  static commentAdded(groupId: string, expenseId: string, comment: unknown) {
    try {
      const socket = getSocketService();
      socket.emitToGroup(groupId, 'comment:added', { expenseId, comment });
    } catch (error) {
      logger.warn({ error }, 'Failed to emit comment:added event');
    }
  }

  static commentDeleted(groupId: string, expenseId: string, commentId: string) {
    try {
      const socket = getSocketService();
      socket.emitToGroup(groupId, 'comment:deleted', { expenseId, commentId });
    } catch (error) {
      logger.warn({ error }, 'Failed to emit comment:deleted event');
    }
  }

  // Settlement events
  static settlementCreated(groupId: string, settlement: unknown) {
    try {
      const socket = getSocketService();
      socket.emitToGroup(groupId, 'settlement:created', settlement);
      this.triggerBalanceUpdate(groupId);
    } catch (error) {
      logger.warn({ error }, 'Failed to emit settlement:created event');
    }
  }

  // Balance update trigger (tells clients to refetch balances)
  static triggerBalanceUpdate(groupId: string) {
    try {
      const socket = getSocketService();
      socket.emitToGroup(groupId, 'balance:updated', { groupId });
    } catch (error) {
      logger.warn({ error }, 'Failed to emit balance:updated event');
    }
  }

  // Member events
  static memberJoined(groupId: string, member: unknown) {
    try {
      const socket = getSocketService();
      socket.emitToGroup(groupId, 'member:joined', member);
    } catch (error) {
      logger.warn({ error }, 'Failed to emit member:joined event');
    }
  }

  static memberLeft(groupId: string, userId: string) {
    try {
      const socket = getSocketService();
      socket.emitToGroup(groupId, 'member:left', { userId });
    } catch (error) {
      logger.warn({ error }, 'Failed to emit member:left event');
    }
  }

  // Invite events
  static inviteAccepted(groupId: string, inviteData: { userId: string; email: string }) {
    try {
      const socket = getSocketService();
      socket.emitToGroup(groupId, 'invite:accepted', inviteData);
    } catch (error) {
      logger.warn({ error }, 'Failed to emit invite:accepted event');
    }
  }

  // Group events
  static groupUpdated(groupId: string, groupData: unknown) {
    try {
      const socket = getSocketService();
      socket.emitToGroup(groupId, 'group:updated', groupData);
    } catch (error) {
      logger.warn({ error }, 'Failed to emit group:updated event');
    }
  }

  // Notification events (personal, not group-wide)
  static notificationCreated(userId: string, notification: unknown) {
    try {
      const socket = getSocketService();
      socket.emitToUser(userId, 'notification:new', notification);
    } catch (error) {
      logger.warn({ error }, 'Failed to emit notification:new event');
    }
  }

  // Batch notification to multiple users
  static notificationsCreated(userIds: string[], notification: unknown) {
    try {
      const socket = getSocketService();
      socket.emitToUsers(userIds, 'notification:new', notification);
    } catch (error) {
      logger.warn({ error }, 'Failed to emit batch notifications');
    }
  }
}
