import type { NextFunction, Request, Response } from 'express';
import { HttpError } from '../lib/errors.js';

/** Wrap async route handlers so thrown/rejected errors reach the error middleware. */
export function asyncHandler<T extends (req: Request, res: Response, next: NextFunction) => unknown>(
  fn: T,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message, details: err.details });
  }
  // pino-http attaches req.log; fall back to console if the logger isn't mounted
  // (e.g. a unit test constructing the handler directly).
  if (req.log) req.log.error({ err }, 'Unhandled error');
  else console.error(err);
  return res.status(500).json({ error: 'Internal server error' });
}
