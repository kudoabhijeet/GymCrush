import { Router } from 'express';
import { loginSchema, refreshSchema, registerSchema } from '@gymcrush/shared';
import { asyncHandler } from '../../middleware/error.js';
import { validateBody } from '../../middleware/validate.js';
import * as authService from './auth.service.js';

export const authRouter = Router();

authRouter.post(
  '/register',
  validateBody(registerSchema),
  asyncHandler(async (req, res) => {
    const result = await authService.register(req.body);
    res.status(201).json(result);
  }),
);

authRouter.post(
  '/login',
  validateBody(loginSchema),
  asyncHandler(async (req, res) => {
    const result = await authService.login(req.body);
    res.json(result);
  }),
);

authRouter.post(
  '/refresh',
  validateBody(refreshSchema),
  asyncHandler(async (req, res) => {
    const tokens = await authService.refresh(req.body.refreshToken);
    res.json({ tokens });
  }),
);

authRouter.post(
  '/logout',
  validateBody(refreshSchema),
  asyncHandler(async (req, res) => {
    await authService.logout(req.body.refreshToken);
    res.status(204).send();
  }),
);
