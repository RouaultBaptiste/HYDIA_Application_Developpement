import { apiFetch } from './api';

export interface PasswordDTO {
  id: string;
  title: string;
  username?: string;
  password: string;
  url?: string;
  notes?: string;
  categoryId?: string;
  strength?: 'weak' | 'medium' | 'strong';
  createdAt: string;
  updatedAt: string;
  favorite?: boolean;
}

export interface PasswordCategoryDTO {
  id: string;
  name: string;
  description?: string;
  passwordCount?: number;
}

export interface GeneratePasswordOptions {
  length?: number;
  includeUppercase?: boolean;
  includeLowercase?: boolean;
  includeNumbers?: boolean;
  includeSymbols?: boolean;
  excludeSimilar?: boolean;
}

export const PasswordsAPI = {
  // Récupérer tous les mots de passe d'un utilisateur
  list: (userId: string, organizationId?: string) =>
    apiFetch<PasswordDTO[]>(`/passwords`, {
      headers: {
        'x-user-id': userId,
        ...(organizationId && { 'x-organization-id': organizationId })
      }
    }),

  // Récupérer un mot de passe par ID
  getById: (userId: string, passwordId: string, organizationId?: string) =>
    apiFetch<PasswordDTO>(`/passwords/${passwordId}`, {
      headers: {
        'x-user-id': userId,
        ...(organizationId && { 'x-organization-id': organizationId })
      }
    }),

  // Créer un nouveau mot de passe
  create: (userId: string, payload: Partial<PasswordDTO>, organizationId?: string) =>
    apiFetch<PasswordDTO>(`/passwords`, {
      method: 'POST',
      headers: {
        'x-user-id': userId,
        ...(organizationId && { 'x-organization-id': organizationId })
      },
      body: JSON.stringify({
        ...payload,
        userId,
        ...(organizationId && { organizationId })
      }),
    }),

  // Mettre à jour un mot de passe existant
  update: (userId: string, passwordId: string, payload: Partial<PasswordDTO>, organizationId?: string) =>
    apiFetch<PasswordDTO>(`/passwords/${passwordId}`, {
      method: 'PUT',
      headers: {
        'x-user-id': userId,
        ...(organizationId && { 'x-organization-id': organizationId })
      },
      body: JSON.stringify({
        ...payload,
        userId,
        ...(organizationId && { organizationId })
      }),
    }),

  // Supprimer un mot de passe
  remove: (userId: string, passwordId: string, organizationId?: string) =>
    apiFetch<void>(`/passwords/${passwordId}`, {
      method: 'DELETE',
      headers: {
        'x-user-id': userId,
        ...(organizationId && { 'x-organization-id': organizationId })
      }
    }),

  // Rechercher des mots de passe
  search: (userId: string, searchTerm: string, organizationId?: string) =>
    apiFetch<PasswordDTO[]>(`/passwords/search?q=${encodeURIComponent(searchTerm)}`, {
      headers: {
        'x-user-id': userId,
        ...(organizationId && { 'x-organization-id': organizationId })
      }
    }),

  // Générer un mot de passe sécurisé
  generate: (userId: string, options: GeneratePasswordOptions, organizationId?: string) =>
    apiFetch<{ password: string }>(`/passwords/generate`, {
      method: 'POST',
      headers: {
        'x-user-id': userId,
        ...(organizationId && { 'x-organization-id': organizationId })
      },
      body: JSON.stringify({
        ...options,
        userId,
        ...(organizationId && { organizationId })
      }),
    }),

  // Récupérer toutes les catégories de mots de passe
  listCategories: (userId: string, organizationId?: string) =>
    apiFetch<PasswordCategoryDTO[]>(`/password-categories`, {
      headers: {
        'x-user-id': userId,
        ...(organizationId && { 'x-organization-id': organizationId })
      }
    }),

  // Créer une nouvelle catégorie
  createCategory: (userId: string, payload: { name: string; description?: string }, organizationId?: string) =>
    apiFetch<PasswordCategoryDTO>(`/password-categories`, {
      method: 'POST',
      headers: {
        'x-user-id': userId,
        ...(organizationId && { 'x-organization-id': organizationId })
      },
      body: JSON.stringify({
        ...payload,
        userId,
        ...(organizationId && { organizationId })
      }),
    }),
};
