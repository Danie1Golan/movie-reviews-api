import type { Request, Response } from 'express';
import { register, login } from '../services/auth.service';
import type { z } from 'zod';
import type { registerSchema, loginSchema } from '../schemas/auth.schemas';

export async function registerController(req: Request, res: Response) {
  res.status(201).json(await register(req.body as z.infer<typeof registerSchema>));
}
export async function loginController(req: Request, res: Response) {
  res.json(await login(req.body as z.infer<typeof loginSchema>));
}
