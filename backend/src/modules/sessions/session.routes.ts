import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';

/**
 * Workout sessions (the logger). Phase 1 TODO:
 *  - POST   /                  start session (validateBody(startSessionSchema))
 *  - GET    /                  session history (paginated)
 *  - GET    /:id               session detail
 *  - POST   /:id/exercises     add a logged exercise
 *  - POST   /sets              log/update a set (validateBody(logSetSchema))
 *  - PATCH  /:id/finish        finish session
 */
export const sessionRouter = Router();

sessionRouter.use(requireAuth);

sessionRouter.get('/', (_req, res) => {
  res.status(501).json({ error: 'Not implemented — Phase 1: workout logger' });
});
