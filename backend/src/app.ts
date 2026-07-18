import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { errorHandler } from './middleware/error.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { exerciseRouter } from './modules/exercises/exercise.routes.js';
import { nutritionRouter } from './modules/nutrition/nutrition.routes.js';
import { planRouter } from './modules/plans/plan.routes.js';
import { sessionRouter } from './modules/sessions/session.routes.js';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: '1mb' }));

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'gymcrush-api', time: new Date().toISOString() });
  });

  app.use('/api/auth', authRouter);
  app.use('/api/exercises', exerciseRouter);
  app.use('/api/plans', planRouter);
  app.use('/api/sessions', sessionRouter);
  app.use('/api/nutrition', nutritionRouter);

  app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));
  app.use(errorHandler);

  return app;
}
