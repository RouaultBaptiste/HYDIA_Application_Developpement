import { Request, Response } from 'express';
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
import { SharingService, sharePasswordSchema, shareDocumentSchema } from '@/services/sharing.service';
import { z } from 'zod';

export class SharingController {
  /**
   * Partager un mot de passe avec un utilisateur
   * POST /api/v1/organizations/:organizationId/sharing/passwords/:passwordId/share
   */
  static sharePassword = asyncHandler(async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.organization) {
        throw new AppError('Authentification ou organisation requise', 401);
      }

      const { passwordId } = req.params;
      
      // Validation des données
      const validatedData = sharePasswordSchema.parse(req.body);

      // Vérifier si l'organisation permet le partage de mots de passe
      if (!req.organization.settings?.allowPasswordSharing) {
        throw new AppError('Le partage de mots de passe est désactivé pour cette organisation', 403);
      }

      // Partager le mot de passe
      const share = await SharingService.sharePassword(
        passwordId,
        req.organization.id,
        req.user.id,
        validatedData.userId,
        validatedData.permissions
      );

      // Logger le partage
      loggers.data.access('password', passwordId, req.user.id, 'share');

      // Répondre avec le partage créé
      return sendCreated(res, { share }, SuccessMessages.PASSWORD_SHARED);

    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = new ValidationError('Données de partage invalides', error.errors);
        return sendError(res, validationError);
      }

      if (error instanceof AppError) {
        return sendError(res, error);
      }

      logger.error('Erreur lors du partage du mot de passe:', error);
      const serverError = new AppError('Erreur interne du serveur', 500);
      return sendError(res, serverError);
    }
  });

  /**
   * Obtenir les mots de passe que j'ai partagés
   * GET /api/v1/organizations/:organizationId/sharing/passwords/shared
   */
  static getSharedPasswords = asyncHandler(async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.organization) {
        throw new AppError('Authentification ou organisation requise', 401);
      }

      // Récupérer les partages de mots de passe
      const sharedPasswords = await SharingService.getSharedPasswords(
        req.organization.id,
        req.user.id
      );

      // Répondre avec les partages
      return sendSuccess(res, { 
        sharedPasswords,
        count: sharedPasswords.length
      }, 200, SuccessMessages.RETRIEVED);

    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error);
      }

      logger.error('Erreur lors de la récupération des mots de passe partagés:', error);
      const serverError = new AppError('Erreur interne du serveur', 500);
      return sendError(res, serverError);
    }
  });

  /**
   * Obtenir les mots de passe partagés avec moi
   * GET /api/v1/organizations/:organizationId/sharing/passwords/shared-with-me
   */
  static getPasswordsSharedWithMe = asyncHandler(async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.organization) {
        throw new AppError('Authentification ou organisation requise', 401);
      }

      // Récupérer les mots de passe partagés avec l'utilisateur
      const sharedWithMe = await SharingService.getPasswordsSharedWithUser(
        req.organization.id,
        req.user.id
      );

      // Répondre avec les partages
      return sendSuccess(res, { 
        sharedPasswords: sharedWithMe,
        count: sharedWithMe.length
      }, 200, SuccessMessages.RETRIEVED);

    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error);
      }

      logger.error('Erreur lors de la récupération des mots de passe partagés:', error);
      const serverError = new AppError('Erreur interne du serveur', 500);
      return sendError(res, serverError);
    }
  });

  /**
   * Supprimer un partage de mot de passe
   * DELETE /api/v1/organizations/:organizationId/sharing/passwords/:passwordId/share/:shareId
   */
  static removePasswordShare = asyncHandler(async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.organization) {
        throw new AppError('Authentification ou organisation requise', 401);
      }

      const { passwordId, shareId } = req.params;

      // Supprimer le partage
      await SharingService.removePasswordShare(
        shareId,
        passwordId,
        req.organization.id,
        req.user.id
      );

      // Logger la suppression du partage
      loggers.data.delete('password_share', shareId, req.user.id);

      // Répondre avec succès
      return sendDeleted(res, SuccessMessages.SHARE_DELETED);

    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error);
      }

      logger.error('Erreur lors de la suppression du partage:', error);
      const serverError = new AppError('Erreur interne du serveur', 500);
      return sendError(res, serverError);
    }
  });

  /**
   * Partager un document avec un utilisateur
   * POST /api/v1/organizations/:organizationId/sharing/documents/:documentId/share
   */
  static shareDocument = asyncHandler(async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.organization) {
        throw new AppError('Authentification ou organisation requise', 401);
      }

      const { documentId } = req.params;
      
      // Validation des données
      const validatedData = shareDocumentSchema.parse(req.body);

      // Vérifier si l'organisation permet le partage de documents
      if (!req.organization.settings?.allowDocumentSharing) {
        throw new AppError('Le partage de documents est désactivé pour cette organisation', 403);
      }

      // Partager le document
      const share = await SharingService.shareDocument(
        documentId,
        req.organization.id,
        req.user.id,
        validatedData.userId,
        validatedData.permissions
      );

      // Logger le partage
      loggers.data.access('document', documentId, req.user.id, 'share');

      // Répondre avec le partage créé
      return sendCreated(res, { share }, SuccessMessages.DOCUMENT_SHARED);

    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = new ValidationError('Données de partage invalides', error.errors);
        return sendError(res, validationError);
      }

      if (error instanceof AppError) {
        return sendError(res, error);
      }

      logger.error('Erreur lors du partage du document:', error);
      const serverError = new AppError('Erreur interne du serveur', 500);
      return sendError(res, serverError);
    }
  });

  /**
   * Obtenir les documents que j'ai partagés
   * GET /api/v1/organizations/:organizationId/sharing/documents/shared
   */
  static getSharedDocuments = asyncHandler(async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.organization) {
        throw new AppError('Authentification ou organisation requise', 401);
      }

      // Récupérer les partages de documents
      const sharedDocuments = await SharingService.getSharedDocuments(
        req.organization.id,
        req.user.id
      );

      // Répondre avec les partages
      return sendSuccess(res, { 
        sharedDocuments,
        count: sharedDocuments.length
      }, 200, SuccessMessages.RETRIEVED);

    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error);
      }

      logger.error('Erreur lors de la récupération des documents partagés:', error);
      const serverError = new AppError('Erreur interne du serveur', 500);
      return sendError(res, serverError);
    }
  });

  /**
   * Obtenir les documents partagés avec moi
   * GET /api/v1/organizations/:organizationId/sharing/documents/shared-with-me
   */
  static getDocumentsSharedWithMe = asyncHandler(async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.organization) {
        throw new AppError('Authentification ou organisation requise', 401);
      }

      // Récupérer les documents partagés avec l'utilisateur
      const sharedWithMe = await SharingService.getDocumentsSharedWithUser(
        req.organization.id,
        req.user.id
      );

      // Répondre avec les partages
      return sendSuccess(res, { 
        sharedDocuments: sharedWithMe,
        count: sharedWithMe.length
      }, 200, SuccessMessages.RETRIEVED);

    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error);
      }

      logger.error('Erreur lors de la récupération des documents partagés:', error);
      const serverError = new AppError('Erreur interne du serveur', 500);
      return sendError(res, serverError);
    }
  });

  /**
   * Supprimer un partage de document
   * DELETE /api/v1/organizations/:organizationId/sharing/documents/:documentId/share/:shareId
   */
  static removeDocumentShare = asyncHandler(async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.organization) {
        throw new AppError('Authentification ou organisation requise', 401);
      }

      const { documentId, shareId } = req.params;

      // Supprimer le partage
      await SharingService.removeDocumentShare(
        shareId,
        documentId,
        req.organization.id,
        req.user.id
      );

      // Logger la suppression du partage
      loggers.data.delete('document_share', shareId, req.user.id);

      // Répondre avec succès
      return sendDeleted(res, SuccessMessages.SHARE_DELETED);

    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error);
      }

      logger.error('Erreur lors de la suppression du partage:', error);
      const serverError = new AppError('Erreur interne du serveur', 500);
      return sendError(res, serverError);
    }
  });

  /**
   * Créer un lien de partage pour un mot de passe
   * POST /api/v1/organizations/:organizationId/sharing/links/password/:passwordId
   */
  static createPasswordShareLink = asyncHandler(async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.organization) {
        throw new AppError('Authentification ou organisation requise', 401);
      }

      const { passwordId } = req.params;
      const { expiresAt, accessCount } = req.body;

      // Vérifier si l'organisation permet le partage de mots de passe
      if (!req.organization.settings?.allowPasswordSharing) {
        throw new AppError('Le partage de mots de passe est désactivé pour cette organisation', 403);
      }

      // Créer le lien de partage
      const shareLink = await SharingService.createPasswordShareLink(
        passwordId,
        req.organization.id,
        req.user.id,
        expiresAt,
        accessCount
      );

      // Logger la création du lien
      loggers.data.create('password_share_link', shareLink.id, req.user.id);

      // Répondre avec le lien créé
      return sendCreated(res, { shareLink }, SuccessMessages.SHARE_LINK_CREATED);

    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error);
      }

      logger.error('Erreur lors de la création du lien de partage:', error);
      const serverError = new AppError('Erreur interne du serveur', 500);
      return sendError(res, serverError);
    }
  });

  /**
   * Créer un lien de partage pour un document
   * POST /api/v1/organizations/:organizationId/sharing/links/document/:documentId
   */
  static createDocumentShareLink = asyncHandler(async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.organization) {
        throw new AppError('Authentification ou organisation requise', 401);
      }

      const { documentId } = req.params;
      const { expiresAt, accessCount } = req.body;

      // Vérifier si l'organisation permet le partage de documents
      if (!req.organization.settings?.allowDocumentSharing) {
        throw new AppError('Le partage de documents est désactivé pour cette organisation', 403);
      }

      // Créer le lien de partage
      const shareLink = await SharingService.createDocumentShareLink(
        documentId,
        req.organization.id,
        req.user.id,
        expiresAt,
        accessCount
      );

      // Logger la création du lien
      loggers.data.create('document_share_link', shareLink.id, req.user.id);

      // Répondre avec le lien créé
      return sendCreated(res, { shareLink }, SuccessMessages.SHARE_LINK_CREATED);

    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error);
      }

      logger.error('Erreur lors de la création du lien de partage:', error);
      const serverError = new AppError('Erreur interne du serveur', 500);
      return sendError(res, serverError);
    }
  });

  /**
   * Obtenir mes liens de partage
   * GET /api/v1/organizations/:organizationId/sharing/links
   */
  static getMyShareLinks = asyncHandler(async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.organization) {
        throw new AppError('Authentification ou organisation requise', 401);
      }

      // Récupérer les liens de partage
      const shareLinks = await SharingService.getMyShareLinks(
        req.organization.id,
        req.user.id
      );

      // Répondre avec les liens
      return sendSuccess(res, { 
        shareLinks,
        count: shareLinks.length
      }, 200, SuccessMessages.RETRIEVED);

    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error);
      }

      logger.error('Erreur lors de la récupération des liens de partage:', error);
      const serverError = new AppError('Erreur interne du serveur', 500);
      return sendError(res, serverError);
    }
  });

  /**
   * Supprimer un lien de partage
   * DELETE /api/v1/organizations/:organizationId/sharing/links/:linkId
   */
  static deleteShareLink = asyncHandler(async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.organization) {
        throw new AppError('Authentification ou organisation requise', 401);
      }

      const { linkId } = req.params;

      // Supprimer le lien
      await SharingService.deleteShareLink(
        linkId,
        req.organization.id,
        req.user.id
      );

      // Logger la suppression du lien
      loggers.data.delete('share_link', linkId, req.user.id);

      // Répondre avec succès
      return sendDeleted(res, SuccessMessages.SHARE_LINK_DELETED);

    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error);
      }

      logger.error('Erreur lors de la suppression du lien de partage:', error);
      const serverError = new AppError('Erreur interne du serveur', 500);
      return sendError(res, serverError);
    }
  });
}
