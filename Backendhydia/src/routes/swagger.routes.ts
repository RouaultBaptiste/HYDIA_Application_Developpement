import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from '@/config/swagger';

const router = Router();

// Configuration des options d'interface utilisateur de Swagger
const swaggerUiOptions = {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Hydia API Documentation',
  customfavIcon: '/favicon.ico',
};

// Route pour accéder à la documentation Swagger UI
router.use('/', swaggerUi.serve);
router.get('/', swaggerUi.setup(swaggerSpec, swaggerUiOptions));

// Route pour exposer les spécifications OpenAPI au format JSON
router.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

export default router;
