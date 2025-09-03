import { Request, Response } from 'express';
import { SupabaseAuthService, loginSchema, registerSchema } from '../services/auth.supabase.service';
import { asyncHandler } from '../utils/response';
import { logger } from '../utils/logger';
import { config } from '../config/env';
import { AppError } from '../utils/errors';

export class SupabaseAuthController {
  /**
   * Connexion d'un utilisateur
   * POST /api/v1/auth/login
   */
  static login = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    // Validation des données
    const validatedData = loginSchema.parse({ email, password });

    // Authentification
    const result = await SupabaseAuthService.login(validatedData);

    // Configuration sécurisée des cookies
    const cookieBase = config.session.cookieName;
    const secure = config.server.nodeEnv === 'production';
    const sameSite = 'lax' as const;
    const domain = config.session.cookieDomain;

    // Durées des cookies optimisées pour la sécurité
    const accessMaxAgeSec = 15 * 60; // 15 minutes
    const refreshMaxAgeSec = 7 * 24 * 60 * 60; // 7 jours (réduit de 30 jours)
    const orgMaxAgeSec = 12 * 60 * 60; // 12 heures

    // Options de cookies sécurisées
    const secureCookieOptions = {
      httpOnly: true,
      secure,
      sameSite,
      domain,
      path: '/',
    };

    // Définir les cookies avec options sécurisées
    res.cookie(`${cookieBase}_access`, result.tokens.accessToken, {
      ...secureCookieOptions,
      maxAge: accessMaxAgeSec * 1000,
    });

    res.cookie(`${cookieBase}_refresh`, result.tokens.refreshToken, {
      ...secureCookieOptions,
      path: '/api/v1/auth', // Limiter le scope du refresh token
      maxAge: refreshMaxAgeSec * 1000,
    });

    logger.info('Cookies d\'authentification définis', {
      userId: result.user.id,
      email: result.user.email,
      accessTokenExpiry: new Date(Date.now() + accessMaxAgeSec * 1000).toISOString(),
      refreshTokenExpiry: new Date(Date.now() + refreshMaxAgeSec * 1000).toISOString(),
      secure,
      sameSite,
      domain
    });

    // Si l'utilisateur n'a pas d'organisations, retourner une erreur
    if (result.organizations.length === 0) {
      return res.status(200).json({
        success: true,
        code: 'NO_ORGANIZATIONS',
        message: 'Aucune organisation trouvée',
        data: {
          user: result.user,
          organizations: [],
        },
      });
    }

    // Cas où l'utilisateur a une seule organisation (sélection automatique)
    if (result.organizations.length === 1) {
      const currentOrg = result.organizations[0];
      
      // Définir le cookie d'organisation avec options sécurisées
      res.cookie(`${cookieBase}_org`, currentOrg.id, {
        ...secureCookieOptions,
        maxAge: orgMaxAgeSec * 1000,
      });

      logger.info('Cookie d\'organisation défini', {
        userId: result.user.id,
        organizationId: currentOrg.id,
        organizationName: currentOrg.name,
        orgTokenExpiry: new Date(Date.now() + orgMaxAgeSec * 1000).toISOString()
      });

      return res.status(200).json({
        success: true,
        message: 'Connexion réussie',
        data: {
          user: result.user,
          organizations: result.organizations,
          currentOrgId: currentOrg.id,
        },
      });
    }

    // Cas où l'utilisateur a plusieurs organisations (sélection requise)
    return res.status(200).json({
      success: true,
      code: 'NEEDS_ORG_SELECTION',
      message: 'Sélection d\'organisation requise',
      data: {
        user: result.user,
        organizations: result.organizations,
      },
    });
  });

  /**
   * Inscription d'un nouvel utilisateur
   * POST /api/v1/auth/register
   */
  static register = asyncHandler(async (req: Request, res: Response) => {
    const { email, password, firstName, lastName } = req.body;

    // Validation des données
    const validatedData = registerSchema.parse({ email, password, firstName, lastName });

    // Créer le compte
    const result = await SupabaseAuthService.register(validatedData);

    // Configuration sécurisée des cookies pour l'inscription
    const cookieBase = config.session.cookieName;
    const secure = config.server.nodeEnv === 'production';
    const sameSite = 'lax' as const;
    const domain = config.session.cookieDomain;

    // Durées des cookies optimisées pour la sécurité
    const accessMaxAgeSec = 15 * 60; // 15 minutes
    const refreshMaxAgeSec = 7 * 24 * 60 * 60; // 7 jours

    // Options de cookies sécurisées
    const secureCookieOptions = {
      httpOnly: true,
      secure,
      sameSite,
      domain,
      path: '/',
    };

    // Mettre à jour les cookies avec options sécurisées
    res.cookie(`${cookieBase}_access`, result.tokens.accessToken, {
      ...secureCookieOptions,
      maxAge: accessMaxAgeSec * 1000,
    });

    res.cookie(`${cookieBase}_refresh`, result.tokens.refreshToken, {
      ...secureCookieOptions,
      path: '/api/v1/auth',
      maxAge: refreshMaxAgeSec * 1000,
    });

    logger.info('Cookies d\'inscription définis', {
      userId: result.user.id,
      email: result.user.email,
      accessTokenExpiry: new Date(Date.now() + accessMaxAgeSec * 1000).toISOString(),
      refreshTokenExpiry: new Date(Date.now() + refreshMaxAgeSec * 1000).toISOString()
    });

    res.status(201).json({
      success: true,
      message: 'Compte créé avec succès',
      data: {
        user: result.user,
      },
    });
  });

  /**
   * Récupérer le profil utilisateur
   * GET /api/v1/auth/me
   */
  static getProfile = asyncHandler(async (req: Request, res: Response) => {
    // Vérifier que l'utilisateur est authentifié
    if (!req.user || !req.user.id) {
      throw new AppError('Utilisateur non authentifié', 401);
    }
    
    // Récupérer le profil complet
    const userProfile = await SupabaseAuthService.getUserProfile(req.user.id);
    
    if (!userProfile) {
      throw new AppError('Utilisateur non trouvé', 404);
    }

    // Récupérer les organisations
    const organizations = await SupabaseAuthService.getUserOrganizations(req.user.id);

    // Récupérer l'organisation courante depuis les cookies
    let currentOrgId: string | null = null;
    if (req.headers.cookie) {
      const cookieBase = config.session.cookieName;
      const orgCookieName = `${cookieBase}_org`;
      
      const cookies = Object.fromEntries(
        req.headers.cookie.split(';').filter(Boolean).map(c => {
          const [k, ...v] = c.trim().split('=');
          return [decodeURIComponent(k), decodeURIComponent(v.join('='))];
        })
      );
      
      currentOrgId = cookies[orgCookieName];
    }

    // Si pas d'organisation courante, prendre la première
    if (!currentOrgId && organizations.length > 0) {
      currentOrgId = organizations[0].id;
    }

    res.status(200).json({
      success: true,
      data: {
        user: userProfile,
        organizations,
        currentOrgId,
      },
    });
  });

  /**
   * Sélectionner une organisation
   * POST /api/v1/auth/select-organization
   */
  static selectOrganization = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError('Utilisateur non authentifié', 401);
    }

    const { organizationId } = req.body;

    if (!organizationId) {
      throw new AppError('ID d\'organisation requis', 400);
    }

    // Vérifier que l'utilisateur a accès à cette organisation
    const organizations = await SupabaseAuthService.getUserOrganizations(req.user.id);
    const selectedOrg = organizations.find(org => org.id === organizationId);

    if (!selectedOrg) {
      throw new AppError('Accès refusé à cette organisation', 403);
    }

    // Configuration sécurisée des cookies pour sélection d'organisation
    const cookieBase = config.session.cookieName;
    const secure = config.server.nodeEnv === 'production';
    const sameSite = 'lax' as const;
    const domain = config.session.cookieDomain;
    const orgMaxAgeSec = 12 * 60 * 60; // 12 heures

    // Options de cookies sécurisées
    const secureCookieOptions = {
      httpOnly: true,
      secure,
      sameSite,
      domain,
      path: '/',
    };

    // Définir le cookie d'organisation avec options sécurisées
    res.cookie(`${cookieBase}_org`, organizationId, {
      ...secureCookieOptions,
      maxAge: orgMaxAgeSec * 1000,
    });

    logger.info('Organisation sélectionnée et cookie défini', {
      userId: req.user.id,
      organizationId,
      organizationName: selectedOrg.name,
      role: selectedOrg.role,
      orgTokenExpiry: new Date(Date.now() + orgMaxAgeSec * 1000).toISOString()
    });

    res.status(200).json({
      success: true,
      message: 'Organisation sélectionnée',
      data: {
        organizationId,
        organizationName: selectedOrg.name,
        role: selectedOrg.role,
      },
    });
  });

  /**
   * Rafraîchir le token d'accès
   * POST /api/v1/auth/refresh
   */
  static refreshToken = asyncHandler(async (req: Request, res: Response) => {
    // Récupérer le refresh token depuis les cookies
    const cookieBase = config.session.cookieName;
    const refreshCookieName = `${cookieBase}_refresh`;
    
    let refreshToken: string | null = null;
    if (req.headers.cookie) {
      const cookies = Object.fromEntries(
        req.headers.cookie.split(';').filter(Boolean).map(c => {
          const [k, ...v] = c.trim().split('=');
          return [decodeURIComponent(k), decodeURIComponent(v.join('='))];
        })
      );
      
      refreshToken = cookies[refreshCookieName];
    }

    if (!refreshToken) {
      throw new AppError('Token de rafraîchissement manquant', 401);
    }

    // Rafraîchir le token
    const newTokens = await SupabaseAuthService.refreshToken(refreshToken);

    // Configuration sécurisée des cookies pour rafraîchissement
    const secure = config.server.nodeEnv === 'production';
    const sameSite = 'lax' as const;
    const domain = config.session.cookieDomain;

    // Durées des cookies optimisées pour la sécurité
    const accessMaxAgeSec = 15 * 60; // 15 minutes
    const refreshMaxAgeSec = 7 * 24 * 60 * 60; // 7 jours

    // Options de cookies sécurisées
    const secureCookieOptions = {
      httpOnly: true,
      secure,
      sameSite,
      domain,
    };

    // Mettre à jour les cookies avec options sécurisées
    res.cookie(`${cookieBase}_access`, newTokens.accessToken, {
      ...secureCookieOptions,
      path: '/',
      maxAge: accessMaxAgeSec * 1000,
    });

    res.cookie(`${cookieBase}_refresh`, newTokens.refreshToken, {
      ...secureCookieOptions,
      path: '/api/v1/auth',
      maxAge: refreshMaxAgeSec * 1000,
    });

    logger.info('Tokens rafraîchis et cookies mis à jour', {
      accessTokenExpiry: new Date(Date.now() + accessMaxAgeSec * 1000).toISOString(),
      refreshTokenExpiry: new Date(Date.now() + refreshMaxAgeSec * 1000).toISOString(),
      expiresIn: newTokens.expiresIn
    });

    res.status(200).json({
      success: true,
      message: 'Token rafraîchi avec succès',
      data: {
        expiresIn: newTokens.expiresIn,
      },
    });
  });

  /**
   * Déconnexion
   * POST /api/v1/auth/logout
   */
  static logout = asyncHandler(async (req: Request, res: Response) => {
    // Déconnexion Supabase
    await SupabaseAuthService.logout();

    // Configuration sécurisée pour suppression des cookies
    const cookieBase = config.session.cookieName;
    const domain = config.session.cookieDomain;
    const secure = config.server.nodeEnv === 'production';
    const sameSite = 'lax' as const;

    // Options de suppression sécurisées (doivent correspondre aux options de création)
    const clearOptions = {
      domain,
      secure,
      sameSite,
      httpOnly: true
    };

    // Supprimer les cookies de manière sécurisée
    res.clearCookie(`${cookieBase}_access`, { ...clearOptions, path: '/' });
    res.clearCookie(`${cookieBase}_refresh`, { ...clearOptions, path: '/api/v1/auth' });
    res.clearCookie(`${cookieBase}_org`, { ...clearOptions, path: '/' });

    logger.info('Cookies de session supprimés lors de la déconnexion', {
      userId: req.user?.id,
      cookiesCleared: [`${cookieBase}_access`, `${cookieBase}_refresh`, `${cookieBase}_org`]
    });

    res.status(200).json({
      success: true,
      message: 'Déconnexion réussie',
    });
  });

  /**
   * Récupérer les organisations de l'utilisateur
   * GET /api/v1/auth/organizations
   */
  static getOrganizations = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError('Utilisateur non authentifié', 401);
    }

    const organizations = await SupabaseAuthService.getUserOrganizations(req.user.id);

    res.status(200).json({
      success: true,
      data: {
        organizations,
      },
    });
  });
}
