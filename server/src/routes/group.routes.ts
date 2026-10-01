import { Router } from 'express';
import { groupController } from '../controllers/group.controller';
import { authenticate } from '../middleware/auth.middleware';
import {
  requireGroupMembership,
  requireGroupOwner,
} from '../middleware/group.middleware';
import { validateBody, validateParams } from '../middleware/validate.middleware';
import {
  createGroupSchema,
  updateGroupSchema,
  addMemberSchema,
  transferOwnershipSchema,
  groupIdParamSchema,
  memberIdParamSchema,
} from './validation/group.schema';

const router = Router();

// All group routes require authentication
router.use(authenticate);

/**
 * POST /api/groups
 * Create a new group (authenticated user becomes owner)
 */
router.post('/', validateBody(createGroupSchema), groupController.create);

/**
 * GET /api/groups/:id
 * Get group details with members
 * Requires: group membership
 */
router.get(
  '/:id',
  validateParams(groupIdParamSchema),
  requireGroupMembership,
  groupController.getOne
);

/**
 * PATCH /api/groups/:id
 * Update group name
 * Requires: group owner
 */
router.patch(
  '/:id',
  validateParams(groupIdParamSchema),
  requireGroupMembership,
  requireGroupOwner,
  validateBody(updateGroupSchema),
  groupController.update
);

/**
 * DELETE /api/groups/:id
 * Delete group
 * Requires: group owner
 * Query param: ?force=true to skip balance/invite checks
 */
router.delete(
  '/:id',
  validateParams(groupIdParamSchema),
  requireGroupMembership,
  requireGroupOwner,
  groupController.delete
);

/**
 * POST /api/groups/:id/members
 * Add existing user to group by email
 * Requires: group membership (any member can add)
 */
router.post(
  '/:id/members',
  validateParams(groupIdParamSchema),
  requireGroupMembership,
  validateBody(addMemberSchema),
  groupController.addMember
);

/**
 * DELETE /api/groups/:id/members/:userId
 * Remove a member from the group
 * Requires: group owner
 */
router.delete(
  '/:id/members/:userId',
  validateParams(groupIdParamSchema),
  requireGroupMembership,
  requireGroupOwner,
  groupController.removeMember
);

/**
 * DELETE /api/groups/:id/members/me
 * Leave group (self-removal)
 * Requires: group membership, no outstanding balance
 * Note: Owner cannot leave without transferring ownership first
 */
router.delete(
  '/:id/members/me',
  validateParams(groupIdParamSchema),
  requireGroupMembership,
  groupController.leaveGroup
);

/**
 * POST /api/groups/:id/transfer-ownership
 * Transfer group ownership to another member
 * Requires: group owner
 */
router.post(
  '/:id/transfer-ownership',
  validateParams(groupIdParamSchema),
  requireGroupMembership,
  requireGroupOwner,
  validateBody(transferOwnershipSchema),
  groupController.transferOwnership
);

export default router;
