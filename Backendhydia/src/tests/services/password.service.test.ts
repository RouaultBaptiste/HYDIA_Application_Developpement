import { describe, expect, it, beforeEach, jest, afterEach } from '@jest/globals';
import { PasswordService, generatePasswordSchema } from '../../services/password.service';
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
    single: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    ilike: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    match: jest.fn().mockReturnThis(),
  },
}));

describe('PasswordService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('createPassword', () => {
    it('devrait créer un mot de passe avec des données valides', async () => {
      // Préparer les données de test
      const organizationId = 'org-123';
      const userId = 'user-123';
      const passwordData = {
        title: 'Gmail',
        username: 'test@gmail.com',
        password: 'SuperSecurePassword123!',
        url: 'https://gmail.com',
        notes: 'Mon compte Gmail principal',
      };

      // Mock de la réponse de Supabase
      (supabase.from as jest.Mock).mockReturnThis();
      (supabase.insert as jest.Mock).mockReturnThis();
      (supabase.select as jest.Mock).mockReturnThis();
      (supabase.single as jest.Mock).mockResolvedValue({
        data: {
          id: 'pass-123',
          title: passwordData.title,
          username: passwordData.username,
          encrypted_password: 'encrypted-password',
          url: passwordData.url,
          notes: passwordData.notes,
          organization_id: organizationId,
          created_by: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_active: true,
        },
        error: null,
      });

      // Appeler la méthode à tester
      const result = await PasswordService.createPassword(
        organizationId,
        userId,
        passwordData
      );

      // Vérifier que le résultat est conforme aux attentes
      expect(result).toBeDefined();
      expect(result.id).toBe('pass-123');
      expect(result.title).toBe(passwordData.title);
      expect(result.username).toBe(passwordData.username);
      expect(result.url).toBe(passwordData.url);
      expect(result.notes).toBe(passwordData.notes);
      expect(result.organizationId).toBe(organizationId);
      expect(result.createdBy).toBe(userId);

      // Vérifier que les appels à Supabase ont été faits correctement
      expect(supabase.from).toHaveBeenCalledWith('passwords');
      expect(supabase.insert).toHaveBeenCalled();
      expect(supabase.select).toHaveBeenCalled();
    });

    it('devrait échouer avec un titre manquant', async () => {
      // Préparer les données de test invalides (sans titre)
      const organizationId = 'org-123';
      const userId = 'user-123';
      const invalidData = {
        username: 'test@gmail.com',
        password: 'SuperSecurePassword123!',
        url: 'https://gmail.com',
        notes: 'Mon compte Gmail principal',
      };

      // Vérifier que le service rejette les données invalides
      await expect(
        PasswordService.createPassword(organizationId, userId, invalidData as any)
      ).rejects.toThrow();
    });
  });

  describe('getPasswordById', () => {
    it('devrait retourner un mot de passe existant', async () => {
      // Préparer les données de test
      const passwordId = 'pass-123';
      const organizationId = 'org-123';
      const userId = 'user-123';

      // Mock de la réponse de Supabase
      (supabase.from as jest.Mock).mockReturnThis();
      (supabase.select as jest.Mock).mockReturnThis();
      (supabase.eq as jest.Mock).mockReturnThis();
      (supabase.single as jest.Mock).mockResolvedValue({
        data: {
          id: passwordId,
          title: 'Gmail',
          username: 'test@gmail.com',
          encrypted_password: 'encrypted-password',
          url: 'https://gmail.com',
          notes: 'Mon compte Gmail principal',
          organization_id: organizationId,
          created_by: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_active: true,
        },
        error: null,
      });

      // Appeler la méthode à tester
      const result = await PasswordService.getPasswordById(
        passwordId,
        organizationId,
        userId
      );

      // Vérifier que le résultat est conforme aux attentes
      expect(result).toBeDefined();
      expect(result.id).toBe(passwordId);
      expect(result.organizationId).toBe(organizationId);

      // Vérifier que les appels à Supabase ont été faits correctement
      expect(supabase.from).toHaveBeenCalledWith('passwords');
      expect(supabase.select).toHaveBeenCalled();
      expect(supabase.eq).toHaveBeenCalledTimes(3);
    });

    it('devrait échouer pour un mot de passe inexistant', async () => {
      // Préparer les données de test
      const passwordId = 'nonexistent-id';
      const organizationId = 'org-123';
      const userId = 'user-123';

      // Mock de la réponse de Supabase (erreur/data null)
      (supabase.from as jest.Mock).mockReturnThis();
      (supabase.select as jest.Mock).mockReturnThis();
      (supabase.eq as jest.Mock).mockReturnThis();
      (supabase.single as jest.Mock).mockResolvedValue({
        data: null,
        error: { message: 'Record not found' },
      });

      // Vérifier que le service lance une erreur appropriée
      await expect(
        PasswordService.getPasswordById(passwordId, organizationId, userId)
      ).rejects.toThrow(AppError);
    });
  });

  describe('generateSecurePassword', () => {
    it('devrait générer un mot de passe avec les options par défaut', () => {
      // Appeler la méthode à tester
      const password = PasswordService.generateSecurePassword({});

      // Vérifier que le mot de passe généré répond aux critères minimaux
      expect(password).toBeDefined();
      expect(password.length).toBeGreaterThanOrEqual(12); // Longueur par défaut
    });

    it('devrait générer un mot de passe avec des options personnalisées', () => {
      // Définir les options personnalisées
      const options = {
        length: 20,
        includeUppercase: true,
        includeLowercase: true,
        includeNumbers: true,
        includeSymbols: false,
      };

      // Appeler la méthode à tester
      const password = PasswordService.generateSecurePassword(options);

      // Vérifier que le mot de passe généré respecte les options
      expect(password).toBeDefined();
      expect(password.length).toBe(options.length);
      expect(/[A-Z]/.test(password)).toBe(options.includeUppercase);
      expect(/[a-z]/.test(password)).toBe(options.includeLowercase);
      expect(/[0-9]/.test(password)).toBe(options.includeNumbers);
      expect(/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)).toBe(options.includeSymbols);
    });

    it('devrait valider les options de génération de mot de passe', () => {
      // Tester la validation avec des données valides
      const validOptions = {
        length: 16,
        includeUppercase: true,
        includeLowercase: true,
        includeNumbers: true,
        includeSymbols: true,
      };
      
      const validationResult = generatePasswordSchema.safeParse(validOptions);
      expect(validationResult.success).toBe(true);

      // Tester la validation avec des données invalides
      const invalidOptions = {
        length: 3, // Trop court
        includeUppercase: false,
        includeLowercase: false,
        includeNumbers: false,
        includeSymbols: false,
      };
      
      const invalidResult = generatePasswordSchema.safeParse(invalidOptions);
      expect(invalidResult.success).toBe(false);
    });
  });
});
