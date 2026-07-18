import { Router } from 'express';
import { planExplorerQuery, upsertPlanSchema } from '@gymcrush/shared';
import { requireAuth, type AuthedRequest } from '../../middleware/auth.js';
import { asyncHandler } from '../../middleware/error.js';
import { validateBody, validateQuery } from '../../middleware/validate.js';
import * as planService from './plan.service.js';

export const planRouter = Router();

planRouter.use(requireAuth);

// GET /api/plans?goal=&daysPerWeek=&templatesOnly=
planRouter.get(
  '/',
  validateQuery(planExplorerQuery),
  asyncHandler(async (req, res) => {
    const { userId } = req as AuthedRequest;
    const filters = (req as unknown as { validatedQuery: Parameters<typeof planService.listPlans>[1] })
      .validatedQuery;
    const plans = await planService.listPlans(userId, filters);
    res.json({ plans });
  }),
);

// POST /api/plans
planRouter.post(
  '/',
  validateBody(upsertPlanSchema),
  asyncHandler(async (req, res) => {
    const { userId } = req as AuthedRequest;
    const plan = await planService.createPlan(userId, req.body);
    res.status(201).json({ plan });
  }),
);

// GET /api/plans/:id
planRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { userId } = req as AuthedRequest;
    const plan = await planService.getPlan(userId, req.params.id);
    res.json({ plan });
  }),
);

// PUT /api/plans/:id
planRouter.put(
  '/:id',
  validateBody(upsertPlanSchema),
  asyncHandler(async (req, res) => {
    const { userId } = req as AuthedRequest;
    const plan = await planService.updatePlan(userId, req.params.id, req.body);
    res.json({ plan });
  }),
);

// POST /api/plans/:id/duplicate
planRouter.post(
  '/:id/duplicate',
  asyncHandler(async (req, res) => {
    const { userId } = req as AuthedRequest;
    const plan = await planService.duplicatePlan(userId, req.params.id);
    res.status(201).json({ plan });
  }),
);

// DELETE /api/plans/:id
planRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const { userId } = req as AuthedRequest;
    await planService.deletePlan(userId, req.params.id);
    res.status(204).send();
  }),
);
