import { z } from 'zod';

// Create group
export const createGroupSchema = z.object({
  name: z.string().min(2, 'Group name must be at least 2 characters').max(100),
});

export type CreateGroupInput = z.infer<typeof createGroupSchema>;

// Update group
export const updateGroupSchema = z.object({
  name: z.string().min(2, 'Group name must be at least 2 characters').max(100),
});

export type UpdateGroupInput = z.infer<typeof updateGroupSchema>;

// Add member by email
export const addMemberSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export type AddMemberInput = z.infer<typeof addMemberSchema>;

// Transfer ownership
export const transferOwnershipSchema = z.object({
  newOwnerId: z.string().uuid('Invalid user ID'),
});

export type TransferOwnershipInput = z.infer<typeof transferOwnershipSchema>;

// Group ID param validation
export const groupIdParamSchema = z.object({
  id: z.string().uuid('Invalid group ID'),
});

// Member ID param validation
export const memberIdParamSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
});

// Group response schemas
export const groupMemberResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string(),
  email: z.string(),
  avatarUrl: z.string().nullable(),
  role: z.enum(['OWNER', 'MEMBER']),
  joinedAt: z.string(),
});

export const groupResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  createdById: z.string(),
  createdAt: z.string(),
  memberCount: z.number(),
  expenseCount: z.number(),
});

export const groupDetailResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  createdById: z.string(),
  createdAt: z.string(),
  members: z.array(groupMemberResponseSchema),
  memberCount: z.number(),
  expenseCount: z.number(),
});

export type GroupMemberResponse = z.infer<typeof groupMemberResponseSchema>;
export type GroupResponse = z.infer<typeof groupResponseSchema>;
export type GroupDetailResponse = z.infer<typeof groupDetailResponseSchema>;
