import { Request, Response } from 'express';
import { 
  OrganizationService, 
  createOrganizationSchema, 
  inviteMemberSchema, 
  updateMemberRoleSchema 
} from '@/services/organization.service';
import { 
  sendSuccess, 
  sendCreated, 
  sendError, 
  sendUpdated,
  sendDeleted,
  asyncHandler, 
  SuccessMessages,
  extractPagination 
} from '@/utils/response';
import { AppError, ValidationError } from '@/utils/errors';
import { logger, loggers } from '@/utils/logger';
import { z } from 'zod';

// Schémas de validation supplémentaires
const updateOrganizationSchema = createOrganizationSchema.partial();

export class OrganizationController {
  /**
   * Créer une nouvelle organisation
   * POST /api/v1/organizations
   */
  static createOrganization = asyncHandler(async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        throw new AppError('Utilisateur non authentifié', 401);
      }

      // Validation des données
      const validatedData = createOrganizationSchema.parse(req.body);

      // Créer l'organisation
      const organization = await OrganizationService.createOrganization(
        req.user.id,
        validatedData
      );

      // Logger la création
      loggers.data.create('organization', organization.id, req.user.id);

      // Répondre avec l'organisation créée
      return sendCreated(res, { organization }, SuccessMessages.ORGANIZATION_CREATED);

    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = new ValidationError('Données d\'organisation invalides', error.errors);
        return sendError(res, validationError);
      }

      if (error instanceof AppError) {
        return sendError(res, error);
      }

      logger.error('Erreur lors de la création de l\'organisation:', error);
      const serverError = new AppError('Erreur interne du serveur', 500);
      return sendError(res, serverError);
    }
  });

  /**
   * Récupérer les organisations de l'utilisateur
   * GET /api/v1/organizations
   */
  static getUserOrganizations = asyncHandler(async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        throw new AppError('Utilisateur non authentifié', 401);
      }

      // Récupérer les organisations
      const organizations = await OrganizationService.getUserOrganizations(req.user.id);

      // Répondre avec les organisations
      return sendSuccess(res, { organizations }, 200, SuccessMessages.RETRIEVED);

    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error);
      }

      logger.error('Erreur lors de la récupération des organisations:', error);
      const serverError = new AppError('Erreur interne du serveur', 500);
      return sendError(res, serverError);
    }
  });

  /**
   * Récupérer une organisation par ID
   * GET /api/v1/organizations/:organizationId
   */
  static getOrganizationById = asyncHandler(async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        throw new AppError('Utilisateur non authentifié', 401);
      }

      const { organizationId } = req.params;

      // Récupérer l'organisation
      const organization = await OrganizationService.getOrganizationById(
        organizationId,
        req.user.id
      );

      // Logger l'accès
      loggers.data.access('organization', organizationId, req.user.id, 'READ');

      // Répondre avec l'organisation
      return sendSuccess(res, { organization }, 200, SuccessMessages.RETRIEVED);

    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error);
      }

      logger.error('Erreur lors de la récupération de l\'organisation:', error);
      const serverError = new AppError('Erreur interne du serveur', 500);
      return sendError(res, serverError);
    }
  });

  /**
   * Mettre à jour une organisation
   * PUT /api/v1/organizations/:organizationId
   */
  static updateOrganization = asyncHandler(async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        throw new AppError('Utilisateur non authentifié', 401);
      }

      const { organizationId } = req.params;

      // Validation des données
      const validatedData = updateOrganizationSchema.parse(req.body);

      // Mettre à jour l'organisation
      const organization = await OrganizationService.updateOrganization(
        organizationId,
        req.user.id,
        validatedData
      );

      // Logger la mise à jour
      loggers.data.update('organization', organizationId, req.user.id);

      // Répondre avec l'organisation mise à jour
      return sendUpdated(res, { organization }, SuccessMessages.ORGANIZATION_UPDATED);

    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = new ValidationError('Données de mise à jour invalides', error.errors);
        return sendError(res, validationError);
      }

      if (error instanceof AppError) {
        return sendError(res, error);
      }

      logger.error('Erreur lors de la mise à jour de l\'organisation:', error);
      const serverError = new AppError('Erreur interne du serveur', 500);
      return sendError(res, serverError);
    }
  });

  /**
   * Inviter un membre dans l'organisation
   * POST /api/v1/organizations/:organizationId/members/invite
   */
  static inviteMember = asyncHandler(async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        throw new AppError('Utilisateur non authentifié', 401);
      }

      const { organizationId } = req.params;

      // Validation des données
      const validatedData = inviteMemberSchema.parse(req.body);

      // Inviter le membre
      await OrganizationService.inviteMember(
        organizationId,
        req.user.id,
        validatedData
      );

      // Logger l'invitation
      loggers.data.create('organization_member', `${organizationId}-${validatedData.email}`, req.user.id);

      // Répondre avec succès
      return sendCreated(res, null, SuccessMessages.MEMBER_INVITED);

    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = new ValidationError('Données d\'invitation invalides', error.errors);
        return sendError(res, validationError);
      }

      if (error instanceof AppError) {
        return sendError(res, error);
      }

      logger.error('Erreur lors de l\'invitation du membre:', error);
      const serverError = new AppError('Erreur interne du serveur', 500);
      return sendError(res, serverError);
    }
  });

  /**
   * Récupérer les membres d'une organisation
   * GET /api/v1/organizations/:organizationId/members
   */
  static getOrganizationMembers = asyncHandler(async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        throw new AppError('Utilisateur non authentifié', 401);
      }

      const { organizationId } = req.params;

      // Récupérer les membres
      const members = await OrganizationService.getOrganizationMembers(
        organizationId,
        req.user.id
      );

      // Logger l'accès
      loggers.data.access('organization_members', organizationId, req.user.id, 'READ');

      // Répondre avec les membres
      return sendSuccess(res, { members }, 200, SuccessMessages.RETRIEVED);

    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error);
      }

      logger.error('Erreur lors de la récupération des membres:', error);
      const serverError = new AppError('Erreur interne du serveur', 500);
      return sendError(res, serverError);
    }
  });

  /**
   * Mettre à jour le rôle d'un membre
   * PUT /api/v1/organizations/:organizationId/members/:memberId/role
   */
  static updateMemberRole = asyncHandler(async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        throw new AppError('Utilisateur non authentifié', 401);
      }

      const { organizationId, memberId } = req.params;

      // Validation des données
      const validatedData = updateMemberRoleSchema.parse(req.body);

      // Mettre à jour le rôle
      await OrganizationService.updateMemberRole(
        organizationId,
        memberId,
        req.user.id,
        validatedData
      );

      // Logger la mise à jour
      loggers.data.update('organization_member', memberId, req.user.id);

      // Répondre avec succès
      return sendUpdated(res, null, SuccessMessages.ROLE_UPDATED);

    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = new ValidationError('Données de rôle invalides', error.errors);
        return sendError(res, validationError);
      }

      if (error instanceof AppError) {
        return sendError(res, error);
      }

      logger.error('Erreur lors de la mise à jour du rôle:', error);
      const serverError = new AppError('Erreur interne du serveur', 500);
      return sendError(res, serverError);
    }
  });

  /**
   * Supprimer un membre de l'organisation
   * DELETE /api/v1/organizations/:organizationId/members/:memberId
   */
  static removeMember = asyncHandler(async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        throw new AppError('Utilisateur non authentifié', 401);
      }

      const { organizationId, memberId } = req.params;

      // Supprimer le membre
      await OrganizationService.removeMember(
        organizationId,
        memberId,
        req.user.id
      );

      // Logger la suppression
      loggers.data.delete('organization_member', memberId, req.user.id);

      // Répondre avec succès
      return sendDeleted(res, SuccessMessages.MEMBER_REMOVED);

    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error);
      }

      logger.error('Erreur lors de la suppression du membre:', error);
      const serverError = new AppError('Erreur interne du serveur', 500);
      return sendError(res, serverError);
    }
  });

  /**
   * Récupérer les statistiques d'une organisation
   * GET /api/v1/organizations/:organizationId/stats
   */
  static getOrganizationStats = asyncHandler(async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        throw new AppError('Utilisateur non authentifié', 401);
      }

      const { organizationId } = req.params;

      // Vérifier les permissions (admin ou manager uniquement)
      const { hasPermission } = await OrganizationService.checkUserPermission(
        organizationId,
        req.user.id,
        ['admin', 'manager']
      );

      if (!hasPermission) {
        throw new AppError('Permissions insuffisantes', 403);
      }

      // TODO: Implémenter la récupération des statistiques
      const stats = {
        totalMembers: 0,
        totalPasswords: 0,
        totalDocuments: 0,
        totalNotes: 0,
        storageUsed: 0,
        lastActivity: new Date().toISOString(),
      };

      // Logger l'accès aux statistiques
      loggers.data.access('organization_stats', organizationId, req.user.id, 'READ');

      // Répondre avec les statistiques
      return sendSuccess(res, { stats }, 200, SuccessMessages.RETRIEVED);

    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error);
      }

      logger.error('Erreur lors de la récupération des statistiques:', error);
      const serverError = new AppError('Erreur interne du serveur', 500);
      return sendError(res, serverError);
    }
  });

  /**
   * Quitter une organisation
   * POST /api/v1/organizations/:organizationId/leave
   */
  static leaveOrganization = asyncHandler(async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        throw new AppError('Utilisateur non authentifié', 401);
      }

      const { organizationId } = req.params;

      // Récupérer les informations de membership
      const { hasPermission, role } = await OrganizationService.checkUserPermission(
        organizationId,
        req.user.id
      );

      if (!hasPermission) {
        throw new AppError('Vous n\'êtes pas membre de cette organisation', 403);
      }

      // Empêcher le propriétaire de quitter l'organisation
      if (role === 'admin') {
        // Vérifier si c'est le propriétaire
        const organization = await OrganizationService.getOrganizationById(
          organizationId,
          req.user.id
        );

        if (organization.ownerId === req.user.id) {
          throw new AppError('Le propriétaire ne peut pas quitter l\'organisation', 400);
        }
      }

      // Trouver l'ID du membership
      const members = await OrganizationService.getOrganizationMembers(
        organizationId,
        req.user.id
      );

      const userMembership = members.find(member => member.userId === req.user?.id);
      
      if (!userMembership) {
        throw new AppError('Membership non trouvé', 404);
      }

      // Supprimer le membre
      await OrganizationService.removeMember(
        organizationId,
        userMembership.id,
        req.user.id
      );

      // Logger l'action
      loggers.data.delete('organization_member', userMembership.id, req.user.id);

      // Répondre avec succès
      return sendSuccess(res, null, 200, 'Vous avez quitté l\'organisation avec succès');

    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error);
      }

      logger.error('Erreur lors de la sortie de l\'organisation:', error);
      const serverError = new AppError('Erreur interne du serveur', 500);
      return sendError(res, serverError);
    }
  });
}
