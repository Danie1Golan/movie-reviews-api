import { Router } from 'express';
import { updateReviewController, deleteReviewController } from '../controllers/review.controller';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { updateReviewSchema } from '../schemas/review.schemas';
import { asyncHandler } from '../utils/asyncHandler';

export const reviewRouter = Router();
reviewRouter.patch('/:id', authenticate, validateBody(updateReviewSchema), asyncHandler(updateReviewController));
reviewRouter.delete('/:id', authenticate, asyncHandler(deleteReviewController));
