import { Router } from 'express';
import { DocumentController } from '@/controllers/document.controller';
import { 
  authenticate, 
  requireActiveUser, 
  requireOrganizationWrite,
  requireOrganizationMember,
  requireFilePermissions,
  extractOrganization,
  logAccess 
} from '@/middlewares/auth.middleware';

const router = Router();

/**
 * Routes des documents
 * Base: /api/v1/organizations/:organizationId/documents
 */

// Middleware d'authentification pour toutes les routes
router.use(authenticate);
router.use(requireActiveUser);

// Routes CRUD directes pour les documents (utilise l'organisation par défaut de l'utilisateur)
router.post('/', requireFilePermissions('write'), logAccess('document'), DocumentController.uploadDocument);
router.get('/', logAccess('document'), DocumentController.getOrganizationDocuments);
router.get('/:documentId', logAccess('document'), DocumentController.getDocumentById);
router.delete('/:documentId', requireFilePermissions('write'), logAccess('document'), DocumentController.deleteDocument);

// Routes pour les dossiers
router.post('/folders', requireFilePermissions('write'), logAccess('document'), DocumentController.createFolder);
router.get('/folders', logAccess('document'), DocumentController.getOrganizationFolders);

// Middleware pour extraire l'organisation des paramètres
router.use('/:organizationId', extractOrganization);

// Routes CRUD des documents
router.post(
  '/:organizationId/documents', 
  requireFilePermissions('write'),
  DocumentController.uploadMiddleware,
  logAccess('document'), 
  DocumentController.uploadDocument
);

router.get(
  '/:organizationId/documents', 
  requireFilePermissions('read'),
  logAccess('document'), 
  DocumentController.getOrganizationDocuments
);

router.get(
  '/:organizationId/documents/search', 
  requireFilePermissions('read'),
  logAccess('document'), 
  DocumentController.searchDocuments
);

router.get(
  '/:organizationId/documents/storage-stats', 
  requireOrganizationMember,
  logAccess('document'), 
  DocumentController.getStorageStats
);

router.get(
  '/:organizationId/documents/:documentId', 
  requireFilePermissions('read'),
  logAccess('document'), 
  DocumentController.getDocumentById
);

router.get(
  '/:organizationId/documents/:documentId/download', 
  requireFilePermissions('read'),
  logAccess('document'), 
  DocumentController.downloadDocument
);

router.get(
  '/:organizationId/documents/:documentId/preview', 
  requireFilePermissions('read'),
  logAccess('document'), 
  DocumentController.previewDocument
);

router.delete(
  '/:organizationId/documents/:documentId', 
  requireFilePermissions('delete'),
  logAccess('document'), 
  DocumentController.deleteDocument
);

// Routes des dossiers
router.post(
  '/:organizationId/folders', 
  requireOrganizationWrite,
  logAccess('document'), 
  DocumentController.createFolder
);

router.get(
  '/:organizationId/folders', 
  requireOrganizationMember,
  logAccess('document'), 
  DocumentController.getOrganizationFolders
);

export default router;
