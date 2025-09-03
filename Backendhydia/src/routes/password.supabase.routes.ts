import { Router } from 'express';
import { PasswordController } from '@/controllers/password.controller';
import { 
  requireAuth, 
  requireRole,
  optionalAuth 
} from '@/middlewares/auth.supabase.middleware';

const router = Router();

/**
 * Routes des mots de passe avec authentification Supabase
 * Base: /api/v1/passwords
 */

// Middleware d'authentification pour toutes les routes
router.use(requireAuth);

// Routes CRUD des mots de passe
router.post('/', PasswordController.createPassword);
router.get('/', PasswordController.getOrganizationPasswords);
router.get('/:passwordId', PasswordController.getPasswordById);
router.put('/:passwordId', PasswordController.updatePassword);
router.delete('/:passwordId', PasswordController.deletePassword);

// Routes utilitaires
router.post('/generate', PasswordController.generatePassword);
router.get('/search', PasswordController.searchPasswords);
router.get('/strength-analysis', PasswordController.analyzePasswordStrength);
router.get('/export', PasswordController.exportPasswords);

// Routes des catégories de mots de passe
router.post('/categories', PasswordController.createCategory);
router.get('/categories', PasswordController.getCategories);

export default router;
