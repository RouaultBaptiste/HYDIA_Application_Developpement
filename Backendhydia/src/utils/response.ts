import { Response } from 'express';
import { AppError, createErrorResponse } from './errors';
import { logger } from './logger';

/**
 * Interface pour les réponses de succès standardisées
 */
export interface SuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
  meta?: {
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    timestamp: string;
    requestId?: string;
  };
}

/**
 * Interface pour les options de pagination
 */
export interface PaginationOptions {
  page: number;
  limit: number;
  total: number;
}

/**
 * Créer une réponse de succès standardisée
 */
export const createSuccessResponse = <T>(
  data: T,
  message?: string,
  pagination?: PaginationOptions,
  requestId?: string
): SuccessResponse<T> => {
  const response: SuccessResponse<T> = {
    success: true,
    data,
    message,
    meta: {
      timestamp: new Date().toISOString(),
      requestId,
    },
  };

  if (pagination) {
    response.meta!.pagination = {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      totalPages: Math.ceil(pagination.total / pagination.limit),
    };
  }

  return response;
};

/**
 * Envoyer une réponse de succès
 */
export const sendSuccess = <T>(
  res: Response,
  data: T,
  statusCode: number = 200,
  message?: string,
  pagination?: PaginationOptions
): Response => {
  const requestId = res.locals.requestId;
  const response = createSuccessResponse(data, message, pagination, requestId);
  
  return res.status(statusCode).json(response);
};

/**
 * Envoyer une réponse d'erreur
 */
export const sendError = (
  res: Response,
  error: AppError,
  requestId?: string
): Response => {
  const path = res.req.originalUrl;
  const errorResponse = createErrorResponse(error, requestId || res.locals.requestId, path);
  
  // Logger l'erreur
  logger.error('API Error Response', {
    error: error.message,
    statusCode: error.statusCode,
    path,
    requestId: requestId || res.locals.requestId,
    stack: error.stack,
  });
  
  return res.status(error.statusCode).json(errorResponse);
};

/**
 * Envoyer une réponse de création réussie
 */
export const sendCreated = <T>(
  res: Response,
  data: T,
  message: string = 'Ressource créée avec succès'
): Response => {
  return sendSuccess(res, data, 201, message);
};

/**
 * Envoyer une réponse de suppression réussie
 */
export const sendDeleted = (
  res: Response,
  message: string = 'Ressource supprimée avec succès'
): Response => {
  return sendSuccess(res, null, 204, message);
};

/**
 * Envoyer une réponse de mise à jour réussie
 */
export const sendUpdated = <T>(
  res: Response,
  data: T,
  message: string = 'Ressource mise à jour avec succès'
): Response => {
  return sendSuccess(res, data, 200, message);
};

/**
 * Envoyer une réponse avec pagination
 */
export const sendPaginated = <T>(
  res: Response,
  data: T[],
  pagination: PaginationOptions,
  message?: string
): Response => {
  return sendSuccess(res, data, 200, message, pagination);
};

/**
 * Utilitaires pour les codes de statut HTTP
 */
export const HttpStatus = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
} as const;

/**
 * Messages de succès standardisés
 */
export const SuccessMessages = {
  CREATED: 'Ressource créée avec succès',
  UPDATED: 'Ressource mise à jour avec succès',
  DELETED: 'Ressource supprimée avec succès',
  RETRIEVED: 'Ressource récupérée avec succès',
  
  // Auth
  LOGIN_SUCCESS: 'Connexion réussie',
  LOGOUT_SUCCESS: 'Déconnexion réussie',
  REGISTER_SUCCESS: 'Inscription réussie',
  TOKEN_REFRESHED: 'Token actualisé avec succès',
  
  // Organization
  ORGANIZATION_CREATED: 'Organisation créée avec succès',
  ORGANIZATION_UPDATED: 'Organisation mise à jour avec succès',
  MEMBER_INVITED: 'Membre invité avec succès',
  MEMBER_REMOVED: 'Membre supprimé avec succès',
  ROLE_UPDATED: 'Rôle mis à jour avec succès',
  
  // Password
  PASSWORD_CREATED: 'Mot de passe créé avec succès',
  PASSWORD_UPDATED: 'Mot de passe mis à jour avec succès',
  PASSWORD_DELETED: 'Mot de passe supprimé avec succès',
  PASSWORD_GENERATED: 'Mot de passe généré avec succès',
  PASSWORD_SHARED: 'Mot de passe partagé avec succès',
  
  // Document
  DOCUMENT_UPLOADED: 'Document uploadé avec succès',
  DOCUMENT_DELETED: 'Document supprimé avec succès',
  FOLDER_CREATED: 'Dossier créé avec succès',
  DOCUMENT_SHARED: 'Document partagé avec succès',
  
  // Sharing
  SHARE_DELETED: 'Partage supprimé avec succès',
  SHARE_LINK_CREATED: 'Lien de partage créé avec succès',
  SHARE_LINK_DELETED: 'Lien de partage supprimé avec succès',
  
  // Note
  NOTE_CREATED: 'Note créée avec succès',
  NOTE_UPDATED: 'Note mise à jour avec succès',
  NOTE_DELETED: 'Note supprimée avec succès',
  CATEGORY_CREATED: 'Catégorie créée avec succès',
} as const;

/**
 * Wrapper pour les contrôleurs async avec gestion d'erreur automatique
 */
export const asyncHandler = (fn: Function) => {
  return (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Valider et extraire les paramètres de pagination
 */
export const extractPagination = (query: any): { page: number; limit: number; offset: number } => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 10));
  const offset = (page - 1) * limit;
  
  return { page, limit, offset };
};

/**
 * Valider et extraire les paramètres de tri
 */
export const extractSorting = (query: any, allowedFields: string[] = []): { sortBy: string; sortOrder: 'asc' | 'desc' } => {
  const sortBy = allowedFields.includes(query.sortBy) ? query.sortBy : 'created_at';
  const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';
  
  return { sortBy, sortOrder };
};

/**
 * Valider et extraire les paramètres de filtrage
 */
export const extractFilters = (query: any, allowedFilters: string[] = []): Record<string, any> => {
  const filters: Record<string, any> = {};
  
  allowedFilters.forEach(filter => {
    if (query[filter] !== undefined && query[filter] !== '') {
      filters[filter] = query[filter];
    }
  });
  
  return filters;
};

/**
 * Créer un ID de requête unique
 */
export const generateRequestId = (): string => {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
};

/**
 * Middleware pour ajouter un ID de requête
 */
export const addRequestId = (req: any, res: any, next: any) => {
  const requestId = generateRequestId();
  res.locals.requestId = requestId;
  res.setHeader('X-Request-ID', requestId);
  next();
};
