import { supabase } from '../config/supabase';
import { logger } from '../utils/logger';
import { AppError, ValidationError } from '../utils/errors';
import { z } from 'zod';

// Schémas de validation
export const createOrganizationSchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  description: z.string().optional(),
  settings: z.object({
    allowPasswordSharing: z.boolean().default(true),
    allowDocumentSharing: z.boolean().default(true),
    requireMFA: z.boolean().default(false),
    passwordPolicy: z.object({
      minLength: z.number().min(8).default(12),
      requireUppercase: z.boolean().default(true),
      requireLowercase: z.boolean().default(true),
      requireNumbers: z.boolean().default(true),
      requireSymbols: z.boolean().default(true),
    }).optional(),
  }).optional(),
});

export const inviteMemberSchema = z.object({
  email: z.string().email('Email invalide'),
  role: z.enum(['admin', 'manager', 'user', 'viewer']),
});

export const updateMemberRoleSchema = z.object({
  role: z.enum(['admin', 'manager', 'user', 'viewer']),
});

export interface Organization {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  isActive: boolean;
  settings: any;
  createdAt: string;
  updatedAt: string;
  memberCount?: number;
  owner?: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
}

export interface OrganizationMember {
  id: string;
  organizationId: string;
  userId: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    avatarUrl?: string;
    lastLogin?: string;
  };
}

export class OrganizationService {
  /**
   * Créer une nouvelle organisation
   */
  static async createOrganization(
    ownerId: string,
    organizationData: z.infer<typeof createOrganizationSchema>
  ): Promise<Organization> {
    try {
      const validatedData = createOrganizationSchema.parse(organizationData);

      // Créer l'organisation avec les colonnes de base
      const { data: organization, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: validatedData.name,
          description: validatedData.description,
          settings: validatedData.settings || {},
        })
        .select()
        .single();

      if (orgError || !organization) {
        logger.error('Erreur lors de la création de l\'organisation:', orgError);
        throw new AppError('Erreur lors de la création de l\'organisation', 500);
      }

      // Essayer de mettre à jour avec owner_id si la colonne existe
      try {
        await supabase
          .from('organizations')
          .update({ owner_id: ownerId })
          .eq('id', organization.id);
      } catch (updateError) {
        // Ignorer l'erreur si la colonne owner_id n'existe pas
        logger.warn('Impossible de définir owner_id, colonne peut-être manquante:', updateError);
      }

      // Ajouter le propriétaire comme membre admin
      const { error: memberError } = await supabase
        .from('organization_members')
        .insert({
          organization_id: organization.id,
          user_id: ownerId,
          role: 'admin',
        });

      if (memberError) {
        logger.error('Erreur lors de l\'ajout du propriétaire comme membre:', memberError);
        // Supprimer l'organisation créée en cas d'erreur
        await supabase.from('organizations').delete().eq('id', organization.id);
        throw new AppError('Erreur lors de la création de l\'organisation', 500);
      }

      logger.info(`Organisation créée: ${organization.name} par ${ownerId}`);

      return {
        id: organization.id,
        name: organization.name,
        description: organization.description,
        ownerId: ownerId, // Utiliser l'ownerId passé en paramètre
        isActive: true, // Par défaut, les organisations sont actives
        settings: organization.settings,
        createdAt: organization.created_at,
        updatedAt: organization.updated_at,
        memberCount: 1,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Erreur lors de la création de l\'organisation:', error);
      throw new AppError('Erreur interne du serveur', 500);
    }
  }

  /**
   * Récupérer les organisations d'un utilisateur
   */
  static async getUserOrganizations(userId: string): Promise<Organization[]> {
    try {
      const { data: memberships, error } = await supabase
        .from('organization_members')
        .select('organization_id, role')
        .eq('user_id', userId);

      if (error) {
        logger.error('Erreur lors de la récupération des organisations:', error);
        throw new AppError('Erreur lors de la récupération des organisations', 500);
      }

      // Récupérer les détails des organisations pour chaque membership
      const organizationsWithCount = await Promise.all(
        memberships.map(async (membership: any) => {
          // Récupérer les détails de l'organisation
          const { data: org, error: orgError } = await supabase
            .from('organizations')
            .select('*')
            .eq('id', membership.organization_id)
            .single();

          if (orgError || !org) {
            logger.warn(`Organisation ${membership.organization_id} non trouvée`);
            return null;
          }

          // Compter les membres
          const { count } = await supabase
            .from('organization_members')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', org.id);

          return {
            id: org.id,
            name: org.name,
            description: org.description,
            ownerId: userId, // Utiliser l'utilisateur actuel comme propriétaire par défaut
            isActive: true, // Par défaut actif
            settings: org.settings,
            createdAt: org.created_at,
            updatedAt: org.updated_at,
            memberCount: count || 0,
            owner: undefined, // Pas de propriétaire défini
          };
        })
      );

      // Filtrer les organisations nulles
      return organizationsWithCount.filter(org => org !== null);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Erreur lors de la récupération des organisations:', error);
      throw new AppError('Erreur interne du serveur', 500);
    }
  }

  /**
   * Récupérer une organisation par ID
   */
  static async getOrganizationById(organizationId: string, userId: string): Promise<Organization> {
    try {
      // Vérifier que l'utilisateur est membre de l'organisation
      const { data: membership } = await supabase
        .from('organization_members')
        .select('role')
        .eq('organization_id', organizationId)
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (!membership) {
        throw new AppError('Accès non autorisé à cette organisation', 403);
      }

      const { data: organization, error } = await supabase
        .from('organizations')
        .select(`
          *,
          profiles!organizations_owner_id_fkey (
            id,
            email,
            first_name,
            last_name
          )
        `)
        .eq('id', organizationId)
        .eq('is_active', true)
        .single();

      if (error || !organization) {
        throw new AppError('Organisation non trouvée', 404);
      }

      // Compter les membres
      const { count } = await supabase
        .from('organization_members')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .eq('is_active', true);

      return {
        id: organization.id,
        name: organization.name,
        description: organization.description,
        ownerId: organization.owner_id,
        isActive: organization.is_active,
        settings: organization.settings,
        createdAt: organization.created_at,
        updatedAt: organization.updated_at,
        memberCount: count || 0,
        owner: {
          id: organization.profiles.id,
          email: organization.profiles.email,
          firstName: organization.profiles.first_name,
          lastName: organization.profiles.last_name,
        },
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Erreur lors de la récupération de l\'organisation:', error);
      throw new AppError('Erreur interne du serveur', 500);
    }
  }

  /**
   * Mettre à jour une organisation
   */
  static async updateOrganization(
    organizationId: string,
    userId: string,
    updates: Partial<z.infer<typeof createOrganizationSchema>>
  ): Promise<Organization> {
    try {
      // Vérifier que l'utilisateur est admin ou propriétaire
      const { data: membership } = await supabase
        .from('organization_members')
        .select('role')
        .eq('organization_id', organizationId)
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (!membership || !['admin', 'owner'].includes(membership.role)) {
        throw new AppError('Permissions insuffisantes', 403);
      }

      const { data: organization, error } = await supabase
        .from('organizations')
        .update({
          name: updates.name,
          description: updates.description,
          settings: updates.settings,
          updated_at: new Date().toISOString(),
        })
        .eq('id', organizationId)
        .select()
        .single();

      if (error || !organization) {
        throw new AppError('Erreur lors de la mise à jour de l\'organisation', 500);
      }

      return {
        id: organization.id,
        name: organization.name,
        description: organization.description,
        ownerId: organization.owner_id,
        isActive: organization.is_active,
        settings: organization.settings,
        createdAt: organization.created_at,
        updatedAt: organization.updated_at,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Erreur lors de la mise à jour de l\'organisation:', error);
      throw new AppError('Erreur interne du serveur', 500);
    }
  }

  /**
   * Inviter un membre dans l'organisation
   */
  static async inviteMember(
    organizationId: string,
    inviterId: string,
    inviteData: z.infer<typeof inviteMemberSchema>
  ): Promise<void> {
    try {
      const validatedData = inviteMemberSchema.parse(inviteData);

      // Vérifier les permissions de l'inviteur
      const { data: inviterMembership } = await supabase
        .from('organization_members')
        .select('role')
        .eq('organization_id', organizationId)
        .eq('user_id', inviterId)
        .eq('is_active', true)
        .single();

      if (!inviterMembership || !['admin', 'manager'].includes(inviterMembership.role)) {
        throw new AppError('Permissions insuffisantes pour inviter des membres', 403);
      }

      // Vérifier si l'utilisateur à inviter existe
      const { data: userToInvite } = await supabase
        .from('users')
        .select('id')
        .eq('email', validatedData.email)
        .eq('is_active', true)
        .single();

      if (!userToInvite) {
        throw new AppError('Utilisateur non trouvé', 404);
      }

      // Vérifier si l'utilisateur n'est pas déjà membre
      const { data: existingMembership } = await supabase
        .from('organization_members')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('user_id', userToInvite.id)
        .single();

      if (existingMembership) {
        throw new AppError('L\'utilisateur est déjà membre de cette organisation', 409);
      }

      // Ajouter le membre
      const { error } = await supabase
        .from('organization_members')
        .insert({
          organization_id: organizationId,
          user_id: userToInvite.id,
          role: validatedData.role,
          is_active: true,
        });

      if (error) {
        logger.error('Erreur lors de l\'ajout du membre:', error);
        throw new AppError('Erreur lors de l\'ajout du membre', 500);
      }

      logger.info(`Membre ajouté à l'organisation ${organizationId}: ${validatedData.email}`);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Erreur lors de l\'invitation du membre:', error);
      throw new AppError('Erreur interne du serveur', 500);
    }
  }

  /**
   * Récupérer les membres d'une organisation
   */
  static async getOrganizationMembers(organizationId: string, userId: string): Promise<OrganizationMember[]> {
    try {
      // Vérifier que l'utilisateur est membre de l'organisation
      const { data: membership } = await supabase
        .from('organization_members')
        .select('role')
        .eq('organization_id', organizationId)
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (!membership) {
        throw new AppError('Accès non autorisé à cette organisation', 403);
      }

      const { data: members, error } = await supabase
        .from('organization_members')
        .select(`
          id,
          organization_id,
          user_id,
          role,
          is_active,
          created_at,
          updated_at,
          profiles!organization_members_user_id_fkey (
            id,
            email,
            first_name,
            last_name,
            avatar_url,
            last_login
          )
        `)
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (error) {
        logger.error('Erreur lors de la récupération des membres:', error);
        throw new AppError('Erreur lors de la récupération des membres', 500);
      }

      return members.map((member: any) => ({
        id: member.id,
        organizationId: member.organization_id,
        userId: member.user_id,
        role: member.role,
        isActive: member.is_active,
        createdAt: member.created_at,
        updatedAt: member.updated_at,
        user: {
          id: member.profiles.id,
          email: member.profiles.email,
          firstName: member.profiles.first_name,
          lastName: member.profiles.last_name,
          avatarUrl: member.profiles.avatar_url,
          lastLogin: member.profiles.last_login,
        },
      }));
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Erreur lors de la récupération des membres:', error);
      throw new AppError('Erreur interne du serveur', 500);
    }
  }

  /**
   * Mettre à jour le rôle d'un membre
   */
  static async updateMemberRole(
    organizationId: string,
    memberId: string,
    updaterId: string,
    roleData: z.infer<typeof updateMemberRoleSchema>
  ): Promise<void> {
    try {
      const validatedData = updateMemberRoleSchema.parse(roleData);

      // Vérifier les permissions de l'updater
      const { data: updaterMembership } = await supabase
        .from('organization_members')
        .select('role')
        .eq('organization_id', organizationId)
        .eq('user_id', updaterId)
        .eq('is_active', true)
        .single();

      if (!updaterMembership || updaterMembership.role !== 'admin') {
        throw new AppError('Permissions insuffisantes', 403);
      }

      // Mettre à jour le rôle
      const { error } = await supabase
        .from('organization_members')
        .update({
          role: validatedData.role,
          updated_at: new Date().toISOString(),
        })
        .eq('id', memberId)
        .eq('organization_id', organizationId);

      if (error) {
        logger.error('Erreur lors de la mise à jour du rôle:', error);
        throw new AppError('Erreur lors de la mise à jour du rôle', 500);
      }

      logger.info(`Rôle mis à jour pour le membre ${memberId}: ${validatedData.role}`);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Erreur lors de la mise à jour du rôle:', error);
      throw new AppError('Erreur interne du serveur', 500);
    }
  }

  /**
   * Supprimer un membre de l'organisation
   */
  static async removeMember(organizationId: string, memberId: string, removerId: string): Promise<void> {
    try {
      // Vérifier les permissions du remover
      const { data: removerMembership } = await supabase
        .from('organization_members')
        .select('role')
        .eq('organization_id', organizationId)
        .eq('user_id', removerId)
        .eq('is_active', true)
        .single();

      if (!removerMembership || !['admin', 'manager'].includes(removerMembership.role)) {
        throw new AppError('Permissions insuffisantes', 403);
      }

      // Désactiver le membre (soft delete)
      const { error } = await supabase
        .from('organization_members')
        .update({
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', memberId)
        .eq('organization_id', organizationId);

      if (error) {
        logger.error('Erreur lors de la suppression du membre:', error);
        throw new AppError('Erreur lors de la suppression du membre', 500);
      }

      logger.info(`Membre supprimé de l'organisation ${organizationId}: ${memberId}`);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Erreur lors de la suppression du membre:', error);
      throw new AppError('Erreur interne du serveur', 500);
    }
  }

  /**
   * Vérifier les permissions d'un utilisateur dans une organisation
   */
  /**
   * Vérifie si un utilisateur est membre d'une organisation
   * @param userId ID de l'utilisateur à vérifier
   * @param organizationId ID de l'organisation
   * @returns true si l'utilisateur est membre, false sinon
   */
  static async isUserMemberOfOrganization(
    userId: string,
    organizationId: string
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('organization_members')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        return false;
      }

      return true;
    } catch (error) {
      logger.error('Error checking organization membership:', error);
      return false;
    }
  }

  static async checkUserPermission(
    organizationId: string,
    userId: string,
    requiredRoles: string[] = ['admin', 'manager', 'user']
  ): Promise<{ hasPermission: boolean; role: string }> {
    try {
      logger.debug('Vérification des permissions utilisateur', {
        organizationId,
        userId,
        requiredRoles
      });

      const { data: membership, error } = await supabase
        .from('organization_members')
        .select('role')
        .eq('organization_id', organizationId)
        .eq('user_id', userId)
        .single();

      if (error) {
        logger.error('Erreur lors de la requête de membership:', error);
        return { hasPermission: false, role: '' };
      }

      if (!membership) {
        logger.warn('Aucun membership trouvé', { organizationId, userId });
        return { hasPermission: false, role: '' };
      }

      logger.debug('Membership trouvé', { 
        role: membership.role, 
        requiredRoles,
        hasPermission: requiredRoles.includes(membership.role)
      });

      // Ajouter "member" aux rôles autorisés par défaut
      const allValidRoles = [...requiredRoles, 'member'];

      return {
        hasPermission: allValidRoles.includes(membership.role),
        role: membership.role,
      };
    } catch (error) {
      logger.error('Erreur lors de la vérification des permissions:', error);
      return { hasPermission: false, role: '' };
    }
  }

  /**
   * Vérifie si un utilisateur a accès à une organisation
   * @param userId ID de l'utilisateur
   * @param organizationId ID de l'organisation
   * @returns true si l'utilisateur a accès, false sinon
   */
  static async checkUserAccess(userId: string, organizationId: string): Promise<boolean> {
    try {
      const { data: membership, error } = await supabase
        .from('organization_members')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (error || !membership) {
        return false;
      }

      return true;
    } catch (error) {
      logger.error('Erreur lors de la vérification d\'accès:', error);
      return false;
    }
  }

  /**
   * Récupère le rôle d'un utilisateur dans une organisation
   * @param userId ID de l'utilisateur
   * @param organizationId ID de l'organisation
   * @returns Le rôle de l'utilisateur ou null si pas de membership
   */
  static async getUserRole(userId: string, organizationId: string): Promise<string | null> {
    try {
      const { data: membership, error } = await supabase
        .from('organization_members')
        .select('role')
        .eq('organization_id', organizationId)
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (error || !membership) {
        return null;
      }

      return membership.role;
    } catch (error) {
      logger.error('Erreur lors de la récupération du rôle:', error);
      return null;
    }
  }
}
