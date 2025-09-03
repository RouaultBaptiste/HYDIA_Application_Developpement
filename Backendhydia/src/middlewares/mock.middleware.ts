import { Request, Response, NextFunction } from 'express';
import { config } from '../config/env';

/**
 * Middleware pour extraire les informations d'authentification des cookies
 * et les ajouter aux headers pour les routes mock
 */
export const extractAuthFromCookies = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    // Extraire les cookies
    const cookieHeader = req.headers.cookie || '';
    const cookiesMap = Object.fromEntries(
      cookieHeader.split(';').filter(Boolean).map(c => {
        const [k, ...v] = c.trim().split('=');
        return [decodeURIComponent(k), decodeURIComponent(v.join('='))];
      })
    );
    
    // Récupérer l'ID d'organisation depuis le cookie
    const cookieBase = config.session.cookieName;
    const orgCookieName = `${cookieBase}_org`;
    const organizationId = cookiesMap[orgCookieName];
    
    if (organizationId) {
      // Ajouter l'ID d'organisation aux headers
      req.headers['x-organization-id'] = organizationId;
      console.log(`[Mock Middleware] Organization ID extrait: ${organizationId}`);
    }
    
    // Récupérer l'ID utilisateur depuis le token d'accès (dans un environnement réel, il faudrait décoder le JWT)
    // Pour le mock, nous allons extraire l'ID utilisateur du token qui contient "user-id"
    const accessCookieName = `${cookieBase}_access`;
    const accessToken = cookiesMap[accessCookieName];
    
    if (accessToken) {
      // Dans un environnement mock, le token contient l'ID utilisateur
      let userId = null;
      
      if (accessToken.includes('test-user-id-123')) {
        userId = 'test-user-id-123';
      } else if (accessToken.includes('antoine-user-id-456')) {
        userId = 'antoine-user-id-456';
      }
      
      if (userId) {
        // Ajouter l'ID utilisateur aux headers
        req.headers['x-user-id'] = userId;
        console.log(`[Mock Middleware] User ID extrait: ${userId}`);
      }
    }
    
    next();
  } catch (error) {
    console.error('[Mock Middleware] Erreur lors de l\'extraction des informations d\'authentification:', error);
    next();
  }
};
