import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';

/**
 * Workout plans (plan -> days -> exercises). Phase 1 TODO:
 *  - GET    /            explore plans (validateQuery(planExplorerQuery))
 *  - POST   /            create plan (validateBody(upsertPlanSchema))
 *  - GET    /:id         plan detail with nested days/exercises
 *  - PUT    /:id         update plan (nested upsert)
 *  - POST   /:id/duplicate
 *  - DELETE /:id
 */
export const planRouter = Router();

planRouter.use(requireAuth);

planRouter.get('/', (_req, res) => {
  res.status(501).json({ error: 'Not implemented — Phase 1: workout plans' });
});
