import { useState, useEffect, useCallback } from 'react';
import { PasswordsAPI, PasswordDTO, PasswordCategoryDTO, GeneratePasswordOptions } from '../lib/passwordApi';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export function usePasswords() {
  const { currentOrgId, user } = useAuth();
  const { toast } = useToast();
  
  const [passwords, setPasswords] = useState<PasswordDTO[]>([]);
  const [categories, setCategories] = useState<PasswordCategoryDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Vérifier que l'utilisateur est connecté
  const userId = user?.id;

  // Charger les mots de passe
  const loadPasswords = useCallback(async () => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await PasswordsAPI.list(userId, currentOrgId);
      // L'API retourne un objet avec une propriété data qui contient passwords
      const apiResponse = response as any;
      if (apiResponse?.success && apiResponse?.data?.passwords) {
        setPasswords(apiResponse.data.passwords);
      } else if (Array.isArray(apiResponse?.data)) {
        setPasswords(apiResponse.data);
      } else if (Array.isArray(response)) {
        setPasswords(response);
      } else {
        console.error('La réponse API n\'est pas un tableau:', response);
        setPasswords([]);
        setError('Format de données incorrect');
        toast({
          title: 'Erreur',
          description: 'Format de données incorrect pour les mots de passe',
          variant: 'destructive',
        });
      }
    } catch (err) {
      console.error('Erreur lors du chargement des mots de passe:', err);
      setError('Impossible de charger les mots de passe');
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les mots de passe',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [userId, currentOrgId, toast]);

  // Charger les catégories
  const loadCategories = useCallback(async () => {
    if (!userId) return;
    
    try {
      const response = await PasswordsAPI.listCategories(userId, currentOrgId);
      // L'API retourne un objet avec une propriété data qui contient categories
      const apiResponse = response as any;
      if (apiResponse?.success && apiResponse?.data?.categories) {
        setCategories(apiResponse.data.categories);
      } else if (Array.isArray(apiResponse?.data)) {
        setCategories(apiResponse.data);
      } else if (Array.isArray(response)) {
        setCategories(response);
      } else {
        // Fallback: créer des catégories par défaut si aucune n'est trouvée
        console.warn('Aucune catégorie trouvée, utilisation des catégories par défaut');
        setCategories([
          { id: 'general', name: 'Général', description: 'Catégorie par défaut' },
          { id: 'work', name: 'Travail', description: 'Mots de passe professionnels' },
          { id: 'personal', name: 'Personnel', description: 'Mots de passe personnels' }
        ]);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des catégories:', err);
      setError('Impossible de charger les catégories');
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les catégories',
        variant: 'destructive',
      });
    }
  }, [userId, currentOrgId, toast]);

  // Créer un mot de passe
  const createPassword = useCallback(async (passwordData: Partial<PasswordDTO>) => {
    if (!userId) return null;
    
    setLoading(true);
    try {
      const response = await PasswordsAPI.create(userId, passwordData, currentOrgId);
      // L'API peut retourner soit l'objet directement, soit un objet avec une propriété data
      const newPassword = (response as any)?.data || response;
      setPasswords(prev => [newPassword, ...prev]);
      toast({
        title: 'Succès',
        description: 'Mot de passe créé avec succès',
      });
      return newPassword;
    } catch (err) {
      console.error('Erreur lors de la création du mot de passe:', err);
      toast({
        title: 'Erreur',
        description: 'Impossible de créer le mot de passe',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [userId, currentOrgId, toast]);

  // Mettre à jour un mot de passe
  const updatePassword = useCallback(async (passwordId: string, updates: Partial<PasswordDTO>) => {
    if (!userId) return null;
    
    setLoading(true);
    try {
      const updatedPassword = await PasswordsAPI.update(userId, passwordId, updates, currentOrgId);
      setPasswords(prev => 
        prev.map(p => p.id === passwordId ? updatedPassword : p)
      );
      toast({
        title: 'Succès',
        description: 'Mot de passe mis à jour avec succès',
      });
      return updatedPassword;
    } catch (err) {
      console.error('Erreur lors de la mise à jour du mot de passe:', err);
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour le mot de passe',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [userId, currentOrgId, toast]);

  // Supprimer un mot de passe
  const deletePassword = useCallback(async (passwordId: string) => {
    if (!userId) return false;
    
    setLoading(true);
    try {
      await PasswordsAPI.remove(userId, passwordId, currentOrgId);
      setPasswords(prev => prev.filter(p => p.id !== passwordId));
      toast({
        title: 'Succès',
        description: 'Mot de passe supprimé avec succès',
      });
      return true;
    } catch (err) {
      console.error('Erreur lors de la suppression du mot de passe:', err);
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer le mot de passe',
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [userId, currentOrgId, toast]);

  // Rechercher des mots de passe
  const searchPasswords = useCallback(async (searchTerm: string) => {
    if (!userId || !searchTerm.trim()) {
      loadPasswords();
      return;
    }
    
    setLoading(true);
    try {
      const results = await PasswordsAPI.search(userId, searchTerm, currentOrgId);
      // S'assurer que results est un tableau
      if (Array.isArray(results)) {
        setPasswords(results);
      } else {
        console.error('La réponse API de recherche n\'est pas un tableau:', results);
        setPasswords([]);
        toast({
          title: 'Erreur',
          description: 'Format de données incorrect pour la recherche',
          variant: 'destructive',
        });
      }
    } catch (err) {
      console.error('Erreur lors de la recherche de mots de passe:', err);
      toast({
        title: 'Erreur',
        description: 'Impossible de rechercher les mots de passe',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [userId, currentOrgId, loadPasswords, toast]);

  // Générer un mot de passe
  const generatePassword = useCallback(async (options: GeneratePasswordOptions = {}) => {
    if (!userId) return null;
    
    try {
      const { password } = await PasswordsAPI.generate(userId, options, currentOrgId);
      return password;
    } catch (err) {
      console.error('Erreur lors de la génération du mot de passe:', err);
      toast({
        title: 'Erreur',
        description: 'Impossible de générer un mot de passe',
        variant: 'destructive',
      });
      return null;
    }
  }, [userId, currentOrgId, toast]);

  // Créer une catégorie
  const createCategory = useCallback(async (name: string, description?: string) => {
    if (!userId) return null;
    
    try {
      const newCategory = await PasswordsAPI.createCategory(userId, { name, description }, currentOrgId);
      setCategories(prev => [...prev, newCategory]);
      toast({
        title: 'Succès',
        description: 'Catégorie créée avec succès',
      });
      return newCategory;
    } catch (err) {
      console.error('Erreur lors de la création de la catégorie:', err);
      toast({
        title: 'Erreur',
        description: 'Impossible de créer la catégorie',
        variant: 'destructive',
      });
      return null;
    }
  }, [userId, currentOrgId, toast]);

  // Charger les données initiales
  useEffect(() => {
    if (userId && currentOrgId) {
      loadPasswords();
      loadCategories();
    }
  }, [userId, currentOrgId, loadPasswords, loadCategories]);

  return {
    passwords,
    categories,
    loading,
    error,
    loadPasswords,
    loadCategories,
    createPassword,
    updatePassword,
    deletePassword,
    searchPasswords,
    generatePassword,
    createCategory,
  };
}
