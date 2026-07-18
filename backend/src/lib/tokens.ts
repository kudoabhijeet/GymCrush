import crypto from 'node:crypto';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../config/env.js';

export interface AccessTokenPayload {
  sub: string; // user id
}

export function signAccessToken(userId: string): string {
  return jwt.sign({ sub: userId }, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_TTL as SignOptions['expiresIn'],
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
}

/**
 * Refresh tokens are opaque random strings. We store only a SHA-256 hash so a DB
 * leak can't be replayed. The signed JWT wrapper lets us also carry an expiry.
 */
export function generateRefreshToken(): { token: string; tokenHash: string } {
  const token = crypto.randomBytes(48).toString('base64url');
  const tokenHash = hashToken(token);
  return { token, tokenHash };
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/** Convert a TTL string like "30d" / "15m" into an absolute Date. */
export function refreshExpiryDate(): Date {
  const ttl = env.JWT_REFRESH_TTL;
  const match = /^(\d+)([smhd])$/.exec(ttl);
  const now = Date.now();
  if (!match) return new Date(now + 30 * 24 * 60 * 60 * 1000);
  const value = Number(match[1]);
  const unit = match[2];
  const ms = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[unit]!;
  return new Date(now + value * ms);
}
