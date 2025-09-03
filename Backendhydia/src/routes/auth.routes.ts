import { Router } from 'express';
import { AuthController } from '@/controllers/auth.controller';
import { authenticate, requireActiveUser, logAccess } from '@/middlewares/auth.middleware';
import { generalRateLimit } from '../middlewares/security.middleware';

const router = Router();

/**
 * Routes d'authentification
 * Base: /api/v1/auth
 */

// Handle OPTIONS preflight requests for CORS
router.options('*', (req, res) => {
  res.status(204).end();
});

// Routes publiques (sans authentification)
router.post('/register', generalRateLimit, AuthController.register);
router.post('/login', generalRateLimit, AuthController.login);
router.post('/refresh', generalRateLimit, AuthController.refreshTokens);

// Routes protégées (avec authentification)
router.use(authenticate);
router.use(requireActiveUser);

router.post('/logout', logAccess('auth'), AuthController.logout);
router.get('/profile', logAccess('auth'), AuthController.getProfile);
router.put('/profile', logAccess('auth'), AuthController.updateProfile);
router.get('/verify', logAccess('auth'), AuthController.verifyToken);
// Flux d'organisation/session strict
router.get('/me', logAccess('auth'), AuthController.me);
router.post('/select-organization', logAccess('auth'), AuthController.selectOrganization);

// Routes administratives
router.get('/stats', logAccess('auth'), AuthController.getAuthStats);

export default router;

