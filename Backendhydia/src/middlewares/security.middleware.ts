import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from '@/config/env';
import { logger } from '@/utils/logger';
import { ValidationError } from '@/utils/errors';

/**
 * Configuration Helmet pour la sécurité des headers HTTP
 */
export const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
});

/**
 * Configuration CORS
 */
export const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Permettre les requêtes sans origine (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    if (config.cors.allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // Log the rejected origin instead of throwing an error
      logger.warn(`CORS: Origin rejetée: ${origin}`, {
        allowedOrigins: config.cors.allowedOrigins,
      });
      // Return false instead of an error to handle preflight requests better
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'X-Request-ID',
    'X-Organization-ID',
    'X-Org-Id',
    'X-User-ID'
  ],
  exposedHeaders: ['X-Request-ID'],
  maxAge: 86400, // 24 heures
  preflightContinue: false,
  optionsSuccessStatus: 204
};

/**
 * Rate limiting général
 */
export const generalRateLimit = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: {
    error: 'Trop de requêtes, veuillez réessayer plus tard.',
    retryAfter: Math.ceil(config.rateLimit.windowMs / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logger.warn('Rate limit dépassé', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path,
      method: req.method
    });
    
    res.status(429).json({
      success: false,
      error: {
        message: 'Trop de requêtes, veuillez réessayer plus tard.',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil(config.rateLimit.windowMs / 1000)
      }
    });
  }
});

/**
 * Rate limiting pour l'authentification
 */
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 tentatives par IP
  skipSuccessfulRequests: true,
  message: {
    error: 'Trop de tentatives de connexion, veuillez réessayer dans 15 minutes.',
    retryAfter: 900
  },
  handler: (req: Request, res: Response) => {
    logger.warn('Rate limit auth dépassé', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path
    });
    
    res.status(429).json({
      success: false,
      error: {
        message: 'Trop de tentatives de connexion, veuillez réessayer dans 15 minutes.',
        code: 'AUTH_RATE_LIMIT_EXCEEDED',
        retryAfter: 900
      }
    });
  }
});

/**
 * Validation des headers requis
 */
export const validateRequiredHeaders = (req: Request, res: Response, next: NextFunction): void => {
  const requiredHeaders = ['user-agent'];
  
  for (const header of requiredHeaders) {
    if (!req.get(header)) {
      logger.warn(`Header requis manquant: ${header}`, {
        ip: req.ip,
        path: req.path,
        method: req.method
      });
      
      res.status(400).json({
        success: false,
        error: {
          message: `Header requis manquant: ${header}`,
          code: 'MISSING_REQUIRED_HEADER'
        }
      });
      return;
    }
  }
  
  next();
};

/**
 * Sanitisation des entrées
 */
export const sanitizeInput = (req: Request, res: Response, next: NextFunction): void => {
  // Fonction de sanitisation récursive
  const sanitize = (obj: any): any => {
    if (typeof obj === 'string') {
      // Supprimer les caractères potentiellement dangereux
      return obj
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<[^>]*>/g, '')
        .trim();
    }
    
    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }
    
    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          sanitized[key] = sanitize(obj[key]);
        }
      }
      return sanitized;
    }
    
    return obj;
  };

  // Sanitiser body, query et params
  if (req.body) {
    req.body = sanitize(req.body);
  }
  
  if (req.query) {
    req.query = sanitize(req.query);
  }
  
  if (req.params) {
    req.params = sanitize(req.params);
  }
  
  next();
};

/**
 * Logger d'activité suspecte
 */
export const suspiciousActivityLogger = (req: Request, res: Response, next: NextFunction): void => {
  const suspiciousPatterns = [
    /\.\.\//,  // Path traversal
    /<script/i, // XSS
    /union.*select/i, // SQL injection
    /javascript:/i, // JavaScript injection
    /vbscript:/i, // VBScript injection
    /onload=/i, // Event handler injection
    /onerror=/i, // Event handler injection
  ];
  
  const checkSuspicious = (value: string): boolean => {
    return suspiciousPatterns.some(pattern => pattern.test(value));
  };
  
  // Vérifier URL, query params, et body
  const url = req.originalUrl;
  const queryString = JSON.stringify(req.query);
  const bodyString = JSON.stringify(req.body);
  
  if (checkSuspicious(url) || checkSuspicious(queryString) || checkSuspicious(bodyString)) {
    logger.warn('Activité suspecte détectée', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      method: req.method,
      url: req.originalUrl,
      query: req.query,
      body: req.body,
      headers: req.headers
    });
    
    // Optionnel: bloquer la requête
    // res.status(403).json({
    //   success: false,
    //   error: {
    //     message: 'Requête bloquée pour activité suspecte',
    //     code: 'SUSPICIOUS_ACTIVITY'
    //   }
    // });
    // return;
  }
  
  next();
};

/**
 * Middleware de génération d'ID de requête
 */
export const generateRequestId = (req: Request, res: Response, next: NextFunction): void => {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  req.requestId = requestId;
  res.setHeader('X-Request-ID', requestId);
  next();
};

/**
 * Middleware de timeout pour les requêtes
 */
export const requestTimeout = (timeoutMs: number = 30000) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        logger.error('Timeout de requête', {
          requestId: req.requestId,
          method: req.method,
          url: req.originalUrl,
          timeout: timeoutMs
        });
        
        res.status(408).json({
          success: false,
          error: {
            message: 'Timeout de la requête',
            code: 'REQUEST_TIMEOUT'
          }
        });
      }
    }, timeoutMs);
    
    // Nettoyer le timeout quand la réponse est envoyée
    res.on('finish', () => {
      clearTimeout(timeout);
    });
    
    next();
  };
};

// Augmenter l'interface Request pour inclure requestId
declare global {
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}
