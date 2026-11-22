import type { RequestHandler } from 'express';
import jwt, { type JwtPayload } from 'jsonwebtoken';
import { env } from '../config/env';
import { User, type UserRole } from '../models/User';
import { asyncHandler } from '../utils/asyncHandler';
import { HttpError } from '../utils/httpError';

export const authenticate: RequestHandler = asyncHandler(async (req, _res, next) => {
  const authorization = req.header('Authorization');
  if (!authorization?.startsWith('Bearer ')) {
    throw new HttpError(401, 'Bearer token required');
  }
  const token = authorization.slice(7).trim();
  let payload: string | JwtPayload;
  try {
    payload = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] });
  } catch {
    throw new HttpError(401, 'Invalid or expired token');
  }
  if (typeof payload === 'string' || typeof payload.sub !== 'string' ||
      !/^[0-9a-fA-F]{24}$/.test(payload.sub)) {
    throw new HttpError(401, 'Invalid token payload');
  }
  const user = await User.findById(payload.sub).lean();
  if (!user) throw new HttpError(401, 'User no longer exists');
  req.currentUser = { id: String(user._id), name: user.name, email: user.email, role: user.role };
  next();
});

export const requireRole = (role: UserRole): RequestHandler => (req, _res, next) => {
  if (!req.currentUser) return next(new HttpError(401, 'Authentication required'));
  if (req.currentUser.role !== role) return next(new HttpError(403, 'Insufficient permissions'));
  next();
};
