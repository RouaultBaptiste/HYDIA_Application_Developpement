import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase, supabaseAuth } from '../config/supabase';
import { config } from '../config/env';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';
import { z } from 'zod';

// Schémas de validation
export const registerSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
  firstName: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'),
  lastName: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
});

export const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
});

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

export class AuthService {
  /**
   * Inscription d'un nouvel utilisateur
   */
  static async register(userData: z.infer<typeof registerSchema>): Promise<{ user: UserProfile; tokens: AuthTokens }> {
    try {
      // Validation des données
      const validatedData = registerSchema.parse(userData);

      // Vérifier si l'utilisateur existe déjà
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', validatedData.email)
        .single();

      if (existingUser) {
        throw new AppError('Un utilisateur avec cet email existe déjà', 409);
      }

      // Créer l'utilisateur avec l'API Admin (service role) et le marquer confirmé (dev)
      const { data: adminCreate, error: adminErr } = await (supabase as any).auth.admin.createUser({
        email: validatedData.email,
        password: validatedData.password,
        email_confirm: true,
        user_metadata: {
          first_name: validatedData.firstName,
          last_name: validatedData.lastName,
        },
      });

      if (adminErr || !adminCreate?.user) {
        logger.error('Erreur lors de la création du compte Supabase (admin):', adminErr);
        throw new AppError('Erreur lors de la création du compte', 500);
      }

      // Attendre que le trigger automatique crée le profil
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Récupérer le profil créé par le trigger
      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', adminCreate.user.id)
        .single();

      if (profileError || !userProfile) {
        logger.error('Erreur lors de la récupération du profil:', profileError);
        throw new AppError('Erreur lors de la création du profil', 500);
      }

      // Créer une organisation personnelle pour l'utilisateur
      const { data: organization, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: `Organisation de ${userProfile.first_name || 'Utilisateur'}`,
          description: 'Organisation personnelle',
          owner_id: userProfile.id,
        })
        .select()
        .single();

      if (orgError) {
        logger.error('Erreur lors de la création de l\'organisation:', orgError);
        // Ne pas faire échouer l'inscription pour cela
      } else {
        // Ajouter l'utilisateur comme membre de son organisation
        await supabase
          .from('organization_members')
          .insert({
            organization_id: organization.id,
            user_id: userProfile.id,
            role: 'owner',
          });
      }

      // Générer les tokens JWT
      const tokens = this.generateTokens(userProfile.id, userProfile.email);

      logger.info(`Nouvel utilisateur créé: ${userProfile.email}`);

      return {
        user: {
          id: userProfile.id,
          email: userProfile.email,
          firstName: userProfile.first_name,
          lastName: userProfile.last_name,
          avatarUrl: userProfile.avatar_url,
          isActive: userProfile.is_active,
          lastLogin: userProfile.last_login,
          createdAt: userProfile.created_at,
        },
        tokens,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Erreur lors de l\'inscription:', error);
      throw new AppError('Erreur interne du serveur', 500);
    }
  }

  /**
   * Connexion d'un utilisateur
   */
  static async login(credentials: z.infer<typeof loginSchema>): Promise<{ user: UserProfile; tokens: AuthTokens }> {
    try {
      // Validation des données
      const validatedData = loginSchema.parse(credentials);

      // Authentification avec Supabase
      const { data: authData, error: authError } = await supabaseAuth.auth.signInWithPassword({
        email: validatedData.email,
        password: validatedData.password,
      });

      if (authError || !authData.user) {
        logger.warn(`Tentative de connexion échouée pour: ${validatedData.email}`);
        throw new AppError('Email ou mot de passe incorrect', 401);
      }

      // Récupérer le profil utilisateur
      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (profileError || !userProfile) {
        logger.error('Utilisateur non trouvé ou inactif:', profileError);
        throw new AppError('Utilisateur non trouvé ou inactif', 404);
      }

      // Mettre à jour la dernière connexion
      await supabase
        .from('profiles')
        .update({ last_login: new Date().toISOString() })
        .eq('id', userProfile.id);

      // Générer les tokens JWT
      const tokens = this.generateTokens(userProfile.id, userProfile.email);

      logger.info(`Utilisateur connecté: ${userProfile.email}`);

      return {
        user: {
          id: userProfile.id,
          email: userProfile.email,
          firstName: userProfile.first_name,
          lastName: userProfile.last_name,
          avatarUrl: userProfile.avatar_url,
          isActive: userProfile.is_active,
          lastLogin: userProfile.last_login,
          createdAt: userProfile.created_at,
        },
        tokens,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Erreur lors de la connexion:', error);
      throw new AppError('Erreur interne du serveur', 500);
    }
  }

  /**
   * Rafraîchir les tokens
   */
  static async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    try {
      const decoded = jwt.verify(refreshToken, config.jwt.secret) as any;
      
      if (decoded.type !== 'refresh') {
        throw new AppError('Token de rafraîchissement invalide', 401);
      }

      // Vérifier que l'utilisateur existe toujours
      const { data: user } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('id', decoded.userId)
        .eq('is_active', true)
        .single();

      if (!user) {
        throw new AppError('Utilisateur non trouvé', 404);
      }

      return this.generateTokens(user.id, user.email);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Erreur lors du rafraîchissement des tokens:', error);
      throw new AppError('Token de rafraîchissement invalide', 401);
    }
  }

  /**
   * Déconnexion
   */
  static async logout(userId: string): Promise<void> {
    try {
      // Déconnecter de Supabase Auth
      await supabaseAuth.auth.signOut();
      
      logger.info(`Utilisateur déconnecté: ${userId}`);
    } catch (error) {
      logger.error('Erreur lors de la déconnexion:', error);
      throw new AppError('Erreur lors de la déconnexion', 500);
    }
  }

  /**
   * Récupérer le profil utilisateur
   */
  static async getProfile(userId: string): Promise<UserProfile> {
    try {
      // D'abord vérifier si l'utilisateur existe (sans filtrer sur is_active)
      const { data: userProfile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !userProfile) {
        logger.error('Utilisateur non trouvé dans profiles:', { userId, error });
        throw new AppError('Utilisateur non trouvé', 404);
      }

      // Vérifier si l'utilisateur est actif
      if (!userProfile.is_active) {
        logger.warn('Utilisateur inactif:', { userId, email: userProfile.email });
        throw new AppError('Compte utilisateur désactivé', 403);
      }

      return {
        id: userProfile.id,
        email: userProfile.email,
        firstName: userProfile.first_name,
        lastName: userProfile.last_name,
        avatarUrl: userProfile.avatar_url,
        isActive: userProfile.is_active,
        lastLogin: userProfile.last_login,
        createdAt: userProfile.created_at,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Erreur lors de la récupération du profil:', error);
      throw new AppError('Erreur interne du serveur', 500);
    }
  }

  /**
   * Mettre à jour le profil utilisateur
   */
  static async updateProfile(userId: string, updates: Partial<Pick<UserProfile, 'firstName' | 'lastName' | 'avatarUrl'>>): Promise<UserProfile> {
    try {
      const { data: updatedProfile, error } = await supabase
        .from('profiles')
        .update({
          first_name: updates.firstName,
          last_name: updates.lastName,
          avatar_url: updates.avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();

      if (error || !updatedProfile) {
        throw new AppError('Erreur lors de la mise à jour du profil', 500);
      }

      return {
        id: updatedProfile.id,
        email: updatedProfile.email,
        firstName: updatedProfile.first_name,
        lastName: updatedProfile.last_name,
        avatarUrl: updatedProfile.avatar_url,
        isActive: updatedProfile.is_active,
        lastLogin: updatedProfile.last_login,
        createdAt: updatedProfile.created_at,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Erreur lors de la mise à jour du profil:', error);
      throw new AppError('Erreur interne du serveur', 500);
    }
  }

  /**
   * Générer les tokens JWT
   */
  private static generateTokens(userId: string, email: string): AuthTokens {
    const payload = { userId, email, type: 'access' };
    const refreshPayload = { userId, email, type: 'refresh' };
    
    // Utiliser une approche pragmatique pour contourner les problèmes de types JWT
    const jwtSecret = config.jwt.secret;
    
    // Créer les tokens en utilisant any pour éviter les conflits de surcharge TypeScript
    const accessToken = (jwt as any).sign(
      payload,
      jwtSecret,
      { expiresIn: config.jwt.expiresIn }
    ) as string;
    
    const refreshToken = (jwt as any).sign(
      refreshPayload,
      jwtSecret,
      { expiresIn: config.jwt.refreshExpiresIn }
    ) as string;

    // Calculer l'expiration en secondes
    const expiresIn = jwt.decode(accessToken) as any;
    const expirationTime = expiresIn.exp - Math.floor(Date.now() / 1000);

    return {
      accessToken,
      refreshToken,
      expiresIn: expirationTime,
    };
  }

  /**
   * Vérifier un token JWT
   */
  static verifyToken(token: string): { userId: string; email: string } {
    try {
      const decoded = jwt.verify(token, config.jwt.secret) as any;
      
      if (decoded.type !== 'access') {
        throw new AppError('Type de token invalide', 401);
      }

      return {
        userId: decoded.userId,
        email: decoded.email,
      };
    } catch (error) {
      throw new AppError('Token invalide', 401);
    }
  }
}
