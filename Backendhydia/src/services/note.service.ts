import { supabase } from '../config/supabase';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';
import { OrganizationService } from './organization.service';
import { z } from 'zod';

// Schémas de validation
export const createNoteSchema = z.object({
  title: z.string().min(1, 'Le titre est requis'),
  content: z.string().min(1, 'Le contenu est requis'),
  categoryId: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const updateNoteSchema = createNoteSchema.partial();

export const createNoteCategorySchema = z.object({
  name: z.string().min(1, 'Le nom de la catégorie est requis'),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Couleur invalide').optional(),
});

export interface Note {
  id: string;
  title: string;
  content: string;
  categoryId?: string;
  organizationId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
  tags?: string[];
  creator?: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
  category?: string;
}

export interface NoteCategory {
  id: string;
  name: string;
  description?: string;
  color?: string;
  organizationId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  noteCount?: number;
}

export class NoteService {
  /**
   * Créer une nouvelle note
   */
  static async createNote(
    organizationId: string,
    userId: string,
    noteData: z.infer<typeof createNoteSchema>
  ): Promise<Note> {
    try {
      const validatedData = createNoteSchema.parse(noteData);

      // Vérifier les permissions
      const { hasPermission } = await OrganizationService.checkUserPermission(
        organizationId,
        userId,
        ['owner', 'admin', 'manager', 'user']
      );

      if (!hasPermission) {
        throw new AppError('Permissions insuffisantes', 403);
      }

      // Créer la note
      const { data: note, error } = await supabase
        .from('notes')
        .insert({
          title: validatedData.title,
          content: validatedData.content,
          category: validatedData.categoryId,
          organization_id: organizationId,
          user_id: userId,
          is_deleted: false,
          
          tags: validatedData.tags,
        })
        .select('*')
        .single();

      if (error || !note) {
        logger.error('Erreur lors de la création de la note:', error);
        throw new AppError('Erreur lors de la création de la note', 500);
      }

      logger.info(`Note créée: ${note.title} par ${userId}`);

      return {
        id: note.id,
        title: note.title,
        content: note.content,
        categoryId: note.category,
        organizationId: note.organization_id,
        createdBy: note.user_id,
        createdAt: note.created_at,
        updatedAt: note.updated_at,
        isDeleted: note.is_deleted,
        tags: note.tags,
        creator: {
          id: note.user_id,
          email: 'user@example.com',
          firstName: 'User',
          lastName: 'Name',
        },
        category: note.category,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Erreur lors de la création de la note:', error);
      throw new AppError('Erreur interne du serveur', 500);
    }
  }

  /**
   * Récupérer les notes d'une organisation
   */
  static async getOrganizationNotes(
    organizationId: string,
    userId: string,
    categoryId?: string,
    includePrivate: boolean = false
  ): Promise<Note[]> {
    try {
      // Vérifier les permissions
      const { hasPermission } = await OrganizationService.checkUserPermission(
        organizationId,
        userId,
        ['owner', 'admin', 'manager', 'user', 'viewer']
      );

      if (!hasPermission) {
        throw new AppError('Permissions insuffisantes', 403);
      }

      let query = supabase
        .from('notes')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_deleted', false)
        .order('updated_at', { ascending: false });

      // Filtrer par catégorie si spécifiée
      if (categoryId) {
        query = query.eq('category', categoryId);
      }

      // Notes privées supprimées - toutes les notes sont publiques dans cette organisation

      const { data: notes, error } = await query;

      if (error) {
        logger.error('Erreur lors de la récupération des notes:', error);
        throw new AppError('Erreur lors de la récupération des notes', 500);
      }

      return notes.map((note: any) => ({
        id: note.id,
        title: note.title,
        content: note.content,
        categoryId: note.category,
        organizationId: note.organization_id,
        createdBy: note.user_id,
        createdAt: note.created_at,
        updatedAt: note.updated_at,
        isDeleted: note.is_deleted,
        tags: note.tags,
        creator: {
          id: note.user_id,
          email: 'user@example.com',
          firstName: 'User',
          lastName: 'Name',
        },
        category: note.category,
      }));
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Erreur lors de la récupération des notes:', error);
      throw new AppError('Erreur interne du serveur', 500);
    }
  }

  /**
   * Récupérer une note par ID
   */
  static async getNoteById(
    noteId: string,
    organizationId: string,
    userId: string
  ): Promise<Note> {
    try {
      // Vérifier les permissions
      const { hasPermission } = await OrganizationService.checkUserPermission(
        organizationId,
        userId,
        ['owner', 'admin', 'manager', 'user', 'viewer']
      );

      if (!hasPermission) {
        throw new AppError('Permissions insuffisantes', 403);
      }

      const { data: note, error } = await supabase
        .from('notes')
        .select('*')
        .eq('id', noteId)
        .eq('organization_id', organizationId)
        .eq('is_deleted', false)
        .single();

      if (error || !note) {
        throw new AppError('Note non trouvée', 404);
      }

      // Vérifier si l'utilisateur peut voir cette note privée
      if (note.is_private && note.created_by !== userId) {
        throw new AppError('Accès non autorisé à cette note', 403);
      }

      return {
        id: note.id,
        title: note.title,
        content: note.content,
        categoryId: note.category,
        organizationId: note.organization_id,
        createdBy: note.user_id,
        createdAt: note.created_at,
        updatedAt: note.updated_at,
        isDeleted: note.is_deleted,
        tags: note.tags,
        creator: {
          id: note.user_id,
          email: 'user@example.com',
          firstName: 'User',
          lastName: 'Name',
        },
        category: note.category,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Erreur lors de la récupération de la note:', error);
      throw new AppError('Erreur interne du serveur', 500);
    }
  }

  /**
   * Mettre à jour une note
   */
  static async updateNote(
    noteId: string,
    organizationId: string,
    userId: string,
    updates: z.infer<typeof updateNoteSchema>
  ): Promise<Note> {
    try {
      const validatedData = updateNoteSchema.parse(updates);

      // Vérifier les permissions
      const { hasPermission } = await OrganizationService.checkUserPermission(
        organizationId,
        userId,
        ['owner', 'admin', 'manager', 'user']
      );

      if (!hasPermission) {
        throw new AppError('Permissions insuffisantes', 403);
      }

      // Vérifier que la note existe et que l'utilisateur peut la modifier
      const { data: existingNote } = await supabase
        .from('notes')
        .select('created_by, is_private')
        .eq('id', noteId)
        .eq('organization_id', organizationId)
        .eq('is_deleted', false)
        .single();

      if (!existingNote) {
        throw new AppError('Note non trouvée', 404);
      }

      // Seul le créateur peut modifier une note privée
      if (existingNote.is_private && existingNote.created_by !== userId) {
        throw new AppError('Seul le créateur peut modifier cette note', 403);
      }

      // Préparer les données de mise à jour
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (validatedData.title !== undefined) updateData.title = validatedData.title;
      if (validatedData.content !== undefined) updateData.content = validatedData.content;
      if (validatedData.categoryId !== undefined) updateData.category = validatedData.categoryId;
      if (validatedData.tags !== undefined) updateData.tags = validatedData.tags;
      // isPrivate supprimé - toutes les notes sont publiques

      const { data: note, error } = await supabase
        .from('notes')
        .update(updateData)
        .eq('id', noteId)
        .eq('organization_id', organizationId)
        .select('*')
        .single();

      if (error || !note) {
        throw new AppError('Erreur lors de la mise à jour de la note', 500);
      }

      logger.info(`Note mise à jour: ${noteId} par ${userId}`);

      return {
        id: note.id,
        title: note.title,
        content: note.content,
        categoryId: note.category,
        organizationId: note.organization_id,
        createdBy: note.user_id,
        createdAt: note.created_at,
        updatedAt: note.updated_at,
        isDeleted: note.is_deleted,
        tags: note.tags,
        creator: {
          id: note.user_id,
          email: 'user@example.com',
          firstName: 'User',
          lastName: 'Name',
        },
        category: note.category,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Erreur lors de la mise à jour de la note:', error);
      throw new AppError('Erreur interne du serveur', 500);
    }
  }

  /**
   * Supprimer une note
   */
  static async deleteNote(
    noteId: string,
    organizationId: string,
    userId: string
  ): Promise<void> {
    try {
      // Vérifier les permissions
      const { hasPermission } = await OrganizationService.checkUserPermission(
        organizationId,
        userId,
        ['owner', 'admin', 'manager', 'user']
      );

      if (!hasPermission) {
        throw new AppError('Permissions insuffisantes', 403);
      }

      // Vérifier que la note existe et que l'utilisateur peut la supprimer
      const { data: existingNote } = await supabase
        .from('notes')
        .select('created_by')
        .eq('id', noteId)
        .eq('organization_id', organizationId)
        .eq('is_deleted', false)
        .single();

      if (!existingNote) {
        throw new AppError('Note non trouvée', 404);
      }

      // Seul le créateur ou un admin peut supprimer une note
      const { role } = await OrganizationService.checkUserPermission(organizationId, userId);
      if (existingNote.created_by !== userId && role !== 'admin') {
        throw new AppError('Seul le créateur ou un administrateur peut supprimer cette note', 403);
      }

      // Soft delete
      const { error } = await supabase
        .from('notes')
        .update({
          is_deleted: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', noteId)
        .eq('organization_id', organizationId);

      if (error) {
        throw new AppError('Erreur lors de la suppression de la note', 500);
      }

      logger.info(`Note supprimée: ${noteId} par ${userId}`);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Erreur lors de la suppression de la note:', error);
      throw new AppError('Erreur interne du serveur', 500);
    }
  }

  /**
   * Créer une catégorie de notes
   */
  static async createCategory(
    organizationId: string,
    userId: string,
    categoryData: z.infer<typeof createNoteCategorySchema>
  ): Promise<NoteCategory> {
    try {
      const validatedData = createNoteCategorySchema.parse(categoryData);

      // Vérifier les permissions
      const { hasPermission } = await OrganizationService.checkUserPermission(
        organizationId,
        userId,
        ['admin', 'manager']
      );

      if (!hasPermission) {
        throw new AppError('Permissions insuffisantes', 403);
      }

      const { data: category, error } = await supabase
        .from('note_categories')
        .insert({
          name: validatedData.name,
          description: validatedData.description,
          color: validatedData.color,
          organization_id: organizationId,
          created_by: userId,
        })
        .select()
        .single();

      if (error || !category) {
        logger.error('Erreur lors de la création de la catégorie:', error);
        throw new AppError('Erreur lors de la création de la catégorie', 500);
      }

      return {
        id: category.id,
        name: category.name,
        description: category.description,
        color: category.color,
        organizationId: category.organization_id,
        createdBy: category.created_by,
        createdAt: category.created_at,
        updatedAt: category.updated_at,
        noteCount: 0,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Erreur lors de la création de la catégorie:', error);
      throw new AppError('Erreur interne du serveur', 500);
    }
  }

  /**
   * Récupérer les catégories d'une organisation
   */
  static async getOrganizationCategories(
    organizationId: string,
    userId: string
  ): Promise<NoteCategory[]> {
    try {
      // Vérifier les permissions
      const { hasPermission } = await OrganizationService.checkUserPermission(
        organizationId,
        userId,
        ['owner', 'admin', 'manager', 'user', 'viewer']
      );

      if (!hasPermission) {
        throw new AppError('Permissions insuffisantes', 403);
      }

      const { data: categories, error } = await supabase
        .from('note_categories')
        .select('*')
        .eq('organization_id', organizationId)
        .order('name', { ascending: true });

      if (error) {
        logger.error('Erreur lors de la récupération des catégories:', error);
        throw new AppError('Erreur lors de la récupération des catégories', 500);
      }

      // Compter les notes pour chaque catégorie
      const categoriesWithCount = await Promise.all(
        categories.map(async (category: any) => {
          const { count } = await supabase
            .from('notes')
            .select('*', { count: 'exact', head: true })
            .eq('category', category.id)
            .eq('is_deleted', false);

          return {
            id: category.id,
            name: category.name,
            description: category.description,
            color: category.color,
            organizationId: category.organization_id,
            createdBy: category.created_by,
            createdAt: category.created_at,
            updatedAt: category.updated_at,
            noteCount: count || 0,
          };
        })
      );

      return categoriesWithCount;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Erreur lors de la récupération des catégories:', error);
      throw new AppError('Erreur interne du serveur', 500);
    }
  }

  /**
   * Rechercher des notes
   */
  static async searchNotes(
    organizationId: string,
    userId: string,
    searchTerm: string,
    includePrivate: boolean = false
  ): Promise<Note[]> {
    try {
      // Vérifier les permissions
      const { hasPermission } = await OrganizationService.checkUserPermission(
        organizationId,
        userId,
        ['owner', 'admin', 'manager', 'user', 'viewer']
      );

      if (!hasPermission) {
        throw new AppError('Permissions insuffisantes', 403);
      }

      let query = supabase
        .from('notes')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_deleted', false)
        .or(`title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`)
        .order('updated_at', { ascending: false });

      // Notes privées supprimées - toutes les notes sont publiques dans cette organisation

      const { data: notes, error } = await query;

      if (error) {
        logger.error('Erreur lors de la recherche de notes:', error);
        throw new AppError('Erreur lors de la recherche de notes', 500);
      }

      return notes.map((note: any) => ({
        id: note.id,
        title: note.title,
        content: note.content,
        categoryId: note.category,
        organizationId: note.organization_id,
        createdBy: note.user_id,
        createdAt: note.created_at,
        updatedAt: note.updated_at,
        isDeleted: note.is_deleted,
        tags: note.tags,
        creator: {
          id: note.user_id,
          email: 'user@example.com',
          firstName: 'User',
          lastName: 'Name',
        },
        category: note.category,
      }));
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Erreur lors de la recherche de notes:', error);
      throw new AppError('Erreur interne du serveur', 500);
    }
  }

  /**
   * Récupérer les notes par tags
   */
  static async getNotesByTags(
    organizationId: string,
    userId: string,
    tags: string[]
  ): Promise<Note[]> {
    try {
      // Vérifier les permissions
      const { hasPermission } = await OrganizationService.checkUserPermission(
        organizationId,
        userId,
        ['owner', 'admin', 'manager', 'user', 'viewer']
      );

      if (!hasPermission) {
        throw new AppError('Permissions insuffisantes', 403);
      }

      const { data: notes, error } = await supabase
        .from('notes')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_deleted', false)
        .overlaps('tags', tags)
        .or(`is_private.eq.false,created_by.eq.${userId}`)
        .order('updated_at', { ascending: false });

      if (error) {
        logger.error('Erreur lors de la récupération des notes par tags:', error);
        throw new AppError('Erreur lors de la récupération des notes par tags', 500);
      }

      return notes.map((note: any) => ({
        id: note.id,
        title: note.title,
        content: note.content,
        categoryId: note.category,
        organizationId: note.organization_id,
        createdBy: note.user_id,
        createdAt: note.created_at,
        updatedAt: note.updated_at,
        isDeleted: note.is_deleted,
        tags: note.tags,
        creator: {
          id: note.user_id,
          email: 'user@example.com',
          firstName: 'User',
          lastName: 'Name',
        },
        category: note.category,
      }));
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Erreur lors de la récupération des notes par tags:', error);
      throw new AppError('Erreur interne du serveur', 500);
    }
  }
}
