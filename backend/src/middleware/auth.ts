import type { NextFunction, Request, Response } from 'express';
import { unauthorized } from '../lib/errors.js';
import { verifyAccessToken } from '../lib/tokens.js';

/** Augment Express Request with the authenticated user id. */
export interface AuthedRequest extends Request {
  userId: string;
}

/** Requires a valid Bearer access token; attaches `req.userId`. */
export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next(unauthorized('Missing bearer token'));
  }
  try {
    const payload = verifyAccessToken(header.slice('Bearer '.length));
    (req as AuthedRequest).userId = payload.sub;
    next();
  } catch {
    next(unauthorized('Invalid or expired token'));
  }
}
