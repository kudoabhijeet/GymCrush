import { Router } from 'express';
import { z } from 'zod';
import {
  commitSessionSchema,
  logSetSchema,
  startSessionSchema,
  updateSetSchema,
} from '@gymcrush/shared';
import { requireAuth, type AuthedRequest } from '../../middleware/auth.js';
import { asyncHandler } from '../../middleware/error.js';
import { validateBody, validateQuery } from '../../middleware/validate.js';
import * as sessionService from './session.service.js';

const listQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
});
type ListQuery = z.infer<typeof listQuerySchema>;

const addExerciseSchema = z.object({ exerciseId: z.string().min(1) });
const finishSchema = z.object({ notes: z.string().max(2000).optional() });

export const sessionRouter = Router();

sessionRouter.use(requireAuth);

// POST /api/sessions  — start a session (optionally from a plan day)
sessionRouter.post(
  '/',
  validateBody(startSessionSchema),
  asyncHandler(async (req, res) => {
    const { userId } = req as AuthedRequest;
    const session = await sessionService.startSession(userId, req.body);
    res.status(201).json({ session });
  }),
);

// POST /api/sessions/commit  — persist a finished workout in one round-trip
sessionRouter.post(
  '/commit',
  validateBody(commitSessionSchema),
  asyncHandler(async (req, res) => {
    const { userId } = req as AuthedRequest;
    const session = await sessionService.commitSession(userId, req.body);
    res.status(201).json({ session });
  }),
);

// GET /api/sessions?limit=  — session history, newest first
sessionRouter.get(
  '/',
  validateQuery(listQuerySchema),
  asyncHandler(async (req, res) => {
    const { userId } = req as AuthedRequest;
    const { limit } = (req as unknown as { validatedQuery: ListQuery }).validatedQuery;
    const sessions = await sessionService.listSessions(userId, { limit });
    res.json({ sessions });
  }),
);

// POST /api/sessions/sets  — create/update a set (body carries loggedExerciseId)
sessionRouter.post(
  '/sets',
  validateBody(logSetSchema),
  asyncHandler(async (req, res) => {
    const { userId } = req as AuthedRequest;
    const session = await sessionService.logSet(userId, req.body);
    res.json({ session });
  }),
);

// PATCH /api/sessions/sets/:setId  — correct a logged set (finished ok)
sessionRouter.patch(
  '/sets/:setId',
  validateBody(updateSetSchema),
  asyncHandler(async (req, res) => {
    const { userId } = req as AuthedRequest;
    const set = await sessionService.updateSet(userId, req.params.setId, req.body);
    res.json({ set });
  }),
);

// GET /api/sessions/:id
sessionRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { userId } = req as AuthedRequest;
    const session = await sessionService.getSession(userId, req.params.id);
    res.json({ session });
  }),
);

// POST /api/sessions/:id/exercises  — append a logged exercise
sessionRouter.post(
  '/:id/exercises',
  validateBody(addExerciseSchema),
  asyncHandler(async (req, res) => {
    const { userId } = req as AuthedRequest;
    const loggedExercise = await sessionService.addExercise(userId, req.params.id, req.body.exerciseId);
    res.status(201).json({ loggedExercise });
  }),
);

// PATCH /api/sessions/:id/finish
sessionRouter.patch(
  '/:id/finish',
  validateBody(finishSchema),
  asyncHandler(async (req, res) => {
    const { userId } = req as AuthedRequest;
    const session = await sessionService.finishSession(userId, req.params.id, req.body.notes);
    res.json({ session });
  }),
);

// DELETE /api/sessions/:id  — discard a session
sessionRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const { userId } = req as AuthedRequest;
    await sessionService.deleteSession(userId, req.params.id);
    res.status(204).send();
  }),
);
