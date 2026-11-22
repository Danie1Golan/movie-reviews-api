import { User, type UserRole } from '../models/User';
import { Review } from '../models/Review';
import { publicUser } from './auth.service';
import { HttpError } from '../utils/httpError';

export async function listUsers() {
  const users = await User.find().sort({ createdAt: -1 }).lean();
  return { data: users.map(publicUser) };
}

export async function changeRole(id: string, role: UserRole, actorId: string) {
  if (id === actorId) throw new HttpError(403, 'You cannot change your own role');
  const user = await User.findByIdAndUpdate(id, { role }, { new: true, runValidators: true }).lean();
  if (!user) throw new HttpError(404, 'User not found');
  return publicUser(user);
}

export async function deleteUser(id: string, actorId: string) {
  if (id === actorId) throw new HttpError(403, 'You cannot delete your own account');
  const user = await User.findByIdAndDelete(id);
  if (!user) throw new HttpError(404, 'User not found');
  await Review.deleteMany({ userId: user._id });
}
