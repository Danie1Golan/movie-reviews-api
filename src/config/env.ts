import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  MONGODB_URI: z.string().min(1),
  JWT_SECRET: z.string().min(32).refine(value => !value.startsWith('CHANGE_ME'), {
    message: 'Replace the example JWT secret with a random value'
  }),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development')
});

export const env = envSchema.parse(process.env);
