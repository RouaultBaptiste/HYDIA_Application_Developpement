/**
 * Classe d'erreur personnalisée pour l'application
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly timestamp: string;
  public readonly path?: string;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    path?: string
  ) {
    super(message);
    
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();
    this.path = path;

    // Maintenir la stack trace (seulement en Node.js)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Erreurs spécifiques pour l'authentification
 */
export class AuthenticationError extends AppError {
  constructor(message: string = 'Non authentifié') {
    super(message, 401);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Non autorisé') {
    super(message, 403);
  }
}

/**
 * Erreurs spécifiques pour la validation
 */
export class ValidationError extends AppError {
  public readonly errors: any[];

  constructor(message: string = 'Données invalides', errors: any[] = []) {
    super(message, 400);
    this.errors = errors;
  }
}

/**
 * Erreurs spécifiques pour les ressources
 */
export class NotFoundError extends AppError {
  constructor(resource: string = 'Ressource') {
    super(`${resource} non trouvé(e)`, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Conflit de données') {
    super(message, 409);
  }
}

/**
 * Erreurs spécifiques pour les limites
 */
export class RateLimitError extends AppError {
  constructor(message: string = 'Trop de requêtes') {
    super(message, 429);
  }
}

export class PayloadTooLargeError extends AppError {
  constructor(message: string = 'Fichier trop volumineux') {
    super(message, 413);
  }
}

/**
 * Erreurs spécifiques pour les services externes
 */
export class ExternalServiceError extends AppError {
  constructor(service: string, message: string = 'Erreur du service externe') {
    super(`${service}: ${message}`, 502);
  }
}

/**
 * Erreurs spécifiques pour la base de données
 */
export class DatabaseError extends AppError {
  constructor(message: string = 'Erreur de base de données') {
    super(message, 500, false); // Non opérationnelle car c'est un problème système
  }
}

/**
 * Types d'erreurs pour une meilleure gestion
 */
export enum ErrorType {
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  VALIDATION = 'VALIDATION',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  RATE_LIMIT = 'RATE_LIMIT',
  PAYLOAD_TOO_LARGE = 'PAYLOAD_TOO_LARGE',
  EXTERNAL_SERVICE = 'EXTERNAL_SERVICE',
  DATABASE = 'DATABASE',
  INTERNAL = 'INTERNAL',
}

/**
 * Mapper les erreurs vers leurs types
 */
export const getErrorType = (error: Error): ErrorType => {
  if (error instanceof AuthenticationError) return ErrorType.AUTHENTICATION;
  if (error instanceof AuthorizationError) return ErrorType.AUTHORIZATION;
  if (error instanceof ValidationError) return ErrorType.VALIDATION;
  if (error instanceof NotFoundError) return ErrorType.NOT_FOUND;
  if (error instanceof ConflictError) return ErrorType.CONFLICT;
  if (error instanceof RateLimitError) return ErrorType.RATE_LIMIT;
  if (error instanceof PayloadTooLargeError) return ErrorType.PAYLOAD_TOO_LARGE;
  if (error instanceof ExternalServiceError) return ErrorType.EXTERNAL_SERVICE;
  if (error instanceof DatabaseError) return ErrorType.DATABASE;
  
  return ErrorType.INTERNAL;
};

/**
 * Interface pour les réponses d'erreur standardisées
 */
export interface ErrorResponse {
  success: false;
  error: {
    type: ErrorType;
    message: string;
    statusCode: number;
    timestamp: string;
    path?: string;
    errors?: any[];
    requestId?: string;
  };
}

/**
 * Créer une réponse d'erreur standardisée
 */
export const createErrorResponse = (
  error: AppError,
  requestId?: string,
  path?: string
): ErrorResponse => {
  return {
    success: false,
    error: {
      type: getErrorType(error),
      message: error.message,
      statusCode: error.statusCode,
      timestamp: error.timestamp,
      path: path || error.path,
      errors: error instanceof ValidationError ? error.errors : undefined,
      requestId,
    },
  };
};

/**
 * Vérifier si une erreur est opérationnelle
 */
export const isOperationalError = (error: Error): boolean => {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
};

/**
 * Codes d'erreur HTTP courants
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  PAYLOAD_TOO_LARGE: 413,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const;
