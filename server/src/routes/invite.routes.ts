import { Router } from 'express';
import { inviteController } from '../controllers/invite.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireGroupMembership } from '../middleware/group.middleware';
import { validateBody, validateParams } from '../middleware/validate.middleware';
import { createInviteSchema, acceptInviteParamSchema } from './validation/invite.schema';

const router = Router();

/**
 * POST /api/groups/:id/invites
 * Create and send an invite to join a group
 * Requires: group membership
 */
router.post(
  '/groups/:id/invites',
  authenticate,
  requireGroupMembership,
  validateBody(createInviteSchema),
  inviteController.create
);

/**
 * GET /api/groups/:id/invites
 * List all invites for a group
 * Requires: group membership
 */
router.get(
  '/groups/:id/invites',
  authenticate,
  requireGroupMembership,
  inviteController.listGroupInvites
);

/**
 * GET /api/invites/pending
 * Get pending invites for the logged-in user
 * Requires: authentication
 */
router.get('/invites/pending', authenticate, inviteController.listPending);

/**
 * GET /api/invites/:token
 * Get invite details (preview before accepting)
 * Public endpoint - no auth required (token is the auth)
 */
router.get(
  '/invites/:token',
  validateParams(acceptInviteParamSchema),
  inviteController.getDetails
);

/**
 * POST /api/invites/:token/accept
 * Accept an invite and join the group
 * Requires: authentication
 */
router.post(
  '/invites/:token/accept',
  authenticate,
  validateParams(acceptInviteParamSchema),
  inviteController.accept
);

export default router;
