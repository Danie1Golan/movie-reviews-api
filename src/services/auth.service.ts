import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { User } from '../models/User';
import type { z } from 'zod';
import type { loginSchema, registerSchema } from '../schemas/auth.schemas';
import { HttpError } from '../utils/httpError';

export function publicUser(user: { _id: unknown; name: string; email: string; role: string }) {
  return { id: String(user._id), name: user.name, email: user.email, role: user.role };
}

function tokenFor(user: { _id: unknown; role: string }) {
  return jwt.sign({ role: user.role }, env.JWT_SECRET, {
    subject: String(user._id), algorithm: 'HS256', expiresIn: '2h'
  });
}

export async function register(input: z.infer<typeof registerSchema>) {
  if (await User.exists({ email: input.email })) throw new HttpError(409, 'Email already registered');
  const user = await User.create({
    name: input.name, email: input.email,
    passwordHash: await bcrypt.hash(input.password, 12), role: 'user'
  });
  return { user: publicUser(user), token: tokenFor(user) };
}

export async function login(input: z.infer<typeof loginSchema>) {
  const user = await User.findOne({ email: input.email }).select('+passwordHash');
  if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
    throw new HttpError(401, 'Invalid email or password');
  }
  return { user: publicUser(user), token: tokenFor(user) };
}
