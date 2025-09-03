import { z } from 'zod';
import { supabase } from '../config/supabase';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';

// Schémas de validation
export const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
});

export const registerSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
  firstName: z.string().min(1, 'Le prénom est requis'),
  lastName: z.string().min(1, 'Le nom est requis'),
});

// Types
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface UserProfile {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
}

export interface OrganizationMember {
  id: string;
  name: string;
  role: string;
}

export class SupabaseAuthService {
  /**
   * Connexion d'un utilisateur avec Supabase Auth
   */
  static async login(credentials: z.infer<typeof loginSchema>): Promise<{
    user: UserProfile;
    tokens: AuthTokens;
    organizations: OrganizationMember[];
  }> {
    try {
      // Validation des données
      const validatedData = loginSchema.parse(credentials);
      
      // Authentification avec Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: validatedData.email,
        password: validatedData.password,
      });

      if (authError) {
        logger.warn(`Tentative de connexion échouée pour: ${validatedData.email}`, { error: authError });
        throw new AppError('Email ou mot de passe incorrect', 401);
      }

      if (!authData.user || !authData.session) {
        throw new AppError('Erreur lors de la connexion', 500);
      }

      logger.info(`Utilisateur connecté: ${validatedData.email}`, { userId: authData.user.id });

      // Récupérer les organisations de l'utilisateur
      const organizations = await this.getUserOrganizations(authData.user.id);

      // Créer le profil utilisateur
      const userProfile: UserProfile = {
        id: authData.user.id,
        email: authData.user.email!,
        firstName: authData.user.user_metadata?.firstName || authData.user.user_metadata?.first_name,
        lastName: authData.user.user_metadata?.lastName || authData.user.user_metadata?.last_name,
        avatarUrl: authData.user.user_metadata?.avatar_url,
        isActive: true,
        lastLogin: new Date().toISOString(),
        createdAt: authData.user.created_at,
      };

      // Générer nos propres tokens JWT pour la compatibilité
      const tokens = this.generateTokens(authData.user.id, authData.user.email!);

      return {
        user: userProfile,
        tokens,
        organizations,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Erreur lors de la connexion:', error);
      throw new AppError('Erreur interne du serveur', 500);
    }
  }

  /**
   * Inscription d'un nouvel utilisateur
   */
  static async register(userData: z.infer<typeof registerSchema>): Promise<{
    user: UserProfile;
    tokens: AuthTokens;
  }> {
    try {
      // Validation des données
      const validatedData = registerSchema.parse(userData);

      // Créer l'utilisateur avec Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: validatedData.email,
        password: validatedData.password,
        options: {
          data: {
            firstName: validatedData.firstName,
            lastName: validatedData.lastName,
            first_name: validatedData.firstName, // Compatibilité
            last_name: validatedData.lastName,   // Compatibilité
          }
        }
      });

      if (authError) {
        logger.warn(`Échec de l'inscription pour: ${validatedData.email}`, { error: authError });
        throw new AppError(authError.message, 400);
      }

      if (!authData.user) {
        throw new AppError('Erreur lors de la création du compte', 500);
      }

      logger.info(`Nouvel utilisateur créé: ${validatedData.email}`, { userId: authData.user.id });

      // Créer une organisation par défaut pour l'utilisateur
      await this.createDefaultOrganization(authData.user.id, validatedData.firstName, validatedData.lastName);

      // Créer le profil utilisateur
      const userProfile: UserProfile = {
        id: authData.user.id,
        email: authData.user.email!,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        isActive: true,
        createdAt: authData.user.created_at,
      };

      // Générer les tokens
      const tokens = this.generateTokens(authData.user.id, authData.user.email!);

      return {
        user: userProfile,
        tokens,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Erreur lors de l\'inscription:', error);
      throw new AppError('Erreur interne du serveur', 500);
    }
  }

  /**
   * Vérifier un token JWT
   */
  static async verifyToken(token: string): Promise<{ userId: string; email: string }> {
    try {
      // Vérifier notre token JWT personnalisé
      const decoded = jwt.verify(token, config.session.secret) as any;
      
      if (decoded.type !== 'access') {
        throw new AppError('Type de token invalide', 401);
      }

      // Vérifier que l'utilisateur existe toujours dans Supabase
      const { data: user, error } = await supabase.auth.admin.getUserById(decoded.userId);
      
      if (error || !user.user) {
        throw new AppError('Utilisateur non trouvé', 401);
      }

      return {
        userId: decoded.userId,
        email: decoded.email,
      };
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AppError('Token invalide', 401);
      }
      throw error;
    }
  }

  /**
   * Récupérer les organisations d'un utilisateur
   */
  static async getUserOrganizations(userId: string): Promise<OrganizationMember[]> {
    try {
      // Utiliser une requête SQL directe pour éviter les problèmes de jointure Supabase
      const { data: memberships, error } = await supabase.rpc('get_user_organizations', {
        p_user_id: userId
      });

      if (error) {
        logger.error('Erreur lors de la récupération des organisations via RPC:', error);
        
        // Fallback: requête manuelle
        logger.info(`Utilisation du fallback pour l'utilisateur: ${userId}`);
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('organization_members')
          .select('role, organization_id')
          .eq('user_id', userId);

        if (fallbackError) {
          logger.error('Erreur lors du fallback:', fallbackError);
          return [];
        }

        logger.info(`Memberships trouvées: ${fallbackData?.length || 0}`, { memberships: fallbackData });

        const organizations: OrganizationMember[] = [];
        for (const membership of fallbackData || []) {
          logger.info(`Récupération de l'organisation: ${membership.organization_id}`);
          const { data: org, error: orgError } = await supabase
            .from('organizations')
            .select('id, name')
            .eq('id', membership.organization_id)
            .single();

          if (orgError) {
            logger.error(`Erreur lors de la récupération de l'organisation ${membership.organization_id}:`, orgError);
          } else if (org) {
            logger.info(`Organisation trouvée: ${org.name}`, { org });
            organizations.push({
              id: org.id,
              name: org.name,
              role: membership.role,
            });
          }
        }

        logger.info(`Total organisations récupérées: ${organizations.length}`, { organizations });
        return organizations;
      }

      return memberships || [];
    } catch (error) {
      logger.error('Erreur lors de la récupération des organisations:', error);
      return [];
    }
  }

  /**
   * Créer une organisation par défaut pour un nouvel utilisateur
   */
  static async createDefaultOrganization(userId: string, firstName: string, lastName: string): Promise<void> {
    try {
      // Créer l'organisation
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert([{
          name: `Organisation de ${firstName} ${lastName}`,
          description: 'Organisation personnelle',
          owner_id: userId,
        }])
        .select()
        .single();

      if (orgError) {
        logger.error('Erreur lors de la création de l\'organisation:', orgError);
        return;
      }

      // Ajouter l'utilisateur comme membre propriétaire
      const { error: memberError } = await supabase
        .from('organization_members')
        .insert([{
          organization_id: org.id,
          user_id: userId,
          role: 'owner',
        }]);

      if (memberError) {
        logger.error('Erreur lors de l\'ajout du membre:', memberError);
      } else {
        logger.info(`Organisation par défaut créée pour l'utilisateur ${userId}`, { orgId: org.id });
      }
    } catch (error) {
      logger.error('Erreur lors de la création de l\'organisation par défaut:', error);
    }
  }

  /**
   * Récupérer le profil d'un utilisateur par son ID
   */
  static async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const { data: user, error } = await supabase.auth.admin.getUserById(userId);
      
      if (error || !user.user) {
        return null;
      }

      return {
        id: user.user.id,
        email: user.user.email!,
        firstName: user.user.user_metadata?.firstName || user.user.user_metadata?.first_name,
        lastName: user.user.user_metadata?.lastName || user.user.user_metadata?.last_name,
        avatarUrl: user.user.user_metadata?.avatar_url,
        isActive: true,
        lastLogin: user.user.last_sign_in_at,
        createdAt: user.user.created_at,
      };
    } catch (error) {
      logger.error('Erreur lors de la récupération du profil:', error);
      return null;
    }
  }

  /**
   * Générer les tokens JWT
   */
  static generateTokens(userId: string, email: string): AuthTokens {
    const accessToken = jwt.sign(
      { 
        userId, 
        email, 
        type: 'access',
        iat: Math.floor(Date.now() / 1000),
      },
      config.session.secret,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { 
        userId, 
        email, 
        type: 'refresh',
        iat: Math.floor(Date.now() / 1000),
      },
      config.session.secret,
      { expiresIn: '30d' }
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 minutes
    };
  }

  /**
   * Rafraîchir un token d'accès
   */
  static async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      const decoded = jwt.verify(refreshToken, config.session.secret) as any;
      
      if (decoded.type !== 'refresh') {
        throw new AppError('Type de token invalide', 401);
      }

      // Vérifier que l'utilisateur existe toujours
      const { data: user, error } = await supabase.auth.admin.getUserById(decoded.userId);
      
      if (error || !user.user) {
        throw new AppError('Utilisateur non trouvé', 401);
      }

      // Générer de nouveaux tokens
      return this.generateTokens(decoded.userId, decoded.email);
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AppError('Token de rafraîchissement invalide', 401);
      }
      throw error;
    }
  }

  /**
   * Déconnexion (invalider la session Supabase)
   */
  static async logout(): Promise<void> {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      logger.error('Erreur lors de la déconnexion:', error);
    }
  }
}
