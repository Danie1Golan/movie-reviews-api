import type { Request, Response } from 'express';
import type { z } from 'zod';
import type { updateRoleSchema } from '../schemas/user.schemas';
import * as service from '../services/user.service';
import { requireObjectId } from '../utils/ids';
import { HttpError } from '../utils/httpError';

function actorId(req: Request) {
  if (!req.currentUser) throw new HttpError(401, 'Authentication required');
  return req.currentUser.id;
}

export async function meController(req: Request, res: Response) {
  res.json({ user: req.currentUser });
}
export async function listUsersController(_req: Request, res: Response) {
  res.json(await service.listUsers());
}
export async function updateRoleController(req: Request, res: Response) {
  const { role } = req.body as z.infer<typeof updateRoleSchema>;
  res.json(await service.changeRole(requireObjectId(req.params.id), role, actorId(req)));
}
export async function deleteUserController(req: Request, res: Response) {
  await service.deleteUser(requireObjectId(req.params.id), actorId(req));
  res.status(204).send();
}
