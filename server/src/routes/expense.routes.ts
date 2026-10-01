import { Router } from 'express';
import { expenseController } from '../controllers/expense.controller';
import { categoryController } from '../controllers/category.controller';
import { authenticate } from '../middleware/auth.middleware';
import {
  requireGroupMembership,
  requireExpenseModifyPermission,
  requireCommentDeletePermission,
} from '../middleware/group.middleware';
import { validateBody, validateQuery } from '../middleware/validate.middleware';
import {
  createExpenseSchema,
  updateExpenseSchema,
  listExpensesQuerySchema,
  createCommentSchema,
} from './validation/expense.schema';

const router = Router();

// All expense routes require authentication
router.use(authenticate);

/**
 * GET /api/categories
 * Get all expense categories
 * Public to authenticated users
 */
router.get('/categories', categoryController.list);

/**
 * POST /api/groups/:id/expenses
 * Create a new expense in a group
 * Requires: group membership
 */
router.post(
  '/groups/:id/expenses',
  requireGroupMembership,
  validateBody(createExpenseSchema),
  expenseController.create
);

/**
 * GET /api/groups/:id/expenses
 * List expenses for a group with pagination
 * Requires: group membership
 * Query params: page, limit, categoryId (optional)
 */
router.get(
  '/groups/:id/expenses',
  requireGroupMembership,
  validateQuery(listExpensesQuerySchema),
  expenseController.list
);

/**
 * GET /api/groups/:id/expenses/:expenseId
 * Get expense detail with comments and history
 * Requires: group membership
 */
router.get(
  '/groups/:id/expenses/:expenseId',
  requireGroupMembership,
  expenseController.getOne
);

/**
 * PATCH /api/groups/:id/expenses/:expenseId
 * Update an expense
 * Requires: group membership + (expense creator OR group owner)
 */
router.patch(
  '/groups/:id/expenses/:expenseId',
  requireGroupMembership,
  requireExpenseModifyPermission,
  validateBody(updateExpenseSchema),
  expenseController.update
);

/**
 * DELETE /api/groups/:id/expenses/:expenseId
 * Delete an expense
 * Requires: group membership + (expense creator OR group owner)
 */
router.delete(
  '/groups/:id/expenses/:expenseId',
  requireGroupMembership,
  requireExpenseModifyPermission,
  expenseController.delete
);

/**
 * POST /api/groups/:id/expenses/:expenseId/comments
 * Add a comment to an expense
 * Requires: group membership
 */
router.post(
  '/groups/:id/expenses/:expenseId/comments',
  requireGroupMembership,
  validateBody(createCommentSchema),
  expenseController.addComment
);

/**
 * DELETE /api/groups/:id/expenses/:expenseId/comments/:commentId
 * Delete a comment
 * Requires: group membership + (comment author OR group owner)
 */
router.delete(
  '/groups/:id/expenses/:expenseId/comments/:commentId',
  requireGroupMembership,
  requireCommentDeletePermission,
  expenseController.deleteComment
);

/**
 * GET /api/groups/:id/expenses/:expenseId/history
 * Get expense audit history
 * Requires: group membership
 */
router.get(
  '/groups/:id/expenses/:expenseId/history',
  requireGroupMembership,
  expenseController.getHistory
);

export default router;
