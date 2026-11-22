import { z } from 'zod';

export const createReviewSchema = z.strictObject({
  rating: z.number().int().min(1).max(10),
  text: z.string().trim().min(3).max(2000)
});
export const updateReviewSchema = createReviewSchema.partial().refine(
  input => Object.keys(input).length > 0,
  { message: 'Supply at least one field' }
);
