import bcrypt from 'bcryptjs';
import type { AuthResponse, LoginInput, PublicUser, RegisterInput } from '@gymcrush/shared';
import { prisma } from '../../db/prisma.js';
import { conflict, notFound, unauthorized } from '../../lib/errors.js';
import {
  generateRefreshToken,
  hashToken,
  refreshExpiryDate,
  signAccessToken,
} from '../../lib/tokens.js';

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
