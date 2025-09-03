import { Router } from 'express';
import { PasswordController } from '@/controllers/password.controller';
import { 
  authenticate, 
  requireActiveUser, 
  requireOrganizationWrite,
  requireOrganizationMember,
  organizationContext,
  setDbContext,
  extractOrganization,
  logAccess 
} from '@/middlewares/auth.middleware';

const router = Router();

/**
 * Routes des mots de passe
 * Base: /api/v1/passwords et /api/v1/organizations/:organizationId/passwords
 */

// Middleware d'authentification pour toutes les routes
router.use(authenticate);
router.use(requireActiveUser);
// Injecter le contexte d'organisation (cookie/header) pour les routes directes
router.use(organizationContext);
// Pousser le contexte au niveau DB (RLS)
router.use(setDbContext);

// Route globale pour générer un mot de passe (pas besoin d'organisation)
router.post('/generate', logAccess('password'), PasswordController.generatePassword);

// Routes CRUD directes pour les mots de passe (utilise l'organisation par défaut de l'utilisateur)
router.post('/', logAccess('password'), PasswordController.createPassword);
router.get('/', logAccess('password'), PasswordController.getOrganizationPasswords);
router.get('/:passwordId', logAccess('password'), PasswordController.getPasswordById);
router.put('/:passwordId', logAccess('password'), PasswordController.updatePassword);
router.delete('/:passwordId', logAccess('password'), PasswordController.deletePassword);

// Routes spécifiques à une organisation
const orgRouter = Router();

// Middleware pour extraire l'organisation des paramètres
orgRouter.use('/:organizationId', extractOrganization);

// Routes CRUD des mots de passe
orgRouter.post(
  '/:organizationId/passwords', 
  requireOrganizationWrite, 
  logAccess('password'), 
  PasswordController.createPassword
);

orgRouter.get(
  '/:organizationId/passwords', 
  requireOrganizationMember, 
  logAccess('password'), 
  PasswordController.getOrganizationPasswords
);

orgRouter.get(
  '/:organizationId/passwords/search', 
  requireOrganizationMember, 
  logAccess('password'), 
  PasswordController.searchPasswords
);

orgRouter.get(
  '/:organizationId/passwords/strength-analysis', 
  requireOrganizationMember, 
  logAccess('password'), 
  PasswordController.analyzePasswordStrength
);

orgRouter.get(
  '/:organizationId/passwords/export', 
  requireOrganizationMember, 
  logAccess('password'), 
  PasswordController.exportPasswords
);

orgRouter.get(
  '/:organizationId/passwords/:passwordId', 
  requireOrganizationMember, 
  logAccess('password'), 
  PasswordController.getPasswordById
);

orgRouter.put(
  '/:organizationId/passwords/:passwordId', 
  requireOrganizationWrite, 
  logAccess('password'), 
  PasswordController.updatePassword
);

orgRouter.delete(
  '/:organizationId/passwords/:passwordId', 
  requireOrganizationWrite, 
  logAccess('password'), 
  PasswordController.deletePassword
);

// Routes des catégories de mots de passe
orgRouter.post(
  '/:organizationId/password-categories', 
  requireOrganizationWrite, 
  logAccess('password'), 
  PasswordController.createCategory
);

orgRouter.get(
  '/:organizationId/password-categories', 
  requireOrganizationMember, 
  logAccess('password'), 
  PasswordController.getCategories
);

// Exporter les routes d'organisation
export { orgRouter as organizationPasswordRoutes };
export default router;
