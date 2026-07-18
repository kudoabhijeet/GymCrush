import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';

/**
 * Nutrition: body profile, macro targets, food logging. Phase 2 TODO:
 *  - PUT  /profile        upsert body profile (validateBody(upsertBodyProfileSchema))
 *                         -> recompute MacroTarget via calcMacroTarget()
 *  - GET  /targets        current macro target
 *  - PUT  /targets        manual override
 *  - GET  /foods          search foods
 *  - POST /foods          custom food (validateBody(createFoodSchema))
 *  - GET  /log?date=      daily food log
 *  - POST /log            add entry (validateBody(logFoodSchema))
 */
export const nutritionRouter = Router();

nutritionRouter.use(requireAuth);

nutritionRouter.get('/targets', (_req, res) => {
  res.status(501).json({ error: 'Not implemented — Phase 2: nutrition' });
});
