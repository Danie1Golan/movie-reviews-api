import { Router } from 'express';
import * as movie from '../controllers/movie.controller';
import * as review from '../controllers/review.controller';
import { authenticate, requireRole } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { createMovieSchema, updateMovieSchema } from '../schemas/movie.schemas';
import { createReviewSchema } from '../schemas/review.schemas';
import { asyncHandler } from '../utils/asyncHandler';

export const movieRouter = Router();
movieRouter.get('/', asyncHandler(movie.listMoviesController));
movieRouter.get('/:id', asyncHandler(movie.getMovieController));
movieRouter.post('/', authenticate, requireRole('admin'), validateBody(createMovieSchema), asyncHandler(movie.createMovieController));
movieRouter.patch('/:id', authenticate, requireRole('admin'), validateBody(updateMovieSchema), asyncHandler(movie.updateMovieController));
movieRouter.delete('/:id', authenticate, requireRole('admin'), asyncHandler(movie.deleteMovieController));
movieRouter.get('/:movieId/reviews', asyncHandler(review.listReviewsController));
movieRouter.post('/:movieId/reviews', authenticate, validateBody(createReviewSchema), asyncHandler(review.createReviewController));
