import { z } from 'zod';

const year = z.number().int().min(1888).max(new Date().getFullYear() + 5);

export const createMovieSchema = z.strictObject({
  title: z.string().trim().min(1).max(150),
  year,
  genre: z.string().trim().min(2).max(80),
  director: z.string().trim().min(2).max(120),
  actors: z.array(z.string().trim().min(1).max(100)).min(1).max(50),
  description: z.string().trim().min(10).max(3000)
});

export const updateMovieSchema = createMovieSchema.partial().refine(
  input => Object.keys(input).length > 0,
  { message: 'Supply at least one field' }
);

export const movieQuerySchema = z.object({
  search: z.string().trim().max(150).optional(),
  genre: z.string().trim().max(80).optional(),
  director: z.string().trim().max(120).optional(),
  year: z.coerce.number().int().min(1888).max(new Date().getFullYear() + 5).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10)
});
