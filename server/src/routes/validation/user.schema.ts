import { z } from 'zod';

// Update profile (name, avatar)
export const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100).optional(),
  avatarUrl: z.string().url('Invalid avatar URL').nullable().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

// User response (never includes password hash)
export const userResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  avatarUrl: z.string().nullable(),
  authProvider: z.enum(['EMAIL', 'GOOGLE']),
  createdAt: z.string(),
});

export type UserResponse = z.infer<typeof userResponseSchema>;
