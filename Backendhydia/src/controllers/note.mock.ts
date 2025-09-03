// Contrôleur de notes mock pour les tests
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

// Define interfaces for Note and NoteCategory
export interface NoteCategory {
  id: string;
  name: string;
  color?: string;
  icon?: string;
  description?: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  isEncrypted: boolean;
  isFavorite: boolean;
  tags?: string[];
  categoryId?: string;
  category?: NoteCategory;
  createdBy: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

// Fonction asyncHandler simplifiée
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => 
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

// Base de données en mémoire pour les notes
const mockNotes: Note[] = [];

export class MockNoteController {
  /**
   * Créer une nouvelle note (mock)
   * POST /api/v1/notes
   */
  static createNote = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { title, content, tags = [], category } = req.body;
      
      // Validation basique
      if (!title || !content) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Le titre et le contenu sont requis',
            statusCode: 400
          }
        });
      }
      
      // Créer une nouvelle note
      const newNote: Note = {
        id: uuidv4(),
        title,
        content,
        isEncrypted: false,
        isFavorite: false,
        tags: Array.isArray(tags) ? tags : [],
        categoryId: category ? category.id : undefined,
        category: category || undefined,
        createdBy: 'test-user-id-123',
        organizationId: req.body.organizationId || 'test-org-id-123',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      // Ajouter à la base de données en mémoire
      mockNotes.push(newNote);
      
      return res.status(201).json({
        success: true,
        message: 'Note créée avec succès',
        data: newNote
      });
    } catch (error: any) {
      console.error('Erreur lors de la création de la note:', error);
      return res.status(500).json({
        success: false,
        error: {
          message: 'Erreur lors de la création de la note',
          statusCode: 500
        }
      });
    }
  });
  
  /**
   * Récupérer toutes les notes d'une organisation (mock)
   * GET /api/v1/notes
   */
  static getOrganizationNotes = asyncHandler(async (req: Request, res: Response) => {
    try {
      const organizationId = req.params.organizationId || 'test-org-id-123';
      
      // Filtrer les notes par organisation
      const notes = mockNotes.filter(n => n.organizationId === organizationId);
      
      return res.status(200).json({
        success: true,
        data: notes
      });
    } catch (error: any) {
      console.error('Erreur lors de la récupération des notes:', error);
      return res.status(500).json({
        success: false,
        error: {
          message: 'Erreur lors de la récupération des notes',
          statusCode: 500
        }
      });
    }
  });
  
  /**
   * Récupérer une note par son ID (mock)
   * GET /api/v1/notes/:noteId
   */
  static getNoteById = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { noteId } = req.params;
      
      // Rechercher la note
      const note = mockNotes.find(n => n.id === noteId);
      
      if (!note) {
        return res.status(404).json({
          success: false,
          error: {
            message: 'Note non trouvée',
            statusCode: 404
          }
        });
      }
      
      return res.status(200).json({
        success: true,
        data: note
      });
    } catch (error: any) {
      console.error('Erreur lors de la récupération de la note:', error);
      return res.status(500).json({
        success: false,
        error: {
          message: 'Erreur lors de la récupération de la note',
          statusCode: 500
        }
      });
    }
  });
  
  /**
   * Mettre à jour une note (mock)
   * PUT /api/v1/notes/:noteId
   */
  static updateNote = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { noteId } = req.params;
      const { title, content, tags, category } = req.body;
      
      // Rechercher la note
      const noteIndex = mockNotes.findIndex(n => n.id === noteId);
      
      if (noteIndex === -1) {
        return res.status(404).json({
          success: false,
          error: {
            message: 'Note non trouvée',
            statusCode: 404
          }
        });
      }
      
      // Mettre à jour la note
      mockNotes[noteIndex] = {
        ...mockNotes[noteIndex],
        title: title || mockNotes[noteIndex].title,
        content: content || mockNotes[noteIndex].content,
        tags: tags !== undefined ? tags : mockNotes[noteIndex].tags,
        category: category || mockNotes[noteIndex].category,
        updatedAt: new Date().toISOString()
      };
      
      return res.status(200).json({
        success: true,
        message: 'Note mise à jour avec succès',
        data: mockNotes[noteIndex]
      });
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour de la note:', error);
      return res.status(500).json({
        success: false,
        error: {
          message: 'Erreur lors de la mise à jour de la note',
          statusCode: 500
        }
      });
    }
  });
  
  /**
   * Supprimer une note (mock)
   * DELETE /api/v1/notes/:noteId
   */
  static deleteNote = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { noteId } = req.params;
      
      // Rechercher la note
      const noteIndex = mockNotes.findIndex(n => n.id === noteId);
      
      if (noteIndex === -1) {
        return res.status(404).json({
          success: false,
          error: {
            message: 'Note non trouvée',
            statusCode: 404
          }
        });
      }
      
      // Supprimer la note
      mockNotes.splice(noteIndex, 1);
      
      return res.status(200).json({
        success: true,
        message: 'Note supprimée avec succès'
      });
    } catch (error: any) {
      console.error('Erreur lors de la suppression de la note:', error);
      return res.status(500).json({
        success: false,
        error: {
          message: 'Erreur lors de la suppression de la note',
          statusCode: 500
        }
      });
    }
  });
  
  /**
   * Rechercher des notes (mock)
   * GET /api/v1/notes/search
   */
  static searchNotes = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { query } = req.query;
      const organizationId = req.params.organizationId || 'test-org-id-123';
      
      if (!query) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Le paramètre de recherche est requis',
            statusCode: 400
          }
        });
      }
      
      // Filtrer les notes par organisation et recherche
      const notes = mockNotes.filter(n => 
        n.organizationId === organizationId && 
        (n.title.toLowerCase().includes(String(query).toLowerCase()) || 
         n.content.toLowerCase().includes(String(query).toLowerCase()) || 
         (n.tags && n.tags.some((tag: string) => tag.toLowerCase().includes(String(query).toLowerCase()))))
      );
      
      return res.status(200).json({
        success: true,
        data: notes
      });
    } catch (error: any) {
      console.error('Erreur lors de la recherche des notes:', error);
      return res.status(500).json({
        success: false,
        error: {
          message: 'Erreur lors de la recherche des notes',
          statusCode: 500
        }
      });
    }
  });
  
  /**
   * Récupérer les notes par tags (mock)
   * GET /api/v1/notes/by-tags
   */
  static getNotesByTags = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { tags } = req.query;
      const organizationId = req.params.organizationId || 'test-org-id-123';
      
      if (!tags) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Les tags sont requis',
            statusCode: 400
          }
        });
      }
      
      const tagArray = Array.isArray(tags) ? tags : [tags];
      
      // Filtrer les notes par organisation et tags
      const notes = mockNotes.filter(n => 
        n.organizationId === organizationId && 
        n.tags && n.tags.some((tag: string) => tagArray.includes(tag))
      );
      
      return res.status(200).json({
        success: true,
        data: notes
      });
    } catch (error: any) {
      console.error('Erreur lors de la récupération des notes par tags:', error);
      return res.status(500).json({
        success: false,
        error: {
          message: 'Erreur lors de la récupération des notes par tags',
          statusCode: 500
        }
      });
    }
  });
  
  /**
   * Récupérer les statistiques des notes (mock)
   * GET /api/v1/notes/stats
   */
  static getNoteStats = asyncHandler(async (req: Request, res: Response) => {
    try {
      const organizationId = req.params.organizationId || 'test-org-id-123';
      
      // Filtrer les notes par organisation
      const notes = mockNotes.filter(n => n.organizationId === organizationId);
      
      // Calculer les statistiques
      const stats = {
        totalNotes: notes.length,
        totalTags: [...new Set(notes.flatMap(n => n.tags || []))].length,
        categoriesCount: Object.entries(
          notes.reduce((acc: {[key: string]: number}, note) => {
            const categoryName = note.category?.name || 'Sans catégorie';
            acc[categoryName] = (acc[categoryName] || 0) + 1;
            return acc;
          }, {})
        ).map(([name, count]) => ({ name, count })),
        recentActivity: notes
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
          .slice(0, 5)
          .map(n => ({ id: n.id, title: n.title, updatedAt: n.updatedAt }))
      };
      
      return res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error: any) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      return res.status(500).json({
        success: false,
        error: {
          message: 'Erreur lors de la récupération des statistiques',
          statusCode: 500
        }
      });
    }
  });
  
  /**
   * Exporter les notes (mock)
   * GET /api/v1/notes/export
   */
  static exportNotes = asyncHandler(async (req: Request, res: Response) => {
    try {
      const organizationId = req.params.organizationId || 'test-org-id-123';
      const { format = 'json' } = req.query;
      
      // Filtrer les notes par organisation
      const notes = mockNotes.filter(n => n.organizationId === organizationId);
      
      if (format === 'markdown') {
        // Simuler un export Markdown
        const markdown = notes.map(n => 
          `# ${n.title}\n\n${n.content}\n\nTags: ${n.tags ? n.tags.join(', ') : 'Aucun tag'}\nCatégorie: ${n.category?.name || 'Sans catégorie'}\nCréé le: ${n.createdAt}\n\n---\n\n`
        ).join('');
        
        res.setHeader('Content-Type', 'text/markdown');
        res.setHeader('Content-Disposition', 'attachment; filename="notes.md"');
        return res.status(200).send(markdown);
      }
      
      // Format JSON par défaut
      return res.status(200).json({
        success: true,
        data: notes
      });
    } catch (error: any) {
      console.error('Erreur lors de l\'export des notes:', error);
      return res.status(500).json({
        success: false,
        error: {
          message: 'Erreur lors de l\'export des notes',
          statusCode: 500
        }
      });
    }
  });
  
  /**
   * Dupliquer une note (mock)
   * POST /api/v1/notes/:noteId/duplicate
   */
  static duplicateNote = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { noteId } = req.params;
      
      // Rechercher la note
      const note = mockNotes.find(n => n.id === noteId);
      
      if (!note) {
        return res.status(404).json({
          success: false,
          error: {
            message: 'Note non trouvée',
            statusCode: 404
          }
        });
      }
      
      // Créer une copie de la note
      const duplicatedNote = {
        ...note,
        id: uuidv4(),
        title: `${note.title} (copie)`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Ajouter à la base de données en mémoire
      mockNotes.push(duplicatedNote);
      
      return res.status(201).json({
        success: true,
        message: 'Note dupliquée avec succès',
        data: duplicatedNote
      });
    } catch (error: any) {
      console.error('Erreur lors de la duplication de la note:', error);
      return res.status(500).json({
        success: false,
        error: {
          message: 'Erreur lors de la duplication de la note',
          statusCode: 500
        }
      });
    }
  });
  
  /**
   * Créer une catégorie de notes (mock)
   * POST /api/v1/note-categories
   */
  static createCategory = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { name, description } = req.body;
      const organizationId = req.params.organizationId || 'test-org-id-123';
      
      if (!name) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Le nom de la catégorie est requis',
            statusCode: 400
          }
        });
      }
      
      // Créer une nouvelle catégorie (fictive)
      const category = {
        id: uuidv4(),
        name,
        description: description || '',
        organizationId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      return res.status(201).json({
        success: true,
        message: 'Catégorie créée avec succès',
        data: category
      });
    } catch (error: any) {
      console.error('Erreur lors de la création de la catégorie:', error);
      return res.status(500).json({
        success: false,
        error: {
          message: 'Erreur lors de la création de la catégorie',
          statusCode: 500
        }
      });
    }
  });
  
  /**
   * Récupérer les catégories de notes (mock)
   * GET /api/v1/note-categories
   */
  static getCategories = asyncHandler(async (req: Request, res: Response) => {
    try {
      // Catégories par défaut
      const categories = [
        {
          id: 'cat-1',
          name: 'Général',
          description: 'Catégorie par défaut',
          organizationId: 'test-org-id-123',
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z'
        },
        {
          id: 'cat-2',
          name: 'Travail',
          description: 'Notes professionnelles',
          organizationId: 'test-org-id-123',
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z'
        },
        {
          id: 'cat-3',
          name: 'Personnel',
          description: 'Notes personnelles',
          organizationId: 'test-org-id-123',
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z'
        }
      ];
      
      return res.status(200).json({
        success: true,
        data: categories
      });
    } catch (error: any) {
      console.error('Erreur lors de la récupération des catégories:', error);
      return res.status(500).json({
        success: false,
        error: {
          message: 'Erreur lors de la récupération des catégories',
          statusCode: 500
        }
      });
    }
  });
}
