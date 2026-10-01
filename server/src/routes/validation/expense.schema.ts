import { z } from 'zod';

// Expense split (per-user share)
export const expenseSplitSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  shareAmount: z.number().positive('Share amount must be positive'),
});

export type ExpenseSplitInput = z.infer<typeof expenseSplitSchema>;

// Create expense
export const createExpenseSchema = z.object({
  description: z.string().min(1, 'Description is required').max(500),
  amount: z.number().positive('Amount must be positive'),
  paidById: z.string().uuid('Invalid payer ID'),
  categoryId: z.string().uuid('Invalid category ID').optional(),
  receiptUrl: z.string().url('Invalid receipt URL').optional(),
  splits: z
    .array(expenseSplitSchema)
    .min(1, 'At least one split is required')
    .refine(
      splits => {
        const userIds = splits.map(s => s.userId);
        return new Set(userIds).size === userIds.length;
      },
      { message: 'Duplicate user IDs in splits' }
    ),
}).refine(
  data => {
    // Validate that splits sum to total amount (within 0.01 tolerance)
    const totalSplits = data.splits.reduce((sum, split) => sum + split.shareAmount, 0);
    const diff = Math.abs(totalSplits - data.amount);
    return diff < 0.01;
  },
  {
    message: 'Split amounts must sum to the total expense amount',
    path: ['splits'],
  }
);

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;

// Update expense
export const updateExpenseSchema = z.object({
  description: z.string().min(1, 'Description is required').max(500).optional(),
  amount: z.number().positive('Amount must be positive').optional(),
  paidById: z.string().uuid('Invalid payer ID').optional(),
  categoryId: z.string().uuid('Invalid category ID').nullable().optional(),
  receiptUrl: z.string().url('Invalid receipt URL').nullable().optional(),
  splits: z
    .array(expenseSplitSchema)
    .min(1, 'At least one split is required')
    .refine(
      splits => {
        const userIds = splits.map(s => s.userId);
        return new Set(userIds).size === userIds.length;
      },
      { message: 'Duplicate user IDs in splits' }
    )
    .optional(),
}).refine(
  data => {
    // If both amount and splits are provided, validate they match
    if (data.amount !== undefined && data.splits !== undefined) {
      const totalSplits = data.splits.reduce((sum, split) => sum + split.shareAmount, 0);
      const diff = Math.abs(totalSplits - data.amount);
      return diff < 0.01;
    }
    return true;
  },
  {
    message: 'Split amounts must sum to the total expense amount',
    path: ['splits'],
  }
);

export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;

// List expenses query params
export const listExpensesQuerySchema = z.object({
  page: z.string().optional().default('1').transform(Number),
  limit: z.string().optional().default('20').transform(Number),
  categoryId: z.string().uuid('Invalid category ID').optional(),
});

export type ListExpensesQuery = z.infer<typeof listExpensesQuerySchema>;

// Create comment
export const createCommentSchema = z.object({
  body: z.string().min(1, 'Comment cannot be empty').max(1000),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;

// Category response
export const categoryResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  icon: z.string(),
});

export type CategoryResponse = z.infer<typeof categoryResponseSchema>;

// Split response
export const splitResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  userName: z.string(),
  shareAmount: z.number(),
});

export type SplitResponse = z.infer<typeof splitResponseSchema>;

// Comment response
export const commentResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  userName: z.string(),
  userAvatar: z.string().nullable(),
  body: z.string(),
  createdAt: z.string(),
});

export type CommentResponse = z.infer<typeof commentResponseSchema>;

// Audit log response
export const auditLogResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  userName: z.string(),
  action: z.enum(['CREATED', 'UPDATED', 'DELETED']),
  changes: z.record(z.any()).nullable(),
  createdAt: z.string(),
});

export type AuditLogResponse = z.infer<typeof auditLogResponseSchema>;

// Expense response
export const expenseResponseSchema = z.object({
  id: z.string(),
  groupId: z.string(),
  description: z.string(),
  amount: z.number(),
  paidById: z.string(),
  paidByName: z.string(),
  categoryId: z.string().nullable(),
  categoryName: z.string().nullable(),
  categoryIcon: z.string().nullable(),
  receiptUrl: z.string().nullable(),
  createdById: z.string(),
  createdByName: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  splits: z.array(splitResponseSchema),
});

export type ExpenseResponse = z.infer<typeof expenseResponseSchema>;

// Expense detail response (includes comments and history)
export const expenseDetailResponseSchema = expenseResponseSchema.extend({
  comments: z.array(commentResponseSchema),
  auditLogs: z.array(auditLogResponseSchema),
});

export type ExpenseDetailResponse = z.infer<typeof expenseDetailResponseSchema>;
