import { z } from 'zod';

export const updateRoleSchema = z.strictObject({ role: z.enum(['user', 'admin']) });
