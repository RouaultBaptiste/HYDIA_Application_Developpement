import express from 'express';
import { config } from '@/config/env';
import { logger } from '@/utils/logger';
import { errorHandler } from '@/middlewares/error.middleware';
import { 
  corsOptions, 
  generalRateLimit, 
  helmetConfig, 
  suspiciousActivityLogger,
  validateRequiredHeaders,
  sanitizeInput 
} from '@/middlewares/security.middleware';
import { 
  morganMiddleware, 
  requestLogger 
} from '@/middlewares/logging.middleware';
import { detectSuspiciousActivity } from '@/middlewares/auth.middleware';
import cors from 'cors';
import path from 'path';
import brandingRoutes from '@/routes/branding.routes';

// Import des routes principales
import apiRoutes from '@/routes/index';
// Import des routes Swagger
import swaggerRoutes from '@/routes/swagger.routes';

/**
 * Création et configuration de l'application Express
 */
export const createApp = (): express.Application => {
  const app = express();

  // Trust proxy pour les headers X-Forwarded-*
  // Configuration du trust proxy (désactivé en développement pour éviter les warnings)
  app.set('trust proxy', config.server.isProduction);

  // CORS doit être configuré avant tout autre middleware
  app.use(cors(corsOptions));
  
  // Middlewares de sécurité
  app.use(helmetConfig);
  app.use(generalRateLimit);

  // Middlewares de parsing
  app.use(express.json({ 
    limit: '10mb',
    strict: true,
  }));
  app.use(express.urlencoded({ 
    extended: true, 
    limit: '10mb' 
  }));

  // Middlewares de logging
  app.use(morganMiddleware);
  app.use(requestLogger);

  // Middlewares de sécurité avancés
  app.use(validateRequiredHeaders);
  app.use(sanitizeInput);
  app.use(suspiciousActivityLogger);
  app.use(detectSuspiciousActivity);

  // Static: logos (with basic caching and no-sniff)
  const logosDir = path.resolve(process.cwd(), 'logo');
  app.use('/static/logo', express.static(logosDir, {
    etag: true,
    maxAge: '5m',
    setHeaders: (res) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Cache-Control', 'public, max-age=300');
    }
  }));

  // Root endpoint
  app.get('/', (_req, res) => {
    res.status(200).json({
      success: true,
      message: 'Bienvenue sur l\'API Hydia',
      description: 'Plateforme SaaS sécurisée de gestion d\'informations',
      version: process.env['npm_package_version'] || '1.0.0',
      environment: config.server.nodeEnv,
      endpoints: {
        health: '/health',
        api: `/api/${config.server.apiVersion}`,
        docs: `/api/${config.server.apiVersion}/docs`
      },
      timestamp: new Date().toISOString(),
    });
  });

  // Health check endpoint
  app.get('/health', (_req: any, res: any) => {
    res.status(200).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0'
    });
  });

  // Routes principales API
  app.use('/api/v1', apiRoutes);

  // Routes de branding (hors /api)
  app.use('/branding', brandingRoutes);

  // Routes de documentation Swagger
  app.use(`/api/${config.server.apiVersion}/docs`, swaggerRoutes);

  // Route par défaut pour les endpoints non trouvés
  app.use('*', (req, res) => {
    res.status(404).json({
      success: false,
      error: 'Endpoint non trouvé',
      path: req.originalUrl,
      method: req.method,
    });
  });

  // Middleware de gestion des erreurs (doit être en dernier)
  app.use(errorHandler);

  return app;
};

/**
 * Démarrage du serveur
 */
export const startServer = async (): Promise<void> => {
  try {
    const app = createApp();
    const port = config.server.port;

    const server = app.listen(port, () => {
      logger.info(`🚀 Serveur Hydia démarré sur le port ${port}`);
      logger.info(`📍 Environnement: ${config.server.nodeEnv}`);
      logger.info(`🔗 API disponible sur: http://localhost:${port}/api/${config.server.apiVersion}`);
      logger.info(`❤️  Health check: http://localhost:${port}/health`);
    });

    // Gestion gracieuse de l'arrêt du serveur
    const gracefulShutdown = (signal: string) => {
      logger.info(`Signal ${signal} reçu, arrêt du serveur...`);
      
      server.close((err) => {
        if (err) {
          logger.error('Erreur lors de l\'arrêt du serveur:', err);
          process.exit(1);
        }
        
        logger.info('Serveur arrêté proprement');
        process.exit(0);
      });
    };

    // Écouter les signaux d'arrêt
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Gestion des erreurs non capturées
    process.on('uncaughtException', (error) => {
      logger.error('Erreur non capturée:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Promise rejetée non gérée:', { reason, promise });
      process.exit(1);
    });

  } catch (error) {
    logger.error('Erreur lors du démarrage du serveur:', error);
    process.exit(1);
  }
};
