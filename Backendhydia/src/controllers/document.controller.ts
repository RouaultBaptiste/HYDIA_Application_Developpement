import { Request, Response } from 'express';
import { 
  DocumentService, 
  uploadDocumentSchema, 
  createFolderSchema 
} from '@/services/document.service';
import { 
  sendSuccess, 
  sendCreated, 
  sendError, 
  sendDeleted,
  asyncHandler, 
  SuccessMessages 
} from '@/utils/response';
import { AppError, ValidationError } from '@/utils/errors';
import { logger, loggers } from '@/utils/logger';
import { supabase } from '@/config/supabase';
import { z } from 'zod';
import multer from 'multer';

// Configuration de multer pour l'upload en mémoire
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

export class DocumentController {
  /**
   * Middleware multer pour l'upload de fichiers
   */
  static uploadMiddleware = upload.single('file');

  /**
   * Uploader un document
   * POST /api/v1/organizations/:organizationId/documents
   */
  static uploadDocument = asyncHandler(async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        throw new AppError('Authentification requise', 401);
      }

      if (!req.file) {
        throw new AppError('Aucun fichier fourni', 400);
      }

      // Validation des données
      const validatedData = uploadDocumentSchema.parse(req.body);

      // Utiliser l'organisation du paramètre ou la première organisation de l'utilisateur
      let organizationId = req.organization?.id;
      if (!organizationId) {
        // Pour les routes directes, récupérer la première organisation de l'utilisateur
        // Requête directe Supabase pour éviter les problèmes de jointure
        const { data: membership, error } = await supabase
          .from('organization_members')
          .select('organization_id')
          .eq('user_id', req.user.id)
          .limit(1)
          .single();
        
        if (error || !membership) {
          throw new AppError('Aucune organisation trouvée pour cet utilisateur', 400);
        }
        organizationId = membership.organization_id;
      }

      // Vérifier que organizationId est défini
      if (!organizationId) {
        throw new AppError('ID d\'organisation manquant', 400);
      }

      // Préparer les données du fichier
      const fileData = {
        fieldname: req.file.fieldname,
        originalname: req.file.originalname,
        encoding: req.file.encoding,
        mimetype: req.file.mimetype,
        size: req.file.size,
        buffer: req.file.buffer,
      };

      // Uploader le document
      const document = await DocumentService.uploadDocument(
        organizationId,
        req.user.id,
        fileData,
        validatedData
      );

      // Logger l'upload
      loggers.data.create('document', document.id, req.user.id);

      // Répondre avec le document uploadé
      return sendCreated(res, { document }, SuccessMessages.DOCUMENT_UPLOADED);

    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = new ValidationError('Données de document invalides', error.errors);
        return sendError(res, validationError);
      }

      if (error instanceof AppError) {
        return sendError(res, error);
      }

      logger.error('Erreur lors de l\'upload du document:', error);
      const serverError = new AppError('Erreur interne du serveur', 500);
      return sendError(res, serverError);
    }
  });

  /**
   * Récupérer les documents d'une organisation
   * GET /api/v1/organizations/:organizationId/documents
   */
  static getOrganizationDocuments = asyncHandler(async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        throw new AppError('Authentification requise', 401);
      }

      const { folderId } = req.query;

      // Utiliser l'organisation du paramètre ou la première organisation de l'utilisateur
      let organizationId = req.organization?.id;
      if (!organizationId) {
        // Pour les routes directes, récupérer la première organisation de l'utilisateur
        // Requête directe Supabase pour éviter les problèmes de jointure
        const { data: membership, error } = await supabase
          .from('organization_members')
          .select('organization_id')
          .eq('user_id', req.user.id)
          .limit(1)
          .single();
        
        if (error || !membership) {
          throw new AppError('Aucune organisation trouvée pour cet utilisateur', 400);
        }
        organizationId = membership.organization_id;
      }

      // Vérifier que organizationId est défini
      if (!organizationId) {
        throw new AppError('ID d\'organisation manquant', 400);
      }

      // Récupérer les documents
      const documents = await DocumentService.getOrganizationDocuments(
        organizationId,
        req.user.id,
        folderId as string
      );

      // Logger l'accès
      loggers.data.access('documents', organizationId, req.user.id, 'READ');

      // Répondre avec les documents
      return sendSuccess(res, { documents }, 200, SuccessMessages.RETRIEVED);

    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error);
      }

      logger.error('Erreur lors de la récupération des documents:', error);
      const serverError = new AppError('Erreur interne du serveur', 500);
      return sendError(res, serverError);
    }
  });

  /**
   * Récupérer un document par ID
   * GET /api/v1/organizations/:organizationId/documents/:documentId
   */
  static getDocumentById = asyncHandler(async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.organization) {
        throw new AppError('Authentification ou organisation requise', 401);
      }

      const { documentId } = req.params;

      // Récupérer le document
      const document = await DocumentService.getDocumentById(
        documentId,
        req.organization.id,
        req.user.id
      );

      // Logger l'accès
      loggers.data.access('document', documentId, req.user.id, 'READ');

      // Répondre avec le document
      return sendSuccess(res, { document }, 200, SuccessMessages.RETRIEVED);

    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error);
      }

      logger.error('Erreur lors de la récupération du document:', error);
      const serverError = new AppError('Erreur interne du serveur', 500);
      return sendError(res, serverError);
    }
  });

  /**
   * Supprimer un document
   * DELETE /api/v1/organizations/:organizationId/documents/:documentId
   */
  static deleteDocument = asyncHandler(async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.organization) {
        throw new AppError('Authentification ou organisation requise', 401);
      }

      const { documentId } = req.params;

      // Supprimer le document
      await DocumentService.deleteDocument(
        documentId,
        req.organization.id,
        req.user.id
      );

      // Logger la suppression
      loggers.data.delete('document', documentId, req.user.id);

      // Répondre avec succès
      return sendDeleted(res, SuccessMessages.DOCUMENT_DELETED);

    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error);
      }

      logger.error('Erreur lors de la suppression du document:', error);
      const serverError = new AppError('Erreur interne du serveur', 500);
      return sendError(res, serverError);
    }
  });

  /**
   * Créer un dossier
   * POST /api/v1/organizations/:organizationId/folders
   */
  static createFolder = asyncHandler(async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        throw new AppError('Authentification requise', 401);
      }

      // Validation des données
      const validatedData = createFolderSchema.parse(req.body);

      // Utiliser l'organisation du paramètre ou la première organisation de l'utilisateur
      let organizationId = req.organization?.id;
      if (!organizationId) {
        // Pour les routes directes, récupérer la première organisation de l'utilisateur
        // Requête directe Supabase pour éviter les problèmes de jointure
        const { data: membership, error } = await supabase
          .from('organization_members')
          .select('organization_id')
          .eq('user_id', req.user.id)
          .limit(1)
          .single();
        
        if (error || !membership) {
          throw new AppError('Aucune organisation trouvée pour cet utilisateur', 400);
        }
        organizationId = membership.organization_id;
      }

      // Vérifier que organizationId est défini
      if (!organizationId) {
        throw new AppError('ID d\'organisation manquant', 400);
      }

      // Créer le dossier
      const folder = await DocumentService.createFolder(
        organizationId,
        req.user.id,
        validatedData
      );

      // Logger la création
      loggers.data.create('document_folder', folder.id, req.user.id);

      // Répondre avec le dossier créé
      return sendCreated(res, { folder }, SuccessMessages.FOLDER_CREATED);

    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = new ValidationError('Données de dossier invalides', error.errors);
        return sendError(res, validationError);
      }

      if (error instanceof AppError) {
        return sendError(res, error);
      }

      logger.error('Erreur lors de la création du dossier:', error);
      const serverError = new AppError('Erreur interne du serveur', 500);
      return sendError(res, serverError);
    }
  });

  /**
   * Récupérer les dossiers d'une organisation
   * GET /api/v1/organizations/:organizationId/folders
   */
  static getOrganizationFolders = asyncHandler(async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.organization) {
        throw new AppError('Authentification ou organisation requise', 401);
      }

      const { parentId } = req.query;

      // Récupérer les dossiers
      const folders = await DocumentService.getOrganizationFolders(
        req.organization.id,
        req.user.id,
        parentId as string
      );

      // Logger l'accès
      loggers.data.access('document_folders', req.organization.id, req.user.id, 'READ');

      // Répondre avec les dossiers
      return sendSuccess(res, { folders }, 200, SuccessMessages.RETRIEVED);

    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error);
      }

      logger.error('Erreur lors de la récupération des dossiers:', error);
      const serverError = new AppError('Erreur interne du serveur', 500);
      return sendError(res, serverError);
    }
  });

  /**
   * Rechercher des documents
   * GET /api/v1/organizations/:organizationId/documents/search
   */
  static searchDocuments = asyncHandler(async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.organization) {
        throw new AppError('Authentification ou organisation requise', 401);
      }

      const { search } = req.query;

      if (!search || typeof search !== 'string') {
        throw new AppError('Terme de recherche requis', 400);
      }

      // Rechercher les documents
      const documents = await DocumentService.searchDocuments(
        req.organization.id,
        req.user.id,
        search
      );

      // Logger la recherche
      loggers.data.access('documents_search', req.organization.id, req.user.id, 'SEARCH');

      // Répondre avec les résultats
      return sendSuccess(res, { 
        documents,
        searchTerm: search,
        count: documents.length 
      }, 200, SuccessMessages.RETRIEVED);

    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error);
      }

      logger.error('Erreur lors de la recherche de documents:', error);
      const serverError = new AppError('Erreur interne du serveur', 500);
      return sendError(res, serverError);
    }
  });

  /**
   * Télécharger un document
   * GET /api/v1/organizations/:organizationId/documents/:documentId/download
   */
  static downloadDocument = asyncHandler(async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.organization) {
        throw new AppError('Authentification ou organisation requise', 401);
      }

      const { documentId } = req.params;

      // Récupérer le document pour vérifier les permissions
      const document = await DocumentService.getDocumentById(
        documentId,
        req.organization.id,
        req.user.id
      );

      // Logger le téléchargement
      loggers.data.access('document', documentId, req.user.id, 'DOWNLOAD');

      // Rediriger vers l'URL de téléchargement Supabase
      if (document.downloadUrl) {
        return res.redirect(document.downloadUrl);
      } else {
        throw new AppError('URL de téléchargement non disponible', 404);
      }

    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error);
      }

      logger.error('Erreur lors du téléchargement du document:', error);
      const serverError = new AppError('Erreur interne du serveur', 500);
      return sendError(res, serverError);
    }
  });

  /**
   * Obtenir les statistiques de stockage
   * GET /api/v1/organizations/:organizationId/documents/storage-stats
   */
  static getStorageStats = asyncHandler(async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.organization) {
        throw new AppError('Authentification ou organisation requise', 401);
      }

      // Récupérer tous les documents pour calculer les statistiques
      const documents = await DocumentService.getOrganizationDocuments(
        req.organization.id,
        req.user.id
      );

      // Calculer les statistiques
      const stats = {
        totalDocuments: documents.length,
        totalSize: documents.reduce((sum, doc) => sum + doc.fileSize, 0),
        averageSize: documents.length > 0 ? Math.round(documents.reduce((sum, doc) => sum + doc.fileSize, 0) / documents.length) : 0,
        typeBreakdown: {} as Record<string, { count: number; size: number }>,
        recentUploads: documents
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5)
          .map(doc => ({
            id: doc.id,
            title: doc.title,
            filename: doc.filename,
            size: doc.fileSize,
            uploadedAt: doc.createdAt,
            uploader: doc.uploader
          }))
      };

      // Calculer la répartition par type de fichier
      documents.forEach(doc => {
        const extension = doc.filename.split('.').pop()?.toLowerCase() || 'unknown';
        if (!stats.typeBreakdown[extension]) {
          stats.typeBreakdown[extension] = { count: 0, size: 0 };
        }
        stats.typeBreakdown[extension].count++;
        stats.typeBreakdown[extension].size += doc.fileSize;
      });

      // Logger l'accès aux statistiques
      loggers.data.access('storage_stats', req.organization.id, req.user.id, 'READ');

      // Répondre avec les statistiques
      return sendSuccess(res, { stats }, 200, 'Statistiques de stockage récupérées');

    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error);
      }

      logger.error('Erreur lors de la récupération des statistiques de stockage:', error);
      const serverError = new AppError('Erreur interne du serveur', 500);
      return sendError(res, serverError);
    }
  });

  /**
   * Prévisualiser un document (pour les types supportés)
   * GET /api/v1/organizations/:organizationId/documents/:documentId/preview
   */
  static previewDocument = asyncHandler(async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.organization) {
        throw new AppError('Authentification ou organisation requise', 401);
      }

      const { documentId } = req.params;

      // Récupérer le document
      const document = await DocumentService.getDocumentById(
        documentId,
        req.organization.id,
        req.user.id
      );

      // Vérifier si le type de fichier supporte la prévisualisation
      const previewableTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'text/plain', 'application/pdf'];
      
      if (!previewableTypes.includes(document.mimeType)) {
        throw new AppError('Type de fichier non prévisualisable', 400);
      }

      // Logger la prévisualisation
      loggers.data.access('document', documentId, req.user.id, 'PREVIEW');

      // Répondre avec les informations de prévisualisation
      return sendSuccess(res, { 
        document: {
          id: document.id,
          title: document.title,
          filename: document.filename,
          mimeType: document.mimeType,
          fileSize: document.fileSize,
          downloadUrl: document.downloadUrl,
          previewable: true
        }
      }, 200, 'Prévisualisation disponible');

    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error);
      }

      logger.error('Erreur lors de la prévisualisation du document:', error);
      const serverError = new AppError('Erreur interne du serveur', 500);
      return sendError(res, serverError);
    }
  });
}
