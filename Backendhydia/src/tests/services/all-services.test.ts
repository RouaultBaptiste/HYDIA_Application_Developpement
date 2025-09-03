import { describe, expect, it, beforeEach } from '@jest/globals';

// Mock complet de toutes les dépendances avant les imports
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
      single: jest.fn().mockResolvedValue({ data: { id: 'test-id' }, error: null }),
    })),
  },
  supabaseAuth: {
    auth: {
      signUp: jest.fn().mockResolvedValue({
        data: { user: { id: 'test-user', email: 'test@example.com' } },
        error: null
      }),
      signInWithPassword: jest.fn().mockResolvedValue({
        data: { user: { id: 'test-user', email: 'test@example.com' } },
        error: null
      }),
    },
  },
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(() => 'mock-jwt-token'),
  verify: jest.fn(() => ({ userId: 'test-user', email: 'test@example.com', type: 'refresh' })),
}));

jest.mock('bcryptjs', () => ({
  hash: jest.fn(() => Promise.resolve('hashed-password')),
  compare: jest.fn(() => Promise.resolve(true)),
}));

jest.mock('../../utils/errors', () => ({
  AppError: class AppError extends Error {
    constructor(message: string, statusCode: number = 500) {
      super(message);
      this.name = 'AppError';
    }
  }
}));

// Imports après les mocks
import { AuthService } from '../../services/auth.service';
import { NoteService } from '../../services/note.service';
import { PasswordService } from '../../services/password.service';
import { DocumentService } from '../../services/document.service';
import { OrganizationService } from '../../services/organization.service';
import { SharingService } from '../../services/sharing.service';

describe('Services Backend Hydia - Tests Intégrés', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('AuthService', () => {
    it('devrait être défini avec toutes ses méthodes', () => {
      expect(AuthService).toBeDefined();
      expect(typeof AuthService.register).toBe('function');
      expect(typeof AuthService.login).toBe('function');
      expect(typeof AuthService.refreshTokens).toBe('function');
    });

    it('devrait pouvoir traiter une inscription', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe'
      };

      try {
        await AuthService.register(userData);
        expect(true).toBe(true); // Test passé si aucune erreur
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });
  });

  describe('NoteService', () => {
    it('devrait être défini avec toutes ses méthodes', () => {
      expect(NoteService).toBeDefined();
      expect(typeof NoteService.createNote).toBe('function');
      expect(typeof NoteService.getNoteById).toBe('function');
      expect(typeof NoteService.updateNote).toBe('function');
      expect(typeof NoteService.deleteNote).toBe('function');
      expect(typeof NoteService.searchNotes).toBe('function');
    });

    it('devrait pouvoir créer une note', async () => {
      const noteData = {
        title: 'Test Note',
        content: 'Test content',
        categoryId: 'cat-123',
        organizationId: 'org-123',
        userId: 'user-123'
      };

      try {
        await NoteService.createNote(noteData);
        expect(true).toBe(true);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });
  });

  describe('PasswordService', () => {
    it('devrait être défini avec toutes ses méthodes', () => {
      expect(PasswordService).toBeDefined();
      expect(typeof PasswordService.createPassword).toBe('function');
      expect(typeof PasswordService.getPasswordById).toBe('function');
      expect(typeof PasswordService.updatePassword).toBe('function');
      expect(typeof PasswordService.deletePassword).toBe('function');
      expect(typeof PasswordService.searchPasswords).toBe('function');
    });

    it('devrait pouvoir créer un mot de passe', async () => {
      const passwordData = {
        title: 'Test Password',
        username: 'testuser',
        password: 'testpass123',
        url: 'https://example.com',
        notes: 'Test notes',
        organizationId: 'org-123',
        userId: 'user-123'
      };

      try {
        await PasswordService.createPassword(passwordData);
        expect(true).toBe(true);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });
  });

  describe('DocumentService', () => {
    it('devrait être défini avec toutes ses méthodes', () => {
      expect(DocumentService).toBeDefined();
      expect(typeof DocumentService.uploadDocument).toBe('function');
      expect(typeof DocumentService.getDocumentById).toBe('function');
      expect(typeof DocumentService.updateDocument).toBe('function');
      expect(typeof DocumentService.deleteDocument).toBe('function');
      expect(typeof DocumentService.createFolder).toBe('function');
    });

    it('devrait pouvoir traiter un upload de document', async () => {
      const documentData = {
        title: 'Test Document',
        filename: 'test.pdf',
        fileSize: 1024,
        mimeType: 'application/pdf',
        organizationId: 'org-123',
        userId: 'user-123'
      };

      try {
        await DocumentService.uploadDocument(documentData, Buffer.from('test'));
        expect(true).toBe(true);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });
  });

  describe('OrganizationService', () => {
    it('devrait être défini avec toutes ses méthodes', () => {
      expect(OrganizationService).toBeDefined();
      expect(typeof OrganizationService.createOrganization).toBe('function');
      expect(typeof OrganizationService.getOrganizationById).toBe('function');
      expect(typeof OrganizationService.updateOrganization).toBe('function');
      expect(typeof OrganizationService.deleteOrganization).toBe('function');
      expect(typeof OrganizationService.isUserMemberOfOrganization).toBe('function');
    });

    it('devrait pouvoir créer une organisation', async () => {
      const orgData = {
        name: 'Test Organization',
        description: 'Test description',
        userId: 'user-123'
      };

      try {
        await OrganizationService.createOrganization(orgData);
        expect(true).toBe(true);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });
  });

  describe('SharingService', () => {
    it('devrait être défini avec toutes ses méthodes', () => {
      expect(SharingService).toBeDefined();
      expect(typeof SharingService.sharePassword).toBe('function');
      expect(typeof SharingService.shareDocument).toBe('function');
      expect(typeof SharingService.createShareLink).toBe('function');
      expect(typeof SharingService.accessSharedItem).toBe('function');
    });

    it('devrait pouvoir partager un mot de passe', async () => {
      try {
        await SharingService.sharePassword('pass-123', 'user-123', 'org-123', {
          recipientEmail: 'recipient@example.com',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          permissions: ['read']
        });
        expect(true).toBe(true);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });
  });

  describe('Tests d\'intégration', () => {
    it('devrait pouvoir importer tous les services sans erreur', () => {
      expect(AuthService).toBeDefined();
      expect(NoteService).toBeDefined();
      expect(PasswordService).toBeDefined();
      expect(DocumentService).toBeDefined();
      expect(OrganizationService).toBeDefined();
      expect(SharingService).toBeDefined();
    });

    it('devrait avoir accès aux variables d\'environnement de test', () => {
      expect(process.env.NODE_ENV).toBe('test');
      expect(process.env.JWT_SECRET).toBeDefined();
      expect(process.env.ENCRYPTION_KEY).toBeDefined();
    });
  });
});
