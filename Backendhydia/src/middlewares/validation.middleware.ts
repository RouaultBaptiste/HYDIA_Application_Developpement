import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { ValidationError } from '@/utils/errors';
import { sendError } from '@/utils/response';
import { logger } from '@/utils/logger';

/**
 * Middleware de validation des données avec Zod
 * @param schema Le schéma Zod à utiliser pour la validation
 * @returns Middleware Express qui valide les données de la requête
 */
export const validateRequest = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Valider le corps, les paramètres et les query params de la requête
      await schema.parseAsync({
        body: req.body,
        params: req.params,
        query: req.query,
      });
      
      // Si aucune erreur n'est levée, passer au middleware suivant
      next();
      return;
    } catch (error) {
      if (error instanceof ZodError) {
        // Créer une erreur de validation formatée
        const validationError = new ValidationError(
          'Données invalides dans la requête',
          error.errors
        );
        
        // Logger l'erreur de validation
        logger.warn('Validation error:', {
          path: req.path,
          method: req.method,
          errors: error.errors,
          body: req.body,
          params: req.params,
          query: req.query
        });
        
        // Envoyer l'erreur au client
        sendError(res, validationError);
        return;
      }
      
      // Pour les autres types d'erreurs, les passer au middleware d'erreur suivant
      next(error);
      return;
    }
  };
};

/**
 * Middleware qui nettoie et sanitize les entrées utilisateur
 * Supprime les caractères potentiellement dangereux et les balises HTML
 */
export const sanitizeInput = () => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    // Fonction récursive pour nettoyer les objets
    const sanitizeObject = (obj: any): any => {
      if (obj === null || obj === undefined) {
        return obj;
      }

      if (typeof obj === 'string') {
        // Nettoyer les chaînes de caractères
        return sanitizeString(obj);
      }

      if (Array.isArray(obj)) {
        // Nettoyer les tableaux récursivement
        return obj.map(item => sanitizeObject(item));
      }

      if (typeof obj === 'object') {
        // Nettoyer les objets récursivement
        const sanitizedObj: any = {};
        for (const [key, value] of Object.entries(obj)) {
          sanitizedObj[key] = sanitizeObject(value);
        }
        return sanitizedObj;
      }

      // Retourner les autres types tels quels
      return obj;
    };

    // Fonction pour nettoyer une chaîne de caractères
    const sanitizeString = (str: string): string => {
      // Convertir les caractères HTML spéciaux
      return str
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;')
        .trim();
    };

    // Nettoyer le body, les params et les query
    if (req.body) {
      req.body = sanitizeObject(req.body);
    }

    if (req.params) {
      req.params = sanitizeObject(req.params);
    }

    if (req.query) {
      req.query = sanitizeObject(req.query);
    }

    next();
    return;
  };
};

/**
 * Middleware qui valide les UUID
 * Vérifie que les paramètres d'URL contenant 'Id' sont des UUID valides
 */
export const validateUUIDs = () => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      
      // Vérifier les paramètres d'URL
      for (const [key, value] of Object.entries(req.params)) {
        if (key.toLowerCase().includes('id') && typeof value === 'string') {
          if (!uuidRegex.test(value)) {
            throw new ValidationError(`Le paramètre ${key} n'est pas un UUID valide`, [{
              path: key,
              message: 'Format UUID invalide'
            }]);
          }
        }
      }
      
      next();
      return;
    } catch (error) {
      if (error instanceof ValidationError) {
        sendError(res, error);
        return;
      }
      next(error);
      return;
    }
  };
};

/**
 * Middleware qui limite la taille des requêtes
 * Rejette les requêtes dont le corps dépasse une taille maximale
 */
export const limitBodySize = (maxSizeKB: number = 1000) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const contentLength = parseInt(req.headers['content-length'] || '0', 10);
    const maxSize = maxSizeKB * 1024; // Conversion en octets
    
    if (contentLength > maxSize) {
      const error = new ValidationError('Taille de requête excessive', [{
        path: 'body',
        message: `La taille de la requête (${Math.round(contentLength / 1024)} KB) dépasse la taille maximale autorisée (${maxSizeKB} KB)`
      }]);
      
      sendError(res, error);
      return;
    }
    
    next();
    return;
  };
};

/**
 * Middleware qui vérifie les autorisations basées sur les rôles
 * Vérifie que l'utilisateur a un des rôles requis
 */
export const requireRoles = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Vérifier que l'utilisateur est authentifié
      if (!req.user) {
        throw new ValidationError('Authentification requise', [{
          path: 'authorization',
          message: 'Utilisateur non authentifié'
        }]);
      }
      
      // Vérifier que l'utilisateur a un rôle autorisé
      const userRoles = req.user.roles || [];
      const hasRole = userRoles.some((role: string) => allowedRoles.includes(role));
      
      if (!hasRole) {
        throw new ValidationError('Accès non autorisé', [{
          path: 'authorization',
          message: 'Rôle insuffisant pour accéder à cette ressource'
        }]);
      }
      
      next();
      return;
    } catch (error) {
      if (error instanceof ValidationError) {
        sendError(res, error);
        return;
      }
      next(error);
      return;
    }
  };
};

/**
 * Middleware qui vérifie la force d'un mot de passe
 * Rejette les mots de passe qui ne respectent pas les critères de sécurité
 */
export const validatePasswordStrength = () => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Si la requête contient un champ password
      if (req.body && req.body.password) {
        const password = req.body.password;
        
        // Vérifier la longueur minimale
        if (password.length < 12) {
          throw new ValidationError('Mot de passe trop faible', [{
            path: 'password',
            message: 'Le mot de passe doit contenir au moins 12 caractères'
          }]);
        }
        
        // Vérifier la présence de différents types de caractères
        const hasUppercase = /[A-Z]/.test(password);
        const hasLowercase = /[a-z]/.test(password);
        const hasDigit = /[0-9]/.test(password);
        const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
        
        const errors = [];
        if (!hasUppercase) {
          errors.push({
            path: 'password',
            message: 'Le mot de passe doit contenir au moins une lettre majuscule'
          });
        }
        
        if (!hasLowercase) {
          errors.push({
            path: 'password',
            message: 'Le mot de passe doit contenir au moins une lettre minuscule'
          });
        }
        
        if (!hasDigit) {
          errors.push({
            path: 'password',
            message: 'Le mot de passe doit contenir au moins un chiffre'
          });
        }
        
        if (!hasSpecialChar) {
          errors.push({
            path: 'password',
            message: 'Le mot de passe doit contenir au moins un caractère spécial'
          });
        }
        
        if (errors.length > 0) {
          throw new ValidationError('Mot de passe trop faible', errors);
        }
      }
      
      next();
      return;
    } catch (error) {
      if (error instanceof ValidationError) {
        sendError(res, error);
        return;
      }
      next(error);
      return;
    }
  };
};

/**
 * Middleware qui vérifie les règles de sécurité CORS
 * Rejette les requêtes qui ne respectent pas les règles CORS
 */
export const validateCorsOrigin = (allowedOrigins: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const origin = req.headers.origin;
    
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      // Origine autorisée ou pas d'origine (même origine)
      next();
      return;
    } else {
      // Origine non autorisée
      const error = new ValidationError('Origine CORS non autorisée', [{
        path: 'origin',
        message: `L'origine '${origin}' n'est pas autorisée à accéder à cette ressource`
      }]);
      
      sendError(res, error);
      return;
    }
  };
};
