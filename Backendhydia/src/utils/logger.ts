import winston from 'winston';
import { config } from '@/config/env';
import path from 'path';
import fs from 'fs';

// Créer le dossier de logs s'il n'existe pas
const logDir = path.dirname(config.logging.filePath);
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Format personnalisé pour les logs
const customFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
);

// Format pour la console en développement
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'HH:mm:ss'
  }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`;
    
    // Ajouter les métadonnées si elles existent
    if (Object.keys(meta).length > 0) {
      log += `\n${JSON.stringify(meta, null, 2)}`;
    }
    
    return log;
  })
);

// Configuration des transports
const transports: winston.transport[] = [
  // Transport pour fichier - tous les logs
  new winston.transports.File({
    filename: config.logging.filePath,
    level: config.logging.level,
    format: customFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
    tailable: true
  }),
  
  // Transport pour fichier - erreurs uniquement
  new winston.transports.File({
    filename: path.join(logDir, 'error.log'),
    level: 'error',
    format: customFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
    tailable: true
  })
];

// Ajouter transport console en développement
if (config.server.isDevelopment) {
  transports.push(
    new winston.transports.Console({
      level: 'debug',
      format: consoleFormat
    })
  );
}

// Créer le logger
export const logger = winston.createLogger({
  level: config.logging.level,
  format: customFormat,
  defaultMeta: {
    service: 'hydia-backend',
    environment: config.server.nodeEnv
  },
  transports,
  // Ne pas quitter le processus en cas d'erreur de logging
  exitOnError: false
});

// Intercepter les erreurs non gérées
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', {
    error: error.message,
    stack: error.stack
  });
  
  // Donner le temps au logger d'écrire avant de quitter
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection:', {
    reason,
    promise
  });
});

// Méthodes utilitaires pour des logs structurés
export const loggers = {
  /**
   * Logger pour les requêtes HTTP
   */
  request: (method: string, url: string, statusCode: number, responseTime: number, userId?: string) => {
    logger.info('HTTP Request', {
      method,
      url,
      statusCode,
      responseTime: `${responseTime}ms`,
      userId,
      type: 'http_request'
    });
  },

  /**
   * Logger pour l'authentification
   */
  auth: {
    login: (userId: string, email: string, ip?: string) => {
      logger.info('User Login', {
        userId,
        email,
        ip,
        type: 'auth_login'
      });
    },
    
    logout: (userId: string, email: string) => {
      logger.info('User Logout', {
        userId,
        email,
        type: 'auth_logout'
      });
    },
    
    register: (userId: string, email: string) => {
      logger.info('User Registration', {
        userId,
        email,
        type: 'auth_register'
      });
    },
    
    failed: (email: string, reason: string, ip?: string) => {
      logger.warn('Authentication Failed', {
        email,
        reason,
        ip,
        type: 'auth_failed'
      });
    }
  },

  /**
   * Logger pour les opérations sur les données
   */
  data: {
    create: (resource: string, resourceId: string, userId: string) => {
      logger.info('Data Created', {
        resource,
        resourceId,
        userId,
        type: 'data_create'
      });
    },
    
    update: (resource: string, resourceId: string, userId: string) => {
      logger.info('Data Updated', {
        resource,
        resourceId,
        userId,
        type: 'data_update'
      });
    },
    
    delete: (resource: string, resourceId: string, userId: string) => {
      logger.info('Data Deleted', {
        resource,
        resourceId,
        userId,
        type: 'data_delete'
      });
    },
    
    access: (resource: string, resourceId: string, userId: string, action: string) => {
      logger.info('Data Accessed', {
        resource,
        resourceId,
        userId,
        action,
        type: 'data_access'
      });
    }
  },

  /**
   * Logger pour la sécurité
   */
  security: {
    suspiciousActivity: (userId: string, activity: string, details: any, ip?: string) => {
      logger.warn('Suspicious Activity', {
        userId,
        activity,
        details,
        ip,
        type: 'security_suspicious'
      });
    },
    
    rateLimitExceeded: (ip: string, endpoint: string) => {
      logger.warn('Rate Limit Exceeded', {
        ip,
        endpoint,
        type: 'security_rate_limit'
      });
    },
    
    invalidToken: (token: string, reason: string, ip?: string) => {
      logger.warn('Invalid Token', {
        token: token.substring(0, 10) + '...', // Ne logger que les premiers caractères
        reason,
        ip,
        type: 'security_invalid_token'
      });
    }
  },

  /**
   * Logger pour les erreurs système
   */
  system: {
    databaseError: (operation: string, error: any) => {
      logger.error('Database Error', {
        operation,
        error: error.message,
        stack: error.stack,
        type: 'system_database_error'
      });
    },
    
    externalServiceError: (service: string, operation: string, error: any) => {
      logger.error('External Service Error', {
        service,
        operation,
        error: error.message,
        type: 'system_external_service_error'
      });
    },
    
    configurationError: (setting: string, value: any, error: string) => {
      logger.error('Configuration Error', {
        setting,
        value,
        error,
        type: 'system_configuration_error'
      });
    }
  },

  /**
   * Logger pour les performances
   */
  performance: {
    slowQuery: (query: string, duration: number, threshold: number = 1000) => {
      if (duration > threshold) {
        logger.warn('Slow Query Detected', {
          query,
          duration: `${duration}ms`,
          threshold: `${threshold}ms`,
          type: 'performance_slow_query'
        });
      }
    },
    
    memoryUsage: (usage: NodeJS.MemoryUsage) => {
      logger.info('Memory Usage', {
        rss: `${Math.round(usage.rss / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)}MB`,
        heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)}MB`,
        external: `${Math.round(usage.external / 1024 / 1024)}MB`,
        type: 'performance_memory'
      });
    }
  }
};

// Logger de développement avec couleurs et format simplifié
export const devLogger = {
  info: (message: string, meta?: any) => {
    if (config.server.isDevelopment) {
      console.log(`ℹ️  ${message}`, meta ? JSON.stringify(meta, null, 2) : '');
    }
  },
  
  warn: (message: string, meta?: any) => {
    if (config.server.isDevelopment) {
      console.warn(`⚠️  ${message}`, meta ? JSON.stringify(meta, null, 2) : '');
    }
  },
  
  error: (message: string, meta?: any) => {
    if (config.server.isDevelopment) {
      console.error(`❌ ${message}`, meta ? JSON.stringify(meta, null, 2) : '');
    }
  },
  
  success: (message: string, meta?: any) => {
    if (config.server.isDevelopment) {
      console.log(`✅ ${message}`, meta ? JSON.stringify(meta, null, 2) : '');
    }
  }
};

export default logger;
