import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { env } from './config/env.js';
import { authLimiter, globalLimiter } from './middleware/rateLimit.js';
import { errorHandler } from './middleware/error.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { exerciseRouter } from './modules/exercises/exercise.routes.js';
import { nutritionRouter } from './modules/nutrition/nutrition.routes.js';
import { planRouter } from './modules/plans/plan.routes.js';
import { sessionRouter } from './modules/sessions/session.routes.js';

/** Unset CORS_ORIGINS => reflect any origin (dev). Set => strict allowlist. */
function corsOptions() {
  const allowed = env.CORS_ORIGINS?.split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  if (!allowed?.length) return undefined;
  return {
    origin(origin: string | undefined, cb: (err: Error | null, allow?: boolean) => void) {
      // Native apps and curl send no Origin header — never reject those, or the
      // iOS client breaks the moment an allowlist is configured.
      if (!origin) return cb(null, true);
      cb(null, allowed.includes(origin));
    },
  };
}

export function createApp() {
  const app = express();

  // Railway terminates TLS upstream, so without this every request looks like it
  // came from the same proxy IP and the rate limiters key them all together.
  app.set('trust proxy', 1);

  app.use(
    pinoHttp({
      // Bearer tokens must never reach the log sink.
      redact: { paths: ['req.headers.authorization', 'req.headers.cookie'], remove: true },
      autoLogging: { ignore: (req) => req.url === '/health' },
    }),
  );

  app.use(helmet());
  app.use(cors(corsOptions()));
  app.use(express.json({ limit: '1mb' }));

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'gymcrush-api', time: new Date().toISOString() });
  });

  app.use('/api/auth', authLimiter);
  app.use('/api', globalLimiter);

  app.use('/api/auth', authRouter);
  app.use('/api/exercises', exerciseRouter);
  app.use('/api/plans', planRouter);
  app.use('/api/sessions', sessionRouter);
  app.use('/api/nutrition', nutritionRouter);

  app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));
  app.use(errorHandler);

  return app;
}
