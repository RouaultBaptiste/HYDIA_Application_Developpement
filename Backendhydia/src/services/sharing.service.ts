import { supabase } from '@/config/supabase';
import { PasswordService } from './password.service';
import { DocumentService } from './document.service';
import { OrganizationService } from './organization.service';
import { AppError } from '@/utils/errors';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { generateSecureToken } from '@/utils/crypto';

// Schémas de validation pour le partage
export const sharePasswordSchema = z.object({
  userId: z.string().uuid(),
  permissions: z.object({
    read: z.boolean().default(true),
    write: z.boolean().default(false),
    delete: z.boolean().default(false)
  }).default({ read: true, write: false, delete: false })
});

export const shareDocumentSchema = z.object({
  userId: z.string().uuid(),
  permissions: z.object({
    read: z.boolean().default(true),
    write: z.boolean().default(false),
    delete: z.boolean().default(false)
  }).default({ read: true, write: false, delete: false })
});

// Types pour le partage
export interface SharePermissions {
  read: boolean;
  write: boolean;
  delete: boolean;
}

export interface PasswordShare {
  id: string;
  passwordId: string;
  sharedBy: string;
  sharedWith: string;
  permissions: SharePermissions;
  createdAt: string;
  password?: any; // Détails du mot de passe si inclus
}

export interface DocumentShare {
  id: string;
  documentId: string;
  sharedBy: string;
  sharedWith: string;
  permissions: SharePermissions;
  createdAt: string;
  document?: any; // Détails du document si inclus
}

export interface ShareLink {
  id: string;
  resourceId: string;
  resourceType: 'password' | 'document';
  token: string;
  createdBy: string;
  expiresAt: string | null;
  accessCount: number | null;
  accessedCount: number;
  createdAt: string;
}

export class SharingService {
  /**
   * Partager un mot de passe avec un autre utilisateur
   */
  static async sharePassword(
    passwordId: string,
    organizationId: string,
    sharedBy: string,
    sharedWith: string,
    permissions: SharePermissions
  ): Promise<PasswordShare> {
    // Vérifier si le mot de passe existe et appartient à l'organisation
    const password = await PasswordService.getPasswordById(passwordId, organizationId, sharedBy);
    if (!password) {
      throw new AppError('Le mot de passe est introuvable', 404);
    }

    // Vérifier si l'utilisateur cible est membre de l'organisation
    const isMember = await OrganizationService.isUserMemberOfOrganization(sharedWith, organizationId);
    if (!isMember) {
      throw new AppError('L\'utilisateur cible n\'est pas membre de l\'organisation', 400);
    }

    // Vérifier si un partage existe déjà pour ce mot de passe avec cet utilisateur
    const { data: existingShare } = await supabase
      .from('password_shares')
      .select('*')
      .eq('password_id', passwordId)
      .eq('shared_with', sharedWith)
      .single();

    if (existingShare) {
      throw new AppError('Ce mot de passe est déjà partagé avec cet utilisateur', 400);
    }

    // Créer le partage
    const shareId = uuidv4();
    const shareData = {
      id: shareId,
      password_id: passwordId,
      shared_by: sharedBy,
      shared_with: sharedWith,
      permissions: permissions,
      organization_id: organizationId,
      created_at: new Date().toISOString()
    };

    const { data: share, error } = await supabase
      .from('password_shares')
      .insert(shareData)
      .select('*')
      .single();

    if (error || !share) {
      throw new AppError('Erreur lors de la création du partage', 500);
    }

    // Retourner le partage formaté
    return {
      id: share.id,
      passwordId: share.password_id,
      sharedBy: share.shared_by,
      sharedWith: share.shared_with,
      permissions: share.permissions,
      createdAt: share.created_at
    };
  }

  /**
   * Récupérer les mots de passe partagés par un utilisateur
   */
  static async getSharedPasswords(
    organizationId: string,
    userId: string
  ): Promise<PasswordShare[]> {
    // Récupérer les partages
    const { data: shares, error } = await supabase
      .from('password_shares')
      .select('*, passwords:password_id(*)')
      .eq('shared_by', userId)
      .eq('organization_id', organizationId);

    if (error) {
      throw new AppError('Erreur lors de la récupération des partages', 500);
    }

    if (!shares || shares.length === 0) {
      return [];
    }

    // Formater les partages
    return shares.map((share: any) => ({
      id: share.id,
      passwordId: share.password_id,
      sharedBy: share.shared_by,
      sharedWith: share.shared_with,
      permissions: share.permissions,
      createdAt: share.created_at,
      password: share.passwords ? {
        id: share.passwords.id,
        title: share.passwords.title,
        createdAt: share.passwords.created_at,
        updatedAt: share.passwords.updated_at,
      } : undefined
    }));
  }

  /**
   * Récupérer les mots de passe partagés avec un utilisateur
   */
  static async getPasswordsSharedWithUser(
    organizationId: string,
    userId: string
  ): Promise<PasswordShare[]> {
    // Récupérer les partages
    const { data: shares, error } = await supabase
      .from('password_shares')
      .select('*, passwords:password_id(*)')
      .eq('shared_with', userId)
      .eq('organization_id', organizationId);

    if (error) {
      throw new AppError('Erreur lors de la récupération des partages', 500);
    }

    if (!shares || shares.length === 0) {
      return [];
    }

    // Formater les partages
    return shares.map((share: any) => ({
      id: share.id,
      passwordId: share.password_id,
      sharedBy: share.shared_by,
      sharedWith: share.shared_with,
      permissions: share.permissions,
      createdAt: share.created_at,
      password: share.passwords ? {
        id: share.passwords.id,
        title: share.passwords.title,
        createdAt: share.passwords.created_at,
        updatedAt: share.passwords.updated_at,
      } : undefined
    }));
  }

  /**
   * Supprimer un partage de mot de passe
   */
  static async removePasswordShare(
    shareId: string,
    passwordId: string,
    organizationId: string,
    userId: string
  ): Promise<void> {
    // Vérifier si le partage existe
    const { data: share, error } = await supabase
      .from('password_shares')
      .select('*')
      .eq('id', shareId)
      .eq('password_id', passwordId)
      .eq('organization_id', organizationId)
      .single();

    if (error || !share) {
      throw new AppError('Le partage est introuvable', 404);
    }

    // Vérifier si l'utilisateur est autorisé à supprimer ce partage
    if (share.shared_by !== userId) {
      throw new AppError('Vous n\'êtes pas autorisé à supprimer ce partage', 403);
    }

    // Supprimer le partage
    const { error: deleteError } = await supabase
      .from('password_shares')
      .delete()
      .eq('id', shareId);

    if (deleteError) {
      throw new AppError('Erreur lors de la suppression du partage', 500);
    }
  }

  /**
   * Partager un document avec un autre utilisateur
   */
  static async shareDocument(
    documentId: string,
    organizationId: string,
    sharedBy: string,
    sharedWith: string,
    permissions: SharePermissions
  ): Promise<DocumentShare> {
    // Vérifier si le document existe et appartient à l'organisation
    const document = await DocumentService.getDocumentById(documentId, organizationId, sharedBy);
    if (!document) {
      throw new AppError('Le document est introuvable', 404);
    }

    // Vérifier si l'utilisateur cible est membre de l'organisation
    const isMember = await OrganizationService.isUserMemberOfOrganization(sharedWith, organizationId);
    if (!isMember) {
      throw new AppError('L\'utilisateur cible n\'est pas membre de l\'organisation', 400);
    }

    // Vérifier si un partage existe déjà pour ce document avec cet utilisateur
    const { data: existingShare } = await supabase
      .from('document_shares')
      .select('*')
      .eq('document_id', documentId)
      .eq('shared_with', sharedWith)
      .single();

    if (existingShare) {
      throw new AppError('Ce document est déjà partagé avec cet utilisateur', 400);
    }

    // Créer le partage
    const shareId = uuidv4();
    const shareData = {
      id: shareId,
      document_id: documentId,
      shared_by: sharedBy,
      shared_with: sharedWith,
      permissions: permissions,
      organization_id: organizationId,
      created_at: new Date().toISOString()
    };

    const { data: share, error } = await supabase
      .from('document_shares')
      .insert(shareData)
      .select('*')
      .single();

    if (error || !share) {
      throw new AppError('Erreur lors de la création du partage', 500);
    }

    // Retourner le partage formaté
    return {
      id: share.id,
      documentId: share.document_id,
      sharedBy: share.shared_by,
      sharedWith: share.shared_with,
      permissions: share.permissions,
      createdAt: share.created_at
    };
  }

  /**
   * Récupérer les documents partagés par un utilisateur
   */
  static async getSharedDocuments(
    organizationId: string,
    userId: string
  ): Promise<DocumentShare[]> {
    // Récupérer les partages
    const { data: shares, error } = await supabase
      .from('document_shares')
      .select('*, documents:document_id(*)')
      .eq('shared_by', userId)
      .eq('organization_id', organizationId);

    if (error) {
      throw new AppError('Erreur lors de la récupération des partages', 500);
    }

    if (!shares || shares.length === 0) {
      return [];
    }

    // Formater les partages
    return shares.map((share: any) => ({
      id: share.id,
      documentId: share.document_id,
      sharedBy: share.shared_by,
      sharedWith: share.shared_with,
      permissions: share.permissions,
      createdAt: share.created_at,
      document: share.documents ? {
        id: share.documents.id,
        title: share.documents.title,
        filename: share.documents.filename,
        createdAt: share.documents.created_at,
        updatedAt: share.documents.updated_at,
      } : undefined
    }));
  }

  /**
   * Récupérer les documents partagés avec un utilisateur
   */
  static async getDocumentsSharedWithUser(
    organizationId: string,
    userId: string
  ): Promise<DocumentShare[]> {
    // Récupérer les partages
    const { data: shares, error } = await supabase
      .from('document_shares')
      .select('*, documents:document_id(*)')
      .eq('shared_with', userId)
      .eq('organization_id', organizationId);

    if (error) {
      throw new AppError('Erreur lors de la récupération des partages', 500);
    }

    if (!shares || shares.length === 0) {
      return [];
    }

    // Formater les partages
    return shares.map((share: any) => ({
      id: share.id,
      documentId: share.document_id,
      sharedBy: share.shared_by,
      sharedWith: share.shared_with,
      permissions: share.permissions,
      createdAt: share.created_at,
      document: share.documents ? {
        id: share.documents.id,
        title: share.documents.title,
        filename: share.documents.filename,
        createdAt: share.documents.created_at,
        updatedAt: share.documents.updated_at,
      } : undefined
    }));
  }

  /**
   * Supprimer un partage de document
   */
  static async removeDocumentShare(
    shareId: string,
    documentId: string,
    organizationId: string,
    userId: string
  ): Promise<void> {
    // Vérifier si le partage existe
    const { data: share, error } = await supabase
      .from('document_shares')
      .select('*')
      .eq('id', shareId)
      .eq('document_id', documentId)
      .eq('organization_id', organizationId)
      .single();

    if (error || !share) {
      throw new AppError('Le partage est introuvable', 404);
    }

    // Vérifier si l'utilisateur est autorisé à supprimer ce partage
    if (share.shared_by !== userId) {
      throw new AppError('Vous n\'êtes pas autorisé à supprimer ce partage', 403);
    }

    // Supprimer le partage
    const { error: deleteError } = await supabase
      .from('document_shares')
      .delete()
      .eq('id', shareId);

    if (deleteError) {
      throw new AppError('Erreur lors de la suppression du partage', 500);
    }
  }

  /**
   * Créer un lien de partage pour un mot de passe
   */
  static async createPasswordShareLink(
    passwordId: string,
    organizationId: string,
    createdBy: string,
    expiresAt?: string,
    accessCount?: number
  ): Promise<ShareLink> {
    // Vérifier si le mot de passe existe et appartient à l'organisation
    const password = await PasswordService.getPasswordById(passwordId, organizationId, createdBy);
    if (!password) {
      throw new AppError('Le mot de passe est introuvable', 404);
    }

    // Générer un token sécurisé pour le lien
    const token = generateSecureToken();
    
    // Créer le lien
    const linkId = uuidv4();
    const linkData = {
      id: linkId,
      resource_id: passwordId,
      resource_type: 'password',
      token: token,
      created_by: createdBy,
      organization_id: organizationId,
      expires_at: expiresAt || null,
      access_count: accessCount || null,
      accessed_count: 0,
      created_at: new Date().toISOString()
    };

    const { data: link, error } = await supabase
      .from('share_links')
      .insert(linkData)
      .select('*')
      .single();

    if (error || !link) {
      throw new AppError('Erreur lors de la création du lien de partage', 500);
    }

    // Retourner le lien formaté
    return {
      id: link.id,
      resourceId: link.resource_id,
      resourceType: link.resource_type as 'password' | 'document',
      token: link.token,
      createdBy: link.created_by,
      expiresAt: link.expires_at,
      accessCount: link.access_count,
      accessedCount: link.accessed_count,
      createdAt: link.created_at
    };
  }

  /**
   * Créer un lien de partage pour un document
   */
  static async createDocumentShareLink(
    documentId: string,
    organizationId: string,
    createdBy: string,
    expiresAt?: string,
    accessCount?: number
  ): Promise<ShareLink> {
    // Vérifier si le document existe et appartient à l'organisation
    const document = await DocumentService.getDocumentById(documentId, organizationId, createdBy);
    if (!document) {
      throw new AppError('Le document est introuvable', 404);
    }

    // Générer un token sécurisé pour le lien
    const token = generateSecureToken();
    
    // Créer le lien
    const linkId = uuidv4();
    const linkData = {
      id: linkId,
      resource_id: documentId,
      resource_type: 'document',
      token: token,
      created_by: createdBy,
      organization_id: organizationId,
      expires_at: expiresAt || null,
      access_count: accessCount || null,
      accessed_count: 0,
      created_at: new Date().toISOString()
    };

    const { data: link, error } = await supabase
      .from('share_links')
      .insert(linkData)
      .select('*')
      .single();

    if (error || !link) {
      throw new AppError('Erreur lors de la création du lien de partage', 500);
    }

    // Retourner le lien formaté
    return {
      id: link.id,
      resourceId: link.resource_id,
      resourceType: link.resource_type as 'password' | 'document',
      token: link.token,
      createdBy: link.created_by,
      expiresAt: link.expires_at,
      accessCount: link.access_count,
      accessedCount: link.accessed_count,
      createdAt: link.created_at
    };
  }

  /**
   * Récupérer les liens de partage créés par un utilisateur
   */
  static async getMyShareLinks(
    organizationId: string,
    userId: string
  ): Promise<ShareLink[]> {
    // Récupérer les liens
    const { data: links, error } = await supabase
      .from('share_links')
      .select('*')
      .eq('created_by', userId)
      .eq('organization_id', organizationId);

    if (error) {
      throw new AppError('Erreur lors de la récupération des liens de partage', 500);
    }

    if (!links || links.length === 0) {
      return [];
    }

    // Formater les liens
    return links.map((link: any) => ({
      id: link.id,
      resourceId: link.resource_id,
      resourceType: link.resource_type as 'password' | 'document',
      token: link.token,
      createdBy: link.created_by,
      expiresAt: link.expires_at,
      accessCount: link.access_count,
      accessedCount: link.accessed_count,
      createdAt: link.created_at
    }));
  }

  /**
   * Supprimer un lien de partage
   */
  static async deleteShareLink(
    linkId: string,
    organizationId: string,
    userId: string
  ): Promise<void> {
    // Vérifier si le lien existe
    const { data: link, error } = await supabase
      .from('share_links')
      .select('*')
      .eq('id', linkId)
      .eq('organization_id', organizationId)
      .single();

    if (error || !link) {
      throw new AppError('Le lien de partage est introuvable', 404);
    }

    // Vérifier si l'utilisateur est autorisé à supprimer ce lien
    if (link.created_by !== userId) {
      throw new AppError('Vous n\'êtes pas autorisé à supprimer ce lien de partage', 403);
    }

    // Supprimer le lien
    const { error: deleteError } = await supabase
      .from('share_links')
      .delete()
      .eq('id', linkId);

    if (deleteError) {
      throw new AppError('Erreur lors de la suppression du lien de partage', 500);
    }
  }
}
