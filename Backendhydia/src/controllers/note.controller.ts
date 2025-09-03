import { Request, Response } from 'express';
import { 
  NoteService, 
  createNoteSchema, 
  updateNoteSchema,
  createNoteCategorySchema 
} from '@/services/note.service';
import { 
  sendSuccess, 
  sendCreated, 
  sendError, 
  sendUpdated,
  sendDeleted,
  asyncHandler, 
  SuccessMessages 
} from '@/utils/response';
import { AppError, ValidationError } from '@/utils/errors';
import { logger, loggers } from '@/utils/logger';
import { z } from 'zod';

export class NoteController {
  /**
   * Créer une nouvelle note
   * POST /api/v1/organizations/:organizationId/notes
   */
  static createNote = asyncHandler(async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        throw new AppError('Authentification requise', 401);
      }

      // Validation des données
      const validatedData = createNoteSchema.parse(req.body);

      // Utiliser l'organisation du paramètre, de l'en-tête, ou la première organisation de l'utilisateur
      let organizationId = req.organization?.id || req.headers['x-organization-id'] as string;
      
      if (!organizationId) {
        // Pour les routes directes, récupérer la première organisation de l'utilisateur
        const { OrganizationService } = await import('@/services/organization.service');
        const userOrganizations = await OrganizationService.getUserOrganizations(req.user.id);
        if (userOrganizations.length === 0) {
          throw new AppError('Aucune organisation trouvée pour cet utilisateur', 400);
        }
        organizationId = userOrganizations[0].id;
      }

      logger.info(`Création d'une note pour l'organisation ${organizationId} par l'utilisateur ${req.user.id}`);

      // Créer la note
      const note = await NoteService.createNote(
        organizationId,
        req.user.id,
        validatedData
      );

      // Logger la création
      loggers.data.create('note', note.id, req.user.id);

      // Répondre avec la note créée
      return sendCreated(res, note, SuccessMessages.NOTE_CREATED);

    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = new ValidationError('Données de note invalides', error.errors);
        return sendError(res, validationError);
      }

      if (error instanceof AppError) {
        return sendError(res, error);
      }

      logger.error('Erreur lors de la création de la note:', error);
      const serverError = new AppError('Erreur interne du serveur', 500);
      return sendError(res, serverError);
    }
  });

  /**
   * Récupérer les notes d'une organisation
   * GET /api/v1/organizations/:organizationId/notes
   */
  static getOrganizationNotes = asyncHandler(async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        throw new AppError('Authentification requise', 401);
      }

      const { categoryId, includePrivate } = req.query;

      // Utiliser l'organisation du paramètre, de l'en-tête, ou la première organisation de l'utilisateur
      let organizationId = req.organization?.id || req.headers['x-organization-id'] as string;
      
      if (!organizationId) {
        // Pour les routes directes, récupérer la première organisation de l'utilisateur
        const { OrganizationService } = await import('@/services/organization.service');
        const userOrganizations = await OrganizationService.getUserOrganizations(req.user.id);
        if (userOrganizations.length === 0) {
          throw new AppError('Aucune organisation trouvée pour cet utilisateur', 400);
        }
        organizationId = userOrganizations[0].id;
      }

      logger.info(`Récupération des notes pour l'organisation ${organizationId} par l'utilisateur ${req.user.id}`);

      // Récupérer les notes
      const notes = await NoteService.getOrganizationNotes(
        organizationId,
        req.user.id,
        categoryId as string,
        includePrivate === 'true'
      );

      // Logger l'accès
      loggers.data.access('notes', organizationId, req.user.id, 'READ');

      // Répondre avec les notes directement dans un tableau pour compatibilité frontend
      return sendSuccess(res, { notes }, 200, SuccessMessages.RETRIEVED);

    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error);
      }

      logger.error('Erreur lors de la récupération des notes:', error);
      const serverError = new AppError('Erreur interne du serveur', 500);
      return sendError(res, serverError);
    }
  });

  /**
   * Récupérer une note par ID
   * GET /api/v1/organizations/:organizationId/notes/:noteId
   */
  static getNoteById = asyncHandler(async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.organization) {
        throw new AppError('Authentification ou organisation requise', 401);
      }

      const { noteId } = req.params;

      // Récupérer la note
      const note = await NoteService.getNoteById(
        noteId,
        req.organization.id,
        req.user.id
      );

      // Logger l'accès
      loggers.data.access('note', noteId, req.user.id, 'READ');

      // Répondre avec la note
      return sendSuccess(res, { note }, 200, SuccessMessages.RETRIEVED);

    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error);
      }

      logger.error('Erreur lors de la récupération de la note:', error);
      const serverError = new AppError('Erreur interne du serveur', 500);
      return sendError(res, serverError);
    }
  });

  /**
   * Mettre à jour une note
   * PUT /api/v1/organizations/:organizationId/notes/:noteId
   */
  static updateNote = asyncHandler(async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.organization) {
        throw new AppError('Authentification ou organisation requise', 401);
      }

      const { noteId } = req.params;

      // Validation des données
      const validatedData = updateNoteSchema.parse(req.body);

      // Mettre à jour la note
      const note = await NoteService.updateNote(
        noteId,
        req.organization.id,
        req.user.id,
        validatedData
      );

      // Logger la mise à jour
      loggers.data.update('note', noteId, req.user.id);

      // Répondre avec la note mise à jour
      return sendUpdated(res, { note }, SuccessMessages.NOTE_UPDATED);

    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = new ValidationError('Données de mise à jour invalides', error.errors);
        return sendError(res, validationError);
      }

      if (error instanceof AppError) {
        return sendError(res, error);
      }

      logger.error('Erreur lors de la mise à jour de la note:', error);
      const serverError = new AppError('Erreur interne du serveur', 500);
      return sendError(res, serverError);
    }
  });

  /**
   * Supprimer une note
   * DELETE /api/v1/organizations/:organizationId/notes/:noteId
   */
  static deleteNote = asyncHandler(async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.organization) {
        throw new AppError('Authentification ou organisation requise', 401);
      }

      const { noteId } = req.params;

      // Supprimer la note
      await NoteService.deleteNote(
        noteId,
        req.organization.id,
        req.user.id
      );

      // Logger la suppression
      loggers.data.delete('note', noteId, req.user.id);

      // Répondre avec succès
      return sendDeleted(res, SuccessMessages.NOTE_DELETED);

    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error);
      }

      logger.error('Erreur lors de la suppression de la note:', error);
      const serverError = new AppError('Erreur interne du serveur', 500);
      return sendError(res, serverError);
    }
  });

  /**
   * Rechercher des notes
   * GET /api/v1/organizations/:organizationId/notes/search
   */
  static searchNotes = asyncHandler(async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.organization) {
        throw new AppError('Authentification ou organisation requise', 401);
      }

      const { search, includePrivate } = req.query;

      if (!search || typeof search !== 'string') {
        throw new AppError('Terme de recherche requis', 400);
      }

      // Rechercher les notes
      const notes = await NoteService.searchNotes(
        req.organization.id,
        req.user.id,
        search,
        includePrivate === 'true'
      );

      // Logger la recherche
      loggers.data.access('notes_search', req.organization.id, req.user.id, 'SEARCH');

      // Répondre avec les résultats
      return sendSuccess(res, { 
        notes,
        searchTerm: search,
        count: notes.length 
      }, 200, SuccessMessages.RETRIEVED);

    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error);
      }

      logger.error('Erreur lors de la recherche de notes:', error);
      const serverError = new AppError('Erreur interne du serveur', 500);
      return sendError(res, serverError);
    }
  });

  /**
   * Récupérer les notes par tags
   * GET /api/v1/organizations/:organizationId/notes/by-tags
   */
  static getNotesByTags = asyncHandler(async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.organization) {
        throw new AppError('Authentification ou organisation requise', 401);
      }

      const { tags } = req.query;

      if (!tags || typeof tags !== 'string') {
        throw new AppError('Tags requis', 400);
      }

      // Convertir la chaîne de tags en tableau
      const tagArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);

      if (tagArray.length === 0) {
        throw new AppError('Au moins un tag valide requis', 400);
      }

      // Récupérer les notes par tags
      const notes = await NoteService.getNotesByTags(
        req.organization.id,
        req.user.id,
        tagArray
      );

      // Logger l'accès
      loggers.data.access('notes_by_tags', req.organization.id, req.user.id, 'READ');

      // Répondre avec les notes
      return sendSuccess(res, { 
        notes,
        tags: tagArray,
        count: notes.length 
      }, 200, SuccessMessages.RETRIEVED);

    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error);
      }

      logger.error('Erreur lors de la récupération des notes par tags:', error);
      const serverError = new AppError('Erreur interne du serveur', 500);
      return sendError(res, serverError);
    }
  });

  /**
   * Créer une catégorie de notes
   * POST /api/v1/organizations/:organizationId/note-categories
   */
  static createCategory = asyncHandler(async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.organization) {
        throw new AppError('Authentification ou organisation requise', 401);
      }

      // Validation des données
      const validatedData = createNoteCategorySchema.parse(req.body);

      // Créer la catégorie
      const category = await NoteService.createCategory(
        req.organization.id,
        req.user.id,
        validatedData
      );

      // Logger la création
      loggers.data.create('note_category', category.id, req.user.id);

      // Répondre avec la catégorie créée
      return sendCreated(res, { category }, SuccessMessages.CATEGORY_CREATED);

    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = new ValidationError('Données de catégorie invalides', error.errors);
        return sendError(res, validationError);
      }

      if (error instanceof AppError) {
        return sendError(res, error);
      }

      logger.error('Erreur lors de la création de la catégorie:', error);
      const serverError = new AppError('Erreur interne du serveur', 500);
      return sendError(res, serverError);
    }
  });

  /**
   * Récupérer les catégories de notes
   * GET /api/v1/organizations/:organizationId/note-categories
   */
  static getCategories = asyncHandler(async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.organization) {
        throw new AppError('Authentification ou organisation requise', 401);
      }

      // Récupérer les catégories
      const categories = await NoteService.getOrganizationCategories(
        req.organization.id,
        req.user.id
      );

      // Logger l'accès
      loggers.data.access('note_categories', req.organization.id, req.user.id, 'READ');

      // Répondre avec les catégories
      return sendSuccess(res, { categories }, 200, SuccessMessages.RETRIEVED);

    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error);
      }

      logger.error('Erreur lors de la récupération des catégories:', error);
      const serverError = new AppError('Erreur interne du serveur', 500);
      return sendError(res, serverError);
    }
  });

  /**
   * Obtenir les statistiques des notes
   * GET /api/v1/organizations/:organizationId/notes/stats
   */
  static getNoteStats = asyncHandler(async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.organization) {
        throw new AppError('Authentification ou organisation requise', 401);
      }

      // Récupérer toutes les notes pour calculer les statistiques
      const notes = await NoteService.getOrganizationNotes(
        req.organization.id,
        req.user.id,
        undefined,
        true // Inclure les notes privées pour les stats
      );

      // Récupérer les catégories
      const categories = await NoteService.getOrganizationCategories(
        req.organization.id,
        req.user.id
      );

      // Calculer les statistiques
      const stats = {
        totalNotes: notes.length,
        privateNotes: notes.filter(note => false).length,
        publicNotes: notes.filter(note => !false).length,
        totalCategories: categories.length,
        notesWithTags: notes.filter(note => note.tags && note.tags.length > 0).length,
        averageContentLength: notes.length > 0 ? Math.round(notes.reduce((sum, note) => sum + note.content.length, 0) / notes.length) : 0,
        categoryBreakdown: categories.map(category => ({
          id: category.id,
          name: category.name,
          noteCount: category.noteCount || 0,
          color: category.color
        })),
        recentNotes: notes
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
          .slice(0, 5)
          .map(note => ({
            id: note.id,
            title: note.title,
            updatedAt: note.updatedAt,
            creator: note.creator,
            isPrivate: false
          })),
        topTags: [] as Array<{ tag: string; count: number }>
      };

      // Calculer les tags les plus utilisés
      const tagCounts: Record<string, number> = {};
      notes.forEach(note => {
        if (note.tags) {
          note.tags.forEach(tag => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
          });
        }
      });

      stats.topTags = Object.entries(tagCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([tag, count]) => ({ tag, count }));

      // Logger l'accès aux statistiques
      loggers.data.access('note_stats', req.organization.id, req.user.id, 'READ');

      // Répondre avec les statistiques
      return sendSuccess(res, { stats }, 200, 'Statistiques des notes récupérées');

    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error);
      }

      logger.error('Erreur lors de la récupération des statistiques des notes:', error);
      const serverError = new AppError('Erreur interne du serveur', 500);
      return sendError(res, serverError);
    }
  });

  /**
   * Exporter les notes
   * GET /api/v1/organizations/:organizationId/notes/export
   */
  static exportNotes = asyncHandler(async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.organization) {
        throw new AppError('Authentification ou organisation requise', 401);
      }

      const { format = 'json', includePrivate = 'false' } = req.query;

      // Récupérer les notes
      const notes = await NoteService.getOrganizationNotes(
        req.organization.id,
        req.user.id,
        undefined,
        includePrivate === 'true'
      );

      // Préparer les données d'export
      const exportData = notes.map(note => ({
        id: note.id,
        title: note.title,
        content: note.content,
        tags: note.tags,
        categoryId: note.categoryId,
        categoryName: note.category,
        isPrivate: false,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
        creator: note.creator
      }));

      // Logger l'export
      loggers.data.access('notes_export', req.organization.id, req.user.id, 'EXPORT');

      // Définir le type de contenu selon le format
      if (format === 'csv') {
        // TODO: Implémenter l'export CSV
        throw new AppError('Format CSV non encore supporté', 400);
      }

      // Répondre avec les données d'export (JSON par défaut)
      return sendSuccess(res, { 
        notes: exportData,
        exportedAt: new Date().toISOString(),
        count: exportData.length,
        format: 'json',
        includePrivate: includePrivate === 'true'
      }, 200, 'Export terminé');

    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error);
      }

      logger.error('Erreur lors de l\'export des notes:', error);
      const serverError = new AppError('Erreur interne du serveur', 500);
      return sendError(res, serverError);
    }
  });

  /**
   * Dupliquer une note
   * POST /api/v1/organizations/:organizationId/notes/:noteId/duplicate
   */
  static duplicateNote = asyncHandler(async (req: Request, res: Response) => {
    try {
      if (!req.user || !req.organization) {
        throw new AppError('Authentification ou organisation requise', 401);
      }

      const { noteId } = req.params;

      // Récupérer la note originale
      const originalNote = await NoteService.getNoteById(
        noteId,
        req.organization.id,
        req.user.id
      );

      // Créer une copie de la note
      const duplicateData = {
        title: `${originalNote.title} (Copie)`,
        content: originalNote.content,
        categoryId: originalNote.categoryId,
        tags: originalNote.tags,
        // isPrivate supprimé - toutes les notes sont publiques
      };

      const duplicatedNote = await NoteService.createNote(
        req.organization.id,
        req.user.id,
        duplicateData
      );

      // Logger la duplication
      loggers.data.create('note', duplicatedNote.id, req.user.id);

      // Répondre avec la note dupliquée
      return sendCreated(res, { note: duplicatedNote }, 'Note dupliquée avec succès');

    } catch (error) {
      if (error instanceof AppError) {
        return sendError(res, error);
      }

      logger.error('Erreur lors de la duplication de la note:', error);
      const serverError = new AppError('Erreur interne du serveur', 500);
      return sendError(res, serverError);
    }
  });
}
