import { Request, Response, NextFunction } from 'express';
import { SupabaseAuthService } from '../services/auth.supabase.service';
import { OrganizationService } from '../services/organization.service';
import { supabase } from '../config/supabase';
import { logger } from '../utils/logger';
import { config } from '../config/env';
import { AppError } from '../utils/errors';

// Define the user profile structure with all fields needed
interface UserProfile {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  isActive: boolean;
  emailVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
  roles?: string[];
}

/**
 * Middleware d'authentification principal utilisant Supabase Auth
 */
export const authenticateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const startTime = Date.now();
  const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    let token = null;
    let tokenSource = 'none';
    const authHeader = req.headers.authorization;
    
    logger.info(`[AUTH-${requestId}] Début authentification`, {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      hasAuthHeader: !!authHeader,
      hasCookies: !!req.headers.cookie
    });
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
      tokenSource = 'header';
      logger.debug(`[AUTH-${requestId}] Token trouvé dans l'en-tête Authorization`);
    }

    if (!token && req.headers.cookie) {
      const cookieBase = config.session.cookieName;
      const accessCookieName = `${cookieBase}_access`;
      
      const cookies = Object.fromEntries(
        req.headers.cookie.split(';').filter(Boolean).map(c => {
          const [k, ...v] = c.trim().split('=');
          return [decodeURIComponent(k), decodeURIComponent(v.join('='))];
        })
      );
      
      token = cookies[accessCookieName];
      if (token) {
        tokenSource = 'cookie';
        logger.debug(`[AUTH-${requestId}] Token trouvé dans les cookies`);
      }
    }

    if (!token) {
      logger.warn(`[AUTH-${requestId}] Aucun token d'authentification trouvé`, {
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        hasAuthHeader: !!authHeader,
        hasCookies: !!req.headers.cookie
      });
      throw new AppError('Token d\'authentification manquant', 401);
    }

    logger.debug(`[AUTH-${requestId}] Vérification du token avec Supabase`, {
      tokenSource,
      tokenLength: token.length
    });

    // Vérifier le token avec Supabase
    const tokenStartTime = Date.now();
    const { userId, email } = await SupabaseAuthService.verifyToken(token);
    const tokenVerifyDuration = Date.now() - tokenStartTime;
    
    logger.debug(`[AUTH-${requestId}] Token vérifié avec succès`, {
      userId,
      email,
      verifyDuration: `${tokenVerifyDuration}ms`
    });
    
    // Récupérer le profil utilisateur complet
    const profileStartTime = Date.now();
    const userProfile = await SupabaseAuthService.getUserProfile(userId);
    const profileFetchDuration = Date.now() - profileStartTime;
    
    if (!userProfile) {
      logger.error(`[AUTH-${requestId}] Profil utilisateur non trouvé`, {
        userId,
        email
      });
      throw new AppError('Utilisateur non trouvé', 401);
    }

    logger.debug(`[AUTH-${requestId}] Profil utilisateur récupéré`, {
      userId: userProfile.id,
      email: userProfile.email,
      isActive: userProfile.isActive,
      fetchDuration: `${profileFetchDuration}ms`
    });

    // Attacher les informations utilisateur à la requête
    req.user = {
      id: userProfile.id,
      email: userProfile.email
    };

    const totalDuration = Date.now() - startTime;
    logger.info(`[AUTH-${requestId}] Authentification réussie`, {
      userId: userProfile.id,
      email: userProfile.email,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      tokenSource,
      totalDuration: `${totalDuration}ms`,
      tokenVerifyDuration: `${tokenVerifyDuration}ms`,
      profileFetchDuration: `${profileFetchDuration}ms`
    });

    next();
  } catch (error) {
    const totalDuration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    const statusCode = error instanceof AppError ? error.statusCode : 500;
    
    logger.error(`[AUTH-${requestId}] Échec de l'authentification`, {
      error: errorMessage,
      statusCode,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      hasAuthHeader: !!req.headers.authorization,
      hasCookies: !!req.headers.cookie,
      duration: `${totalDuration}ms`,
      stack: error instanceof Error ? error.stack : undefined
    });

    res.status(statusCode === 500 ? 401 : statusCode).json({
      success: false,
      error: {
        message: statusCode === 500 ? 'Token invalide' : errorMessage,
        code: 'AUTHENTICATION_FAILED',
        statusCode: statusCode === 500 ? 401 : statusCode
      }
    });
  }
};

/**
 * Middleware pour définir le contexte d'organisation
 */
export const setOrganizationContext = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const startTime = Date.now();
  const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    if (!req.user) {
      logger.error(`[ORG-${requestId}] Utilisateur non authentifié pour le contexte organisationnel`);
      throw new AppError('Utilisateur non authentifié', 401);
    }

    let organizationId: string | null = null;
    let orgSource = 'none';

    logger.debug(`[ORG-${requestId}] Recherche de l'ID d'organisation`, {
      userId: req.user.id,
      method: req.method,
      url: req.originalUrl,
      hasOrgHeader: !!req.headers['x-organization-id'],
      hasOrgParam: !!req.params.organizationId,
      hasCookies: !!req.headers.cookie
    });

    // 1. Vérifier l'en-tête x-organization-id
    if (req.headers['x-organization-id']) {
      organizationId = req.headers['x-organization-id'] as string;
      orgSource = 'header';
      logger.debug(`[ORG-${requestId}] Organisation trouvée dans l'en-tête: ${organizationId}`);
    }

    // 2. Vérifier les paramètres de route
    if (!organizationId && req.params.organizationId) {
      organizationId = req.params.organizationId;
      orgSource = 'param';
      logger.debug(`[ORG-${requestId}] Organisation trouvée dans les paramètres: ${organizationId}`);
    }

    // 3. Vérifier les cookies
    if (!organizationId && req.headers.cookie) {
      const cookieBase = config.session.cookieName;
      const orgCookieName = `${cookieBase}_org`;
      
      const cookies = Object.fromEntries(
        req.headers.cookie.split(';').filter(Boolean).map(c => {
          const [k, ...v] = c.trim().split('=');
          return [decodeURIComponent(k), decodeURIComponent(v.join('='))];
        })
      );
      
      organizationId = cookies[orgCookieName];
      if (organizationId) {
        orgSource = 'cookie';
        logger.debug(`[ORG-${requestId}] Organisation trouvée dans les cookies: ${organizationId}`);
      }
    }

    if (!organizationId) {
      logger.warn(`[ORG-${requestId}] Aucun ID d'organisation trouvé`, {
        userId: req.user.id,
        method: req.method,
        url: req.originalUrl,
        hasOrgHeader: !!req.headers['x-organization-id'],
        hasOrgParam: !!req.params.organizationId,
        hasCookies: !!req.headers.cookie
      });
      throw new AppError('ID d\'organisation manquant', 400);
    }

    // Vérifier que l'utilisateur a accès à cette organisation
    logger.debug(`[ORG-${requestId}] Vérification de l'accès à l'organisation`, {
      userId: req.user.id,
      organizationId,
      orgSource
    });
    
    const accessCheckStart = Date.now();
    const hasAccess = await OrganizationService.checkUserAccess(
      req.user.id,
      organizationId
    );
    const accessCheckDuration = Date.now() - accessCheckStart;

    if (!hasAccess) {
      // Vérifier si l'utilisateur a au moins une organisation
      logger.debug(`[ORG-${requestId}] Vérification des organisations de l'utilisateur`);
      const userOrganizations = await OrganizationService.getUserOrganizations(req.user.id);
      
      if (userOrganizations.length === 0) {
        logger.warn(`[ORG-${requestId}] Utilisateur sans organisation`, {
          userId: req.user.id
        });
        throw new AppError('Utilisateur doit être membre d\'au moins une organisation', 403);
      }
      
      // Si l'utilisateur a des organisations mais pas celle demandée, utiliser la première disponible
      const firstOrg = userOrganizations[0];
      logger.info(`[ORG-${requestId}] Utilisation de l'organisation par défaut`, {
        userId: req.user.id,
        requestedOrgId: organizationId,
        defaultOrgId: firstOrg.id,
        defaultOrgName: firstOrg.name
      });
      
      organizationId = firstOrg.id;
      orgSource = 'default';
    }

    // Récupérer le rôle de l'utilisateur dans l'organisation
    const roleCheckStart = Date.now();
    const userRole = await OrganizationService.getUserRole(
      req.user.id,
      organizationId
    );
    const roleCheckDuration = Date.now() - roleCheckStart;

    logger.debug(`[ORG-${requestId}] Rôle utilisateur récupéré`, {
      userId: req.user.id,
      organizationId,
      userRole: userRole || 'viewer',
      roleCheckDuration: `${roleCheckDuration}ms`
    });

    // Attacher le contexte organisationnel à la requête
    req.organization = {
      id: organizationId,
      role: userRole || 'viewer'
    };

    // Définir le contexte dans la base de données pour RLS
    const contextSetStart = Date.now();
    try {
      const { error: rpcError } = await supabase.rpc('set_app_context', {
        user_id: req.user.id,
        org_id: organizationId
      });
      
      if (rpcError) {
        logger.warn(`[ORG-${requestId}] Erreur RPC set_app_context:`, {
          error: rpcError.message,
          code: rpcError.code,
          userId: req.user.id,
          organizationId
        });
        // Continue sans RPC context - les middlewares de permissions géreront l'accès
      }
    } catch (rpcException) {
      logger.warn(`[ORG-${requestId}] Exception lors de l'appel RPC:`, {
        error: rpcException instanceof Error ? rpcException.message : 'Erreur inconnue',
        userId: req.user.id,
        organizationId
      });
      // Continue sans RPC context - les middlewares de permissions géreront l'accès
    }
    const contextSetDuration = Date.now() - contextSetStart;

    const totalDuration = Date.now() - startTime;
    logger.info(`[ORG-${requestId}] Contexte organisationnel défini avec succès`, {
      userId: req.user.id,
      organizationId,
      userRole: userRole || 'viewer',
      orgSource,
      method: req.method,
      url: req.originalUrl,
      totalDuration: `${totalDuration}ms`,
      accessCheckDuration: `${accessCheckDuration}ms`,
      roleCheckDuration: `${roleCheckDuration}ms`,
      contextSetDuration: `${contextSetDuration}ms`
    });

    next();
  } catch (error) {
    logger.warn('Échec de la définition du contexte d\'organisation', { 
      error: error instanceof Error ? error.message : 'Erreur inconnue',
      userId: req.user?.id,
      path: req.path 
    });

    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        error: {
          type: 'ORGANIZATION_ERROR',
          message: error.message,
          statusCode: error.statusCode,
          timestamp: new Date().toISOString(),
          path: req.originalUrl,
          requestId: res.locals.requestId,
        },
      });
    } else {
      res.status(500).json({
        success: false,
        error: {
          type: 'ORGANIZATION_ERROR',
          message: 'Erreur lors de la définition du contexte d\'organisation',
          statusCode: 500,
          timestamp: new Date().toISOString(),
          path: req.originalUrl,
          requestId: res.locals.requestId,
        },
      });
    }
  }
};

/**
 * Middleware combiné pour l'authentification et le contexte d'organisation
 */
export const requireAuth = [authenticateUser, setOrganizationContext];

/**
 * Middleware pour vérifier les permissions spécifiques
 */
export const requireRole = (roles: string | string[]) => {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.organization) {
      res.status(401).json({
        success: false,
        error: {
          type: 'AUTHORIZATION_ERROR',
          message: 'Contexte d\'organisation manquant',
          statusCode: 401,
          timestamp: new Date().toISOString(),
          path: req.originalUrl,
          requestId: res.locals.requestId,
        },
      });
      return;
    }

    if (!allowedRoles.includes(req.organization.role)) {
      res.status(403).json({
        success: false,
        error: {
          type: 'AUTHORIZATION_ERROR',
          message: `Rôle insuffisant. Rôles requis: ${allowedRoles.join(', ')}`,
          statusCode: 403,
          timestamp: new Date().toISOString(),
          path: req.originalUrl,
          requestId: res.locals.requestId,
        },
      });
      return;
    }

    next();
  };
};

/**
 * Middleware pour les routes publiques (optionnel auth)
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Essayer d'authentifier, mais ne pas échouer si pas de token
    let token: string | null = null;
    
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
    
    if (!token && req.headers.cookie) {
      const cookieBase = config.session.cookieName;
      const accessCookieName = `${cookieBase}_access`;
      
      const cookies = Object.fromEntries(
        req.headers.cookie.split(';').filter(Boolean).map(c => {
          const [k, ...v] = c.trim().split('=');
          return [decodeURIComponent(k), decodeURIComponent(v.join('='))];
        })
      );
      
      token = cookies[accessCookieName];
    }

    if (token) {
      try {
        const { userId } = await SupabaseAuthService.verifyToken(token);
        const userProfile = await SupabaseAuthService.getUserProfile(userId);
        
        if (userProfile) {
          req.user = {
            id: userProfile.id,
            email: userProfile.email
          };
        }
      } catch (error) {
        // Ignorer les erreurs d'authentification pour les routes optionnelles
        logger.debug('Authentification optionnelle échouée', { error: error instanceof Error ? error.message : 'Erreur inconnue' });
      }
    }

    next();
  } catch (error) {
    // Pour les routes optionnelles, continuer même en cas d'erreur
    next();
  }
};

/**
 * Middleware de logging pour l'accès aux ressources
 */
export const logAccess = (resourceType: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const startTime = Date.now();
    
    // Log de la requête
    logger.info('Accès à la ressource', {
      resourceType,
      method: req.method,
      path: req.path,
      userId: req.user?.id,
      organizationId: req.organization?.id,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });

    // Log de la réponse
    const originalSend = res.send;
    res.send = function(data) {
      const duration = Date.now() - startTime;
      
      logger.info('Réponse envoyée', {
        resourceType,
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration,
        userId: req.user?.id,
        organizationId: req.organization?.id,
      });

      return originalSend.call(this, data);
    };

    next();
  };
};
