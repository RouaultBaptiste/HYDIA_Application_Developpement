import { describe, expect, it, beforeEach, jest, afterEach } from '@jest/globals';
import { OrganizationService } from '../../services/organization.service';
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
    neq: jest.fn().mockReturnThis(),
    is: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    match: jest.fn().mockReturnThis(),
  }
}));

describe('OrganizationService', () => {
  // Réinitialiser les mocks avant chaque test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Test de création d'une organisation
  describe('createOrganization', () => {
    it('devrait créer une organisation avec succès', async () => {
      // Mock de la réponse Supabase
      const mockOrganization = {
        id: 'org-123',
        name: 'Test Organization',
        description: 'Description de test',
        owner_id: 'user-123',
        is_active: true,
        settings: { allowPasswordSharing: true, allowDocumentSharing: true },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      (supabase.from as jest.Mock).mockReturnThis();
      (supabase.insert as jest.Mock).mockReturnThis();
      (supabase.select as jest.Mock).mockReturnThis();
      (supabase.single as jest.Mock).mockResolvedValue({
        data: mockOrganization,
        error: null
      });

      // Exécuter la méthode
      const result = await OrganizationService.createOrganization('user-123', {
        name: 'Test Organization',
        description: 'Description de test',
        settings: {
          allowPasswordSharing: true,
          allowDocumentSharing: true
        }
      });

      // Vérifier les résultats
      expect(result).toBeDefined();
      expect(result.id).toBe('org-123');
      expect(result.name).toBe('Test Organization');
      expect(result.ownerId).toBe('user-123');
      expect(supabase.from).toHaveBeenCalledWith('organizations');
      expect(supabase.insert).toHaveBeenCalled();
    });

    it('devrait lever une erreur si la création échoue', async () => {
      // Mock d'une erreur Supabase
      (supabase.from as jest.Mock).mockReturnThis();
      (supabase.insert as jest.Mock).mockReturnThis();
      (supabase.select as jest.Mock).mockReturnThis();
      (supabase.single as jest.Mock).mockResolvedValue({
        data: null,
        error: { message: 'Erreur de création' }
      });

      // Vérifier que l'erreur est levée
      await expect(OrganizationService.createOrganization('user-123', {
        name: 'Test Organization'
      })).rejects.toThrow(AppError);
    });
  });

  // Test de récupération des organisations d'un utilisateur
  describe('getUserOrganizations', () => {
    it('devrait récupérer les organisations d\'un utilisateur', async () => {
      // Mock de la réponse Supabase
      const mockOrganizations = [
        {
          id: 'org-1',
          name: 'Org 1',
          description: 'Description 1',
          owner_id: 'user-123',
          is_active: true,
          settings: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'org-2',
          name: 'Org 2',
          description: 'Description 2',
          owner_id: 'other-user',
          is_active: true,
          settings: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];

      (supabase.from as jest.Mock).mockReturnThis();
      (supabase.select as jest.Mock).mockReturnThis();
      (supabase.eq as jest.Mock).mockReturnThis();
      (supabase.is as jest.Mock).mockReturnThis();
      (supabase.order as jest.Mock).mockResolvedValue({
        data: mockOrganizations,
        error: null
      });

      // Exécuter la méthode
      const result = await OrganizationService.getUserOrganizations('user-123');

      // Vérifier les résultats
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('org-1');
      expect(result[1].id).toBe('org-2');
      expect(supabase.from).toHaveBeenCalledWith('organizations');
    });

    it('devrait renvoyer un tableau vide en cas d\'erreur', async () => {
      // Mock d'une erreur Supabase
      (supabase.from as jest.Mock).mockReturnThis();
      (supabase.select as jest.Mock).mockReturnThis();
      (supabase.eq as jest.Mock).mockReturnThis();
      (supabase.is as jest.Mock).mockReturnThis();
      (supabase.order as jest.Mock).mockResolvedValue({
        data: null,
        error: { message: 'Erreur de récupération' }
      });

      // Exécuter la méthode
      const result = await OrganizationService.getUserOrganizations('user-123');

      // Vérifier les résultats
      expect(result).toEqual([]);
    });
  });

  // Test de récupération d'une organisation par ID
  describe('getOrganizationById', () => {
    it('devrait récupérer une organisation par ID avec succès', async () => {
      // Mock de la réponse Supabase
      const mockOrganization = {
        id: 'org-123',
        name: 'Test Organization',
        description: 'Description de test',
        owner_id: 'user-123',
        is_active: true,
        settings: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      (supabase.from as jest.Mock).mockReturnThis();
      (supabase.select as jest.Mock).mockReturnThis();
      (supabase.eq as jest.Mock).mockReturnThis();
      (supabase.single as jest.Mock).mockResolvedValue({
        data: mockOrganization,
        error: null
      });

      // Mock de la vérification de permission
      jest.spyOn(OrganizationService, 'checkUserPermission').mockResolvedValue({
        hasPermission: true,
        role: 'admin'
      });

      // Exécuter la méthode
      const result = await OrganizationService.getOrganizationById('org-123', 'user-123');

      // Vérifier les résultats
      expect(result).toBeDefined();
      expect(result.id).toBe('org-123');
      expect(result.name).toBe('Test Organization');
      expect(OrganizationService.checkUserPermission).toHaveBeenCalledWith('org-123', 'user-123');
    });

    it('devrait lever une erreur si l\'utilisateur n\'a pas les permissions nécessaires', async () => {
      // Mock de la vérification de permission qui échoue
      jest.spyOn(OrganizationService, 'checkUserPermission').mockResolvedValue({
        hasPermission: false,
        role: ''
      });

      // Vérifier que l'erreur est levée
      await expect(OrganizationService.getOrganizationById('org-123', 'user-456')).rejects.toThrow(AppError);
    });
  });

  // Test de vérification d'appartenance à une organisation
  describe('isUserMemberOfOrganization', () => {
    it('devrait confirmer qu\'un utilisateur est membre d\'une organisation', async () => {
      // Mock de la réponse Supabase
      (supabase.from as jest.Mock).mockReturnThis();
      (supabase.select as jest.Mock).mockReturnThis();
      (supabase.eq as jest.Mock).mockReturnThis();
      (supabase.single as jest.Mock).mockResolvedValue({
        data: { id: 'member-1' },
        error: null
      });

      // Exécuter la méthode
      const result = await OrganizationService.isUserMemberOfOrganization('user-123', 'org-123');

      // Vérifier les résultats
      expect(result).toBe(true);
      expect(supabase.from).toHaveBeenCalledWith('organization_members');
    });

    it('devrait indiquer qu\'un utilisateur n\'est pas membre d\'une organisation', async () => {
      // Mock de la réponse Supabase (aucun membre trouvé)
      (supabase.from as jest.Mock).mockReturnThis();
      (supabase.select as jest.Mock).mockReturnThis();
      (supabase.eq as jest.Mock).mockReturnThis();
      (supabase.single as jest.Mock).mockResolvedValue({
        data: null,
        error: { message: 'Not found' }
      });

      // Exécuter la méthode
      const result = await OrganizationService.isUserMemberOfOrganization('user-456', 'org-123');

      // Vérifier les résultats
      expect(result).toBe(false);
    });
  });

  // Test de vérification des permissions
  describe('checkUserPermission', () => {
    it('devrait vérifier les permissions avec succès pour un admin', async () => {
      // Mock de la réponse Supabase
      (supabase.from as jest.Mock).mockReturnThis();
      (supabase.select as jest.Mock).mockReturnThis();
      (supabase.eq as jest.Mock).mockReturnThis();
      (supabase.single as jest.Mock).mockResolvedValue({
        data: { 
          id: 'member-1',
          user_id: 'user-123',
          organization_id: 'org-123',
          role: 'admin',
          is_active: true
        },
        error: null
      });

      // Exécuter la méthode
      const result = await OrganizationService.checkUserPermission('org-123', 'user-123', ['admin']);

      // Vérifier les résultats
      expect(result.hasPermission).toBe(true);
      expect(result.role).toBe('admin');
    });

    it('devrait refuser l\'accès si le rôle n\'est pas autorisé', async () => {
      // Mock de la réponse Supabase
      (supabase.from as jest.Mock).mockReturnThis();
      (supabase.select as jest.Mock).mockReturnThis();
      (supabase.eq as jest.Mock).mockReturnThis();
      (supabase.single as jest.Mock).mockResolvedValue({
        data: { 
          id: 'member-1',
          user_id: 'user-123',
          organization_id: 'org-123',
          role: 'viewer',
          is_active: true
        },
        error: null
      });

      // Exécuter la méthode
      const result = await OrganizationService.checkUserPermission('org-123', 'user-123', ['admin', 'manager']);

      // Vérifier les résultats
      expect(result.hasPermission).toBe(false);
      expect(result.role).toBe('viewer');
    });
  });
});
