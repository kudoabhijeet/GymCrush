import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';

/**
 * Exercise catalog + custom exercises. Phase 1 TODO:
 *  - GET  /            list/search catalog + user-custom (query: q, muscleGroup)
 *  - POST /            create custom exercise (validateBody(createExerciseSchema))
 *  - DELETE /:id       remove a user-custom exercise
 */
export const exerciseRouter = Router();

exerciseRouter.use(requireAuth);

exerciseRouter.get('/', (_req, res) => {
  res.status(501).json({ error: 'Not implemented — Phase 1: exercise catalog' });
});
