import { HttpError } from './httpError';

export function requireObjectId(id: string | undefined): string {
  if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
    throw new HttpError(400, 'Invalid MongoDB ID');
  }
  return id;
}
