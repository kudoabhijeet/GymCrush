import type { NextFunction, Request, Response } from 'express';
import type { ZodTypeAny, z } from 'zod';
import { badRequest } from '../lib/errors.js';

/** Validate `req.body` against a Zod schema and replace it with the parsed value. */
export function validateBody<T extends ZodTypeAny>(schema: T) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return next(badRequest('Validation failed', result.error.flatten()));
    }
    req.body = result.data as z.infer<T>;
    next();
  };
}

/** Validate `req.query` against a Zod schema. */
export function validateQuery<T extends ZodTypeAny>(schema: T) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      return next(badRequest('Invalid query parameters', result.error.flatten()));
    }
    // Express 4 makes req.query a getter-only in some setups; attach separately.
    (req as Request & { validatedQuery: z.infer<T> }).validatedQuery = result.data;
    next();
  };
}
