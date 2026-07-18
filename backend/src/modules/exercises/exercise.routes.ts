import { Router } from 'express';
import { z } from 'zod';
import { createExerciseSchema, MuscleGroup } from '@gymcrush/shared';
import { requireAuth, type AuthedRequest } from '../../middleware/auth.js';
import { asyncHandler } from '../../middleware/error.js';
import { validateBody, validateQuery } from '../../middleware/validate.js';
import * as exerciseService from './exercise.service.js';

const listQuerySchema = z.object({
  search: z.string().max(80).optional(),
  muscleGroup: MuscleGroup.optional(),
});
type ListQuery = z.infer<typeof listQuerySchema>;

export const exerciseRouter = Router();

exerciseRouter.use(requireAuth);

// GET /api/exercises?search=&muscleGroup=
exerciseRouter.get(
  '/',
  validateQuery(listQuerySchema),
  asyncHandler(async (req, res) => {
    const { userId } = req as AuthedRequest;
    const query = (req as unknown as { validatedQuery: ListQuery }).validatedQuery;
    const exercises = await exerciseService.listExercises(userId, query);
    res.json({ exercises });
  }),
);

// POST /api/exercises  — create a custom exercise
exerciseRouter.post(
  '/',
  validateBody(createExerciseSchema),
  asyncHandler(async (req, res) => {
    const { userId } = req as AuthedRequest;
    const exercise = await exerciseService.createExercise(userId, req.body);
    res.status(201).json({ exercise });
  }),
);

// DELETE /api/exercises/:id  — remove a custom exercise
exerciseRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const { userId } = req as AuthedRequest;
    await exerciseService.deleteExercise(userId, req.params.id);
    res.status(204).send();
  }),
);
