import { Prisma } from '@prisma/client';
import { prisma } from '../../db/prisma.js';
import type { SupabaseClaims } from '../../lib/supabaseJwt.js';

/**
 * Maps a Supabase `auth.users.id` to the local `User.id`.
 *
 * Everything downstream (`ownerId === req.userId` in every service) keeps working
 * unchanged because we resolve to the *local* id here and nowhere else.
 */

const TTL_MS = 5 * 60 * 1000;
const MAX_ENTRIES = 5000;

const cache = new Map<string, { localId: string; expiresAt: number }>();

function readCache(authUserId: string): string | null {
  const hit = cache.get(authUserId);
  if (!hit) return null;
  if (hit.expiresAt < Date.now()) {
    cache.delete(authUserId);
    return null;
  }
  return hit.localId;
}

function writeCache(authUserId: string, localId: string) {
  // The mapping is immutable for a given auth user, so the only correctness
  // concern is deletion — handled by evictIdentity on the delete path.
  if (cache.size >= MAX_ENTRIES) {
    const oldest = cache.keys().next();
    if (!oldest.done) cache.delete(oldest.value);
  }
  cache.set(authUserId, { localId, expiresAt: Date.now() + TTL_MS });
}

export function evictIdentity(authUserId: string) {
  cache.delete(authUserId);
}

function displayNameFrom(claims: SupabaseClaims): string {
  const meta = claims.userMetadata;
  for (const key of ['display_name', 'full_name', 'name'] as const) {
    const value = meta[key];
    if (typeof value === 'string' && value.trim()) return value.trim().slice(0, 60);
  }
  return claims.email?.split('@')[0] ?? 'Athlete';
}

/**
 * Local user id for a verified Supabase token, provisioning one on first sight.
 *
 * Provisioning is **create-only**: it deliberately never looks up an existing row
 * by email. Linking an incoming token to a pre-existing account by email address
 * would be an account-takeover primitive whenever that email isn't verified.
 * Existing users are linked offline instead, by `scripts/importAuthUsers.ts`.
 */
export async function resolveLocalUserId(claims: SupabaseClaims): Promise<string> {
  const cached = readCache(claims.sub);
  if (cached) return cached;

  const existing = await prisma.user.findUnique({
    where: { authUserId: claims.sub },
    select: { id: true },
  });
  if (existing) {
    writeCache(claims.sub, existing.id);
    return existing.id;
  }

  try {
    const created = await prisma.user.create({
      data: {
        authUserId: claims.sub,
        email: claims.email ?? `${claims.sub}@placeholder.invalid`,
        displayName: displayNameFrom(claims),
        passwordHash: null,
      },
      select: { id: true },
    });
    writeCache(claims.sub, created.id);
    return created.id;
  } catch (err) {
    // Two concurrent first-requests can race the unique index; re-read the winner.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      const raced = await prisma.user.findUnique({
        where: { authUserId: claims.sub },
        select: { id: true },
      });
      if (raced) {
        writeCache(claims.sub, raced.id);
        return raced.id;
      }
    }
    throw err;
  }
}
