import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { ForbiddenError, NotFoundError, UnauthorizedError } from '../utils/errors';
import { Role } from '@prisma/client';

/**
 * Verify user is a member of the group specified in req.params.id
 * Must run after authenticate middleware
 * Attaches req.membership for downstream handlers
 */
export const requireGroupMembership = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    const groupId = req.params.id || req.params.groupId;
    
    if (!groupId) {
      throw new NotFoundError('Group ID not provided in request');
    }

    // Check if user is a member of this group
    const membership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId: req.user.id,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenError('You are not a member of this group');
    }

    // Attach membership to request for downstream use
    req.membership = {
      id: membership.id,
      groupId: membership.groupId,
      userId: membership.userId,
      role: membership.role,
      joinedAt: membership.joinedAt,
    };

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Verify user is the owner of the group
 * Must run after requireGroupMembership
 */
export const requireGroupOwner = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    if (!req.membership) {
      throw new ForbiddenError('Group membership not verified');
    }

    if (req.membership.role !== Role.OWNER) {
      throw new ForbiddenError('Only group owners can perform this action');
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Verify user can modify an expense (creator or group owner)
 * Must run after requireGroupMembership
 */
export const requireExpenseModifyPermission = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    if (!req.membership) {
      throw new ForbiddenError('Group membership not verified');
    }

    const expenseId = req.params.expenseId;
    
    if (!expenseId) {
      throw new NotFoundError('Expense ID not provided in request');
    }

    // Fetch the expense
    const expense = await prisma.expense.findUnique({
      where: { id: expenseId },
      select: {
        id: true,
        groupId: true,
        createdById: true,
      },
    });

    if (!expense) {
      throw new NotFoundError('Expense not found');
    }

    // Verify expense belongs to the group
    if (expense.groupId !== req.membership.groupId) {
      throw new ForbiddenError('Expense does not belong to this group');
    }

    // Allow if user is the creator OR group owner
    const canModify =
      expense.createdById === req.user.id || 
      req.membership.role === Role.OWNER;

    if (!canModify) {
      throw new ForbiddenError('Only the expense creator or group owner can modify this expense');
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Verify user can delete a comment (comment author or group owner)
 * Must run after requireGroupMembership
 */
export const requireCommentDeletePermission = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    if (!req.membership) {
      throw new ForbiddenError('Group membership not verified');
    }

    const commentId = req.params.commentId;
    
    if (!commentId) {
      throw new NotFoundError('Comment ID not provided in request');
    }

    // Fetch the comment
    const comment = await prisma.expenseComment.findUnique({
      where: { id: commentId },
      select: {
        id: true,
        userId: true,
        expense: {
          select: {
            groupId: true,
          },
        },
      },
    });

    if (!comment) {
      throw new NotFoundError('Comment not found');
    }

    // Verify comment belongs to an expense in this group
    if (comment.expense.groupId !== req.membership.groupId) {
      throw new ForbiddenError('Comment does not belong to this group');
    }

    // Allow if user is the author OR group owner
    const canDelete =
      comment.userId === req.user.id || 
      req.membership.role === Role.OWNER;

    if (!canDelete) {
      throw new ForbiddenError('Only the comment author or group owner can delete this comment');
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Verify user can create a settlement (must be one of the parties involved)
 * Must run after requireGroupMembership
 * Validates req.body contains fromUserId or toUserId matching the authenticated user
 */
export const requireSettlementParticipant = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    const { fromUserId, toUserId } = req.body as { fromUserId?: string; toUserId?: string };

    if (!fromUserId || !toUserId) {
      throw new ForbiddenError('Settlement must specify both fromUserId and toUserId');
    }

    // User must be one of the two parties
    const isParticipant = 
      fromUserId === req.user.id || 
      toUserId === req.user.id;

    if (!isParticipant) {
      throw new ForbiddenError('You can only create settlements where you are a participant');
    }

    next();
  } catch (error) {
    next(error);
  }
};
