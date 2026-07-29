import { createRemoteJWKSet, jwtVerify } from 'jose';
import { env } from '../config/env.js';

/**
 * Verifies access tokens minted by Supabase Auth (GoTrue).
 *
 * Asymmetric (ES256) via the project's JWKS, not the legacy shared HS256 secret:
 * `signInWithIdToken` — which native Apple sign-in needs — refuses to work on a
 * project still using symmetric keys, so this isn't a preference. It also means
 * no signing secret has to exist in the API's environment at all.
 */

export interface SupabaseClaims {
  /** `auth.users.id`. */
  sub: string;
  email?: string;
  emailVerified: boolean;
  /** Whatever was passed as `options.data` on signUp / `updateUser({ data })`. */
  userMetadata: Record<string, unknown>;
}

/** Supabase Auth is only wired up once SUPABASE_URL is configured. */
export const supabaseAuthEnabled = Boolean(env.SUPABASE_URL);

const issuer = env.SUPABASE_URL ? `${env.SUPABASE_URL}/auth/v1` : undefined;

// `jose` fetches once and caches, refetching only when it sees an unknown kid —
// so key rotation is picked up without a redeploy.
const jwks = env.SUPABASE_URL
  ? createRemoteJWKSet(new URL(`${env.SUPABASE_URL}/auth/v1/.well-known/jwks.json`))
  : null;

export async function verifySupabaseToken(token: string): Promise<SupabaseClaims> {
  if (!jwks || !issuer) throw new Error('Supabase Auth is not configured');

  const { payload } = await jwtVerify(token, jwks, { issuer, audience: 'authenticated' });
  if (!payload.sub) throw new Error('Token has no subject');

  return {
    sub: payload.sub,
    email: typeof payload.email === 'string' ? payload.email : undefined,
    emailVerified: payload.email_verified === true,
    userMetadata: (payload.user_metadata as Record<string, unknown> | undefined) ?? {},
  };
}
