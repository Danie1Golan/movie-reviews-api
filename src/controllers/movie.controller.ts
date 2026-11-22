import type { Request, Response } from 'express';
import type { z } from 'zod';
import { movieQuerySchema, type createMovieSchema, type updateMovieSchema } from '../schemas/movie.schemas';
import * as service from '../services/movie.service';
import { requireObjectId } from '../utils/ids';

export async function listMoviesController(req: Request, res: Response) {
  res.json(await service.listMovies(movieQuerySchema.parse(req.query)));
}
export async function getMovieController(req: Request, res: Response) {
  res.json(await service.getMovie(requireObjectId(req.params.id)));
}
export async function createMovieController(req: Request, res: Response) {
  res.status(201).json(await service.createMovie(req.body as z.infer<typeof createMovieSchema>));
}
export async function updateMovieController(req: Request, res: Response) {
  res.json(await service.updateMovie(requireObjectId(req.params.id), req.body as z.infer<typeof updateMovieSchema>));
}
export async function deleteMovieController(req: Request, res: Response) {
  await service.deleteMovie(requireObjectId(req.params.id));
  res.status(204).send();
}
