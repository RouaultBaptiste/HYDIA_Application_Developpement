import { Router } from 'express';
import { NoteController } from '@/controllers/note.controller';
import { 
  requireAuth, 
  requireRole,
  optionalAuth 
} from '@/middlewares/auth.supabase.middleware';

const router = Router();

/**
 * Routes des notes avec authentification Supabase
 * Base: /api/v1/notes
 */

// Middleware d'authentification Supabase pour toutes les routes
router.use(requireAuth);

// Routes de recherche (doivent être avant les routes avec paramètres)
router.get('/search', NoteController.searchNotes);

// Routes des catégories de notes
router.post('/categories', NoteController.createCategory);
router.get('/categories', NoteController.getCategories);

// Routes CRUD directes pour les notes (utilise l'organisation par défaut de l'utilisateur)
router.post('/', NoteController.createNote);
router.get('/', NoteController.getOrganizationNotes);
router.get('/:noteId', NoteController.getNoteById);
router.put('/:noteId', NoteController.updateNote);
router.delete('/:noteId', NoteController.deleteNote);

export default router;
