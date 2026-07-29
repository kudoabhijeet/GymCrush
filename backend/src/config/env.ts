import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL: z.string().default('30d'),

  /**
   * Supabase Auth. Optional on purpose during the migration: if unset the API
   * simply keeps using legacy JWTs, so a deploy that's missing these boots and
   * serves rather than crash-looping.
   */
  SUPABASE_URL: z.string().url().optional(),
  /** Server-only. Never expose to the app — it bypasses all row security. */
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20).optional(),
  /** Comma-separated allowlist. Unset => reflect any origin (dev default). */
  CORS_ORIGINS: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
  throw new Error('Invalid environment configuration. See backend/.env.example');
}

export const env = parsed.data;
