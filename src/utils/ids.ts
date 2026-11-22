import { HttpError } from './httpError';

export function requireObjectId(id: string | string[] | undefined): string {
  if (typeof id !== 'string' || !/^[0-9a-fA-F]{24}$/.test(id)) {
    throw new HttpError(400, 'Invalid MongoDB ID');
  }
  return id;
}
