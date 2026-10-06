import { expenseRepository } from '../repositories/expense.repository';
import { groupRepository } from '../repositories/group.repository';
import { NotFoundError, ValidationError, ForbiddenError } from '../utils/errors';
import { logger } from '../utils/logger';
import { SocketEvents } from '../socket/events';

class ExpenseService {
  // Create expense
  async createExpense(
    groupId: string,
    userId: string,
    data: {
      description: string;
      amount: number;
      paidById: string;
      categoryId?: string;
      receiptUrl?: string;
      splits: Array<{ userId: string; shareAmount: number }>;
    }
  ) {
    // Verify all users in splits are members of the group
    const group = await groupRepository.findById(groupId);
    if (!group) {
      throw new NotFoundError('Group not found');
    }

    const memberIds = group.members.map(m => m.userId);
    const paidByIsMember = memberIds.includes(data.paidById);
    const allSplitsValid = data.splits.every(s => memberIds.includes(s.userId));

    if (!paidByIsMember) {
      throw new ValidationError('Payer must be a member of the group');
    }

    if (!allSplitsValid) {
      throw new ValidationError('All split users must be members of the group');
    }

    // Create expense
    const expense = await expenseRepository.createExpense({
      groupId,
      ...data,
      createdById: userId,
    });

    logger.info(
      {
        expenseId: expense.id,
        groupId,
        amount: expense.amount,
        createdById: userId,
      },
      'Expense created'
    );

    // Fetch with all relations for real-time event
    const expenseWithRelations = await expenseRepository.findById(expense.id);
    if (!expenseWithRelations) {
      throw new NotFoundError('Expense not found after creation');
    }

    const response = this.formatExpenseResponse(expenseWithRelations);

    // Emit real-time event
    SocketEvents.expenseCreated(groupId, response);

    return response;
  }

  // Get expense detail
  async getExpenseDetail(expenseId: string) {
    const expense = await expenseRepository.findById(expenseId);

    if (!expense) {
      throw new NotFoundError('Expense not found');
    }

    // Get user info for audit logs
    const auditLogs = await Promise.all(
      expense.auditLogs.map(async log => {
        // Find user name from group members or use createdById
        const userInfo = expense.group 
          ? await this.getUserInfo(log.expense.createdById)
          : { name: 'Unknown' };
        
        return {
          id: log.id,
          userId: log.expense.createdById,
          userName: userInfo.name,
          action: log.action,
          changes: log.changes as Record<string, unknown> | null,
          createdAt: log.createdAt,
        };
      })
    );

    return {
      id: expense.id,
      groupId: expense.groupId,
      description: expense.description,
      amount: Number(expense.amount),
      paidById: expense.paidBy.id,
      paidByName: expense.paidBy.name,
      categoryId: expense.category?.id || null,
      categoryName: expense.category?.name || null,
      categoryIcon: expense.category?.icon || null,
      receiptUrl: expense.receiptUrl,
      createdById: expense.createdById,
      createdByName: expense.paidBy.name,
      createdAt: expense.createdAt,
      updatedAt: expense.updatedAt,
      splits: expense.splits.map(s => ({
        id: s.id,
        userId: s.user.id,
        userName: s.user.name,
        shareAmount: Number(s.shareAmount),
      })),
      comments: expense.comments.map(c => ({
        id: c.id,
        userId: c.user.id,
        userName: c.user.name,
        userAvatar: c.user.avatarUrl,
        body: c.body,
        createdAt: c.createdAt,
      })),
      auditLogs,
    };
  }

  // List expenses with pagination
  async listExpenses(
    groupId: string,
    options: {
      page: number;
      limit: number;
      categoryId?: string;
    }
  ) {
    const { expenses, total } = await expenseRepository.listExpenses(groupId, options);

    const formattedExpenses = expenses.map(e => this.formatExpenseResponse(e));

    return {
      expenses: formattedExpenses,
      pagination: {
        page: options.page,
        limit: options.limit,
        total,
        totalPages: Math.ceil(total / options.limit),
      },
    };
  }

  // Update expense
  async updateExpense(
    expenseId: string,
    userId: string,
    data: {
      description?: string;
      amount?: number;
      paidById?: string;
      categoryId?: string | null;
      receiptUrl?: string | null;
      splits?: Array<{ userId: string; shareAmount: number }>;
    }
  ) {
    const existing = await expenseRepository.findById(expenseId);
    if (!existing) {
      throw new NotFoundError('Expense not found');
    }

    // If updating paidBy or splits, verify they're group members
    if (data.paidById || data.splits) {
      const group = await groupRepository.findById(existing.groupId);
      if (!group) {
        throw new NotFoundError('Group not found');
      }

      const memberIds = group.members.map(m => m.userId);

      if (data.paidById && !memberIds.includes(data.paidById)) {
        throw new ValidationError('Payer must be a member of the group');
      }

      if (data.splits) {
        const allSplitsValid = data.splits.every(s => memberIds.includes(s.userId));
        if (!allSplitsValid) {
          throw new ValidationError('All split users must be members of the group');
        }
      }
    }

    // Build change log
    const changes: Record<string, { from: unknown; to: unknown }> = {};
    if (data.description !== undefined && data.description !== existing.description) {
      changes.description = { from: existing.description, to: data.description };
    }
    if (data.amount !== undefined && data.amount !== Number(existing.amount)) {
      changes.amount = { from: Number(existing.amount), to: data.amount };
    }
    if (data.paidById !== undefined && data.paidById !== existing.paidById) {
      changes.paidById = { from: existing.paidById, to: data.paidById };
    }

    // Update expense
    const updatedExpense = await expenseRepository.updateExpense(expenseId, userId, data, changes);

    logger.info(
      {
        expenseId,
        userId,
        changes: Object.keys(changes),
      },
      'Expense updated'
    );

    // Fetch with all relations
    const expenseWithRelations = await expenseRepository.findById(updatedExpense.id);
    if (!expenseWithRelations) {
      throw new NotFoundError('Expense not found after update');
    }

    const response = this.formatExpenseResponse(expenseWithRelations);

    // Emit real-time event
    SocketEvents.expenseUpdated(expenseWithRelations.groupId, response);

    return response;
  }

  // Delete expense
  async deleteExpense(expenseId: string, userId: string) {
    const expense = await expenseRepository.findById(expenseId);
    if (!expense) {
      throw new NotFoundError('Expense not found');
    }

    const groupId = expense.groupId;

    await expenseRepository.deleteExpense(expenseId, userId);

    logger.info({ expenseId, userId }, 'Expense deleted');

    // Emit real-time event
    SocketEvents.expenseDeleted(groupId, expenseId);
  }

  // Get all categories
  async getAllCategories() {
    const categories = await expenseRepository.getAllCategories();
    return categories.map(c => ({
      id: c.id,
      name: c.name,
      icon: c.icon,
    }));
  }

  // Add comment
  async addComment(expenseId: string, userId: string, body: string) {
    const expense = await expenseRepository.findById(expenseId);
    if (!expense) {
      throw new NotFoundError('Expense not found');
    }

    const comment = await expenseRepository.addComment(expenseId, userId, body);

    logger.info({ expenseId, userId }, 'Comment added');

    const response = {
      id: comment.id,
      userId: comment.user.id,
      userName: comment.user.name,
      userAvatar: comment.user.avatarUrl,
      body: comment.body,
      createdAt: comment.createdAt,
    };

    // Emit real-time event
    SocketEvents.commentAdded(expense.groupId, expenseId, response);

    return response;
  }

  // Delete comment
  async deleteComment(commentId: string, expenseId: string, groupId: string) {
    await expenseRepository.deleteComment(commentId);
    logger.info({ commentId }, 'Comment deleted');

    // Emit real-time event
    SocketEvents.commentDeleted(groupId, expenseId, commentId);
  }

  // Get expense history
  async getExpenseHistory(expenseId: string) {
    const expense = await expenseRepository.findById(expenseId);
    if (!expense) {
      throw new NotFoundError('Expense not found');
    }

    const history = await expenseRepository.getExpenseHistory(expenseId);

    return history.map(log => ({
      id: log.id,
      action: log.action,
      changes: log.changes as Record<string, unknown> | null,
      createdAt: log.createdAt,
    }));
  }

  // Helper: Format expense response
  private formatExpenseResponse(expense: {
    id: string;
    groupId: string;
    description: string;
    amount: unknown;
    paidById: string;
    categoryId: string | null;
    receiptUrl: string | null;
    createdById: string;
    createdAt: Date;
    updatedAt: Date;
    paidBy: { id: string; name: string };
    createdBy: { id: string; name: string };
    category: { id: string; name: string; icon: string } | null;
    splits: Array<{
      id: string;
      userId: string;
      shareAmount: unknown;
      user: { id: string; name: string };
    }>;
  }) {
    return {
      id: expense.id,
      groupId: expense.groupId,
      description: expense.description,
      amount: Number(expense.amount),
      paidById: expense.paidBy.id,
      paidByName: expense.paidBy.name,
      categoryId: expense.category?.id || null,
      categoryName: expense.category?.name || null,
      categoryIcon: expense.category?.icon || null,
      receiptUrl: expense.receiptUrl,
      createdById: expense.createdById,
      createdByName: expense.createdBy.name,
      createdAt: expense.createdAt,
      updatedAt: expense.updatedAt,
      splits: expense.splits.map(s => ({
        id: s.id,
        userId: s.user.id,
        userName: s.user.name,
        shareAmount: Number(s.shareAmount),
      })),
    };
  }

  // Helper: Get user info
  private async getUserInfo(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });
    return user || { name: 'Unknown' };
  }
}

// Import prisma for the helper
import { prisma } from '../utils/prisma';

export const expenseService = new ExpenseService();
