import { Request, Response, NextFunction } from 'express';
import { logger } from '@/utils/logger';
import { 
  ValidationError, 
  AuthenticationError, 
  AuthorizationError, 
  NotFoundError, 
  ConflictError,
  RateLimitError,
  DatabaseError,
  ExternalServiceError 
} from '@/utils/errors';

/**
 * Interface pour les erreurs avec code de statut
 */
interface ErrorWithStatus extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
}

/**
 * Middleware de gestion centralisée des erreurs
 */
export const errorHandler = (
  err: ErrorWithStatus,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Si les headers ont déjà été envoyés, déléguer à Express
  if (res.headersSent) {
    return next(err);
  }

  // Logger l'erreur
  logger.error('Erreur capturée par le middleware', {
    requestId: req.requestId,
    error: {
      name: err.name,
      message: err.message,
      stack: err.stack,
      code: err.code,
      statusCode: err.statusCode
    },
    request: {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: (req as any).user?.id
    }
  });

  let statusCode = 500;
  let errorCode = 'INTERNAL_SERVER_ERROR';
  let message = 'Une erreur interne est survenue';
  let details: any = undefined;

  // Gestion spécifique selon le type d'erreur
  if (err instanceof ValidationError) {
    statusCode = 400;
    errorCode = 'VALIDATION_ERROR';
    message = err.message;
    details = (err as any).details || err.message;
  } else if (err instanceof AuthenticationError) {
    statusCode = 401;
    errorCode = 'AUTHENTICATION_ERROR';
    message = err.message;
  } else if (err instanceof AuthorizationError) {
    statusCode = 403;
    errorCode = 'AUTHORIZATION_ERROR';
    message = err.message;
  } else if (err instanceof NotFoundError) {
    statusCode = 404;
    errorCode = 'NOT_FOUND';
    message = err.message;
  } else if (err instanceof ConflictError) {
    statusCode = 409;
    errorCode = 'CONFLICT';
    message = err.message;
  } else if (err instanceof RateLimitError) {
    statusCode = 429;
    errorCode = 'RATE_LIMIT_EXCEEDED';
    message = err.message;
  } else if (err instanceof DatabaseError) {
    statusCode = 500;
    errorCode = 'DATABASE_ERROR';
    message = 'Erreur de base de données';
    // Ne pas exposer les détails de la DB en production
    if (process.env.NODE_ENV === 'development') {
      details = err.message;
    }
  } else if (err instanceof ExternalServiceError) {
    statusCode = 502;
    errorCode = 'EXTERNAL_SERVICE_ERROR';
    message = 'Erreur de service externe';
  } else if (err.name === 'CastError') {
    // Erreur de cast MongoDB/Mongoose
    statusCode = 400;
    errorCode = 'INVALID_ID';
    message = 'ID invalide';
  } else if (err.name === 'ValidationError') {
    // Erreur de validation Mongoose
    statusCode = 400;
    errorCode = 'VALIDATION_ERROR';
    message = 'Données invalides';
    details = Object.values((err as any).errors).map((error: any) => ({
      field: error.path,
      message: error.message
    }));
  } else if (err.name === 'MongoError' && (err as any).code === 11000) {
    // Erreur de duplication MongoDB
    statusCode = 409;
    errorCode = 'DUPLICATE_KEY';
    message = 'Cette ressource existe déjà';
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    errorCode = 'INVALID_TOKEN';
    message = 'Token invalide';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    errorCode = 'TOKEN_EXPIRED';
    message = 'Token expiré';
  } else if (err.name === 'SyntaxError' && 'body' in err) {
    statusCode = 400;
    errorCode = 'INVALID_JSON';
    message = 'JSON invalide';
  } else if (err.statusCode) {
    // Erreur avec code de statut personnalisé
    statusCode = err.statusCode;
    errorCode = err.code || errorCode;
    message = err.message || message;
  }

  // Construire la réponse d'erreur
  const errorResponse: any = {
    success: false,
    error: {
      code: errorCode,
      message,
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    }
  };

  // Ajouter les détails si présents
  if (details) {
    errorResponse.error.details = details;
  }

  // En développement, ajouter la stack trace
  if (process.env.NODE_ENV === 'development') {
    errorResponse.error.stack = err.stack;
  }

  // Envoyer la réponse
  res.status(statusCode).json(errorResponse);
};

/**
 * Middleware pour gérer les routes non trouvées
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  logger.warn('Route non trouvée', {
    requestId: req.requestId,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Route non trouvée',
      path: req.originalUrl,
      method: req.method,
      timestamp: new Date().toISOString(),
      requestId: req.requestId
    }
  });
};

/**
 * Wrapper pour les fonctions async afin de capturer les erreurs
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Middleware de gestion des erreurs de validation Zod
 */
export const zodErrorHandler = (err: any, req: Request, res: Response, next: NextFunction): void => {
  if (err.name === 'ZodError') {
    const validationErrors = err.errors.map((error: any) => ({
      field: error.path.join('.'),
      message: error.message,
      code: error.code
    }));

    logger.warn('Erreur de validation Zod', {
      requestId: req.requestId,
      errors: validationErrors,
      method: req.method,
      url: req.originalUrl
    });

    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Données invalides',
        details: validationErrors,
        timestamp: new Date().toISOString(),
        requestId: req.requestId
      }
    });
    return;
  }

  next(err);
};
