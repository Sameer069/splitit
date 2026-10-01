import { NotificationType } from '@prisma/client';
import { notificationService } from './notification.service';
import { pushService } from './push.service';
import { logger } from '../utils/logger';

/**
 * High-level notification trigger service
 * Creates in-app notifications + sends push notifications
 * Called by other services when events occur
 */
export class NotificationTriggerService {
  /**
   * Notify when expense is added
   */
  static async expenseAdded(
    groupId: string,
    groupName: string,
    expenseDescription: string,
    expenseAmount: number,
    createdBy: { id: string; name: string },
    memberIds: string[]
  ) {
    // Notify all members except the creator
    const recipientIds = memberIds.filter(id => id !== createdBy.id);

    if (recipientIds.length === 0) return;

    const title = `New expense in ${groupName}`;
    const body = `${createdBy.name} added "${expenseDescription}" ($${expenseAmount.toFixed(2)})`;

    await Promise.all([
      // In-app notifications
      notificationService.createBatchNotifications(recipientIds, {
        groupId,
        type: NotificationType.EXPENSE_ADDED,
        title,
        body,
        data: { groupId, expenseDescription, amount: expenseAmount },
      }),
      // Push notifications (only to disconnected users)
      pushService.sendPushNotification(recipientIds, title, body, {
        type: 'EXPENSE_ADDED',
        groupId,
      }),
    ]);
  }

  /**
   * Notify when expense is updated
   */
  static async expenseUpdated(
    groupId: string,
    groupName: string,
    expenseDescription: string,
    updatedBy: { id: string; name: string },
    memberIds: string[]
  ) {
    const recipientIds = memberIds.filter(id => id !== updatedBy.id);

    if (recipientIds.length === 0) return;

    const title = `Expense updated in ${groupName}`;
    const body = `${updatedBy.name} updated "${expenseDescription}"`;

    await Promise.all([
      notificationService.createBatchNotifications(recipientIds, {
        groupId,
        type: NotificationType.EXPENSE_UPDATED,
        title,
        body,
        data: { groupId },
      }),
      pushService.sendPushNotification(recipientIds, title, body, {
        type: 'EXPENSE_UPDATED',
        groupId,
      }),
    ]);
  }

  /**
   * Notify when expense is deleted
   */
  static async expenseDeleted(
    groupId: string,
    groupName: string,
    expenseDescription: string,
    deletedBy: { id: string; name: string },
    memberIds: string[]
  ) {
    const recipientIds = memberIds.filter(id => id !== deletedBy.id);

    if (recipientIds.length === 0) return;

    const title = `Expense deleted in ${groupName}`;
    const body = `${deletedBy.name} deleted "${expenseDescription}"`;

    await Promise.all([
      notificationService.createBatchNotifications(recipientIds, {
        groupId,
        type: NotificationType.EXPENSE_DELETED,
        title,
        body,
        data: { groupId },
      }),
      pushService.sendPushNotification(recipientIds, title, body, {
        type: 'EXPENSE_DELETED',
        groupId,
      }),
    ]);
  }

  /**
   * Notify when invite is received
   */
  static async inviteReceived(
    userId: string,
    groupName: string,
    invitedBy: { id: string; name: string }
  ) {
    const title = 'Group Invitation';
    const body = `${invitedBy.name} invited you to join "${groupName}"`;

    await Promise.all([
      notificationService.createNotification({
        userId,
        groupId: null,
        type: NotificationType.INVITE_RECEIVED,
        title,
        body,
        data: { groupName },
      }),
      pushService.sendPushNotification([userId], title, body, {
        type: 'INVITE_RECEIVED',
      }),
    ]);
  }

  /**
   * Notify when someone accepts an invite
   */
  static async inviteAccepted(
    inviterId: string,
    groupId: string,
    groupName: string,
    acceptedBy: { id: string; name: string }
  ) {
    const title = 'Invite Accepted';
    const body = `${acceptedBy.name} joined ${groupName}`;

    await Promise.all([
      notificationService.createNotification({
        userId: inviterId,
        groupId,
        type: NotificationType.INVITE_ACCEPTED,
        title,
        body,
        data: { groupId },
      }),
      pushService.sendPushNotification([inviterId], title, body, {
        type: 'INVITE_ACCEPTED',
        groupId,
      }),
    ]);
  }

  /**
   * Notify when new member joins
   */
  static async memberJoined(
    groupId: string,
    groupName: string,
    newMember: { id: string; name: string },
    existingMemberIds: string[]
  ) {
    const recipientIds = existingMemberIds.filter(id => id !== newMember.id);

    if (recipientIds.length === 0) return;

    const title = `New member in ${groupName}`;
    const body = `${newMember.name} joined the group`;

    await Promise.all([
      notificationService.createBatchNotifications(recipientIds, {
        groupId,
        type: NotificationType.MEMBER_JOINED,
        title,
        body,
        data: { groupId },
      }),
      pushService.sendPushNotification(recipientIds, title, body, {
        type: 'MEMBER_JOINED',
        groupId,
      }),
    ]);
  }

  /**
   * Notify when settlement is recorded
   */
  static async settlementRecorded(
    groupId: string,
    groupName: string,
    from: { id: string; name: string },
    to: { id: string; name: string },
    amount: number
  ) {
    // Notify the recipient of payment
    const title = 'Payment Received';
    const body = `${from.name} paid you $${amount.toFixed(2)} in ${groupName}`;

    await Promise.all([
      notificationService.createNotification({
        userId: to.id,
        groupId,
        type: NotificationType.SETTLED_UP,
        title,
        body,
        data: { groupId, amount },
      }),
      pushService.sendPushNotification([to.id], title, body, {
        type: 'SETTLED_UP',
        groupId,
      }),
    ]);
  }
}
