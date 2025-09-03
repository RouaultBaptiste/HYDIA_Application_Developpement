import { AuthService } from '../../services/auth.service';
import { supabase } from '../../config/supabase';
import { AppError } from '../../utils/errors';
import jwt from 'jsonwebtoken';

// Mock des dépendances
jest.mock('../../config/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
    })),
  },
  supabaseAuth: {
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
    },
  },
}));
jest.mock('jsonwebtoken');
jest.mock('bcryptjs');

const mockSupabase = require('../../config/supabase').supabase;
const mockSupabaseAuth = require('../../config/supabase').supabaseAuth;
const mockJwt = jwt as jest.Mocked<typeof jwt>;

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    const validUserData = {
      email: 'test@example.com',
      password: 'Password123!',
      firstName: 'John',
      lastName: 'Doe'
    };

    it('devrait créer un nouvel utilisateur avec succès', async () => {
      // Mock de la réponse Supabase Auth
      mockSupabaseAuth.auth.signUp.mockResolvedValue({
        data: {
          user: {
            id: 'user-123',
            email: 'test@example.com'
          }
        },
        error: null
      });

      // Mock pour vérifier si l'utilisateur existe déjà (retourne null = n'existe pas)
      mockSupabase.from().select().eq().single.mockResolvedValue({ data: null, error: null });
      
      // Mock pour récupérer le profil créé
      mockSupabase.from().select().eq().single.mockResolvedValueOnce({
        data: {
          id: 'user-123',
          email: 'test@example.com',
          first_name: 'John',
          last_name: 'Doe',
          is_active: true,
          created_at: new Date().toISOString()
        },
        error: null
      });

      // Mock pour créer l'organisation
      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: { id: 'org-123', name: 'Organisation de John' },
        error: null
      });

      // Mock pour ajouter le membre à l'organisation
      mockSupabase.from().insert.mockResolvedValue({ data: {}, error: null });

      // Mock JWT
      mockJwt.sign.mockReturnValue('mock-token');

      const result = await AuthService.register(validUserData);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('tokens');
      expect(result.user.email).toBe(validUserData.email);
    });

    it('devrait lever une erreur si l\'utilisateur existe déjà', async () => {
      // Mock pour simuler un utilisateur existant
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: { id: 'existing-user' },
        error: null
      });

      await expect(AuthService.register(validUserData))
        .rejects
        .toThrow(AppError);
    });
  });

  describe('login', () => {
    const validCredentials = {
      email: 'test@example.com',
      password: 'Password123!'
    };

    it('devrait connecter un utilisateur avec succès', async () => {
      mockSupabaseAuth.auth.signInWithPassword.mockResolvedValue({
        data: {
          user: {
            id: 'user-123',
            email: 'test@example.com'
          },
          session: {
            access_token: 'supabase-token',
            refresh_token: 'refresh-token'
          }
        },
        error: null
      });

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: {
          id: 'user-123',
          email: 'test@example.com',
          first_name: 'John',
          last_name: 'Doe',
          is_active: true
        },
        error: null
      });

      mockSupabase.from().update().eq.mockResolvedValue({ data: {}, error: null });
      mockJwt.sign.mockReturnValue('mock-token');

      const result = await AuthService.login(validCredentials);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('tokens');
      expect(result.user.email).toBe('test@example.com');
    });

    it('devrait lever une erreur pour des identifiants invalides', async () => {
      mockSupabaseAuth.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid credentials' }
      });

      await expect(AuthService.login(validCredentials))
        .rejects
        .toThrow(AppError);
    });
  });

  describe('refreshTokens', () => {
    it('devrait rafraîchir un token valide', async () => {
      const mockPayload = {
        userId: 'user-123',
        email: 'test@example.com',
        type: 'refresh'
      };

      mockJwt.verify.mockReturnValue(mockPayload);
      mockJwt.sign.mockReturnValue('new-token');

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: {
          id: 'user-123',
          email: 'test@example.com',
          is_active: true
        },
        error: null
      });

      const result = await AuthService.refreshTokens('valid-refresh-token');

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('devrait lever une erreur pour un token invalide', async () => {
      mockJwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(AuthService.refreshTokens('invalid-token'))
        .rejects
        .toThrow(AppError);
    });
  });
});
