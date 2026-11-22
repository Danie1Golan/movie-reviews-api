import { type FilterQuery, Types } from 'mongoose';
import { Movie, type IMovie } from '../models/Movie';
import { Review } from '../models/Review';
import type { z } from 'zod';
import type { createMovieSchema, movieQuerySchema, updateMovieSchema } from '../schemas/movie.schemas';
import { HttpError } from '../utils/httpError';

export type MovieStats = { reviewCount: number; averageRating: number | null };

// Pure calculation reused by the database aggregation and unit tests.
export function toRatingStats(totalRating: number, reviewCount: number): MovieStats {
  if (reviewCount === 0) return { reviewCount: 0, averageRating: null };
  return { reviewCount, averageRating: Math.round((totalRating / reviewCount) * 100) / 100 };
}

export function calculateAverage(ratings: number[]): MovieStats {
  return toRatingStats(ratings.reduce((total, rating) => total + rating, 0), ratings.length);
}

function escapedRegex(value: string): RegExp {
  return new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
}

type MovieShape = IMovie & { _id: Types.ObjectId };
export function movieResponse(movie: MovieShape, stats: MovieStats = { reviewCount: 0, averageRating: null }) {
  return {
    id: String(movie._id), title: movie.title, year: movie.year,
    genre: movie.genre, director: movie.director, actors: movie.actors,
    description: movie.description,
    reviewCount: stats.reviewCount, averageRating: stats.averageRating,
    createdAt: movie.createdAt, updatedAt: movie.updatedAt
  };
}

async function statsByMovieId(ids: Types.ObjectId[]): Promise<Map<string, MovieStats>> {
  if (!ids.length) return new Map();
  const rows = await Review.aggregate<{
    _id: Types.ObjectId; reviewCount: number; totalRating: number;
  }>([
    { $match: { movieId: { $in: ids } } },
    { $group: { _id: '$movieId', reviewCount: { $sum: 1 }, totalRating: { $sum: '$rating' } } }
  ]);
  return new Map(rows.map(row => [String(row._id), toRatingStats(row.totalRating, row.reviewCount)]));
}

export async function listMovies(input: z.infer<typeof movieQuerySchema>) {
  const filter: FilterQuery<IMovie> = {};
  if (input.search) filter.title = escapedRegex(input.search);
  if (input.genre) filter.genre = escapedRegex(input.genre);
  if (input.director) filter.director = escapedRegex(input.director);
  if (input.year !== undefined) filter.year = input.year;

  const [movies, total] = await Promise.all([
    Movie.find(filter).sort({ createdAt: -1, _id: -1 })
      .skip((input.page - 1) * input.limit).limit(input.limit).lean(),
    Movie.countDocuments(filter)
  ]);
  const stats = await statsByMovieId(movies.map(movie => movie._id));
  return {
    data: movies.map(movie => movieResponse(movie, stats.get(String(movie._id)))),
    pagination: { page: input.page, limit: input.limit, total, pages: Math.ceil(total / input.limit) }
  };
}

export async function getMovie(id: string) {
  const movie = await Movie.findById(id).lean();
  if (!movie) throw new HttpError(404, 'Movie not found');
  const stats = await statsByMovieId([movie._id]);
  return movieResponse(movie, stats.get(String(movie._id)));
}

export async function createMovie(input: z.infer<typeof createMovieSchema>) {
  const movie = await Movie.create(input);
  return movieResponse(movie);
}

export async function updateMovie(id: string, input: z.infer<typeof updateMovieSchema>) {
  const movie = await Movie.findByIdAndUpdate(id, { $set: input }, { new: true, runValidators: true }).lean();
  if (!movie) throw new HttpError(404, 'Movie not found');
  const stats = await statsByMovieId([movie._id]);
  return movieResponse(movie, stats.get(String(movie._id)));
}

export async function deleteMovie(id: string) {
  const movie = await Movie.findByIdAndDelete(id);
  if (!movie) throw new HttpError(404, 'Movie not found');
  await Review.deleteMany({ movieId: movie._id });
}
