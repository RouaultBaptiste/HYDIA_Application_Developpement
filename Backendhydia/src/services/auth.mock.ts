// Service d'authentification mock pour les tests
import { z } from 'zod';
import { loginSchema } from './auth.service';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';

// Type pour les données utilisateur mock
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

// Utilisateurs de test avec leurs organisations
const MOCK_USERS: Record<string, MockUserData> = {
  'test@example.com': {
    user: {
      id: 'test-user-id-123',
      email: 'test@example.com',
      first_name: 'Test',
      last_name: 'User',
      avatar_url: null,
      is_active: true,
      last_login: new Date().toISOString(),
      created_at: '2025-01-01T00:00:00.000Z',
    },
    organizations: [
      {
        id: 'test-org-id-123',
        name: 'Organisation Test',
        role: 'owner'
      }
    ]
  },
  'Antoineronold@proton.me': {
    user: {
      id: 'antoine-user-id-456',
      email: 'Antoineronold@proton.me',
      first_name: 'Antoine',
      last_name: 'Ronold',
      avatar_url: null,
      is_active: true,
      last_login: new Date().toISOString(),
      created_at: '2025-01-01T00:00:00.000Z',
    },
    organizations: [
      {
        id: 'antoine-org-id-456',
        name: 'Organisation Antoine',
        role: 'owner'
      }
    ]
  }
};

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface UserProfile {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
}

export class MockAuthService {
  /**
   * Connexion d'un utilisateur (mock)
   */
  static async login(credentials: z.infer<typeof loginSchema>): Promise<{ user: UserProfile; tokens: AuthTokens }> {
    try {
      // Validation des données
      const validatedData = loginSchema.parse(credentials);
      
      // Vérification simplifiée des identifiants
      // Accepter soit test@example.com/password123 soit Antoineronold@proton.me/Antoineronold@proton.me
      const validCredentials = [
        { email: 'test@example.com', password: 'password123' },
        { email: 'test@example.com', password: 'test@example.com' },
        { email: 'Antoineronold@proton.me', password: 'Antoineronold@proton.me' }
      ];
      
      const isValid = validCredentials.some(cred => 
        cred.email === validatedData.email && cred.password === validatedData.password
      );
      
      if (!isValid) {
        logger.warn(`Tentative de connexion échouée pour: ${validatedData.email}`);
        throw new AppError('Email ou mot de passe incorrect', 401);
      }
      
      logger.info(`Utilisateur connecté (mock): ${validatedData.email}`);
      
      // Récupérer les données de l'utilisateur connecté
      const userEmail = validatedData.email;
      const userData = MOCK_USERS[userEmail as keyof typeof MOCK_USERS];
      
      if (!userData) {
        logger.error(`Données utilisateur non trouvées pour: ${userEmail}`);
        throw new AppError('Erreur interne du serveur', 500);
      }
      
      // Générer des tokens factices avec l'ID de l'utilisateur
      const tokens = this.generateTokens(userData.user.id, userEmail);
      
      return {
        user: {
          id: userData.user.id,
          email: userData.user.email,
          firstName: userData.user.first_name,
          lastName: userData.user.last_name,
          avatarUrl: userData.user.avatar_url || undefined,
          isActive: userData.user.is_active,
          lastLogin: userData.user.last_login,
          createdAt: userData.user.created_at,
        },
        tokens,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Erreur lors de la connexion (mock):', error);
      throw new AppError('Erreur interne du serveur', 500);
    }
  }
  
  /**
   * Récupérer les organisations de l'utilisateur (mock)
   */
  static async getUserOrganizations(userId: string): Promise<any[]> {
    // Rechercher l'utilisateur par son ID
    for (const email in MOCK_USERS) {
      const userData = MOCK_USERS[email as keyof typeof MOCK_USERS];
      if (userData.user.id === userId) {
        return userData.organizations;
      }
    }
    return [];
  }
  
  /**
   * Générer les tokens JWT (mock)
   */
  static generateTokens(userId: string, email: string): AuthTokens {
    return {
      accessToken: `mock-access-token-${userId}-${Date.now()}`,
      refreshToken: `mock-refresh-token-${userId}-${Date.now()}`,
      expiresIn: 900 // 15 minutes
    };
  }
}
