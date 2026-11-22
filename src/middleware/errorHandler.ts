import type { ErrorRequestHandler, RequestHandler } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { HttpError } from '../utils/httpError';

export const notFound: RequestHandler = (_req, _res, next) => {
  next(new HttpError(404, 'Endpoint not found'));
};

export const errorHandler: ErrorRequestHandler = (error: unknown, _req, res, _next) => {
  if (error instanceof HttpError) {
    res.status(error.status).json({ error: error.message });
    return;
  }
  if (error instanceof z.ZodError) {
    res.status(400).json({ error: 'Validation error', details: error.issues.map(issue => ({
      field: issue.path.join('.'), message: issue.message
    })) });
    return;
  }
  if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) {
    res.status(400).json({ error: 'Invalid data', details: error.message });
    return;
  }
  if (typeof error === 'object' && error !== null && 'code' in error && error.code === 11000) {
    res.status(409).json({ error: 'This record already exists' });
    return;
  }
  if (error instanceof SyntaxError && 'body' in error) {
    res.status(400).json({ error: 'Malformed JSON' });
    return;
  }
  console.error('Unhandled error', error);
  res.status(500).json({ error: 'Internal server error' });
};
