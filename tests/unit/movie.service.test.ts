import { describe, expect, it } from 'vitest';
import { calculateAverage, toRatingStats } from '../../src/services/movie.service';

describe('rating summary (unit)', () => {
  it('returns zero and null for a movie with no reviews', () => {
    expect(calculateAverage([])).toEqual({ reviewCount: 0, averageRating: null });
  });
  it('calculates average and count for several reviews', () => {
    expect(calculateAverage([9, 7, 8])).toEqual({ reviewCount: 3, averageRating: 8 });
  });
  it('aggregated sum and count share the tested computation', () => {
    expect(toRatingStats(19, 2)).toEqual({ reviewCount: 2, averageRating: 9.5 });
  });
  it('rounds to two decimal digits', () => {
    expect(calculateAverage([10, 9, 8])).toEqual({ reviewCount: 3, averageRating: 9 });
    expect(calculateAverage([6, 7, 7])).toEqual({ reviewCount: 3, averageRating: 6.67 });
  });
});
