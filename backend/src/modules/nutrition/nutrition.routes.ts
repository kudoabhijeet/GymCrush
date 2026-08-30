import { Router } from 'express';
import { z } from 'zod';
import {
  createFoodSchema,
  logFoodSchema,
  logWeightSchema,
  macroTargetSchema,
  upsertBodyProfileSchema,
} from '@gymcrush/shared';
import { requireAuth, type AuthedRequest } from '../../middleware/auth.js';
import { asyncHandler } from '../../middleware/error.js';
import { validateBody, validateQuery } from '../../middleware/validate.js';
import * as nutritionService from './nutrition.service.js';

const foodsQuerySchema = z.object({ search: z.string().max(80).optional() });
type FoodsQuery = z.infer<typeof foodsQuerySchema>;

const logQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});
type LogQuery = z.infer<typeof logQuerySchema>;

export const nutritionRouter = Router();

nutritionRouter.use(requireAuth);

/* ------------------------------ Body profile ----------------------------- */

// PUT /api/nutrition/profile  — upsert profile + recompute macro targets
nutritionRouter.put(
  '/profile',
  validateBody(upsertBodyProfileSchema),
  asyncHandler(async (req, res) => {
    const { userId } = req as AuthedRequest;
    const result = await nutritionService.upsertBodyProfile(userId, req.body);
    res.json(result);
  }),
);

// GET /api/nutrition/profile
nutritionRouter.get(
  '/profile',
  asyncHandler(async (req, res) => {
    const { userId } = req as AuthedRequest;
    const profile = await nutritionService.getBodyProfile(userId);
    res.json({ profile });
  }),
);

/* ------------------------------ Macro targets ---------------------------- */

// GET /api/nutrition/targets
nutritionRouter.get(
  '/targets',
  asyncHandler(async (req, res) => {
    const { userId } = req as AuthedRequest;
    const target = await nutritionService.getMacroTarget(userId);
    res.json({ target });
  }),
);

// PUT /api/nutrition/targets  — manual override
nutritionRouter.put(
  '/targets',
  validateBody(macroTargetSchema),
  asyncHandler(async (req, res) => {
    const { userId } = req as AuthedRequest;
    const target = await nutritionService.setMacroTarget(userId, req.body);
    res.json({ target });
  }),
);

/* --------------------------------- Foods --------------------------------- */

// GET /api/nutrition/foods?search=
nutritionRouter.get(
  '/foods',
  validateQuery(foodsQuerySchema),
  asyncHandler(async (req, res) => {
    const { userId } = req as AuthedRequest;
    const { search } = (req as unknown as { validatedQuery: FoodsQuery }).validatedQuery;
    const foods = await nutritionService.listFoods(userId, search);
    res.json({ foods });
  }),
);

// POST /api/nutrition/foods  — create a custom food
nutritionRouter.post(
  '/foods',
  validateBody(createFoodSchema),
  asyncHandler(async (req, res) => {
    const { userId } = req as AuthedRequest;
    const food = await nutritionService.createFood(userId, req.body);
    res.status(201).json({ food });
  }),
);

/* ------------------------------- Food log -------------------------------- */

// GET /api/nutrition/log?date=yyyy-mm-dd
nutritionRouter.get(
  '/log',
  validateQuery(logQuerySchema),
  asyncHandler(async (req, res) => {
    const { userId } = req as AuthedRequest;
    const { date } = (req as unknown as { validatedQuery: LogQuery }).validatedQuery;
    const log = await nutritionService.getDailyLog(userId, date);
    res.json({ log });
  }),
);

// POST /api/nutrition/log  — add a food entry to a day
nutritionRouter.post(
  '/log',
  validateBody(logFoodSchema),
  asyncHandler(async (req, res) => {
    const { userId } = req as AuthedRequest;
    const log = await nutritionService.addFoodEntry(userId, req.body);
    res.status(201).json({ log });
  }),
);

// DELETE /api/nutrition/log/entries/:entryId
nutritionRouter.delete(
  '/log/entries/:entryId',
  asyncHandler(async (req, res) => {
    const { userId } = req as AuthedRequest;
    await nutritionService.removeFoodEntry(userId, req.params.entryId);
    res.status(204).send();
  }),
);

/* ------------------------------ Bodyweight ------------------------------- */

// GET /api/nutrition/weight  — bodyweight history (ascending)
nutritionRouter.get(
  '/weight',
  asyncHandler(async (req, res) => {
    const { userId } = req as AuthedRequest;
    const history = await nutritionService.getWeightHistory(userId);
    res.json({ history });
  }),
);

// POST /api/nutrition/weight  — log a bodyweight measurement
nutritionRouter.post(
  '/weight',
  validateBody(logWeightSchema),
  asyncHandler(async (req, res) => {
    const { userId } = req as AuthedRequest;
    const entry = await nutritionService.logWeight(userId, req.body.weightKg);
    res.status(201).json({ entry });
  }),
);

// PATCH /api/nutrition/weight/:id  — correct a weigh-in (typo fix)
nutritionRouter.patch(
  '/weight/:id',
  validateBody(logWeightSchema),
  asyncHandler(async (req, res) => {
    const { userId } = req as AuthedRequest;
    const entry = await nutritionService.updateWeight(userId, req.params.id, req.body.weightKg);
    res.json({ entry });
  }),
);

// DELETE /api/nutrition/weight/:id
nutritionRouter.delete(
  '/weight/:id',
  asyncHandler(async (req, res) => {
    const { userId } = req as AuthedRequest;
    await nutritionService.deleteWeight(userId, req.params.id);
    res.status(204).send();
  }),
);
