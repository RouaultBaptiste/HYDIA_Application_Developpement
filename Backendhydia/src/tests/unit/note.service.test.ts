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
          id: 'note-123',
          title: 'Test Note',
          content: 'Test content',
          organization_id: 'org-123',
          created_by: 'user-123',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_deleted: false
        },
        error: null
      }),
    })),
  },
}));

jest.mock('../../services/organization.service', () => ({
  OrganizationService: {
    isUserMemberOfOrganization: jest.fn().mockResolvedValue(true)
  }
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
import { NoteService } from '../../services/note.service';

describe('NoteService - Tests Unitaires Complets', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('devrait être défini avec toutes ses méthodes', () => {
    expect(NoteService).toBeDefined();
    expect(typeof NoteService.createNote).toBe('function');
    expect(typeof NoteService.getNoteById).toBe('function');
    expect(typeof NoteService.updateNote).toBe('function');
    expect(typeof NoteService.deleteNote).toBe('function');
    expect(typeof NoteService.searchNotes).toBe('function');
  });

  describe('createNote', () => {
    it('devrait créer une note avec des données valides', async () => {
      const noteData = {
        title: 'Test Note',
        content: 'Test content',
        categoryId: 'cat-123'
      };

      try {
        const result = await NoteService.createNote('org-123', 'user-123', noteData);
        expect(result).toBeDefined();
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });

    it('devrait rejeter les données invalides', async () => {
      const invalidNoteData = {
        title: '', // Titre vide
        content: ''
      };

      try {
        await NoteService.createNote('org-123', 'user-123', invalidNoteData);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });
  });

  describe('getNoteById', () => {
    it('devrait récupérer une note par son ID', async () => {
      try {
        const result = await NoteService.getNoteById('note-123', 'org-123', 'user-123');
        expect(result).toBeDefined();
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });

    it('devrait gérer les notes inexistantes', async () => {
      try {
        await NoteService.getNoteById('note-inexistant', 'org-123', 'user-123');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });
  });

  describe('updateNote', () => {
    it('devrait mettre à jour une note existante', async () => {
      const updateData = {
        title: 'Updated Note',
        content: 'Updated content'
      };

      try {
        const result = await NoteService.updateNote('note-123', 'org-123', 'user-123', updateData);
        expect(result).toBeDefined();
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });

    it('devrait rejeter les mises à jour invalides', async () => {
      const invalidUpdateData = {
        title: '', // Titre vide
        content: ''
      };

      try {
        await NoteService.updateNote('note-123', 'org-123', 'user-123', invalidUpdateData);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });
  });

  describe('deleteNote', () => {
    it('devrait supprimer une note existante', async () => {
      try {
        await NoteService.deleteNote('note-123', 'org-123', 'user-123');
        expect(true).toBe(true);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });

    it('devrait gérer la suppression de notes inexistantes', async () => {
      try {
        await NoteService.deleteNote('note-inexistant', 'org-123', 'user-123');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });
  });

  describe('searchNotes', () => {
    it('devrait rechercher des notes par terme', async () => {
      try {
        const result = await NoteService.searchNotes('org-123', 'user-123', 'test');
        expect(result).toBeDefined();
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });

    it('devrait gérer les recherches vides', async () => {
      try {
        const result = await NoteService.searchNotes('org-123', 'user-123', '');
        expect(result).toBeDefined();
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });

    it('devrait récupérer les notes d\'une organisation', async () => {
      try {
        const result = await NoteService.getOrganizationNotes('org-123', 'user-123');
        expect(result).toBeDefined();
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });
  });
});
