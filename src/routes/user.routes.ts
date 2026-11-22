import { Router } from 'express';
import * as user from '../controllers/user.controller';
import { authenticate, requireRole } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { updateRoleSchema } from '../schemas/user.schemas';
import { asyncHandler } from '../utils/asyncHandler';

export const userRouter = Router();
userRouter.get('/me', authenticate, asyncHandler(user.meController));
userRouter.get('/', authenticate, requireRole('admin'), asyncHandler(user.listUsersController));
userRouter.patch('/:id/role', authenticate, requireRole('admin'), validateBody(updateRoleSchema), asyncHandler(user.updateRoleController));
userRouter.delete('/:id', authenticate, requireRole('admin'), asyncHandler(user.deleteUserController));
