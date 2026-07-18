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
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message, details: err.details });
  }
  req_log(err);
  return res.status(500).json({ error: 'Internal server error' });
}

function req_log(err: unknown) {
  // Central place to hook Sentry/pino later.
  console.error(err);
}
