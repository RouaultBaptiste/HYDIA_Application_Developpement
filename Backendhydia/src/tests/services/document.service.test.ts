import { describe, expect, it, beforeEach, jest, afterEach } from '@jest/globals';
import { DocumentService } from '../../services/document.service';
import { supabase } from '../../config/supabase';
import { AppError } from '../../utils/errors';

// Mock de Supabase
jest.mock('../../config/supabase', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    ilike: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    match: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    storage: {
      from: jest.fn().mockReturnValue({
        upload: jest.fn().mockResolvedValue({ data: { path: 'test-path' }, error: null }),
        getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: 'https://example.com/test-file' } }),
        remove: jest.fn().mockResolvedValue({ data: {}, error: null }),
      }),
    },
  },
}));

describe('DocumentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('uploadDocument', () => {
    it('devrait télécharger un document avec des données valides', async () => {
      // Préparer les données de test
      const organizationId = 'org-123';
      const userId = 'user-123';
      const documentData = {
        title: 'Document de test',
        file: {
          buffer: Buffer.from('test file content'),
          originalname: 'test-document.pdf',
          mimetype: 'application/pdf',
          size: 1024,
        },
        folderId: 'folder-123'
      };

      // Mock de la réponse de Supabase Storage
      (supabase.storage.from as jest.Mock).mockReturnValue({
        upload: jest.fn().mockResolvedValue({
          data: { path: 'documents/org-123/test-document.pdf' },
          error: null,
        }),
        getPublicUrl: jest.fn().mockReturnValue({
          data: { publicUrl: 'https://example.com/test-document.pdf' },
        }),
      });

      // Mock de la réponse de Supabase Database
      (supabase.from as jest.Mock).mockReturnThis();
      (supabase.insert as jest.Mock).mockReturnThis();
      (supabase.select as jest.Mock).mockReturnThis();
      (supabase.single as jest.Mock).mockResolvedValue({
        data: {
          id: 'doc-123',
          title: documentData.title,
          filename: 'test-document.pdf',
          file_path: 'documents/org-123/test-document.pdf',
          file_size: 1024,
          mime_type: 'application/pdf',
          organization_id: organizationId,
          folder_id: documentData.folderId,
          uploaded_by: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_active: true,
        },
        error: null,
      });

      // Appeler la méthode à tester
      const result = await DocumentService.uploadDocument(
        organizationId,
        userId,
        documentData
      );

      // Vérifier que le résultat est conforme aux attentes
      expect(result).toBeDefined();
      expect(result.id).toBe('doc-123');
      expect(result.title).toBe(documentData.title);
      expect(result.filename).toBe('test-document.pdf');
      expect(result.mimeType).toBe('application/pdf');
      expect(result.organizationId).toBe(organizationId);
      expect(result.uploadedBy).toBe(userId);

      // Vérifier que les appels à Supabase ont été faits correctement
      expect(supabase.storage.from).toHaveBeenCalled();
      expect(supabase.from).toHaveBeenCalledWith('documents');
      expect(supabase.insert).toHaveBeenCalled();
      expect(supabase.select).toHaveBeenCalled();
    });

    it('devrait échouer avec un fichier manquant', async () => {
      // Préparer les données de test invalides (sans fichier)
      const organizationId = 'org-123';
      const userId = 'user-123';
      const invalidData = {
        title: 'Document sans fichier',
        folderId: 'folder-123'
      };

      // Vérifier que le service rejette les données invalides
      await expect(
        DocumentService.uploadDocument(organizationId, userId, invalidData as any)
      ).rejects.toThrow();
    });
  });

  describe('getDocumentById', () => {
    it('devrait retourner un document existant', async () => {
      // Préparer les données de test
      const documentId = 'doc-123';
      const organizationId = 'org-123';
      const userId = 'user-123';

      // Mock de la réponse de Supabase
      (supabase.from as jest.Mock).mockReturnThis();
      (supabase.select as jest.Mock).mockReturnThis();
      (supabase.eq as jest.Mock).mockReturnThis();
      (supabase.single as jest.Mock).mockResolvedValue({
        data: {
          id: documentId,
          title: 'Document de test',
          filename: 'test-document.pdf',
          file_path: 'documents/org-123/test-document.pdf',
          file_size: 1024,
          mime_type: 'application/pdf',
          organization_id: organizationId,
          folder_id: 'folder-123',
          uploaded_by: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_active: true,
        },
        error: null,
      });

      // Mock de l'URL publique
      (supabase.storage.from as jest.Mock).mockReturnValue({
        getPublicUrl: jest.fn().mockReturnValue({
          data: { publicUrl: 'https://example.com/test-document.pdf' },
        }),
      });

      // Appeler la méthode à tester
      const result = await DocumentService.getDocumentById(
        documentId,
        organizationId,
        userId
      );

      // Vérifier que le résultat est conforme aux attentes
      expect(result).toBeDefined();
      expect(result.id).toBe(documentId);
      expect(result.organizationId).toBe(organizationId);
      expect(result.uploadedBy).toBe(userId);

      // Vérifier que les appels à Supabase ont été faits correctement
      expect(supabase.from).toHaveBeenCalledWith('documents');
      expect(supabase.select).toHaveBeenCalled();
      expect(supabase.eq).toHaveBeenCalledTimes(3);
    });

    it('devrait échouer pour un document inexistant', async () => {
      // Préparer les données de test
      const documentId = 'nonexistent-id';
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
        DocumentService.getDocumentById(documentId, organizationId, userId)
      ).rejects.toThrow(AppError);
    });
  });

  describe('createFolder', () => {
    it('devrait créer un dossier avec des données valides', async () => {
      // Préparer les données de test
      const organizationId = 'org-123';
      const userId = 'user-123';
      const folderData = {
        name: 'Dossier de test',
        description: 'Description du dossier',
        parentFolderId: null
      };

      // Mock de la réponse de Supabase
      (supabase.from as jest.Mock).mockReturnThis();
      (supabase.insert as jest.Mock).mockReturnThis();
      (supabase.select as jest.Mock).mockReturnThis();
      (supabase.single as jest.Mock).mockResolvedValue({
        data: {
          id: 'folder-123',
          name: folderData.name,
          description: folderData.description,
          parent_folder_id: null,
          organization_id: organizationId,
          created_by: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_active: true,
        },
        error: null,
      });

      // Appeler la méthode à tester
      const result = await DocumentService.createFolder(
        organizationId,
        userId,
        folderData
      );

      // Vérifier que le résultat est conforme aux attentes
      expect(result).toBeDefined();
      expect(result.id).toBe('folder-123');
      expect(result.name).toBe(folderData.name);
      expect(result.description).toBe(folderData.description);
      expect(result.organizationId).toBe(organizationId);
      expect(result.createdBy).toBe(userId);

      // Vérifier que les appels à Supabase ont été faits correctement
      expect(supabase.from).toHaveBeenCalledWith('document_folders');
      expect(supabase.insert).toHaveBeenCalled();
      expect(supabase.select).toHaveBeenCalled();
    });
  });

  describe('getFolders', () => {
    it('devrait retourner les dossiers d\'une organisation', async () => {
      // Préparer les données de test
      const organizationId = 'org-123';
      const userId = 'user-123';

      // Mock de la réponse de Supabase
      (supabase.from as jest.Mock).mockReturnThis();
      (supabase.select as jest.Mock).mockReturnThis();
      (supabase.eq as jest.Mock).mockReturnThis();
      (supabase.order as jest.Mock).mockResolvedValue({
        data: [
          {
            id: 'folder-1',
            name: 'Dossier 1',
            description: 'Description du dossier 1',
            parent_folder_id: null,
            organization_id: organizationId,
            created_by: userId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            is_active: true,
          },
          {
            id: 'folder-2',
            name: 'Dossier 2',
            description: 'Description du dossier 2',
            parent_folder_id: null,
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
      const result = await DocumentService.getFolders(
        organizationId,
        userId
      );

      // Vérifier que le résultat est conforme aux attentes
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
      expect(result[0].id).toBe('folder-1');
      expect(result[1].id).toBe('folder-2');

      // Vérifier que les appels à Supabase ont été faits correctement
      expect(supabase.from).toHaveBeenCalledWith('document_folders');
      expect(supabase.select).toHaveBeenCalled();
      expect(supabase.eq).toHaveBeenCalled();
    });
  });
});
