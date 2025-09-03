import express from 'express';
import { config } from '../config/env';

const router = express.Router();

// Endpoint pour tester la configuration
router.get('/test', (req, res) => {
  // Ne renvoyer que les informations non sensibles
  res.json({
    supabase: {
      url: config.supabase.url,
      // On masque les clés pour la sécurité
      anonKey: config.supabase.anonKey ? '***' : null,
      serviceRoleKey: config.supabase.serviceRoleKey ? '***' : null,
    },
    urls: {
      frontend: config.urls.frontend,
      backend: config.urls.backend,
    },
    cors: {
      allowedOrigins: config.cors.allowedOrigins,
    },
    environment: config.server.nodeEnv,
  });
});

export default router;
