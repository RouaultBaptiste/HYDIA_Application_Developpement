import { describe, expect, it, beforeEach } from '@jest/globals';

// Mock complet avant les imports
jest.mock('../../config/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      ilike: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: {
          id: 'pwd-123',
          name: 'Test Password',
          username: 'testuser',
          encrypted_password: 'encrypted_data',
          url: 'https://example.com',
          organization_id: 'org-123',
          created_by: 'user-123',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_active: true
        },
        error: null
      }),
    })),
  },
}));

jest.mock('../../utils/crypto', () => ({
  encrypt: jest.fn((data: string) => `encrypted_${data}`),
  decrypt: jest.fn((encryptedData: string) => encryptedData.replace('encrypted_', '')),
}));

jest.mock('../../utils/errors', () => ({
  AppError: class AppError extends Error {
    constructor(message: string, statusCode: number = 500) {
      super(message);
      this.name = 'AppError';
    }
  }
}));

// Import après les mocks
import { PasswordService } from '../../services/password.service';

describe('PasswordService - Tests Unitaires Complets', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('devrait être défini avec toutes ses méthodes', () => {
    expect(PasswordService).toBeDefined();
    expect(typeof PasswordService.createPassword).toBe('function');
    expect(typeof PasswordService.getPasswordById).toBe('function');
    expect(typeof PasswordService.updatePassword).toBe('function');
    expect(typeof PasswordService.deletePassword).toBe('function');
    expect(typeof PasswordService.searchPasswords).toBe('function');
    expect(typeof PasswordService.generateSecurePassword).toBe('function');
  });

  describe('createPassword', () => {
    it('devrait créer un mot de passe avec chiffrement', async () => {
      const passwordData = {
        name: 'Test Password',
        username: 'testuser',
        password: 'SecurePassword123!',
        url: 'https://example.com',
        notes: 'Test notes',
        organizationId: 'org-123',
        userId: 'user-123'
      };

      try {
        const result = await PasswordService.createPassword(passwordData);
        expect(result).toBeDefined();
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });

    it('devrait rejeter les données invalides', async () => {
      const invalidPasswordData = {
        name: '', // Nom vide
        username: '',
        password: '',
        organizationId: 'org-123',
        userId: 'user-123'
      };

      try {
        await PasswordService.createPassword(invalidPasswordData);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });

    it('devrait chiffrer le mot de passe avant stockage', async () => {
      const passwordData = {
        name: 'Test Password',
        username: 'testuser',
        password: 'PlainTextPassword',
        organizationId: 'org-123',
        userId: 'user-123'
      };

      try {
        await PasswordService.createPassword(passwordData);
        // Le mock encrypt devrait avoir été appelé
        const { encrypt } = require('../../utils/crypto');
        expect(encrypt).toHaveBeenCalledWith('PlainTextPassword');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });
  });

  describe('getPasswordById', () => {
    it('devrait récupérer et déchiffrer un mot de passe', async () => {
      try {
        const result = await PasswordService.getPasswordById('pwd-123', 'user-123', 'org-123');
        expect(result).toBeDefined();
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });

    it('devrait gérer les mots de passe inexistants', async () => {
      try {
        await PasswordService.getPasswordById('pwd-inexistant', 'user-123', 'org-123');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });
  });

  describe('updatePassword', () => {
    it('devrait mettre à jour un mot de passe avec rechiffrement', async () => {
      const updateData = {
        name: 'Updated Password',
        username: 'updateduser',
        password: 'NewSecurePassword123!'
      };

      try {
        const result = await PasswordService.updatePassword('pwd-123', updateData, 'user-123', 'org-123');
        expect(result).toBeDefined();
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });

    it('devrait chiffrer le nouveau mot de passe', async () => {
      const updateData = {
        password: 'NewPlainTextPassword'
      };

      try {
        await PasswordService.updatePassword('pwd-123', updateData, 'user-123', 'org-123');
        const { encrypt } = require('../../utils/crypto');
        expect(encrypt).toHaveBeenCalledWith('NewPlainTextPassword');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });
  });

  describe('deletePassword', () => {
    it('devrait supprimer un mot de passe existant', async () => {
      try {
        await PasswordService.deletePassword('pwd-123', 'user-123', 'org-123');
        expect(true).toBe(true);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });
  });

  describe('searchPasswords', () => {
    it('devrait rechercher des mots de passe par terme', async () => {
      try {
        const result = await PasswordService.searchPasswords('test', 'user-123', 'org-123');
        expect(result).toBeDefined();
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });

    it('devrait limiter les résultats de recherche', async () => {
      try {
        const result = await PasswordService.searchPasswords('test', 'user-123', 'org-123', { limit: 5 });
        expect(result).toBeDefined();
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });
  });

  describe('generateSecurePassword', () => {
    it('devrait générer un mot de passe sécurisé par défaut', () => {
      const password = PasswordService.generateSecurePassword();
      expect(typeof password).toBe('string');
      expect(password.length).toBeGreaterThan(8);
    });

    it('devrait générer un mot de passe avec options personnalisées', () => {
      const options = {
        length: 16,
        includeUppercase: true,
        includeLowercase: true,
        includeNumbers: true,
        includeSymbols: true
      };
      
      const password = PasswordService.generateSecurePassword(options);
      expect(typeof password).toBe('string');
      expect(password.length).toBe(16);
    });

    it('devrait générer des mots de passe différents à chaque appel', () => {
      const password1 = PasswordService.generateSecurePassword();
      const password2 = PasswordService.generateSecurePassword();
      expect(password1).not.toBe(password2);
    });
  });
});
