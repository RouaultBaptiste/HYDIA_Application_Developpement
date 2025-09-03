import { Router } from 'express';
import { addRequestId } from '@/utils/response';
import authRoutes from './auth.routes';
import authMockRoutes from './auth.mock.routes';
import authSupabaseRoutes from './auth.supabase.routes';
import organizationRoutes from './organization.routes';
import passwordRoutes from './password.routes';
import passwordSupabaseRoutes from './password.supabase.routes';
import { organizationPasswordRoutes } from './password.routes';
import noteRoutes from './note.routes';
import notesSupabaseRoutes from './notes.supabase.routes';
import documentRoutes from './document.routes';
import configRoutes from './config.routes';
import { passwordsRouter, notesRouter } from './mock.routes';
import { config } from '@/config/env';

const router = Router();

/**
 * Routes principales de l'API
 * Base: /api/v1
 */

// Middleware pour ajouter un ID de requête unique
router.use(addRequestId);

// Route de santé de l'API
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Hydia API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Routes d'authentification
// Utiliser le nouveau système Supabase par défaut
router.use('/auth', authSupabaseRoutes);
// Routes mock disponibles pour les tests
router.use('/auth/mock', authMockRoutes);
// router.use('/auth', authRoutes); // Routes normales désactivées temporairement

// Routes des organisations
router.use('/organizations', organizationRoutes);

// Routes des mots de passe (globales et par organisation)
// Utiliser les routes Supabase sécurisées
router.use('/passwords', passwordSupabaseRoutes);
router.use('/password-categories', passwordSupabaseRoutes);
// Routes mock disponibles sur un autre endpoint pour les tests uniquement
router.use('/mock/passwords', passwordsRouter);
// Routes d'organisation conservées pour compatibilité
router.use('/organizations', organizationPasswordRoutes);

// Routes des documents (directes et par organisation) ou disabled (501)
if (config.features.documents) {
  router.use('/documents', documentRoutes);
  router.use('/organizations', documentRoutes);
} else {
  router.use('/documents', (_req, res) => {
    res.status(501).json({
      success: false,
      error: {
        message: 'La fonctionnalité Documents est désactivée',
        statusCode: 501,
      }
    });
  });
}

// Route de configuration pour tests
router.use('/config', configRoutes);

// Routes des notes (directes et par organisation)
// Utiliser les routes Supabase pour les notes
router.use('/notes', notesSupabaseRoutes);
// Routes mock disponibles sur un autre endpoint pour les tests
router.use('/mock/notes', notesRouter);
// Routes d'organisation conservées pour compatibilité
router.use('/organizations', noteRoutes);

// Route 404 pour les endpoints non trouvés
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: 'Endpoint non trouvé',
      statusCode: 404,
      timestamp: new Date().toISOString(),
      path: req.originalUrl
    }
  });
});

export default router;
