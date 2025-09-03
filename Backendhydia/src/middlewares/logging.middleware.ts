import { Request, Response, NextFunction } from 'express';
import morgan from 'morgan';
import { logger } from '@/utils/logger';

/**
 * Configuration Morgan pour les logs HTTP
 */
export const morganMiddleware = morgan(
  ':method :url :status :res[content-length] - :response-time ms',
  {
    stream: {
      write: (message: string) => {
        logger.http(message.trim());
      }
    }
  }
);

/**
 * Middleware de logging des requêtes
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  
  // Logger le début de la requête
  logger.info('Requête entrante', {
    requestId: req.requestId,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    contentType: req.get('Content-Type'),
    contentLength: req.get('Content-Length')
  });

  // Intercepter la fin de la réponse
  const originalSend = res.send;
  res.send = function(data: any) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Logger la fin de la requête
    logger.info('Requête terminée', {
      requestId: req.requestId,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: res.get('Content-Length')
    });
    
    return originalSend.call(this, data);
  };

  next();
};

/**
 * Middleware de logging des erreurs
 */
export const errorLogger = (err: any, req: Request, res: Response, next: NextFunction): void => {
  logger.error('Erreur dans la requête', {
    requestId: req.requestId,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    error: {
      name: err.name,
      message: err.message,
      stack: err.stack
    }
  });
  
  next(err);
};

/**
 * Middleware de logging des accès aux données sensibles
 */
export const sensitiveDataLogger = (dataType: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    logger.warn('Accès aux données sensibles', {
      requestId: req.requestId,
      dataType,
      userId: (req as any).user?.id,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    next();
  };
};

/**
 * Middleware de logging des actions administratives
 */
export const adminActionLogger = (action: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    logger.warn('Action administrative', {
      requestId: req.requestId,
      action,
      adminId: (req as any).user?.id,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      body: req.body
    });
    
    next();
  };
};
