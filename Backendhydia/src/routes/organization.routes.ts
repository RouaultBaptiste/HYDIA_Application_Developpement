import { Router } from 'express';
import { OrganizationController } from '@/controllers/organization.controller';
import { 
  authenticate, 
  requireActiveUser, 
  requireOrganizationMember,
  requireOrganizationManager,
  requireOrganizationAdmin,
  extractOrganization,
  logAccess 
} from '@/middlewares/auth.middleware';

const router = Router();

/**
 * Routes des organisations
 * Base: /api/v1/organizations
 */

// Middleware d'authentification pour toutes les routes
router.use(authenticate);
router.use(requireActiveUser);

// Routes générales des organisations
router.post('/', logAccess('organization'), OrganizationController.createOrganization);
router.get('/', logAccess('organization'), OrganizationController.getUserOrganizations);

// Middleware pour extraire l'organisation des paramètres
router.use('/:organizationId', extractOrganization);

// Routes spécifiques à une organisation
router.get(
  '/:organizationId', 
  requireOrganizationMember, 
  logAccess('organization'), 
  OrganizationController.getOrganizationById
);

router.put(
  '/:organizationId', 
  requireOrganizationAdmin, 
  logAccess('organization'), 
  OrganizationController.updateOrganization
);

// Routes de gestion des membres
router.post(
  '/:organizationId/members/invite', 
  requireOrganizationManager, 
  logAccess('organization'), 
  OrganizationController.inviteMember
);

router.get(
  '/:organizationId/members', 
  requireOrganizationMember, 
  logAccess('organization'), 
  OrganizationController.getOrganizationMembers
);

router.put(
  '/:organizationId/members/:memberId/role', 
  requireOrganizationAdmin, 
  logAccess('organization'), 
  OrganizationController.updateMemberRole
);

router.delete(
  '/:organizationId/members/:memberId', 
  requireOrganizationManager, 
  logAccess('organization'), 
  OrganizationController.removeMember
);

// Routes utilitaires
router.get(
  '/:organizationId/stats', 
  requireOrganizationManager, 
  logAccess('organization'), 
  OrganizationController.getOrganizationStats
);

router.post(
  '/:organizationId/leave', 
  requireOrganizationMember, 
  logAccess('organization'), 
  OrganizationController.leaveOrganization
);

export default router;
