import CryptoJS from 'crypto-js';
import { supabase } from '../config/supabase';
import { config } from '../config/env';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';
import { OrganizationService } from './organization.service';
import { z } from 'zod';

// Schémas de validation
export const createPasswordSchema = z.object({
  title: z.string().min(1, 'Le titre est requis'),
  username: z.string().optional(),
  password: z.string().min(1, 'Le mot de passe est requis'),
  url: z.preprocess(
    // Prétraiter pour gérer les chaînes vides et null
    (val) => val === '' || val === null ? undefined : val,
    // Accepter n'importe quelle chaîne de caractères
    z.string().optional()
  ),
  notes: z.string().optional(),
  categoryId: z.preprocess(
    // Prétraiter pour gérer les chaînes vides, null et undefined
    (val) => {
      if (val === '' || val === null || val === undefined) return undefined;
      return val;
    },
    // Accepter n'importe quelle chaîne de caractères ou undefined
    z.string().optional()
  ),
});

export const updatePasswordSchema = createPasswordSchema.partial();

export const generatePasswordSchema = z.object({
  length: z.number().min(8).max(128).default(16),
  includeUppercase: z.boolean().default(true),
  includeLowercase: z.boolean().default(true),
  includeNumbers: z.boolean().default(true),
  includeSymbols: z.boolean().default(true),
  excludeSimilar: z.boolean().default(true),
});

export interface Password {
  id: string;
  title: string;
  username?: string;
  password: string;
  url?: string;
  notes?: string;
  categoryId?: string;
  organizationId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
  creator?: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
}

export interface PasswordCategory {
  id: string;
  name: string;
  description?: string;
  organizationId: string;
  createdBy: string;
  createdAt: string;
  passwordCount?: number;
}

export class PasswordService {
  /**
   * Chiffrer un mot de passe
   */
  private static encryptPassword(password: string): string {
    return CryptoJS.AES.encrypt(password, config.security.encryptionKey).toString();
  }

  /**
   * Déchiffrer un mot de passe
   */
  private static decryptPassword(encryptedPassword: string): string {
    const bytes = CryptoJS.AES.decrypt(encryptedPassword, config.security.encryptionKey);
    return bytes.toString(CryptoJS.enc.Utf8);
  }

  /**
   * Générer un mot de passe sécurisé
   */
  static generateSecurePassword(options: Partial<z.infer<typeof generatePasswordSchema>> = {}): string {
    const defaultOptions: z.infer<typeof generatePasswordSchema> = {
      length: 16,
      includeUppercase: true,
      includeLowercase: true,
      includeNumbers: true,
      includeSymbols: true,
      excludeSimilar: false
    };
    
    const finalOptions = { ...defaultOptions, ...options };
    const validatedOptions = generatePasswordSchema.parse(options);
    
    let charset = '';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    const similar = 'il1Lo0O';

    if (validatedOptions.includeUppercase) charset += uppercase;
    if (validatedOptions.includeLowercase) charset += lowercase;
    if (validatedOptions.includeNumbers) charset += numbers;
    if (validatedOptions.includeSymbols) charset += symbols;

    if (validatedOptions.excludeSimilar) {
      charset = charset.split('').filter(char => !similar.includes(char)).join('');
    }

    if (charset.length === 0) {
      throw new AppError('Au moins un type de caractère doit être sélectionné', 400);
    }

    let password = '';
    for (let i = 0; i < validatedOptions.length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }

    // S'assurer qu'au moins un caractère de chaque type sélectionné est présent
    let requiredChars = '';
    if (validatedOptions.includeUppercase) requiredChars += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
    if (validatedOptions.includeLowercase) requiredChars += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
    if (validatedOptions.includeNumbers) requiredChars += numbers.charAt(Math.floor(Math.random() * numbers.length));
    if (validatedOptions.includeSymbols) requiredChars += symbols.charAt(Math.floor(Math.random() * symbols.length));

    // Remplacer les premiers caractères par les caractères requis
    for (let i = 0; i < requiredChars.length && i < password.length; i++) {
      password = password.substring(0, i) + requiredChars[i] + password.substring(i + 1);
    }

    // Mélanger le mot de passe
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }

  /**
   * Créer un nouveau mot de passe
   */
  static async createPassword(
    organizationId: string,
    userId: string,
    passwordData: z.infer<typeof createPasswordSchema>
  ): Promise<Password> {
    try {
      logger.info('Début création mot de passe:', { organizationId, userId, passwordData });
      const validatedData = createPasswordSchema.parse(passwordData);
      logger.info('Données validées:', validatedData);

      // Vérifier les permissions
      logger.info('Vérification des permissions...');
      const { hasPermission } = await OrganizationService.checkUserPermission(
        organizationId,
        userId,
        ['owner', 'admin', 'manager', 'user']
      );
      logger.info('Permissions vérifiées:', { hasPermission });

      if (!hasPermission) {
        throw new AppError('Permissions insuffisantes', 403);
      }

      // Chiffrer le mot de passe
      logger.info('Chiffrement du mot de passe...');
      const encryptedPassword = this.encryptPassword(validatedData.password);
      logger.info('Mot de passe chiffré avec succès');

      // Créer le mot de passe
      const insertData: any = {
        site_name: validatedData.title,
        username: validatedData.username,
        password: encryptedPassword,
        url: validatedData.url,
        notes: validatedData.notes,
        organization_id: organizationId,
        user_id: userId,
        is_deleted: false,
      };

      // Ajouter category seulement s'il est défini
      if (validatedData.categoryId) {
        insertData.category = validatedData.categoryId;
      }

      logger.info('Données à insérer:', insertData);
      const { data: password, error } = await supabase
        .from('passwords')
        .insert(insertData)
        .select('*')
        .single();
      
      logger.info('Résultat insertion:', { password, error });

      if (error || !password) {
        logger.error('Erreur lors de la création du mot de passe:', error);
        throw new AppError('Erreur lors de la création du mot de passe', 500);
      }

      logger.info(`Mot de passe créé: ${password.site_name} par ${userId}`);

      // Test simple sans récupération de profil
      return {
        id: password.id,
        title: password.site_name,
        username: password.username,
        password: this.decryptPassword(password.password),
        url: password.url,
        notes: password.notes,
        categoryId: password.category,
        organizationId: password.organization_id,
        createdBy: password.user_id,
        createdAt: password.created_at,
        updatedAt: password.updated_at,
        isDeleted: password.is_deleted,
        creator: {
          id: userId,
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
        },
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Erreur lors de la création du mot de passe:', error);
      throw new AppError('Erreur interne du serveur', 500);
    }
  }

  /**
   * Récupérer les mots de passe d'une organisation
   */
  static async getOrganizationPasswords(
    organizationId: string,
    userId: string,
    categoryId?: string
  ): Promise<Password[]> {
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
        .from('passwords')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      const { data: passwords, error } = await query;

      if (error) {
        logger.error('Erreur lors de la récupération des mots de passe:', error);
        throw new AppError('Erreur lors de la récupération des mots de passe', 500);
      }

      return passwords.map((password: any) => ({
        id: password.id,
        title: password.site_name,
        username: password.username,
        password: this.decryptPassword(password.password),
        url: password.url,
        notes: password.notes,
        categoryId: password.category,
        organizationId: password.organization_id,
        createdBy: password.user_id,
        createdAt: password.created_at,
        updatedAt: password.updated_at,
        isDeleted: password.is_deleted,
        creator: {
          id: password.user_id,
          email: 'user@example.com',
          firstName: 'User',
          lastName: 'Name',
        },
      }));
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Erreur lors de la récupération des mots de passe:', error);
      throw new AppError('Erreur interne du serveur', 500);
    }
  }

  /**
   * Récupérer un mot de passe par ID
   */
  static async getPasswordById(
    passwordId: string,
    organizationId: string,
    userId: string
  ): Promise<Password> {
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

      const { data: password, error } = await supabase
        .from('passwords')
        .select('*')
        .eq('id', passwordId)
        .eq('organization_id', organizationId)
        .eq('is_deleted', false)
        .single();

      if (error || !password) {
        throw new AppError('Mot de passe non trouvé', 404);
      }

      return {
        id: password.id,
        title: password.site_name,
        username: password.username,
        password: this.decryptPassword(password.password),
        url: password.url,
        notes: password.notes,
        categoryId: password.category,
        organizationId: password.organization_id,
        createdBy: password.user_id,
        createdAt: password.created_at,
        updatedAt: password.updated_at,
        isDeleted: password.is_deleted,
        creator: {
          id: password.user_id,
          email: 'user@example.com',
          firstName: 'User',
          lastName: 'Name',
        },
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Erreur lors de la récupération du mot de passe:', error);
      throw new AppError('Erreur interne du serveur', 500);
    }
  }

  /**
   * Mettre à jour un mot de passe
   */
  static async updatePassword(
    passwordId: string,
    organizationId: string,
    userId: string,
    updates: z.infer<typeof updatePasswordSchema>
  ): Promise<Password> {
    try {
      const validatedData = updatePasswordSchema.parse(updates);

      // Vérifier les permissions
      const { hasPermission } = await OrganizationService.checkUserPermission(
        organizationId,
        userId,
        ['owner', 'admin', 'manager', 'user']
      );

      if (!hasPermission) {
        throw new AppError('Permissions insuffisantes', 403);
      }

      // Préparer les données de mise à jour
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (validatedData.title !== undefined) updateData.title = validatedData.title;
      if (validatedData.username !== undefined) updateData.username = validatedData.username;
      if (validatedData.password !== undefined) {
        updateData.encrypted_password = this.encryptPassword(validatedData.password);
      }
      if (validatedData.url !== undefined) updateData.url = validatedData.url;
      if (validatedData.notes !== undefined) updateData.notes = validatedData.notes;
      if (validatedData.categoryId !== undefined) updateData.category_id = validatedData.categoryId;

      const { data: password, error } = await supabase
        .from('passwords')
        .update(updateData)
        .eq('id', passwordId)
        .eq('organization_id', organizationId)
        .select('*')
        .single();

      if (error || !password) {
        throw new AppError('Erreur lors de la mise à jour du mot de passe', 500);
      }

      logger.info(`Mot de passe mis à jour: ${passwordId} par ${userId}`);

      return {
        id: password.id,
        title: password.site_name,
        username: password.username,
        password: this.decryptPassword(password.password),
        url: password.url,
        notes: password.notes,
        categoryId: password.category,
        organizationId: password.organization_id,
        createdBy: password.user_id,
        createdAt: password.created_at,
        updatedAt: password.updated_at,
        isDeleted: password.is_deleted,
        creator: {
          id: password.user_id,
          email: 'user@example.com',
          firstName: 'User',
          lastName: 'Name',
        },
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Erreur lors de la mise à jour du mot de passe:', error);
      throw new AppError('Erreur interne du serveur', 500);
    }
  }

  /**
   * Supprimer un mot de passe
   */
  static async deletePassword(
    passwordId: string,
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

      // Soft delete
      const { error } = await supabase
        .from('passwords')
        .update({
          is_deleted: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', passwordId)
        .eq('organization_id', organizationId);

      if (error) {
        throw new AppError('Erreur lors de la suppression du mot de passe', 500);
      }

      logger.info(`Mot de passe supprimé: ${passwordId} par ${userId}`);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Erreur lors de la suppression du mot de passe:', error);
      throw new AppError('Erreur interne du serveur', 500);
    }
  }

  /**
   * Créer une catégorie de mots de passe
   */
  static async createCategory(
    organizationId: string,
    userId: string,
    name: string,
    description?: string
  ): Promise<PasswordCategory> {
    try {
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
        .from('password_categories')
        .insert({
          name,
          description,
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
        organizationId: category.organization_id,
        createdBy: category.created_by,
        createdAt: category.created_at,
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
  ): Promise<PasswordCategory[]> {
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
        .from('password_categories')
        .select('*')
        .eq('organization_id', organizationId)
        .order('name', { ascending: true });

      if (error) {
        logger.error('Erreur lors de la récupération des catégories:', error);
        throw new AppError('Erreur lors de la récupération des catégories', 500);
      }

      // Compter les mots de passe pour chaque catégorie
      const categoriesWithCount = await Promise.all(
        categories.map(async (category: any) => {
          const { count } = await supabase
            .from('passwords')
            .select('*', { count: 'exact', head: true })
            .eq('category_id', category.id)
            .eq('is_deleted', false);

          return {
            id: category.id,
            name: category.name,
            description: category.description,
            organizationId: category.organization_id,
            createdBy: category.created_by,
            createdAt: category.created_at,
            passwordCount: count || 0,
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
   * Rechercher des mots de passe
   */
  static async searchPasswords(
    organizationId: string,
    userId: string,
    searchTerm: string
  ): Promise<Password[]> {
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

      const { data: passwords, error } = await supabase
        .from('passwords')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_deleted', false)
        .or(`title.ilike.%${searchTerm}%,username.ilike.%${searchTerm}%,url.ilike.%${searchTerm}%,notes.ilike.%${searchTerm}%`)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Erreur lors de la recherche de mots de passe:', error);
        throw new AppError('Erreur lors de la recherche de mots de passe', 500);
      }

      return passwords.map((password: any) => ({
        id: password.id,
        title: password.site_name,
        username: password.username,
        password: this.decryptPassword(password.password),
        url: password.url,
        notes: password.notes,
        categoryId: password.category,
        organizationId: password.organization_id,
        createdBy: password.user_id,
        createdAt: password.created_at,
        updatedAt: password.updated_at,
        isDeleted: password.is_deleted,
        creator: {
          id: password.user_id,
          email: 'user@example.com',
          firstName: 'User',
          lastName: 'Name',
        },
      }));
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Erreur lors de la recherche de mots de passe:', error);
      throw new AppError('Erreur interne du serveur', 500);
    }
  }
}
