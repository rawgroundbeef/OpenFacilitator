import express, { type Express, type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { facilitatorRouter } from './routes/facilitator.js';
import { adminRouter } from './routes/admin.js';
import { authRouter } from './routes/auth.js';
import { resolveFacilitator } from './middleware/tenant.js';

/**
 * Create the Express server with all middleware and routes
 */
export function createServer(): Express {
  const app = express();

  // Security middleware
  app.use(
    helmet({
      contentSecurityPolicy: false, // Disable for development
    })
  );
  app.use(
    cors({
      origin: [
        'http://localhost:3000',
        'http://localhost:3002',
        'http://localhost:3003',
        'https://openfacilitator.io',
      ],
      credentials: true,
    })
  );
  app.use(express.json());

  // Health check
  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Auth routes (handled by Better Auth)
  app.use('/api/auth', authRouter);

  // Admin API routes (for dashboard)
  app.use('/api/admin', adminRouter);

  // Multi-tenant facilitator routes
  // These are resolved by subdomain or custom domain
  app.use('/', resolveFacilitator, facilitatorRouter);

  // Error handler
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Server error:', err);
    res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  });

  return app;
}

