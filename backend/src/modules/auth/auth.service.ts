import bcrypt from 'bcryptjs';
import type { AuthResponse, LoginInput, PublicUser, RegisterInput } from '@gymcrush/shared';
import { prisma } from '../../db/prisma.js';
import { conflict, forbidden, notFound, unauthorized } from '../../lib/errors.js';
import { supabaseAdmin } from '../../lib/supabaseAdmin.js';
import {
  generateRefreshToken,
  hashToken,
  refreshExpiryDate,
  signAccessToken,
} from '../../lib/tokens.js';
import { evictIdentity } from './identity.js';

/**
 * Owns the curated template plans every user reads. Deleting it would cascade
 * those away for the whole product, so it is never deletable via the API.
 * Kept in sync with `prisma/seed.ts`.
 */
const SYSTEM_USER_EMAIL = 'system@gymcrush.app';

function toPublicUser(user: {
  id: string;
  email: string;
  displayName: string;
  createdAt: Date;
}) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    createdAt: user.createdAt.toISOString(),
  };
}

async function issueTokens(userId: string) {
  const accessToken = signAccessToken(userId);
  const { token, tokenHash } = generateRefreshToken();
  await prisma.refreshToken.create({
    data: { userId, tokenHash, expiresAt: refreshExpiryDate() },
  });
  return { accessToken, refreshToken: token };
}

export async function register(input: RegisterInput): Promise<AuthResponse> {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw conflict('Email already registered');

  const passwordHash = await bcrypt.hash(input.password, 12);
  const user = await prisma.user.create({
    data: { email: input.email, passwordHash, displayName: input.displayName },
  });

  const tokens = await issueTokens(user.id);
  return { user: toPublicUser(user), tokens };
}

export async function login(input: LoginInput): Promise<AuthResponse> {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) throw unauthorized('Invalid credentials');
  // No local hash => already migrated to Supabase Auth (or a service account that
  // can't log in). Same generic error, so this doesn't leak which case it is.
  if (!user.passwordHash) throw unauthorized('Invalid credentials');

  const ok = await bcrypt.compare(input.password, user.passwordHash);
  if (!ok) throw unauthorized('Invalid credentials');

  const tokens = await issueTokens(user.id);
  return { user: toPublicUser(user), tokens };
}

/** The currently authenticated user, for session hydration on app start. */
export async function getMe(userId: string): Promise<PublicUser> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw notFound('User not found');
  return toPublicUser(user);
}

/**
 * Permanently deletes the caller's account. Required by App Store guidelines.
 *
 * The auth identity goes first on purpose: that revokes every session
 * immediately, so no in-flight request can race the local delete and re-create
 * an empty row via JIT provisioning. If the local delete then fails we're left
 * with rows nobody can ever authenticate into — recoverable and harmless. The
 * reverse order fails the other way, leaving live credentials behind.
 */
export async function deleteAccount(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, authUserId: true },
  });
  if (!user) throw notFound('User not found');
  if (user.email === SYSTEM_USER_EMAIL) throw forbidden('This account cannot be deleted');

  if (user.authUserId) {
    const { error } = await supabaseAdmin().auth.admin.deleteUser(user.authUserId);
    // "not found" means the identity is already gone; anything else must abort
    // so we never delete local data while the credentials still work.
    if (error && error.status !== 404) {
      throw new Error(`Failed to delete Supabase user: ${error.message}`);
    }
    evictIdentity(user.authUserId);
  }

  // Cascades across plans, sessions, logs, profile and targets.
  await prisma.user.delete({ where: { id: user.id } });
}

export async function refresh(refreshToken: string) {
  const tokenHash = hashToken(refreshToken);
  const stored = await prisma.refreshToken.findUnique({ where: { tokenHash } });

  if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
    throw unauthorized('Invalid refresh token');
  }

  // Rotate: revoke the used token, issue a fresh pair.
  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revokedAt: new Date() },
  });

  return issueTokens(stored.userId);
}

export async function logout(refreshToken: string): Promise<void> {
  const tokenHash = hashToken(refreshToken);
  await prisma.refreshToken.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}
