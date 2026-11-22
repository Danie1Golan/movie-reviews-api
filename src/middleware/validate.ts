import type { RequestHandler } from 'express';
import { z } from 'zod';

export const validateBody = (schema: z.ZodType): RequestHandler => (req, _res, next) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return next(parsed.error);
  req.body = parsed.data;
  next();
};
