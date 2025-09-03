// Contrôleur d'authentification mock pour les tests
import { Request, Response } from 'express';
import { loginSchema } from '../services/auth.service';
import { MockAuthService } from '../services/auth.mock';
import { config } from '../config/env';

// Fonction asyncHandler simplifiée
const asyncHandler = (fn: (req: Request, res: Response, next: any) => Promise<any>) => 
  (req: Request, res: Response, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

// Logger simplifié
const loggers = {
  auth: {
    login: (userId: string, email: string, ip: string) => {
      console.log(`[AUTH] Login: ${email} (${userId}) from ${ip}`);
    }
  }
};

// Types et interfaces pour les utilisateurs mock
type MockUserData = {
  user: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
    is_active: boolean;
    last_login: string;
    created_at: string;
  };
  organizations: Array<{
    id: string;
    name: string;
    role: string;
  }>;
};

export class MockAuthController {
  /**
   * Connexion d'un utilisateur (mock)
   * POST /api/v1/auth/login
   */
  static login = asyncHandler(async (req: Request, res: Response) => {
    try {
      // Validation des données
      const validatedData = loginSchema.parse(req.body);

      // Authentifier l'utilisateur avec le service mock
      const result = await MockAuthService.login(validatedData);

      // Logger la connexion
      loggers.auth.login(result.user.id || '', result.user.email || '', req.ip || '');

      // Récupérer les organisations de l'utilisateur connecté
      const organizations = await MockAuthService.getUserOrganizations(result.user.id || '');

      // Définir les cookies HttpOnly pour access et refresh
      const cookieBase = config.session.cookieName;
      const domain = config.session.cookieDomain;
      const secure = config.server.isProduction;
      const sameSite: any = secure ? 'none' : 'lax';
      const accessCookieName = `${cookieBase}_access`;
      const refreshCookieName = `${cookieBase}_refresh`;
      const orgCookieName = `${cookieBase}_org`;

      // Durées approximatives basées sur la config
      const accessMaxAgeSec = 15 * 60; // 15 min par défaut
      const refreshMaxAgeSec = 30 * 24 * 60 * 60; // 30 jours
      const orgMaxAgeSec = 12 * 60 * 60; // 12 heures

      res.cookie(accessCookieName, result.tokens.accessToken, {
        httpOnly: true,
        secure,
        sameSite,
        domain,
        path: '/',
        maxAge: accessMaxAgeSec * 1000,
      });

      res.cookie(refreshCookieName, result.tokens.refreshToken, {
        httpOnly: true,
        secure,
        sameSite,
        domain,
        path: '/api/v1/auth',
        maxAge: refreshMaxAgeSec * 1000,
      });

      // Cas où l'utilisateur n'a pas d'organisation
      if (organizations.length === 0) {
        return res.status(200).json({
          success: true,
          code: 'USER_WITHOUT_ORG',
          message: 'Utilisateur sans organisation',
          data: {
            user: result.user,
            organizations: [],
          },
        });
      }

      // Cas où l'utilisateur a une seule organisation (sélection automatique)
      if (organizations.length === 1) {
        const currentOrg = organizations[0];
        
        // Définir le cookie d'organisation
        res.cookie(orgCookieName, currentOrg.id, {
          httpOnly: true,
          secure,
          sameSite,
          domain,
          path: '/',
          maxAge: orgMaxAgeSec * 1000,
        });

        return res.status(200).json({
          success: true,
          message: 'Connexion réussie',
          data: {
            user: result.user,
            organizations,
            currentOrgId: currentOrg.id,
          },
        });
      }

      // Cas où l'utilisateur a plusieurs organisations (sélection requise)
      return res.status(200).json({
        success: true,
        code: 'NEEDS_ORG_SELECTION',
        message: 'Sélection d\'organisation requise',
        data: {
          user: result.user,
          organizations,
        },
      });
    } catch (error: any) {
      // Géré par le middleware d'erreur
      throw error;
    }
  });

  /**
   * Récupérer le profil utilisateur (mock)
   * GET /api/v1/auth/me
   */
  static getProfile = asyncHandler(async (req: Request, res: Response) => {
    // Vérifier que l'utilisateur est authentifié
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non authentifié',
        error: {
          code: 'UNAUTHORIZED',
          status: 401
        }
      });
    }
    
    // Récupérer l'utilisateur par son ID depuis le service mock
    const userId = req.user.id;
    let user = null;
    
    // Simuler la récupération d'utilisateur par ID
    if (userId === 'test-user-id-123') {
      user = {
        id: 'test-user-id-123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        avatarUrl: null,
        isActive: true,
        lastLogin: new Date().toISOString(),
        createdAt: '2025-01-01T00:00:00.000Z',
      };
    } else if (userId === 'antoine-user-id-456') {
      user = {
        id: 'antoine-user-id-456',
        email: 'Antoineronold@proton.me',
        firstName: 'Antoine',
        lastName: 'Ronold',
        avatarUrl: null,
        isActive: true,
        lastLogin: new Date().toISOString(),
        createdAt: '2025-01-01T00:00:00.000Z',
      };
    }
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé',
        error: {
          code: 'NOT_FOUND',
          status: 404
        }
      });
    }
    
    // Récupérer les organisations de l'utilisateur
    const organizations = await MockAuthService.getUserOrganizations(user.id);
    
    // Lire l'organisation actuelle depuis le cookie
    const cookieBase = config.session.cookieName;
    const orgCookieName = `${cookieBase}_org`;
    const cookieHeader = req.headers.cookie || '';
    const cookiesMap = Object.fromEntries(
      cookieHeader.split(';').filter(Boolean).map((c: string) => {
        const [k, ...v] = c.trim().split('=');
        return [decodeURIComponent(k), decodeURIComponent(v.join('='))];
      })
    );
    const currentOrgId = cookiesMap[orgCookieName] || (organizations.length > 0 ? organizations[0].id : null);

    return res.status(200).json({
      success: true,
      data: {
        user,
        organizations,
        currentOrgId,
      },
    });
  });
}
