import { Router } from 'express';
import { MockPasswordController } from '@/controllers/password.mock';
import { MockNoteController } from '@/controllers/note.mock';
import { logAccess } from '@/middlewares/auth.middleware';
import { extractAuthFromCookies } from '@/middlewares/mock.middleware';

const router = Router();

/**
 * Routes mock pour les tests
 * Base: /api/v1/passwords et /api/v1/notes
 */

// Appliquer le middleware d'extraction des informations d'authentification à toutes les routes
router.use(extractAuthFromCookies);

// Routes des mots de passe
router.post('/', logAccess('password'), MockPasswordController.createPassword);
router.get('/', logAccess('password'), MockPasswordController.getOrganizationPasswords);
router.get('/:passwordId', logAccess('password'), MockPasswordController.getPasswordById);
router.put('/:passwordId', logAccess('password'), MockPasswordController.updatePassword);
router.delete('/:passwordId', logAccess('password'), MockPasswordController.deletePassword);
router.post('/generate', logAccess('password'), MockPasswordController.generatePassword);
router.get('/search', logAccess('password'), MockPasswordController.searchPasswords);
router.get('/strength-analysis', logAccess('password'), MockPasswordController.analyzePasswordStrength);
router.get('/export', logAccess('password'), MockPasswordController.exportPasswords);

// Routes des catégories de mots de passe
router.post('/categories', logAccess('password'), MockPasswordController.createCategory);
router.get('/categories', logAccess('password'), MockPasswordController.getCategories);
router.post('/password-categories', logAccess('password'), MockPasswordController.createCategory);
router.get('/password-categories', logAccess('password'), MockPasswordController.getCategories);

// Routes des notes - ces routes ne sont pas utilisées ici car nous avons un routeur séparé pour les notes
// Voir index.ts où nous créons deux routeurs distincts

// Routes des catégories de notes - ces routes ne sont pas utilisées ici car nous avons un routeur séparé pour les notes
// Voir index.ts où nous créons deux routeurs distincts

// Créer un routeur séparé pour les notes
const notesRouter = Router();

// Appliquer le middleware d'extraction des informations d'authentification aux routes de notes
notesRouter.use(extractAuthFromCookies);

// Routes des notes
notesRouter.post('/', logAccess('note'), MockNoteController.createNote);
notesRouter.get('/', logAccess('note'), MockNoteController.getOrganizationNotes);
notesRouter.get('/:noteId', logAccess('note'), MockNoteController.getNoteById);
notesRouter.put('/:noteId', logAccess('note'), MockNoteController.updateNote);
notesRouter.delete('/:noteId', logAccess('note'), MockNoteController.deleteNote);
notesRouter.get('/search', logAccess('note'), MockNoteController.searchNotes);
notesRouter.get('/by-tags', logAccess('note'), MockNoteController.getNotesByTags);
notesRouter.get('/stats', logAccess('note'), MockNoteController.getNoteStats);
notesRouter.get('/export', logAccess('note'), MockNoteController.exportNotes);
notesRouter.post('/:noteId/duplicate', logAccess('note'), MockNoteController.duplicateNote);

// Routes des catégories de notes
notesRouter.post('/categories', logAccess('note'), MockNoteController.createCategory);
notesRouter.get('/categories', logAccess('note'), MockNoteController.getCategories);

export { router as passwordsRouter, notesRouter };

