import { describe, expect, it } from 'vitest';
import { createMovieSchema, updateMovieSchema, movieQuerySchema } from '../../src/schemas/movie.schemas';
import { createReviewSchema, updateReviewSchema } from '../../src/schemas/review.schemas';
import { registerSchema } from '../../src/schemas/auth.schemas';
import { requireObjectId } from '../../src/utils/ids';

const movie = {
  title: 'The Example', year: 2021, genre: 'Drama', director: 'Jane Director',
  actors: ['Actor One'], description: 'A complete description of the movie.'
};

describe('input validation (unit)', () => {
  it('accepts valid movie data', () => {
    expect(createMovieSchema.safeParse(movie).success).toBe(true);
  });
  it('rejects a movie with missing actors and unknown fields', () => {
    expect(createMovieSchema.safeParse({ ...movie, actors: [] }).success).toBe(false);
    expect(createMovieSchema.safeParse({ ...movie, isAdmin: true }).success).toBe(false);
  });
  it('requires at least one PATCH field', () => {
    expect(updateMovieSchema.safeParse({}).success).toBe(false);
    expect(updateMovieSchema.safeParse({ title: 'New title' }).success).toBe(true);
    expect(updateReviewSchema.safeParse({}).success).toBe(false);
  });
  it('rejects ratings outside 1..10', () => {
    expect(createReviewSchema.safeParse({ rating: 11, text: 'Excellent' }).success).toBe(false);
    expect(createReviewSchema.safeParse({ rating: 0, text: 'Poor' }).success).toBe(false);
    expect(createReviewSchema.safeParse({ rating: 8, text: 'Good review' }).success).toBe(true);
  });
  it('rejects escalation via registration payload', () => {
    expect(registerSchema.safeParse({
      name: 'Jane Doe', email: 'jane@example.com', password: 'password123', role: 'admin'
    }).success).toBe(false);
  });
  it('parses pagination safely', () => {
    expect(movieQuerySchema.parse({ page: '2', limit: '5' })).toMatchObject({ page: 2, limit: 5 });
    expect(movieQuerySchema.safeParse({ page: '0' }).success).toBe(false);
    expect(movieQuerySchema.safeParse({ limit: '101' }).success).toBe(false);
  });
  it('validates exact ObjectId shape', () => {
    expect(requireObjectId('507f1f77bcf86cd799439011')).toBe('507f1f77bcf86cd799439011');
    expect(() => requireObjectId('incorrect')).toThrow('Invalid MongoDB ID');
  });
});
