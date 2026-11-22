import { Router } from 'express';
import { registerController, loginController } from '../controllers/auth.controller';
import { validateBody } from '../middleware/validate';
import { registerSchema, loginSchema } from '../schemas/auth.schemas';
import { asyncHandler } from '../utils/asyncHandler';

export const authRouter = Router();
authRouter.post('/register', validateBody(registerSchema), asyncHandler(registerController));
authRouter.post('/login', validateBody(loginSchema), asyncHandler(loginController));
