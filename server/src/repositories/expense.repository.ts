import { Expense, AuditAction, Prisma } from '@prisma/client';
import { prisma } from '../utils/prisma';

export class ExpenseRepository {
  // Create expense with splits and audit log
  async createExpense(data: {
    groupId: string;
    description: string;
    amount: number;
    paidById: string;
    categoryId?: string;
    receiptUrl?: string;
    createdById: string;
    splits: Array<{ userId: string; shareAmount: number }>;
  }): Promise<Expense> {
    return prisma.expense.create({
      data: {
        groupId: data.groupId,
        description: data.description,
        amount: data.amount,
        paidById: data.paidById,
        categoryId: data.categoryId,
        receiptUrl: data.receiptUrl,
        createdById: data.createdById,
        splits: {
          create: data.splits,
        },
        auditLogs: {
          create: {
            userId: data.createdById,
            action: AuditAction.CREATED,
            changes: Prisma.JsonNull,
          },
        },
      },
      include: {
        splits: true,
        paidBy: {
          select: { id: true, name: true },
        },
        createdBy: {
          select: { id: true, name: true },
        },
        category: true,
      },
    });
  }

  // Find expense by ID with full details
  async findById(id: string) {
    return prisma.expense.findUnique({
      where: { id },
      include: {
        paidBy: {
          select: { id: true, name: true, email: true },
        },
        createdBy: {
          select: { id: true, name: true },
        },
        category: true,
        splits: {
          include: {
            user: {
              select: { id: true, name: true },
            },
          },
        },
        comments: {
          include: {
            user: {
              select: { id: true, name: true, avatarUrl: true },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        auditLogs: {
          include: {
            expense: {
              select: {
                createdById: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        group: {
          select: { id: true, name: true },
        },
      },
    });
  }

  // List expenses for a group with pagination
  async listExpenses(
    groupId: string,
    options: {
      page: number;
      limit: number;
      categoryId?: string;
    }
  ) {
    const where: Prisma.ExpenseWhereInput = {
      groupId,
      ...(options.categoryId && { categoryId: options.categoryId }),
    };

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        include: {
          paidBy: {
            select: { id: true, name: true },
          },
          createdBy: {
            select: { id: true, name: true },
          },
          category: true,
          splits: {
            include: {
              user: {
                select: { id: true, name: true },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: (options.page - 1) * options.limit,
        take: options.limit,
      }),
      prisma.expense.count({ where }),
    ]);

    return { expenses, total };
  }

  // Update expense
  async updateExpense(
    id: string,
    userId: string,
    data: {
      description?: string;
      amount?: number;
      paidById?: string;
      categoryId?: string | null;
      receiptUrl?: string | null;
      splits?: Array<{ userId: string; shareAmount: number }>;
    },
    changes: Record<string, unknown>
  ): Promise<Expense> {
    // If splits are being updated, delete old ones and create new ones
    const updateData: Prisma.ExpenseUpdateInput = {
      ...(data.description !== undefined && { description: data.description }),
      ...(data.amount !== undefined && { amount: data.amount }),
      ...(data.paidById !== undefined && { paidById: data.paidById }),
      ...(data.categoryId !== undefined && {
        categoryId: data.categoryId,
      }),
      ...(data.receiptUrl !== undefined && {
        receiptUrl: data.receiptUrl,
      }),
      auditLogs: {
        create: {
          userId,
          action: AuditAction.UPDATED,
          changes: changes as Prisma.InputJsonValue,
        },
      },
    };

    if (data.splits) {
      // Delete existing splits and create new ones
      await prisma.expenseSplit.deleteMany({
        where: { expenseId: id },
      });
      updateData.splits = {
        create: data.splits,
      };
    }

    return prisma.expense.update({
      where: { id },
      data: updateData,
      include: {
        splits: true,
        paidBy: {
          select: { id: true, name: true },
        },
        createdBy: {
          select: { id: true, name: true },
        },
        category: true,
      },
    });
  }

  // Delete expense (with audit log)
  async deleteExpense(id: string, userId: string): Promise<void> {
    // Create audit log before deleting (will cascade delete)
    await prisma.expenseAuditLog.create({
      data: {
        expenseId: id,
        userId,
        action: AuditAction.DELETED,
        changes: Prisma.JsonNull,
      },
    });

    await prisma.expense.delete({
      where: { id },
    });
  }

  // Get all categories
  async getAllCategories() {
    return prisma.expenseCategory.findMany({
      orderBy: { name: 'asc' },
    });
  }

  // Add comment
  async addComment(expenseId: string, userId: string, body: string) {
    return prisma.expenseComment.create({
      data: {
        expenseId,
        userId,
        body,
      },
      include: {
        user: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
    });
  }

  // Delete comment
  async deleteComment(commentId: string): Promise<void> {
    await prisma.expenseComment.delete({
      where: { id: commentId },
    });
  }

  // Get expense history (audit logs)
  async getExpenseHistory(expenseId: string) {
    return prisma.expenseAuditLog.findMany({
      where: { expenseId },
      orderBy: { createdAt: 'desc' },
    });
  }
}

export const expenseRepository = new ExpenseRepository();
