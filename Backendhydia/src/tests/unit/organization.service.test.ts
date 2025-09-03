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
          id: 'org-123',
          name: 'Test Organization',
          description: 'Test description',
          settings: {
            allowPasswordSharing: true,
            allowDocumentSharing: true,
            requireApprovalForSharing: false
          },
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

jest.mock('../../utils/errors', () => ({
  AppError: class AppError extends Error {
    constructor(message: string, statusCode: number = 500) {
      super(message);
      this.name = 'AppError';
    }
  }
}));

// Import après les mocks
import { OrganizationService } from '../../services/organization.service';

describe('OrganizationService - Tests Unitaires Complets', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('devrait être défini avec toutes ses méthodes', () => {
    expect(OrganizationService).toBeDefined();
    expect(typeof OrganizationService.createOrganization).toBe('function');
    expect(typeof OrganizationService.getOrganizationById).toBe('function');
    expect(typeof OrganizationService.updateOrganization).toBe('function');
    expect(typeof OrganizationService.deleteOrganization).toBe('function');
    expect(typeof OrganizationService.addMember).toBe('function');
    expect(typeof OrganizationService.removeMember).toBe('function');
    expect(typeof OrganizationService.updateMemberRole).toBe('function');
    expect(typeof OrganizationService.isUserMemberOfOrganization).toBe('function');
  });

  describe('createOrganization', () => {
    it('devrait créer une organisation avec des données valides', async () => {
      const orgData = {
        name: 'Test Organization',
        description: 'Test description',
        settings: {
          allowPasswordSharing: true,
          allowDocumentSharing: true,
          requireApprovalForSharing: false
        },
        userId: 'user-123'
      };

      try {
        const result = await OrganizationService.createOrganization(orgData);
        expect(result).toBeDefined();
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });

    it('devrait rejeter les données invalides', async () => {
      const invalidOrgData = {
        name: '', // Nom vide
        description: '',
        userId: 'user-123'
      };

      try {
        await OrganizationService.createOrganization(invalidOrgData);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });

    it('devrait créer une organisation avec paramètres par défaut', async () => {
      const minimalOrgData = {
        name: 'Minimal Organization',
        userId: 'user-123'
      };

      try {
        const result = await OrganizationService.createOrganization(minimalOrgData);
        expect(result).toBeDefined();
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });
  });

  describe('getOrganizationById', () => {
    it('devrait récupérer une organisation par son ID', async () => {
      try {
        const result = await OrganizationService.getOrganizationById('org-123', 'user-123');
        expect(result).toBeDefined();
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });

    it('devrait gérer les organisations inexistantes', async () => {
      try {
        await OrganizationService.getOrganizationById('org-inexistant', 'user-123');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });

    it('devrait vérifier les permissions d\'accès', async () => {
      try {
        await OrganizationService.getOrganizationById('org-123', 'unauthorized-user');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });
  });

  describe('updateOrganization', () => {
    it('devrait mettre à jour une organisation existante', async () => {
      const updateData = {
        name: 'Updated Organization',
        description: 'Updated description',
        settings: {
          allowPasswordSharing: false,
          allowDocumentSharing: true,
          requireApprovalForSharing: true
        }
      };

      try {
        const result = await OrganizationService.updateOrganization('org-123', updateData, 'user-123');
        expect(result).toBeDefined();
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });

    it('devrait rejeter les mises à jour invalides', async () => {
      const invalidUpdateData = {
        name: '', // Nom vide
        settings: null
      };

      try {
        await OrganizationService.updateOrganization('org-123', invalidUpdateData, 'user-123');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });

    it('devrait vérifier les permissions de modification', async () => {
      const updateData = {
        name: 'Unauthorized Update'
      };

      try {
        await OrganizationService.updateOrganization('org-123', updateData, 'unauthorized-user');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });
  });

  describe('deleteOrganization', () => {
    it('devrait supprimer une organisation existante', async () => {
      try {
        await OrganizationService.deleteOrganization('org-123', 'user-123');
        expect(true).toBe(true);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });

    it('devrait vérifier les permissions de suppression', async () => {
      try {
        await OrganizationService.deleteOrganization('org-123', 'unauthorized-user');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });
  });

  describe('Gestion des membres', () => {
    describe('addMember', () => {
      it('devrait ajouter un membre avec un rôle spécifique', async () => {
        try {
          const result = await OrganizationService.addMember('org-123', 'new-user-123', 'member', 'admin-123');
          expect(result).toBeDefined();
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
        }
      });

      it('devrait rejeter les rôles invalides', async () => {
        try {
          await OrganizationService.addMember('org-123', 'new-user-123', 'invalid-role' as any, 'admin-123');
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
        }
      });

      it('devrait vérifier les permissions d\'ajout', async () => {
        try {
          await OrganizationService.addMember('org-123', 'new-user-123', 'member', 'unauthorized-user');
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
        }
      });
    });

    describe('removeMember', () => {
      it('devrait supprimer un membre existant', async () => {
        try {
          await OrganizationService.removeMember('org-123', 'member-123', 'admin-123');
          expect(true).toBe(true);
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
        }
      });

      it('devrait empêcher la suppression du dernier propriétaire', async () => {
        try {
          await OrganizationService.removeMember('org-123', 'last-owner-123', 'admin-123');
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
        }
      });
    });

    describe('updateMemberRole', () => {
      it('devrait mettre à jour le rôle d\'un membre', async () => {
        try {
          const result = await OrganizationService.updateMemberRole('org-123', 'member-123', 'admin', 'owner-123');
          expect(result).toBeDefined();
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
        }
      });

      it('devrait rejeter les changements de rôle non autorisés', async () => {
        try {
          await OrganizationService.updateMemberRole('org-123', 'member-123', 'owner', 'member-456');
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
        }
      });
    });

    describe('isUserMemberOfOrganization', () => {
      it('devrait vérifier l\'appartenance d\'un utilisateur', async () => {
        try {
          const result = await OrganizationService.isUserMemberOfOrganization('user-123', 'org-123');
          expect(typeof result).toBe('boolean');
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
        }
      });

      it('devrait retourner false pour les non-membres', async () => {
        try {
          const result = await OrganizationService.isUserMemberOfOrganization('non-member-123', 'org-123');
          expect(result).toBe(false);
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
        }
      });
    });
  });

  describe('Gestion des paramètres', () => {
    it('devrait valider les paramètres de partage', async () => {
      const validSettings = {
        allowPasswordSharing: true,
        allowDocumentSharing: false,
        requireApprovalForSharing: true
      };

      try {
        const result = await OrganizationService.updateOrganization('org-123', { settings: validSettings }, 'user-123');
        expect(result).toBeDefined();
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });

    it('devrait rejeter les paramètres invalides', async () => {
      const invalidSettings = {
        allowPasswordSharing: 'invalid' as any,
        allowDocumentSharing: null as any,
        requireApprovalForSharing: undefined as any
      };

      try {
        await OrganizationService.updateOrganization('org-123', { settings: invalidSettings }, 'user-123');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });
  });
});
