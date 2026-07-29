import { Router } from 'express';
import { loginSchema, refreshSchema, registerSchema } from '@gymcrush/shared';
import { requireAuth, type AuthedRequest } from '../../middleware/auth.js';
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

// GET /api/auth/me — the current user, for session hydration
authRouter.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { userId } = req as AuthedRequest;
    const user = await authService.getMe(userId);
    res.json({ user });
  }),
);

// DELETE /api/auth/account — permanent, irreversible. Required by the App Store.
authRouter.delete(
  '/account',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { userId } = req as AuthedRequest;
    await authService.deleteAccount(userId);
    res.status(204).send();
  }),
);
