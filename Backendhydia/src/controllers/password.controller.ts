import { Request, Response } from 'express';
import { 
  PasswordService, 
  createPasswordSchema, 
  updatePasswordSchema,
  generatePasswordSchema 
} from '@/services/password.service';
import { 
  sendSuccess, 
  sendCreated, 
  sendError, 
  sendUpdated,
  sendDeleted,
  asyncHandler, 
  SuccessMessages,
  extractPagination,
  extractFilters 
} from '@/utils/response';
import { AppError, ValidationError } from '@/utils/errors';
import { logger, loggers } from '@/utils/logger';
import { z } from 'zod';

// Schémas de validation supplémentaires
const searchPasswordsSchema = z.object({
  search: z.string().min(1, 'Terme de recherche requis'),
});

const createCategorySchema = z.object({
  name: z.string().min(1, 'Nom de la catégorie requis'),
  description: z.string().optional(),
});

export class PasswordController {
  /**
   * Créer un nouveau mot de passe
   * POST /api/v1/organizations/:organizationId/passwords
   */
  static createPassword = asyncHandler(async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        throw new AppError('Authentification requise', 401);
      }

      // Log des données reçues pour le débogage
      console.log('Données reçues pour création de mot de passe:', JSON.stringify(req.body));
      console.log('Type de categoryId:', typeof req.body.categoryId);
      console.log('Valeur de categoryId:', req.body.categoryId);
      
      // Validation des données
      let validatedData;
      try {
        validatedData = createPasswordSchema.parse(req.body);
        console.log('Validation réussie, données validées:', JSON.stringify(validatedData));
      } catch (validationError) {
        console.error('Erreur de validation détaillée:', validationError);
        throw validationError;
      }

      // Utiliser l'organisation du paramètre ou la première organisation de l'utilisateur
      let organizationId = req.organization?.id;
      if (!organizationId) {
        // Pour les routes directes, récupérer la première organisation de l'utilisateur
        const { OrganizationService } = await import('@/services/organization.service');
        const userOrganizations = await OrganizationService.getUserOrganizations(req.user.id);
        if (userOrganizations.length === 0) {
          throw new AppError('Aucune organisation trouvée pour cet utilisateur', 400);
        }
        organizationId = userOrganizations[0].id;
      }

      // Créer le mot de passe
      const password = await PasswordService.createPassword(
        organizationId,
        req.user.id,
        validatedData
      );

      // Logger la création
      loggers.data.create('password', password.id, req.user.id);

      // Répondre avec le mot de passe créé
      return sendCreated(res, { password }, SuccessMessages.PASSWORD_CREATED);

    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = new ValidationError('Données de mot de passe invalides', error.errors);
        return sendError(res, validationError);
      }

      if (error instanceof AppError) {
        return sendError(res, error);
      }

      logger.error('Erreur lors de la création du mot de passe:', error);
      const serverError = new AppError('Erreur interne du serveur', 500);
      return sendError(res, serverError);
    }
  });

  /**
   * Récupérer les mots de passe d'une organisation
   * GET /api/v1/organizations/:organizationId/passwords
   */
  static getOrganizationPasswords = asyncHandler(async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        throw new AppError('Authentification requise', 401);
      }

      const { categoryId } = req.query;

      // Utiliser l'organisation du paramètre ou la première organisation de l'utilisateur
      let organizationId = req.organization?.id;
      if (!organizationId) {
        // Pour les routes directes, récupérer la première organisation de l'utilisateur
        const { OrganizationService } = await import('@/services/organization.service');
        const userOrganizations = await OrganizationService.getUserOrganizations(req.user.id);
        if (userOrganizations.length === 0) {
          throw new AppError('Aucune organisation trouvée pour cet utilisateur', 400);
        }
        organizationId = userOrganizations[0].id;
      }

      // Récupérer les mots de passe
      const passwords = await PasswordService.getOrganizationPasswords(
        organizationId,
        req.user.id,
        categoryId as string
      );

      // Logger l'accès
      loggers.data.access('passwords', organizationId, req.user.id, 'READ');

      // Répondre avec les mots de passe
      return sendSuccess(res, { passwords }, 200, SuccessMessages.RETRIEVED);

    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error);
      }

      logger.error('Erreur lors de la récupération des mots de passe:', error);
      const serverError = new AppError('Erreur interne du serveur', 500);
      return sendError(res, serverError);
    }
  });

  /**
   * Récupérer un mot de passe par ID
   * GET /api/v1/organizations/:organizationId/passwords/:passwordId
   */
  static getPasswordById = asyncHandler(async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.organization) {
        throw new AppError('Authentification ou organisation requise', 401);
      }

      const { passwordId } = req.params;

      // Récupérer le mot de passe
      const password = await PasswordService.getPasswordById(
        passwordId,
        req.organization.id,
        req.user.id
      );

      // Logger l'accès
      loggers.data.access('password', passwordId, req.user.id, 'READ');

      // Répondre avec le mot de passe
      return sendSuccess(res, { password }, 200, SuccessMessages.RETRIEVED);

    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error);
      }

      logger.error('Erreur lors de la récupération du mot de passe:', error);
      const serverError = new AppError('Erreur interne du serveur', 500);
      return sendError(res, serverError);
    }
  });

  /**
   * Mettre à jour un mot de passe
   * PUT /api/v1/organizations/:organizationId/passwords/:passwordId
   */
  static updatePassword = asyncHandler(async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.organization) {
        throw new AppError('Authentification ou organisation requise', 401);
      }

      const { passwordId } = req.params;

      // Validation des données
      const validatedData = updatePasswordSchema.parse(req.body);

      // Mettre à jour le mot de passe
      const password = await PasswordService.updatePassword(
        passwordId,
        req.organization.id,
        req.user.id,
        validatedData
      );

      // Logger la mise à jour
      loggers.data.update('password', passwordId, req.user.id);

      // Répondre avec le mot de passe mis à jour
      return sendUpdated(res, { password }, SuccessMessages.PASSWORD_UPDATED);

    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = new ValidationError('Données de mise à jour invalides', error.errors);
        return sendError(res, validationError);
      }

      if (error instanceof AppError) {
        return sendError(res, error);
      }

      logger.error('Erreur lors de la mise à jour du mot de passe:', error);
      const serverError = new AppError('Erreur interne du serveur', 500);
      return sendError(res, serverError);
    }
  });

  /**
   * Supprimer un mot de passe
   * DELETE /api/v1/organizations/:organizationId/passwords/:passwordId
   */
  static deletePassword = asyncHandler(async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.organization) {
        throw new AppError('Authentification ou organisation requise', 401);
      }

      const { passwordId } = req.params;

      // Supprimer le mot de passe
      await PasswordService.deletePassword(
        passwordId,
        req.organization.id,
        req.user.id
      );

      // Logger la suppression
      loggers.data.delete('password', passwordId, req.user.id);

      // Répondre avec succès
      return sendDeleted(res, SuccessMessages.PASSWORD_DELETED);

    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error);
      }

      logger.error('Erreur lors de la suppression du mot de passe:', error);
      const serverError = new AppError('Erreur interne du serveur', 500);
      return sendError(res, serverError);
    }
  });

  /**
   * Générer un mot de passe sécurisé
   * POST /api/v1/passwords/generate
   */
  static generatePassword = asyncHandler(async (req: Request, res: Response) => {
    try {
      // Validation des options
      const validatedOptions = generatePasswordSchema.parse(req.body);

      // Générer le mot de passe
      const generatedPassword = PasswordService.generateSecurePassword(validatedOptions);

      // Répondre avec le mot de passe généré
      return sendSuccess(res, { 
        password: generatedPassword,
        options: validatedOptions 
      }, 200, SuccessMessages.PASSWORD_GENERATED);

    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = new ValidationError('Options de génération invalides', error.errors);
        return sendError(res, validationError);
      }

      if (error instanceof AppError) {
        return sendError(res, error);
      }

      logger.error('Erreur lors de la génération du mot de passe:', error);
      const serverError = new AppError('Erreur interne du serveur', 500);
      return sendError(res, serverError);
    }
  });

  /**
   * Rechercher des mots de passe
   * GET /api/v1/organizations/:organizationId/passwords/search
   */
  static searchPasswords = asyncHandler(async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.organization) {
        throw new AppError('Authentification ou organisation requise', 401);
      }

      const { search } = req.query;

      if (!search || typeof search !== 'string') {
        throw new AppError('Terme de recherche requis', 400);
      }

      // Rechercher les mots de passe
      const passwords = await PasswordService.searchPasswords(
        req.organization.id,
        req.user.id,
        search
      );

      // Logger la recherche
      loggers.data.access('passwords_search', req.organization.id, req.user.id, 'SEARCH');

      // Répondre avec les résultats
      return sendSuccess(res, { 
        passwords,
        searchTerm: search,
        count: passwords.length 
      }, 200, SuccessMessages.RETRIEVED);

    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error);
      }

      logger.error('Erreur lors de la recherche de mots de passe:', error);
      const serverError = new AppError('Erreur interne du serveur', 500);
      return sendError(res, serverError);
    }
  });

  /**
   * Créer une catégorie de mots de passe
   * POST /api/v1/organizations/:organizationId/password-categories
   */
  static createCategory = asyncHandler(async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.organization) {
        throw new AppError('Authentification ou organisation requise', 401);
      }

      // Validation des données
      const validatedData = createCategorySchema.parse(req.body);

      // Créer la catégorie
      const category = await PasswordService.createCategory(
        req.organization.id,
        req.user.id,
        validatedData.name,
        validatedData.description
      );

      // Logger la création
      loggers.data.create('password_category', category.id, req.user.id);

      // Répondre avec la catégorie créée
      return sendCreated(res, { category }, SuccessMessages.CATEGORY_CREATED);

    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = new ValidationError('Données de catégorie invalides', error.errors);
        return sendError(res, validationError);
      }

      if (error instanceof AppError) {
        return sendError(res, error);
      }

      logger.error('Erreur lors de la création de la catégorie:', error);
      const serverError = new AppError('Erreur interne du serveur', 500);
      return sendError(res, serverError);
    }
  });

  /**
   * Récupérer les catégories de mots de passe
   * GET /api/v1/organizations/:organizationId/password-categories
   */
  static getCategories = asyncHandler(async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.organization) {
        throw new AppError('Authentification ou organisation requise', 401);
      }

      // Récupérer les catégories
      const categories = await PasswordService.getOrganizationCategories(
        req.organization.id,
        req.user.id
      );

      // Logger l'accès
      loggers.data.access('password_categories', req.organization.id, req.user.id, 'READ');

      // Répondre avec les catégories
      return sendSuccess(res, { categories }, 200, SuccessMessages.RETRIEVED);

    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error);
      }

      logger.error('Erreur lors de la récupération des catégories:', error);
      const serverError = new AppError('Erreur interne du serveur', 500);
      return sendError(res, serverError);
    }
  });

  /**
   * Analyser la force des mots de passe d'une organisation
   * GET /api/v1/organizations/:organizationId/passwords/strength-analysis
   */
  static analyzePasswordStrength = asyncHandler(async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.organization) {
        throw new AppError('Authentification ou organisation requise', 401);
      }

      // Récupérer tous les mots de passe pour analyse
      const passwords = await PasswordService.getOrganizationPasswords(
        req.organization.id,
        req.user.id
      );

      // Analyser la force des mots de passe
      const analysis = {
        total: passwords.length,
        weak: 0,
        medium: 0,
        strong: 0,
        duplicates: 0,
        oldPasswords: 0, // Plus de 90 jours
        recommendations: [] as string[]
      };

      // TODO: Implémenter l'analyse réelle de la force des mots de passe
      // Pour l'instant, on retourne des données factices
      analysis.weak = Math.floor(passwords.length * 0.2);
      analysis.medium = Math.floor(passwords.length * 0.3);
      analysis.strong = passwords.length - analysis.weak - analysis.medium;

      if (analysis.weak > 0) {
        analysis.recommendations.push('Remplacer les mots de passe faibles');
      }
      if (analysis.duplicates > 0) {
        analysis.recommendations.push('Éliminer les doublons de mots de passe');
      }

      // Logger l'analyse
      loggers.data.access('password_analysis', req.organization.id, req.user.id, 'ANALYZE');

      // Répondre avec l'analyse
      return sendSuccess(res, { analysis }, 200, 'Analyse de sécurité terminée');

    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error);
      }

      logger.error('Erreur lors de l\'analyse des mots de passe:', error);
      const serverError = new AppError('Erreur interne du serveur', 500);
      return sendError(res, serverError);
    }
  });

  /**
   * Exporter les mots de passe (format sécurisé)
   * GET /api/v1/organizations/:organizationId/passwords/export
   */
  static exportPasswords = asyncHandler(async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.organization) {
        throw new AppError('Authentification ou organisation requise', 401);
      }

      // Vérifier les permissions d'export (admin uniquement)
      if (req.organization.role !== 'admin') {
        throw new AppError('Seuls les administrateurs peuvent exporter les mots de passe', 403);
      }

      // Récupérer les mots de passe
      const passwords = await PasswordService.getOrganizationPasswords(
        req.organization.id,
        req.user.id
      );

      // Préparer les données d'export (sans les mots de passe réels pour la sécurité)
      const exportData = passwords.map(password => ({
        title: password.title,
        username: password.username,
        url: password.url,
        notes: password.notes,
        categoryId: password.categoryId,
        createdAt: password.createdAt,
        updatedAt: password.updatedAt,
        // Ne pas inclure le mot de passe réel dans l'export
        hasPassword: !!password.password
      }));

      // Logger l'export
      loggers.security.suspiciousActivity(
        req.user.id,
        'PASSWORD_EXPORT',
        { organizationId: req.organization.id, count: passwords.length },
        req.ip
      );

      // Répondre avec les données d'export
      return sendSuccess(res, { 
        passwords: exportData,
        exportedAt: new Date().toISOString(),
        count: exportData.length 
      }, 200, 'Export terminé');

    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error);
      }

      logger.error('Erreur lors de l\'export des mots de passe:', error);
      const serverError = new AppError('Erreur interne du serveur', 500);
      return sendError(res, serverError);
    }
  });
}
