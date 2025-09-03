import { Router } from 'express';
import { MockAuthController } from '../controllers/auth.mock';

// Middleware de rate limiting simplifié
const rateLimiter = (options: any) => (req: any, res: any, next: any) => {
  // Version simplifiée qui ne fait rien
  next();
};

const router = Router();

// Route de connexion (mock)
router.post('/login', rateLimiter({ windowMs: 15 * 60 * 1000, max: 10 }), MockAuthController.login);

// Route pour récupérer le profil utilisateur (mock)
router.get('/me', MockAuthController.getProfile);

export default router;
