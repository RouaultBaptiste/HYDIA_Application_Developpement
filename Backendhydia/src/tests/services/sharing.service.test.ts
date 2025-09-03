import { describe, expect, it, beforeEach, jest, afterEach } from '@jest/globals';
import { SharingService } from '../../services/sharing.service';
import { PasswordService } from '../../services/password.service';
import { DocumentService } from '../../services/document.service';
import { OrganizationService } from '../../services/organization.service';
import { supabase } from '../../config/supabase';
import { AppError } from '../../utils/errors';
import { v4 as uuidv4 } from 'uuid';

// Mock des modules
jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('mock-uuid-123')
}));

jest.mock('../../utils/crypto', () => ({
  generateSecureToken: jest.fn().mockReturnValue('mock-secure-token-123')
}));

jest.mock('../../services/password.service');
jest.mock('../../services/document.service');
jest.mock('../../services/organization.service');

jest.mock('../../config/supabase', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    match: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis()
  }
}));

describe('SharingService', () => {
  // Réinitialiser les mocks avant chaque test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Test de partage de mot de passe
  describe('sharePassword', () => {
    it('devrait partager un mot de passe avec succès', async () => {
      // Mock des dépendances
      const mockPassword = {
        id: 'password-123',
        title: 'Test Password',
        password: 'encrypted-password',
        organizationId: 'org-123',
        createdBy: 'user-123'
      };

      const mockShare = {
        id: 'mock-uuid-123',
        password_id: 'password-123',
        shared_by: 'user-123',
        shared_with: 'user-456',
        permissions: { read: true, write: false, delete: false },
        organization_id: 'org-123',
        created_at: expect.any(String)
      };

      // Mock des services
      (PasswordService.getPasswordById as jest.Mock).mockResolvedValue(mockPassword);
      (OrganizationService.isUserMemberOfOrganization as jest.Mock).mockResolvedValue(true);
      
      // Mock de Supabase pour la vérification d'un partage existant
      (supabase.from as jest.Mock).mockReturnThis();
      (supabase.select as jest.Mock).mockReturnThis();
      (supabase.eq as jest.Mock).mockReturnThis();
      (supabase.single as jest.Mock).mockResolvedValueOnce({ data: null, error: null });
      
      // Mock de Supabase pour l'insertion d'un nouveau partage
      (supabase.from as jest.Mock).mockReturnThis();
      (supabase.insert as jest.Mock).mockReturnThis();
      (supabase.select as jest.Mock).mockReturnThis();
      (supabase.single as jest.Mock).mockResolvedValueOnce({ 
        data: mockShare,
        error: null 
      });

      // Exécuter la méthode
      const result = await SharingService.sharePassword(
        'password-123',
        'org-123',
        'user-123',
        'user-456',
        { read: true, write: false, delete: false }
      );

      // Vérifier les résultats
      expect(result).toBeDefined();
      expect(result.id).toBe('mock-uuid-123');
      expect(result.passwordId).toBe('password-123');
      expect(result.sharedBy).toBe('user-123');
      expect(result.sharedWith).toBe('user-456');
      expect(PasswordService.getPasswordById).toHaveBeenCalledWith('password-123', 'org-123', 'user-123');
      expect(OrganizationService.isUserMemberOfOrganization).toHaveBeenCalledWith('user-456', 'org-123');
      expect(supabase.from).toHaveBeenCalledWith('password_shares');
      expect(supabase.insert).toHaveBeenCalled();
    });

    it('devrait lever une erreur si le mot de passe n\'existe pas', async () => {
      // Mock des services
      (PasswordService.getPasswordById as jest.Mock).mockResolvedValue(null);

      // Vérifier que l'erreur est levée
      await expect(SharingService.sharePassword(
        'invalid-password',
        'org-123',
        'user-123',
        'user-456',
        { read: true, write: false, delete: false }
      )).rejects.toThrow(AppError);
    });

    it('devrait lever une erreur si l\'utilisateur cible n\'est pas membre de l\'organisation', async () => {
      // Mock des services
      (PasswordService.getPasswordById as jest.Mock).mockResolvedValue({
        id: 'password-123',
        title: 'Test Password',
        organizationId: 'org-123'
      });
      (OrganizationService.isUserMemberOfOrganization as jest.Mock).mockResolvedValue(false);

      // Vérifier que l'erreur est levée
      await expect(SharingService.sharePassword(
        'password-123',
        'org-123',
        'user-123',
        'user-456',
        { read: true, write: false, delete: false }
      )).rejects.toThrow(AppError);
    });

    it('devrait lever une erreur si le partage existe déjà', async () => {
      // Mock des services
      (PasswordService.getPasswordById as jest.Mock).mockResolvedValue({
        id: 'password-123',
        title: 'Test Password',
        organizationId: 'org-123'
      });
      (OrganizationService.isUserMemberOfOrganization as jest.Mock).mockResolvedValue(true);
      
      // Mock de Supabase pour la vérification d'un partage existant
      (supabase.from as jest.Mock).mockReturnThis();
      (supabase.select as jest.Mock).mockReturnThis();
      (supabase.eq as jest.Mock).mockReturnThis();
      (supabase.single as jest.Mock).mockResolvedValueOnce({ 
        data: { id: 'existing-share' },
        error: null 
      });

      // Vérifier que l'erreur est levée
      await expect(SharingService.sharePassword(
        'password-123',
        'org-123',
        'user-123',
        'user-456',
        { read: true, write: false, delete: false }
      )).rejects.toThrow(AppError);
    });
  });

  // Test de création de lien de partage pour mot de passe
  describe('createPasswordShareLink', () => {
    it('devrait créer un lien de partage pour un mot de passe', async () => {
      // Mock des dépendances
      const mockPassword = {
        id: 'password-123',
        title: 'Test Password',
        password: 'encrypted-password',
        organizationId: 'org-123'
      };

      const mockShareLink = {
        id: 'mock-uuid-123',
        resource_id: 'password-123',
        resource_type: 'password',
        token: 'mock-secure-token-123',
        created_by: 'user-123',
        expires_at: '2024-12-31T23:59:59Z',
        access_count: 5,
        accessed_count: 0,
        organization_id: 'org-123',
        created_at: expect.any(String)
      };

      // Mock des services
      (PasswordService.getPasswordById as jest.Mock).mockResolvedValue(mockPassword);
      
      // Mock de Supabase pour l'insertion du lien
      (supabase.from as jest.Mock).mockReturnThis();
      (supabase.insert as jest.Mock).mockReturnThis();
      (supabase.select as jest.Mock).mockReturnThis();
      (supabase.single as jest.Mock).mockResolvedValueOnce({ 
        data: mockShareLink,
        error: null 
      });

      // Exécuter la méthode
      const result = await SharingService.createPasswordShareLink(
        'password-123',
        'org-123',
        'user-123',
        '2024-12-31T23:59:59Z',
        5
      );

      // Vérifier les résultats
      expect(result).toBeDefined();
      expect(result.id).toBe('mock-uuid-123');
      expect(result.resourceId).toBe('password-123');
      expect(result.resourceType).toBe('password');
      expect(result.token).toBe('mock-secure-token-123');
      expect(result.expiresAt).toBe('2024-12-31T23:59:59Z');
      expect(result.accessCount).toBe(5);
      expect(PasswordService.getPasswordById).toHaveBeenCalled();
      expect(supabase.from).toHaveBeenCalledWith('share_links');
      expect(supabase.insert).toHaveBeenCalled();
    });
  });

  // Test de récupération des partages d'un mot de passe
  describe('getPasswordShares', () => {
    it('devrait récupérer les partages d\'un mot de passe', async () => {
      // Mock des partages
      const mockShares = [
        {
          id: 'share-1',
          password_id: 'password-123',
          shared_by: 'user-123',
          shared_with: 'user-456',
          permissions: { read: true, write: false, delete: false },
          organization_id: 'org-123',
          created_at: '2023-01-01T00:00:00Z'
        },
        {
          id: 'share-2',
          password_id: 'password-123',
          shared_by: 'user-123',
          shared_with: 'user-789',
          permissions: { read: true, write: true, delete: false },
          organization_id: 'org-123',
          created_at: '2023-01-02T00:00:00Z'
        }
      ];

      // Mock de Supabase
      (supabase.from as jest.Mock).mockReturnThis();
      (supabase.select as jest.Mock).mockReturnThis();
      (supabase.eq as jest.Mock).mockReturnThis();
      (supabase.order as jest.Mock).mockResolvedValue({
        data: mockShares,
        error: null
      });

      // Exécuter la méthode
      const result = await SharingService.getPasswordShares('password-123', 'org-123', 'user-123');

      // Vérifier les résultats
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('share-1');
      expect(result[1].id).toBe('share-2');
      expect(supabase.from).toHaveBeenCalledWith('password_shares');
      expect(supabase.eq).toHaveBeenCalledWith('password_id', 'password-123');
    });
  });

  // Test de partage de document
  describe('shareDocument', () => {
    it('devrait partager un document avec succès', async () => {
      // Mock des dépendances
      const mockDocument = {
        id: 'document-123',
        title: 'Test Document',
        organizationId: 'org-123',
        createdBy: 'user-123'
      };

      const mockShare = {
        id: 'mock-uuid-123',
        document_id: 'document-123',
        shared_by: 'user-123',
        shared_with: 'user-456',
        permissions: { read: true, write: false, delete: false },
        organization_id: 'org-123',
        created_at: expect.any(String)
      };

      // Mock des services
      (DocumentService.getDocumentById as jest.Mock).mockResolvedValue(mockDocument);
      (OrganizationService.isUserMemberOfOrganization as jest.Mock).mockResolvedValue(true);
      
      // Mock de Supabase pour la vérification d'un partage existant
      (supabase.from as jest.Mock).mockReturnThis();
      (supabase.select as jest.Mock).mockReturnThis();
      (supabase.eq as jest.Mock).mockReturnThis();
      (supabase.single as jest.Mock).mockResolvedValueOnce({ data: null, error: null });
      
      // Mock de Supabase pour l'insertion d'un nouveau partage
      (supabase.from as jest.Mock).mockReturnThis();
      (supabase.insert as jest.Mock).mockReturnThis();
      (supabase.select as jest.Mock).mockReturnThis();
      (supabase.single as jest.Mock).mockResolvedValueOnce({ 
        data: mockShare,
        error: null 
      });

      // Exécuter la méthode
      const result = await SharingService.shareDocument(
        'document-123',
        'org-123',
        'user-123',
        'user-456',
        { read: true, write: false, delete: false }
      );

      // Vérifier les résultats
      expect(result).toBeDefined();
      expect(result.id).toBe('mock-uuid-123');
      expect(result.documentId).toBe('document-123');
      expect(result.sharedBy).toBe('user-123');
      expect(result.sharedWith).toBe('user-456');
      expect(DocumentService.getDocumentById).toHaveBeenCalled();
      expect(OrganizationService.isUserMemberOfOrganization).toHaveBeenCalledWith('user-456', 'org-123');
    });
  });

  // Test d'accès à un lien de partage
  describe('accessShareLink', () => {
    it('devrait accéder à un lien de partage valide pour un mot de passe', async () => {
      // Mock du lien de partage
      const mockShareLink = {
        id: 'link-123',
        resource_id: 'password-123',
        resource_type: 'password',
        token: 'valid-token',
        created_by: 'user-123',
        expires_at: new Date(Date.now() + 86400000).toISOString(), // Expire demain
        access_count: 5,
        accessed_count: 0,
        organization_id: 'org-123',
        created_at: new Date().toISOString()
      };

      const mockPassword = {
        id: 'password-123',
        title: 'Test Password',
        username: 'testuser',
        password: 'encrypted-password',
        url: 'https://example.com',
        organizationId: 'org-123'
      };

      // Mock de Supabase pour la récupération du lien
      (supabase.from as jest.Mock).mockReturnThis();
      (supabase.select as jest.Mock).mockReturnThis();
      (supabase.eq as jest.Mock).mockReturnThis();
      (supabase.single as jest.Mock).mockResolvedValueOnce({ 
        data: mockShareLink,
        error: null 
      });

      // Mock de la méthode getPasswordById
      (PasswordService.getPasswordById as jest.Mock).mockResolvedValue(mockPassword);

      // Mock de Supabase pour la mise à jour du compteur d'accès
      (supabase.from as jest.Mock).mockReturnThis();
      (supabase.update as jest.Mock).mockReturnThis();
      (supabase.eq as jest.Mock).mockReturnThis();
      (supabase.single as jest.Mock).mockResolvedValueOnce({
        data: { ...mockShareLink, accessed_count: 1 },
        error: null
      });

      // Exécuter la méthode
      const result = await SharingService.accessShareLink('valid-token');

      // Vérifier les résultats
      expect(result).toBeDefined();
      expect(result.resource).toBeDefined();
      expect(result.resource.id).toBe('password-123');
      expect(result.resourceType).toBe('password');
      expect(supabase.from).toHaveBeenCalledWith('share_links');
      expect(supabase.update).toHaveBeenCalledWith({ accessed_count: 1 });
    });

    it('devrait lever une erreur si le lien n\'existe pas', async () => {
      // Mock de Supabase
      (supabase.from as jest.Mock).mockReturnThis();
      (supabase.select as jest.Mock).mockReturnThis();
      (supabase.eq as jest.Mock).mockReturnThis();
      (supabase.single as jest.Mock).mockResolvedValueOnce({ 
        data: null,
        error: { message: 'Not found' } 
      });

      // Vérifier que l'erreur est levée
      await expect(SharingService.accessShareLink('invalid-token')).rejects.toThrow(AppError);
    });

    it('devrait lever une erreur si le lien est expiré', async () => {
      // Mock du lien de partage expiré
      const mockShareLink = {
        id: 'link-123',
        resource_id: 'password-123',
        resource_type: 'password',
        token: 'expired-token',
        created_by: 'user-123',
        expires_at: new Date(Date.now() - 86400000).toISOString(), // Expiré hier
        access_count: 5,
        accessed_count: 0,
        organization_id: 'org-123',
        created_at: new Date().toISOString()
      };

      // Mock de Supabase
      (supabase.from as jest.Mock).mockReturnThis();
      (supabase.select as jest.Mock).mockReturnThis();
      (supabase.eq as jest.Mock).mockReturnThis();
      (supabase.single as jest.Mock).mockResolvedValueOnce({ 
        data: mockShareLink,
        error: null 
      });

      // Vérifier que l'erreur est levée
      await expect(SharingService.accessShareLink('expired-token')).rejects.toThrow(AppError);
    });

    it('devrait lever une erreur si le nombre d\'accès est dépassé', async () => {
      // Mock du lien de partage avec nombre d'accès maximal atteint
      const mockShareLink = {
        id: 'link-123',
        resource_id: 'password-123',
        resource_type: 'password',
        token: 'limited-token',
        created_by: 'user-123',
        expires_at: new Date(Date.now() + 86400000).toISOString(), // Expire demain
        access_count: 3,
        accessed_count: 3,
        organization_id: 'org-123',
        created_at: new Date().toISOString()
      };

      // Mock de Supabase
      (supabase.from as jest.Mock).mockReturnThis();
      (supabase.select as jest.Mock).mockReturnThis();
      (supabase.eq as jest.Mock).mockReturnThis();
      (supabase.single as jest.Mock).mockResolvedValueOnce({ 
        data: mockShareLink,
        error: null 
      });

      // Vérifier que l'erreur est levée
      await expect(SharingService.accessShareLink('limited-token')).rejects.toThrow(AppError);
    });
  });
});
