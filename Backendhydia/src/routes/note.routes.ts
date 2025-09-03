import { Router } from 'express';
import { NoteController } from '@/controllers/note.controller';
import { 
  authenticate, 
  requireActiveUser, 
  requireOrganizationWrite,
  requireOrganizationMember,
  organizationContext,
  setDbContext,
  extractOrganization,
  logAccess 
} from '@/middlewares/auth.middleware';

const router = Router();

/**
 * Routes des notes
 * Base: /api/v1/organizations/:organizationId/notes
 */

// Middleware d'authentification pour toutes les routes
router.use(authenticate);
router.use(requireActiveUser);
// Injecter le contexte d'organisation (cookie/header) pour les routes directes
router.use(organizationContext);
// Pousser le contexte au niveau DB (RLS)
router.use(setDbContext);

// Routes CRUD directes pour les notes (utilise l'organisation par défaut de l'utilisateur)
router.post('/', logAccess('note'), NoteController.createNote);
router.get('/', logAccess('note'), NoteController.getOrganizationNotes);
router.get('/:noteId', logAccess('note'), NoteController.getNoteById);
router.put('/:noteId', logAccess('note'), NoteController.updateNote);
router.delete('/:noteId', logAccess('note'), NoteController.deleteNote);

// Middleware pour extraire l'organisation des paramètres
router.use('/:organizationId', extractOrganization);

// Routes CRUD des notes
router.post(
  '/:organizationId/notes', 
  requireOrganizationWrite, 
  logAccess('note'), 
  NoteController.createNote
);

router.get(
  '/:organizationId/notes', 
  requireOrganizationMember, 
  logAccess('note'), 
  NoteController.getOrganizationNotes
);

router.get(
  '/:organizationId/notes/search', 
  requireOrganizationMember, 
  logAccess('note'), 
  NoteController.searchNotes
);

router.get(
  '/:organizationId/notes/by-tags', 
  requireOrganizationMember, 
  logAccess('note'), 
  NoteController.getNotesByTags
);

router.get(
  '/:organizationId/notes/stats', 
  requireOrganizationMember, 
  logAccess('note'), 
  NoteController.getNoteStats
);

router.get(
  '/:organizationId/notes/export', 
  requireOrganizationMember, 
  logAccess('note'), 
  NoteController.exportNotes
);

router.get(
  '/:organizationId/notes/:noteId', 
  requireOrganizationMember, 
  logAccess('note'), 
  NoteController.getNoteById
);

router.put(
  '/:organizationId/notes/:noteId', 
  requireOrganizationWrite, 
  logAccess('note'), 
  NoteController.updateNote
);

router.delete(
  '/:organizationId/notes/:noteId', 
  requireOrganizationWrite, 
  logAccess('note'), 
  NoteController.deleteNote
);

router.post(
  '/:organizationId/notes/:noteId/duplicate', 
  requireOrganizationWrite, 
  logAccess('note'), 
  NoteController.duplicateNote
);

// Routes des catégories de notes
router.post(
  '/:organizationId/note-categories', 
  requireOrganizationWrite, 
  logAccess('note'), 
  NoteController.createCategory
);

router.get(
  '/:organizationId/note-categories', 
  requireOrganizationMember, 
  logAccess('note'), 
  NoteController.getCategories
);

export default router;
