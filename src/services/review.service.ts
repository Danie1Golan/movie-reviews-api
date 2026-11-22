import { Types } from 'mongoose';
import { Movie } from '../models/Movie';
import { Review } from '../models/Review';
import type { z } from 'zod';
import type { createReviewSchema, updateReviewSchema } from '../schemas/review.schemas';
import { HttpError } from '../utils/httpError';

async function assertMovieExists(movieId: string) {
  if (!(await Movie.exists({ _id: movieId }))) throw new HttpError(404, 'Movie not found');
}

function reviewResponse(review: {
  _id: unknown; movieId: unknown; userId: unknown;
  rating: number; text: string; createdAt?: Date; updatedAt?: Date;
}) {
  return {
    id: String(review._id), movieId: String(review.movieId),
    userId: String(review.userId), rating: review.rating, text: review.text,
    createdAt: review.createdAt, updatedAt: review.updatedAt
  };
}

export async function listReviews(movieId: string) {
  await assertMovieExists(movieId);
  const reviews = await Review.find({ movieId }).sort({ createdAt: -1, _id: -1 }).lean();
  return { data: reviews.map(reviewResponse) };
}

export async function createReview(movieId: string, userId: string, input: z.infer<typeof createReviewSchema>) {
  await assertMovieExists(movieId);
  if (await Review.exists({ movieId, userId })) {
    throw new HttpError(409, 'You have already reviewed this movie');
  }
  const review = await Review.create({
    movieId: new Types.ObjectId(movieId),
    userId: new Types.ObjectId(userId),
    ...input
  });
  return reviewResponse(review);
}

export async function updateReview(id: string, currentUser: { id: string; role: string }, input: z.infer<typeof updateReviewSchema>) {
  const review = await Review.findById(id);
  if (!review) throw new HttpError(404, 'Review not found');
  if (String(review.userId) !== currentUser.id && currentUser.role !== 'admin') {
    throw new HttpError(403, 'You can only edit your own reviews');
  }
  review.set(input);
  await review.save();
  return reviewResponse(review);
}

export async function deleteReview(id: string, currentUser: { id: string; role: string }) {
  const review = await Review.findById(id);
  if (!review) throw new HttpError(404, 'Review not found');
  if (String(review.userId) !== currentUser.id && currentUser.role !== 'admin') {
    throw new HttpError(403, 'You can only delete your own reviews');
  }
  await review.deleteOne();
}
