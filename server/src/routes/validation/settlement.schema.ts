import { z } from 'zod';

// Create settlement
export const createSettlementSchema = z.object({
  fromUserId: z.string().uuid('Invalid from user ID'),
  toUserId: z.string().uuid('Invalid to user ID'),
  amount: z.number().positive('Amount must be positive'),
  note: z.string().max(500).optional(),
}).refine(
  data => data.fromUserId !== data.toUserId,
  { message: 'Cannot settle with yourself', path: ['toUserId'] }
);

export type CreateSettlementInput = z.infer<typeof createSettlementSchema>;

// List settlements query params
export const listSettlementsQuerySchema = z.object({
  page: z.string().optional().default('1').transform(Number),
  limit: z.string().optional().default('20').transform(Number),
});

export type ListSettlementsQuery = z.infer<typeof listSettlementsQuerySchema>;

// Balance response
export const balanceResponseSchema = z.object({
  userId: z.string(),
  userName: z.string(),
  userAvatar: z.string().nullable(),
  balance: z.number(), // positive = owed to them, negative = they owe
});

export type BalanceResponse = z.infer<typeof balanceResponseSchema>;

// Simplified settlement suggestion
export const settlementSuggestionSchema = z.object({
  fromUserId: z.string(),
  fromUserName: z.string(),
  toUserId: z.string(),
  toUserName: z.string(),
  amount: z.number(),
});

export type SettlementSuggestion = z.infer<typeof settlementSuggestionSchema>;

// Balance summary response
export const balanceSummaryResponseSchema = z.object({
  balances: z.array(balanceResponseSchema),
  suggestions: z.array(settlementSuggestionSchema),
});

export type BalanceSummaryResponse = z.infer<typeof balanceSummaryResponseSchema>;

// Settlement response
export const settlementResponseSchema = z.object({
  id: z.string(),
  groupId: z.string(),
  fromUserId: z.string(),
  fromUserName: z.string(),
  toUserId: z.string(),
  toUserName: z.string(),
  amount: z.number(),
  note: z.string().nullable(),
  settledAt: z.string(),
});

export type SettlementResponse = z.infer<typeof settlementResponseSchema>;
