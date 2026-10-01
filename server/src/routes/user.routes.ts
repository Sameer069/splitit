import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validate.middleware';
import { updateProfileSchema } from './validation/user.schema';

const router = Router();

// All user routes require authentication
router.use(authenticate);

// GET /api/me - Get current user profile
router.get('/', userController.getMe);

// PATCH /api/me - Update current user profile
router.patch('/', validateBody(updateProfileSchema), userController.updateMe);

// GET /api/me/groups - Get user's groups
router.get('/groups', userController.getMyGroups);

export default router;
