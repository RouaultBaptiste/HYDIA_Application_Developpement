import { Router } from 'express';
import { SharingController } from '@/controllers/sharing.controller';
import { 
  authenticate, 
  requireActiveUser, 
  requireOrganizationWrite,
  requireOrganizationMember,
  extractOrganization,
  logAccess 
} from '@/middlewares/auth.middleware';

const router = Router();

/**
 * Routes pour le partage de ressources
 * Base: /api/v1/organizations/:organizationId/sharing
 */

// Middleware d'authentification pour toutes les routes
router.use(authenticate);
router.use(requireActiveUser);
router.use(extractOrganization);
router.use(requireOrganizationMember);

// Routes pour les mots de passe partagés
router.post('/passwords/:passwordId/share', 
  requireOrganizationWrite, 
  logAccess('password_share'), 
  SharingController.sharePassword
);

router.get('/passwords/shared', 
  logAccess('password_share'), 
  SharingController.getSharedPasswords
);

router.get('/passwords/shared-with-me', 
  logAccess('password_share'), 
  SharingController.getPasswordsSharedWithMe
);

router.delete('/passwords/:passwordId/share/:shareId', 
  requireOrganizationWrite, 
  logAccess('password_share'), 
  SharingController.removePasswordShare
);

// Routes pour les documents partagés
router.post('/documents/:documentId/share', 
  requireOrganizationWrite, 
  logAccess('document_share'), 
  SharingController.shareDocument
);

router.get('/documents/shared', 
  logAccess('document_share'), 
  SharingController.getSharedDocuments
);

router.get('/documents/shared-with-me', 
  logAccess('document_share'), 
  SharingController.getDocumentsSharedWithMe
);

router.delete('/documents/:documentId/share/:shareId', 
  requireOrganizationWrite, 
  logAccess('document_share'), 
  SharingController.removeDocumentShare
);

// Routes pour la génération et la gestion des liens de partage
router.post('/links/password/:passwordId', 
  requireOrganizationWrite, 
  logAccess('share_link'), 
  SharingController.createPasswordShareLink
);

router.post('/links/document/:documentId', 
  requireOrganizationWrite, 
  logAccess('share_link'), 
  SharingController.createDocumentShareLink
);

router.get('/links', 
  logAccess('share_link'), 
  SharingController.getMyShareLinks
);

router.delete('/links/:linkId', 
  requireOrganizationWrite, 
  logAccess('share_link'), 
  SharingController.deleteShareLink
);

export default router;
