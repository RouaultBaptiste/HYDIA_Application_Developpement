import { describe, expect, it, beforeEach } from '@jest/globals';

// Mock complet de Supabase avant tout import
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
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
    })),
  },
}));

// Mock des utilitaires
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
import { AppError } from '../../utils/errors';

const mockSupabase = require('../../config/supabase').supabase;

describe('NoteService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('createNote', () => {
    it('devrait créer une note avec des données valides', async () => {
      // Préparer les données de test
      const organizationId = 'org-123';
      const userId = 'user-123';
      const noteData = {
        title: 'Ma note de test',
        content: 'Contenu de ma note de test',
        isPrivate: false,
        categoryId: 'cat-123'
      };

      // Mock de la réponse de Supabase
      (supabase.from as jest.Mock).mockReturnThis();
      (supabase.insert as jest.Mock).mockReturnThis();
      (supabase.select as jest.Mock).mockReturnThis();
      (supabase.single as jest.Mock).mockResolvedValue({
        data: {
          id: 'note-123',
          title: noteData.title,
          content: noteData.content,
          category_id: noteData.categoryId,
          organization_id: organizationId,
          created_by: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_active: true,
        },
        error: null,
      });

      // Appeler la méthode à tester
      const result = await NoteService.createNote(
        organizationId,
        userId,
        noteData
      );

      // Vérifier que le résultat est conforme aux attentes
      expect(result).toBeDefined();
      expect(result.id).toBe('note-123');
      expect(result.title).toBe(noteData.title);
      expect(result.content).toBe(noteData.content);
      expect(result.categoryId).toBe(noteData.categoryId);
      expect(result.organizationId).toBe(organizationId);
      expect(result.createdBy).toBe(userId);

      // Vérifier que les appels à Supabase ont été faits correctement
      expect(supabase.from).toHaveBeenCalledWith('notes');
      expect(supabase.insert).toHaveBeenCalled();
      expect(supabase.select).toHaveBeenCalled();
    });

    it('devrait échouer avec un titre ou un contenu manquant', async () => {
      // Préparer les données de test invalides (sans titre)
      const organizationId = 'org-123';
      const userId = 'user-123';
      const invalidData = {
        content: 'Contenu de ma note',
        isPrivate: false,
      };

      // Vérifier que le service rejette les données invalides
      await expect(
        NoteService.createNote(organizationId, userId, invalidData as any)
      ).rejects.toThrow();
    });
  });

  describe('getNoteById', () => {
    it('devrait retourner une note existante', async () => {
      // Préparer les données de test
      const noteId = 'note-123';
      const organizationId = 'org-123';
      const userId = 'user-123';

      // Mock de la réponse de Supabase
      (supabase.from as jest.Mock).mockReturnThis();
      (supabase.select as jest.Mock).mockReturnThis();
      (supabase.eq as jest.Mock).mockReturnThis();
      (supabase.single as jest.Mock).mockResolvedValue({
        data: {
          id: noteId,
          title: 'Ma note de test',
          content: 'Contenu de ma note de test',
          category_id: 'cat-123',
          organization_id: organizationId,
          created_by: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_active: true,
        },
        error: null,
      });

      // Appeler la méthode à tester
      const result = await NoteService.getNoteById(
        noteId,
        organizationId,
        userId
      );

      // Vérifier que le résultat est conforme aux attentes
      expect(result).toBeDefined();
      expect(result.id).toBe(noteId);
      expect(result.organizationId).toBe(organizationId);
      expect(result.createdBy).toBe(userId);

      // Vérifier que les appels à Supabase ont été faits correctement
      expect(supabase.from).toHaveBeenCalledWith('notes');
      expect(supabase.select).toHaveBeenCalled();
      expect(supabase.eq).toHaveBeenCalledTimes(3);
    });

    it('devrait échouer pour une note inexistante', async () => {
      // Préparer les données de test
      const noteId = 'nonexistent-id';
      const organizationId = 'org-123';
      const userId = 'user-123';

      // Mock de la réponse de Supabase (erreur/data null)
      (supabase.from as jest.Mock).mockReturnThis();
      (supabase.select as jest.Mock).mockReturnThis();
      (supabase.eq as jest.Mock).mockReturnThis();
      (supabase.single as jest.Mock).mockResolvedValue({
        data: null,
        error: { message: 'Record not found' },
      });

      // Vérifier que le service lance une erreur appropriée
      await expect(
        NoteService.getNoteById(noteId, organizationId, userId)
      ).rejects.toThrow(AppError);
    });
  });

  describe('updateNote', () => {
    it('devrait mettre à jour une note existante', async () => {
      // Préparer les données de test
      const noteId = 'note-123';
      const organizationId = 'org-123';
      const userId = 'user-123';
      const updateData = {
        title: 'Titre mis à jour',
        content: 'Contenu mis à jour',
      };

      // Mock de la vérification d'existence
      (supabase.from as jest.Mock).mockReturnThis();
      (supabase.select as jest.Mock).mockReturnThis();
      (supabase.eq as jest.Mock).mockReturnThis();
      (supabase.single as jest.Mock).mockResolvedValueOnce({
        data: {
          id: noteId,
          title: 'Ancien titre',
          content: 'Ancien contenu',
          organization_id: organizationId,
          created_by: userId,
        },
        error: null,
      });

      // Mock de la mise à jour
      (supabase.update as jest.Mock).mockReturnThis();
      (supabase.eq as jest.Mock).mockReturnThis();
      (supabase.single as jest.Mock).mockResolvedValueOnce({
        data: {
          id: noteId,
          title: updateData.title,
          content: updateData.content,
          organization_id: organizationId,
          created_by: userId,
          updated_at: new Date().toISOString(),
          is_active: true,
        },
        error: null,
      });

      // Appeler la méthode à tester
      const result = await NoteService.updateNote(
        noteId,
        organizationId,
        userId,
        updateData
      );

      // Vérifier que le résultat est conforme aux attentes
      expect(result).toBeDefined();
      expect(result.id).toBe(noteId);
      expect(result.title).toBe(updateData.title);
      expect(result.content).toBe(updateData.content);

      // Vérifier que les appels à Supabase ont été faits correctement
      expect(supabase.from).toHaveBeenCalledWith('notes');
      expect(supabase.update).toHaveBeenCalled();
    });
  });

  describe('searchNotes', () => {
    it('devrait retourner des notes correspondant aux critères de recherche', async () => {
      // Préparer les données de test
      const organizationId = 'org-123';
      const userId = 'user-123';
      const searchTerm = 'test';

      // Mock de la réponse de Supabase
      (supabase.from as jest.Mock).mockReturnThis();
      (supabase.select as jest.Mock).mockReturnThis();
      (supabase.eq as jest.Mock).mockReturnThis();
      (supabase.or as jest.Mock).mockReturnThis();
      (supabase.ilike as jest.Mock).mockReturnThis();
      (supabase.order as jest.Mock).mockReturnThis();
      (supabase.limit as jest.Mock).mockResolvedValue({
        data: [
          {
            id: 'note-1',
            title: 'Note de test 1',
            content: 'Contenu de test',
            organization_id: organizationId,
            created_by: userId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            is_active: true,
          },
          {
            id: 'note-2',
            title: 'Une autre note',
            content: 'Ce contenu contient le mot test',
            organization_id: organizationId,
            created_by: userId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            is_active: true,
          }
        ],
        error: null,
      });

      // Appeler la méthode à tester
      const result = await NoteService.searchNotes(
        organizationId,
        userId,
        searchTerm
      );

      // Vérifier que le résultat est conforme aux attentes
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
      expect(result[0].id).toBe('note-1');
      expect(result[1].id).toBe('note-2');

      // Vérifier que les appels à Supabase ont été faits correctement
      expect(supabase.from).toHaveBeenCalledWith('notes');
      expect(supabase.select).toHaveBeenCalled();
      expect(supabase.eq).toHaveBeenCalled();
      expect(supabase.or).toHaveBeenCalled();
    });
  });
});
