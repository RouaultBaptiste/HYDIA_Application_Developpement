import { Router } from 'express';
import { SupabaseAuthController } from '../controllers/auth.supabase.controller';
import { authenticateUser, optionalAuth } from '../middlewares/auth.supabase.middleware';
import rateLimit from 'express-rate-limit';

const router = Router();

// Rate limiting pour les routes d'authentification
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Maximum 10 tentatives par IP
  message: {
    success: false,
    error: {
      message: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.',
      statusCode: 429,
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 5, // Maximum 5 inscriptions par IP par heure
  message: {
    success: false,
    error: {
      message: 'Trop de tentatives d\'inscription. Réessayez dans 1 heure.',
      statusCode: 429,
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Routes d'authentification Supabase
 * Base: /api/v1/auth
 */

// Route de connexion
router.post('/login', authLimiter, SupabaseAuthController.login);

// Route d'inscription
router.post('/register', registerLimiter, SupabaseAuthController.register);

// Route pour récupérer le profil utilisateur (nécessite authentification)
router.get('/me', authenticateUser, SupabaseAuthController.getProfile);

// Route pour sélectionner une organisation
router.post('/select-organization', authenticateUser, SupabaseAuthController.selectOrganization);

// Route pour rafraîchir le token
router.post('/refresh', SupabaseAuthController.refreshToken);

// Route de déconnexion
router.post('/logout', optionalAuth, SupabaseAuthController.logout);

// Route pour récupérer les organisations de l'utilisateur
router.get('/organizations', authenticateUser, SupabaseAuthController.getOrganizations);

export default router;
