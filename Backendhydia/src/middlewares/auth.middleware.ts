import { Request, Response, NextFunction } from 'express';
import { SupabaseAuthService } from '../services/auth.supabase.service';
import { OrganizationService } from '@/services/organization.service';
import { AppError, AuthenticationError, AuthorizationError } from '@/utils/errors';
import { sendError } from '@/utils/response';
import { logger, loggers } from '@/utils/logger';
import { config } from '@/config/env';
import { supabase } from '@/config/supabase';

// Extension des types Express pour inclure les données utilisateur
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        roles?: string[];
      };
      organization?: {
        id: string;
        role: string;
        settings?: {
          allowPasswordSharing?: boolean;
          allowDocumentSharing?: boolean;
          [key: string]: any;
        };
      };
    }
  }
}

/**
 * Middleware d'authentification JWT
 * Vérifie la validité du token et ajoute les informations utilisateur à la requête
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    let token = '';

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else {
      // Essayer de lire le cookie d'accès HttpOnly
      const cookieBase = config.session.cookieName;
      const accessCookieName = `${cookieBase}_access`;
      const cookieHeader = req.headers.cookie || '';
      const cookiesMap = Object.fromEntries(
        cookieHeader.split(';').filter(Boolean).map(c => {
          const [k, ...v] = c.trim().split('=');
          return [decodeURIComponent(k), decodeURIComponent(v.join('='))];
        })
      );
      token = cookiesMap[accessCookieName] || '';
    }
    
    if (!token) {
      throw new AuthenticationError('Token d\'authentification manquant');
    }

    // Vérifier et décoder le token avec SupabaseAuthService
    const decoded = await SupabaseAuthService.verifyToken(token);
    
    // Ajouter les informations utilisateur à la requête
    req.user = {
      id: decoded.userId,
      email: decoded.email,
    };
    // Logger l'accès
    loggers.auth.login(decoded.userId, decoded.email, req.ip);
    
    next();
  } catch (error) {
    if (error instanceof AppError) {
      loggers.security.invalidToken(req.headers.authorization || '', error.message, req.ip);
      sendError(res, error);
      return;
    }
    
    logger.error('Erreur d\'authentification:', error);
    const authError = new AuthenticationError('Token d\'authentification invalide');
    sendError(res, authError);
    return;
  }
};

/**
 * Middleware de contexte DB pour RLS
 * Appelle une RPC Postgres `set_app_context(user_id, org_id)` si disponible
 * N'échoue pas la requête en cas d'erreur de RPC, log seulement.
 */
export const setDbContext = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id || null;
    const orgId = req.organization?.id || null;

    if (!userId) return next();

    // Appeler la RPC si elle existe côté DB
    const { error } = await supabase.rpc('set_app_context', {
      user_id: userId,
      org_id: orgId,
    });

    if (error) {
      logger.warn('RPC set_app_context a échoué ou est absente', {
        error: error.message,
        code: (error as any).code,
      });
    }
  } catch (e) {
    logger.warn('Erreur middleware setDbContext (ignorée):', e);
  } finally {
    next();
  }
};

/**
 * Middleware de contexte d'organisation
 * - Lit l'organisation depuis cookie `${cookieName}_org` ou headers `x-organization-id`/`x-org-id`
 * - Vérifie l'appartenance de l'utilisateur à l'organisation
 * - Attache `req.organization = { id, role }`
 * N'échoue pas si aucune organisation n'est fournie (utile pour des routes non-scopées)
 */
export const organizationContext = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Doit être après authenticate
    const userId = req.user?.id;

    // Lire org depuis headers ou cookie
    const headerOrg = (req.headers['x-organization-id'] as string) || (req.headers['x-org-id'] as string) || '';
    const cookieBase = config.session.cookieName;
    const orgCookieName = `${cookieBase}_org`;
    const cookieHeader = req.headers.cookie || '';
    const cookiesMap = Object.fromEntries(
      cookieHeader.split(';').filter(Boolean).map(c => {
        const [k, ...v] = c.trim().split('=');
        return [decodeURIComponent(k), decodeURIComponent(v.join('='))];
      })
    );
    const cookieOrg = cookiesMap[orgCookieName] || '';
    const organizationId = headerOrg || cookieOrg;

    if (!organizationId) {
      // Pas d'organisation fournie, continuer sans erreur
      return next();
    }

    if (!userId) {
      // Si pas d'utilisateur, on ne peut pas valider l'appartenance
      return next();
    }

    // Vérifier appartenance et récupérer rôle
    const { hasPermission, role } = await OrganizationService.checkUserPermission(
      organizationId,
      userId,
      ['admin', 'manager', 'user', 'viewer']
    );

    if (!hasPermission) {
      // Si l'en-tête/cookie pointe vers une org non accessible, ignorer le contexte
      logger.warn('Organisation non autorisée pour cet utilisateur', { userId, organizationId });
      return next();
    }

    req.organization = {
      id: organizationId,
      role,
    };

    next();
  } catch (error) {
    logger.error('Erreur middleware organizationContext:', error);
    // Ne bloque pas la requête, mais n'attache pas l'org
    next();
  }
};

/**
 * Middleware d'authentification optionnelle
 * Similaire à authenticate mais n'échoue pas si aucun token n'est fourni
 */
export const optionalAuthenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // Continuer sans authentification
    }

    const token = authHeader.substring(7);
    
    if (!token) {
      return next(); // Continuer sans authentification
    }

    // Vérifier et décoder le token avec SupabaseAuthService
    const decoded = await SupabaseAuthService.verifyToken(token);
    
    // Ajouter les informations utilisateur à la requête
    req.user = {
      id: decoded.userId,
      email: decoded.email,
    };
    
    next();
  } catch (error) {
    // En cas d'erreur, continuer sans authentification
    logger.warn('Token optionnel invalide:', error);
    next();
  }
};

/**
 * Middleware de vérification des rôles dans une organisation
 */
export const requireOrganizationRole = (allowedRoles: string[] = ['admin', 'manager', 'user']) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AuthenticationError('Authentification requise');
      }

      const organizationId = req.params.organizationId || req.body.organizationId;
      
      if (!organizationId) {
        throw new AppError('ID d\'organisation manquant', 400);
      }

      // Vérifier les permissions de l'utilisateur dans l'organisation
      const { hasPermission, role } = await OrganizationService.checkUserPermission(
        organizationId,
        req.user.id,
        allowedRoles
      );

      if (!hasPermission) {
        throw new AuthorizationError('Permissions insuffisantes pour cette organisation');
      }

      // Ajouter les informations d'organisation à la requête
      req.organization = {
        id: organizationId,
        role,
      };

      next();
    } catch (error) {
      if (error instanceof AppError) {
        sendError(res, error);
      return;
      }
      
      logger.error('Erreur de vérification des rôles:', error);
      const authError = new AuthorizationError('Erreur de vérification des permissions');
      sendError(res, authError);
    return;
    }
  };
};

/**
 * Middleware pour vérifier si l'utilisateur est admin d'une organisation
 */
export const requireOrganizationAdmin = requireOrganizationRole(['admin']);

/**
 * Middleware pour vérifier si l'utilisateur est admin ou manager d'une organisation
 */
export const requireOrganizationManager = requireOrganizationRole(['admin', 'manager']);

/**
 * Middleware pour vérifier si l'utilisateur est membre d'une organisation (tous rôles)
 */
export const requireOrganizationMember = requireOrganizationRole(['admin', 'manager', 'user', 'viewer']);

/**
 * Middleware pour vérifier si l'utilisateur peut écrire dans une organisation
 */
export const requireOrganizationWrite = requireOrganizationRole(['admin', 'manager', 'user']);

/**
 * Middleware pour vérifier la propriété d'une ressource
 */
export const requireResourceOwnership = (resourceIdParam: string = 'id') => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AuthenticationError('Authentification requise');
      }

      const resourceId = req.params[resourceIdParam];
      const userId = req.user.id;

      // Cette vérification doit être implémentée dans chaque service spécifique
      // Pour l'instant, on passe au middleware suivant
      // TODO: Implémenter la vérification de propriété spécifique à chaque ressource
      
      next();
    } catch (error) {
      if (error instanceof AppError) {
        sendError(res, error);
      return;
      }
      
      logger.error('Erreur de vérification de propriété:', error);
      const authError = new AuthorizationError('Erreur de vérification de propriété');
      sendError(res, authError);
    return;
    }
  };
};

/**
 * Middleware pour limiter l'accès aux utilisateurs actifs uniquement
 */
export const requireActiveUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AuthenticationError('Authentification requise');
    }

    // Récupérer le profil utilisateur pour vérifier s'il est actif
    const userProfile = await SupabaseAuthService.getUserProfile(req.user.id);
    
    if (!userProfile || !userProfile.isActive) {
      throw new AuthorizationError('Compte utilisateur désactivé');
    }

    next();
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error);
      return;
    }
    
    logger.error('Erreur de vérification d\'utilisateur actif:', error);
    const authError = new AuthorizationError('Erreur de vérification du statut utilisateur');
    sendError(res, authError);
    return;
  }
};

/**
 * Middleware pour extraire l'organisation depuis différentes sources
 */
export const extractOrganization = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Essayer de récupérer l'ID d'organisation depuis différentes sources
  const organizationId = 
    req.params.organizationId ||
    req.body.organizationId ||
    req.query.organizationId ||
    req.headers['x-organization-id'];

  if (organizationId) {
    req.body.organizationId = organizationId;
    req.params.organizationId = organizationId;
  }

  next();
};

/**
 * Middleware pour logger les tentatives d'accès
 */
export const logAccess = (resource: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const userId = req.user?.id;
    const resourceId = req.params.id || req.params.resourceId;
    const action = req.method;
    const ip = req.ip;

    loggers.data.access(resource, resourceId || 'unknown', userId || 'anonymous', action);
    
    // Logger les détails de la requête
    logger.info('Resource Access', {
      resource,
      resourceId,
      userId,
      action,
      ip,
      userAgent: req.headers['user-agent'],
      path: req.originalUrl,
    });

    next();
  };
};

/**
 * Middleware pour détecter les activités suspectes
 */
export const detectSuspiciousActivity = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const userId = req.user?.id;
  const ip = req.ip;
  const userAgent = req.headers['user-agent'];
  const path = req.originalUrl;

  // Détecter les tentatives d'accès à des ressources non autorisées
  if (req.method === 'DELETE' && userId) {
    loggers.security.suspiciousActivity(
      userId,
      'DELETE_REQUEST',
      { path, method: req.method },
      ip
    );
  }

  // Détecter les requêtes avec des paramètres suspects
  const suspiciousPatterns = [
    /script/i,
    /javascript/i,
    /vbscript/i,
    /onload/i,
    /onerror/i,
    /<script/i,
    /eval\(/i,
    /expression\(/i,
  ];

  const queryString = JSON.stringify(req.query);
  const bodyString = JSON.stringify(req.body);

  suspiciousPatterns.forEach(pattern => {
    if (pattern.test(queryString) || pattern.test(bodyString)) {
      loggers.security.suspiciousActivity(
        userId || 'anonymous',
        'SUSPICIOUS_PAYLOAD',
        { 
          path, 
          method: req.method,
          query: req.query,
          body: req.body,
          userAgent 
        },
        ip
      );
    }
  });

  next();
};

/**
 * Middleware pour vérifier les permissions de fichier
 */
export const requireFilePermissions = (action: 'read' | 'write' | 'delete') => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AuthenticationError('Authentification requise');
      }

      const organizationId = req.params.organizationId || req.body.organizationId;
      
      if (!organizationId) {
        throw new AppError('ID d\'organisation manquant', 400);
      }

      // Définir les rôles requis selon l'action
      let allowedRoles: string[] = [];
      
      switch (action) {
        case 'read':
          allowedRoles = ['admin', 'manager', 'user', 'viewer'];
          break;
        case 'write':
          allowedRoles = ['admin', 'manager', 'user'];
          break;
        case 'delete':
          allowedRoles = ['admin', 'manager'];
          break;
      }

      // Vérifier les permissions
      const { hasPermission, role } = await OrganizationService.checkUserPermission(
        organizationId,
        req.user.id,
        allowedRoles
      );

      if (!hasPermission) {
        throw new AuthorizationError(`Permissions insuffisantes pour ${action} des fichiers`);
      }

      req.organization = {
        id: organizationId,
        role,
      };

      next();
    } catch (error) {
      if (error instanceof AppError) {
        sendError(res, error);
      return;
      }
      
      logger.error('Erreur de vérification des permissions de fichier:', error);
      const authError = new AuthorizationError('Erreur de vérification des permissions');
      sendError(res, authError);
    return;
    }
  };
};
