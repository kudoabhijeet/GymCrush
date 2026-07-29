import type { NextFunction, Request, Response } from 'express';
import { unauthorized } from '../lib/errors.js';
import { verifyAccessToken } from '../lib/tokens.js';
import { supabaseAuthEnabled, verifySupabaseToken } from '../lib/supabaseJwt.js';
import { resolveLocalUserId } from '../modules/auth/identity.js';

/** Augment Express Request with the authenticated user id. */
export interface AuthedRequest extends Request {
  /** Local `User.id` — the id every service scopes ownership by. */
  userId: string;
  /** Supabase `auth.users.id`, when the caller authenticated via Supabase. */
  authUserId?: string;
}

/**
 * Resolves a bearer token to a local user id, accepting both Supabase Auth
 * tokens and the legacy self-issued ones.
 *
 * The dual path is what lets the API deploy ahead of the app release: old builds
 * keep working on legacy tokens while new builds use Supabase. It is removed
 * once every client is on Supabase.
 */
async function authenticate(req: Request): Promise<void> {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) throw unauthorized('Missing bearer token');
  const token = header.slice('Bearer '.length);

  if (supabaseAuthEnabled) {
    try {
      const claims = await verifySupabaseToken(token);
      const authed = req as AuthedRequest;
      authed.userId = await resolveLocalUserId(claims);
      authed.authUserId = claims.sub;
      return;
    } catch {
      // Not a valid Supabase token — fall through to the legacy verifier.
    }
  }

  try {
    const payload = verifyAccessToken(token);
    (req as AuthedRequest).userId = payload.sub;
  } catch {
    throw unauthorized('Invalid or expired token');
  }
}

/** Requires a valid Bearer access token; attaches `req.userId`. */
export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  // Express 4 doesn't catch rejections from async middleware, so bridge manually.
  authenticate(req).then(() => next(), next);
}
