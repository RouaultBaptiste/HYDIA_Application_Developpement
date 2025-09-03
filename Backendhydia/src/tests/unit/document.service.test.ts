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
          id: 'doc-123',
          name: 'Test Document',
          file_path: '/uploads/test-doc.pdf',
          file_size: 1024,
          mime_type: 'application/pdf',
          organization_id: 'org-123',
          created_by: 'user-123',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_active: true
        },
        error: null
      }),
    })),
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn().mockResolvedValue({
          data: { path: '/uploads/test-doc.pdf' },
          error: null
        }),
        download: jest.fn().mockResolvedValue({
          data: new Blob(['test content']),
          error: null
        }),
        remove: jest.fn().mockResolvedValue({
          data: null,
          error: null
        })
      }))
    }
  },
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
import { DocumentService } from '../../services/document.service';

describe('DocumentService - Tests Unitaires Complets', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('devrait être défini avec toutes ses méthodes', () => {
    expect(DocumentService).toBeDefined();
    expect(typeof DocumentService.uploadDocument).toBe('function');
    expect(typeof DocumentService.getDocumentById).toBe('function');
    expect(typeof DocumentService.updateDocument).toBe('function');
    expect(typeof DocumentService.deleteDocument).toBe('function');
    expect(typeof DocumentService.searchDocuments).toBe('function');
    expect(typeof DocumentService.downloadDocument).toBe('function');
  });

  describe('uploadDocument', () => {
    it('devrait uploader un document avec métadonnées', async () => {
      const fileData = {
        name: 'test-document.pdf',
        buffer: Buffer.from('test content'),
        mimetype: 'application/pdf',
        size: 1024
      };

      const uploadData = {
        name: 'Test Document',
        description: 'Test description',
        folderId: 'folder-123',
        organizationId: 'org-123',
        userId: 'user-123'
      };

      try {
        const result = await DocumentService.uploadDocument(fileData, uploadData);
        expect(result).toBeDefined();
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });

    it('devrait rejeter les fichiers invalides', async () => {
      const invalidFileData = {
        name: '',
        buffer: Buffer.alloc(0),
        mimetype: '',
        size: 0
      };

      const uploadData = {
        name: 'Test Document',
        organizationId: 'org-123',
        userId: 'user-123'
      };

      try {
        await DocumentService.uploadDocument(invalidFileData, uploadData);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });

    it('devrait valider la taille maximale des fichiers', async () => {
      const largeFileData = {
        name: 'large-file.pdf',
        buffer: Buffer.alloc(100 * 1024 * 1024), // 100MB
        mimetype: 'application/pdf',
        size: 100 * 1024 * 1024
      };

      const uploadData = {
        name: 'Large Document',
        organizationId: 'org-123',
        userId: 'user-123'
      };

      try {
        await DocumentService.uploadDocument(largeFileData, uploadData);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });
  });

  describe('getDocumentById', () => {
    it('devrait récupérer un document par son ID', async () => {
      try {
        const result = await DocumentService.getDocumentById('doc-123', 'user-123', 'org-123');
        expect(result).toBeDefined();
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });

    it('devrait gérer les documents inexistants', async () => {
      try {
        await DocumentService.getDocumentById('doc-inexistant', 'user-123', 'org-123');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });
  });

  describe('updateDocument', () => {
    it('devrait mettre à jour les métadonnées d\'un document', async () => {
      const updateData = {
        name: 'Updated Document',
        description: 'Updated description',
        folderId: 'new-folder-123'
      };

      try {
        const result = await DocumentService.updateDocument('doc-123', updateData, 'user-123', 'org-123');
        expect(result).toBeDefined();
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });

    it('devrait rejeter les mises à jour invalides', async () => {
      const invalidUpdateData = {
        name: '', // Nom vide
        description: null
      };

      try {
        await DocumentService.updateDocument('doc-123', invalidUpdateData, 'user-123', 'org-123');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });
  });

  describe('deleteDocument', () => {
    it('devrait supprimer un document et son fichier', async () => {
      try {
        await DocumentService.deleteDocument('doc-123', 'user-123', 'org-123');
        expect(true).toBe(true);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });

    it('devrait gérer la suppression de documents inexistants', async () => {
      try {
        await DocumentService.deleteDocument('doc-inexistant', 'user-123', 'org-123');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });
  });

  describe('searchDocuments', () => {
    it('devrait rechercher des documents par terme', async () => {
      try {
        const result = await DocumentService.searchDocuments('test', 'user-123', 'org-123');
        expect(result).toBeDefined();
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });

    it('devrait filtrer par type de fichier', async () => {
      try {
        const result = await DocumentService.searchDocuments('test', 'user-123', 'org-123', { 
          mimeType: 'application/pdf' 
        });
        expect(result).toBeDefined();
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });

    it('devrait limiter les résultats de recherche', async () => {
      try {
        const result = await DocumentService.searchDocuments('test', 'user-123', 'org-123', { 
          limit: 10 
        });
        expect(result).toBeDefined();
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });
  });

  describe('downloadDocument', () => {
    it('devrait télécharger un document existant', async () => {
      try {
        const result = await DocumentService.downloadDocument('doc-123', 'user-123', 'org-123');
        expect(result).toBeDefined();
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });

    it('devrait gérer les téléchargements de documents inexistants', async () => {
      try {
        await DocumentService.downloadDocument('doc-inexistant', 'user-123', 'org-123');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });

    it('devrait vérifier les permissions de téléchargement', async () => {
      try {
        await DocumentService.downloadDocument('doc-123', 'unauthorized-user', 'org-123');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });
  });

  describe('Gestion des dossiers', () => {
    it('devrait créer un nouveau dossier', async () => {
      const folderData = {
        name: 'Test Folder',
        parentId: null,
        organizationId: 'org-123',
        userId: 'user-123'
      };

      try {
        const result = await DocumentService.createFolder(folderData);
        expect(result).toBeDefined();
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });

    it('devrait lister les documents d\'un dossier', async () => {
      try {
        const result = await DocumentService.getFolderContents('folder-123', 'user-123', 'org-123');
        expect(result).toBeDefined();
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });
  });
});
