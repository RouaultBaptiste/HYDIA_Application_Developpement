import { Request, Response } from 'express';
import { config } from '@/config/env';
import { AuthService, registerSchema, loginSchema } from '@/services/auth.service';
import { OrganizationService } from '@/services/organization.service';
import { sendSuccess, sendCreated, sendError, asyncHandler, SuccessMessages } from '@/utils/response';
import { AppError, ValidationError } from '@/utils/errors';
import { logger, loggers } from '@/utils/logger';
import { z } from 'zod';

// Schémas de validation pour les contrôleurs
const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Token de rafraîchissement requis'),
});

const updateProfileSchema = z.object({
  firstName: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères').optional(),
  lastName: z.string().min(2, 'Le nom doit contenir au moins 2 caractères').optional(),
  avatarUrl: z.string().url('URL d\'avatar invalide').optional(),
});

export class AuthController {
  /**
   * Inscription d'un nouvel utilisateur
   * POST /api/v1/auth/register
   */
  static register = asyncHandler(async (req: Request, res: Response) => {
    try {
      // Validation des données
      const validatedData = registerSchema.parse(req.body);

      // Créer l'utilisateur
      const result = await AuthService.register(validatedData);

      // Logger l'inscription
      loggers.auth.register(result.user.id, result.user.email);

      // Répondre avec les données utilisateur et tokens
      return sendCreated(res, {
        user: result.user,
        tokens: result.tokens,
      }, SuccessMessages.REGISTER_SUCCESS);

    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = new ValidationError('Données d\'inscription invalides', error.errors);
        return sendError(res, validationError);
      }

      if (error instanceof AppError) {
        return sendError(res, error);
      }

      logger.error('Erreur lors de l\'inscription:', error);
      const serverError = new AppError('Erreur interne du serveur', 500);
      return sendError(res, serverError);
    }
  });

  /**
   * Retourne l'utilisateur courant et ses organisations
   * GET /api/v1/auth/me
   */
  static me = asyncHandler(async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        throw new AppError('Utilisateur non authentifié', 401);
      }

      const user = await AuthService.getProfile(req.user.id);
      const organizations = await OrganizationService.getUserOrganizations(req.user.id);

      // Déterminer l'org courante depuis cookie ou header (en attendant le store de session)
      const cookieBase = config.session.cookieName;
      const orgCookieName = `${cookieBase}_org`;
      const cookies: Record<string, string> = {};
      (req.headers.cookie || '')
        .split(';')
        .filter(Boolean)
        .forEach(c => {
          const [k, ...v] = c.trim().split('=');
          cookies[decodeURIComponent(k)] = decodeURIComponent(v.join('='));
        });
      const currentOrgId = (req.headers['x-org-id'] as string) || cookies[orgCookieName] || null;

      return sendSuccess(res, { user, organizations, currentOrgId }, 200, SuccessMessages.RETRIEVED);
    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error);
      }
      logger.error('Erreur /auth/me:', error);
      const serverError = new AppError('Erreur interne du serveur', 500);
      return sendError(res, serverError);
    }
  });

  /**
   * Sélection de l'organisation active et fixation dans cookie HttpOnly
   * POST /api/v1/auth/select-organization
   */
  static selectOrganization = asyncHandler(async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        throw new AppError('Utilisateur non authentifié', 401);
      }

      const schema = z.object({ organizationId: z.string().min(1) });
      const { organizationId } = schema.parse(req.body || {});

      // Vérifier l'appartenance
      const isMember = await OrganizationService.isUserMemberOfOrganization(req.user.id, organizationId);
      if (!isMember) {
        throw new AppError('Accès non autorisé à cette organisation', 403);
      }

      // Définir cookie d'organisation (HttpOnly)
      const cookieBase = config.session.cookieName;
      const domain = config.session.cookieDomain;
      const secure = config.server.isProduction;
      const sameSite: any = secure ? 'none' : 'lax';
      const orgCookieName = `${cookieBase}_org`;

      // 12h par défaut
      const maxAgeMs = 12 * 60 * 60 * 1000;

      res.cookie(orgCookieName, organizationId, {
        httpOnly: true,
        secure,
        sameSite,
        domain,
        path: '/',
        maxAge: maxAgeMs,
      });

      return sendSuccess(res, { organizationId }, 200, 'Organisation sélectionnée');
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = new ValidationError('Organisation invalide', error.errors);
        return sendError(res, validationError);
      }
      if (error instanceof AppError) {
        return sendError(res, error);
      }
      logger.error('Erreur /auth/select-organization:', error);
      const serverError = new AppError('Erreur interne du serveur', 500);
      return sendError(res, serverError);
    }
  });

  /**
   * Connexion d'un utilisateur
   * POST /api/v1/auth/login
   */
  static login = asyncHandler(async (req: Request, res: Response) => {
    try {
      // Validation des données
      const validatedData = loginSchema.parse(req.body);

      // Authentifier l'utilisateur
      const result = await AuthService.login(validatedData);

      // Logger la connexion
      loggers.auth.login(result.user.id, result.user.email, req.ip);

      // Récupérer les organisations de l'utilisateur
      const organizations = await OrganizationService.getUserOrganizations(result.user.id);

      // Définir les cookies HttpOnly pour access et refresh
      const cookieBase = config.session.cookieName;
      const domain = config.session.cookieDomain;
      const secure = config.server.isProduction;
      const sameSite: any = secure ? 'none' : 'lax';
      const accessCookieName = `${cookieBase}_access`;
      const refreshCookieName = `${cookieBase}_refresh`;
      const orgCookieName = `${cookieBase}_org`;

      // Durées approximatives basées sur la config
      const accessMaxAgeSec = 15 * 60; // 15 min par défaut
      const refreshMaxAgeSec = 30 * 24 * 60 * 60; // 30 jours
      const orgMaxAgeSec = 12 * 60 * 60; // 12 heures

      res.cookie(accessCookieName, result.tokens.accessToken, {
        httpOnly: true,
        secure,
        sameSite,
        domain,
        path: '/',
        maxAge: accessMaxAgeSec * 1000,
      });

      res.cookie(refreshCookieName, result.tokens.refreshToken, {
        httpOnly: true,
        secure,
        sameSite,
        domain,
        path: '/api/v1/auth',
        maxAge: refreshMaxAgeSec * 1000,
      });

      // Gestion des cas d'organisation
      if (organizations.length === 0) {
        // Cas 0: Aucune organisation
        const error = new AppError('Aucune organisation associée à ce compte', 403);
        (error as any).code = 'USER_WITHOUT_ORG';
        return sendError(res, error);
      } else if (organizations.length === 1) {
        // Cas 1: Une seule organisation - auto-sélection
        const org = organizations[0];
        res.cookie(orgCookieName, org.id, {
          httpOnly: true,
          secure,
          sameSite,
          domain,
          path: '/',
          maxAge: orgMaxAgeSec * 1000,
        });

        return sendSuccess(res, {
          user: result.user,
          organizations,
          currentOrgId: org.id,
        }, 200, SuccessMessages.LOGIN_SUCCESS);
      } else {
        // Cas >1: Plusieurs organisations - sélection requise
        return sendSuccess(res, {
          user: result.user,
          organizations,
          currentOrgId: null,
        }, 200, 'NEEDS_ORG_SELECTION');
      }

    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = new ValidationError('Données de connexion invalides', error.errors);
        return sendError(res, validationError);
      }

      if (error instanceof AppError) {
        // Logger les tentatives de connexion échouées
        loggers.auth.failed(req.body.email || 'unknown', error.message, req.ip);
        return sendError(res, error);
      }

      logger.error('Erreur lors de la connexion:', error);
      const serverError = new AppError('Erreur interne du serveur', 500);
      return sendError(res, serverError);
    }
  });

  /**
   * Rafraîchissement des tokens
   * POST /api/v1/auth/refresh
   */
  static refreshTokens = asyncHandler(async (req: Request, res: Response) => {
    try {
      // Lire le refresh token depuis le body OU le cookie HttpOnly
      const cookieBase = config.session.cookieName;
      const refreshCookieName = `${cookieBase}_refresh`;
      const cookieHeader = req.headers.cookie || '';
      const cookiesMap = Object.fromEntries(
        cookieHeader.split(';').filter(Boolean).map(c => {
          const [k, ...v] = c.trim().split('=');
          return [decodeURIComponent(k), decodeURIComponent(v.join('='))];
        })
      );

      const bodyToken = (req.body && (req.body as any).refreshToken) || '';
      const cookieToken = cookiesMap[refreshCookieName] || '';
      const provided = bodyToken || cookieToken;

      const validatedData = refreshTokenSchema.parse({ refreshToken: provided });

      // Rafraîchir (rotation)
      const tokens = await AuthService.refreshTokens(validatedData.refreshToken);

      // Mettre à jour les cookies (rotation)
      const domain = config.session.cookieDomain;
      const secure = config.server.isProduction;
      const sameSite: any = secure ? 'none' : 'lax';
      const accessCookieName = `${cookieBase}_access`;

      const accessMaxAgeSec = 15 * 60;
      const refreshMaxAgeSec = 30 * 24 * 60 * 60;

      res.cookie(accessCookieName, tokens.accessToken, {
        httpOnly: true,
        secure,
        sameSite,
        domain,
        path: '/',
        maxAge: accessMaxAgeSec * 1000,
      });

      res.cookie(refreshCookieName, tokens.refreshToken, {
        httpOnly: true,
        secure,
        sameSite,
        domain,
        path: '/api/v1/auth',
        maxAge: refreshMaxAgeSec * 1000,
      });

      return sendSuccess(res, { ok: true }, 200, SuccessMessages.TOKEN_REFRESHED);

    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = new ValidationError('Token de rafraîchissement invalide', error.errors);
        return sendError(res, validationError);
      }

      if (error instanceof AppError) {
        return sendError(res, error);
      }

      logger.error('Erreur lors du rafraîchissement des tokens:', error);
      const serverError = new AppError('Erreur interne du serveur', 500);
      return sendError(res, serverError);
    }
  });

  /**
   * Déconnexion d'un utilisateur
   * POST /api/v1/auth/logout
   */
  static logout = asyncHandler(async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        throw new AppError('Utilisateur non authentifié', 401);
      }

      // Déconnecter l'utilisateur
      await AuthService.logout(req.user.id);

      // Effacer les cookies
      const cookieBase = config.session.cookieName;
      const domain = config.session.cookieDomain;
      const accessCookieName = `${cookieBase}_access`;
      const refreshCookieName = `${cookieBase}_refresh`;
      res.clearCookie(accessCookieName, { domain, path: '/' });
      res.clearCookie(refreshCookieName, { domain, path: '/api/v1/auth' });

      // Logger la déconnexion
      loggers.auth.logout(req.user.id, req.user.email);

      // Répondre avec succès
      return sendSuccess(res, null, 200, SuccessMessages.LOGOUT_SUCCESS);

    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error);
      }

      logger.error('Erreur lors de la déconnexion:', error);
      const serverError = new AppError('Erreur interne du serveur', 500);
      return sendError(res, serverError);
    }
  });

  /**
   * Récupération du profil utilisateur
   * GET /api/v1/auth/profile
   */
  static getProfile = asyncHandler(async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        throw new AppError('Utilisateur non authentifié', 401);
      }

      // Récupérer le profil utilisateur
      const userProfile = await AuthService.getProfile(req.user.id);

      // Répondre avec le profil
      return sendSuccess(res, { user: userProfile }, 200, SuccessMessages.RETRIEVED);

    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error);
      }

      logger.error('Erreur lors de la récupération du profil:', error);
      const serverError = new AppError('Erreur interne du serveur', 500);
      return sendError(res, serverError);
    }
  });

  /**
   * Mise à jour du profil utilisateur
   * PUT /api/v1/auth/profile
   */
  static updateProfile = asyncHandler(async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        throw new AppError('Utilisateur non authentifié', 401);
      }

      // Validation des données
      const validatedData = updateProfileSchema.parse(req.body);

      // Mettre à jour le profil
      const updatedProfile = await AuthService.updateProfile(req.user.id, validatedData);

      // Logger la mise à jour
      loggers.data.update('user_profile', req.user.id, req.user.id);

      // Répondre avec le profil mis à jour
      return sendSuccess(res, { user: updatedProfile }, 200, SuccessMessages.UPDATED);

    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = new ValidationError('Données de profil invalides', error.errors);
        return sendError(res, validationError);
      }

      if (error instanceof AppError) {
        return sendError(res, error);
      }

      logger.error('Erreur lors de la mise à jour du profil:', error);
      const serverError = new AppError('Erreur interne du serveur', 500);
      return sendError(res, serverError);
    }
  });

  /**
   * Vérification de la validité du token
   * GET /api/v1/auth/verify
   */
  static verifyToken = asyncHandler(async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        throw new AppError('Token invalide', 401);
      }

      // Récupérer le profil pour s'assurer que l'utilisateur existe toujours
      const userProfile = await AuthService.getProfile(req.user.id);

      // Répondre avec les informations de validation
      return sendSuccess(res, {
        valid: true,
        user: userProfile,
      }, 200, 'Token valide');

    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error);
      }

      logger.error('Erreur lors de la vérification du token:', error);
      const serverError = new AppError('Erreur interne du serveur', 500);
      return sendError(res, serverError);
    }
  });

  /**
   * Récupération des statistiques d'authentification (admin uniquement)
   * GET /api/v1/auth/stats
   */
  static getAuthStats = asyncHandler(async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        throw new AppError('Utilisateur non authentifié', 401);
      }

      // TODO: Implémenter la vérification des permissions admin globales
      // Pour l'instant, cette route est disponible pour tous les utilisateurs authentifiés

      // Récupérer les statistiques d'authentification
      // TODO: Implémenter la logique de récupération des statistiques
      const stats = {
        totalUsers: 0,
        activeUsers: 0,
        newUsersToday: 0,
        loginAttemptsToday: 0,
        failedLoginsToday: 0,
      };

      return sendSuccess(res, { stats }, 200, 'Statistiques récupérées');

    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error);
      }

      logger.error('Erreur lors de la récupération des statistiques:', error);
      const serverError = new AppError('Erreur interne du serveur', 500);
      return sendError(res, serverError);
    }
  });
}
