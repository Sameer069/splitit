import { z } from 'zod';

// Create invite
export const createInviteSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export type CreateInviteInput = z.infer<typeof createInviteSchema>;

// Accept invite (token from URL params)
export const acceptInviteParamSchema = z.object({
  token: z.string().min(1, 'Invite token is required'),
});

export type AcceptInviteParam = z.infer<typeof acceptInviteParamSchema>;

// Invite response
export const inviteResponseSchema = z.object({
  id: z.string(),
  groupId: z.string(),
  groupName: z.string(),
  email: z.string(),
  status: z.enum(['PENDING', 'ACCEPTED', 'EXPIRED']),
  invitedBy: z.object({
    id: z.string(),
    name: z.string(),
  }),
  createdAt: z.string(),
  expiresAt: z.string(),
});

export type InviteResponse = z.infer<typeof inviteResponseSchema>;
