import type { Request, Response } from 'express';
import type { z } from 'zod';
import type { createReviewSchema, updateReviewSchema } from '../schemas/review.schemas';
import * as service from '../services/review.service';
import { requireObjectId } from '../utils/ids';
import { HttpError } from '../utils/httpError';

function actor(req: Request) {
  if (!req.currentUser) throw new HttpError(401, 'Authentication required');
  return req.currentUser;
}

export async function listReviewsController(req: Request, res: Response) {
  res.json(await service.listReviews(requireObjectId(req.params.movieId)));
}
export async function createReviewController(req: Request, res: Response) {
  res.status(201).json(await service.createReview(
    requireObjectId(req.params.movieId), actor(req).id, req.body as z.infer<typeof createReviewSchema>
  ));
}
export async function updateReviewController(req: Request, res: Response) {
  res.json(await service.updateReview(
    requireObjectId(req.params.id), actor(req), req.body as z.infer<typeof updateReviewSchema>
  ));
}
export async function deleteReviewController(req: Request, res: Response) {
  await service.deleteReview(requireObjectId(req.params.id), actor(req));
  res.status(204).send();
}
