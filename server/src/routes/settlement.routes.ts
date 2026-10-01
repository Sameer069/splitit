import { Router } from 'express';
import { settlementController } from '../controllers/settlement.controller';
import { authenticate } from '../middleware/auth.middleware';
import {
  requireGroupMembership,
  requireSettlementParticipant,
} from '../middleware/group.middleware';
import { validateBody, validateQuery } from '../middleware/validate.middleware';
import {
  createSettlementSchema,
  listSettlementsQuerySchema,
} from './validation/settlement.schema';

const router = Router();

// All settlement routes require authentication
router.use(authenticate);

/**
 * GET /api/groups/:id/balances
 * Get current balances and settlement suggestions for a group
 * Requires: group membership
 */
router.get(
  '/groups/:id/balances',
  requireGroupMembership,
  settlementController.getBalances
);

/**
 * POST /api/groups/:id/settlements
 * Record a settlement (payment made)
 * Requires: group membership + must be one of the two parties
 */
router.post(
  '/groups/:id/settlements',
  requireGroupMembership,
  requireSettlementParticipant,
  validateBody(createSettlementSchema),
  settlementController.create
);

/**
 * GET /api/groups/:id/settlements
 * List settlement history for a group
 * Requires: group membership
 * Query params: page, limit
 */
router.get(
  '/groups/:id/settlements',
  requireGroupMembership,
  validateQuery(listSettlementsQuerySchema),
  settlementController.list
);

export default router;
