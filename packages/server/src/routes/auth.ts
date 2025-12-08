import { Router, type Request, type Response, type IRouter } from 'express';
import { toNodeHandler } from 'better-auth/node';
import { getAuth } from '../auth/index.js';

const router: IRouter = Router();

/**
 * Better Auth handles all /api/auth/* routes
 * This includes:
 * - POST /api/auth/sign-up/email - Email/password signup
 * - POST /api/auth/sign-in/email - Email/password signin
 * - POST /api/auth/sign-out - Sign out
 * - GET /api/auth/session - Get current session
 * - POST /api/auth/forget-password - Request password reset
 * - POST /api/auth/reset-password - Reset password
 * - And more...
 */
router.all('/*', (req: Request, res: Response) => {
  const auth = getAuth();
  const handler = toNodeHandler(auth);
  return handler(req, res);
});

export { router as authRouter };

