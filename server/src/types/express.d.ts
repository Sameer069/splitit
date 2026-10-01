// Extend Express Request type to include custom properties

import { Role } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name: string;
      };
      membership?: {
        id: string;
        groupId: string;
        userId: string;
        role: Role;
        joinedAt: Date;
      };
    }
  }
}

export {};
