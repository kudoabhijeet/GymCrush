import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

/**
 * Most brute-force surface moved to Supabase (which has its own per-endpoint
 * limits), so these exist to protect *this* API: bcrypt on the legacy login path
 * is CPU-expensive, and account deletion is destructive.
 *
 * Disabled outside production so local dev and smoke tests aren't throttled.
 */
const enabled = env.NODE_ENV === 'production';

const common = {
  standardHeaders: 'draft-7' as const,
  legacyHeaders: false,
  skip: () => !enabled,
  message: { error: 'Too many requests, please try again shortly.' },
};

/** Broad backstop for the whole API. */
export const globalLimiter = rateLimit({
  ...common,
  windowMs: 60_000,
  limit: 120,
});

/** Tighter: credential endpoints and account deletion. */
export const authLimiter = rateLimit({
  ...common,
  windowMs: 15 * 60_000,
  limit: 30,
});
