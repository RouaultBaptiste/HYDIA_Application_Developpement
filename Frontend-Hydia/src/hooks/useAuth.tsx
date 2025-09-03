import { createContext, useContext, useState, useEffect, ReactNode, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
}

interface Organization {
  id: string;
  name: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  organizations: Organization[];
  currentOrgId: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  selectOrganization: (orgId: string) => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = import.meta.env.VITE_API_URL || (window as any).__HYDIA_API_URL__ || 'http://localhost:3001/api/v1';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrgId, setCurrentOrgId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastRefreshRef = useRef<number>(0);

  const isAuthenticated = !!user;

  // Fonction utilitaire pour les appels API avec gestion d'erreurs robuste et logs détaillés
  const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    const startTime = Date.now();

    try {
      // Éviter le double préfixe /api/v1 en vérifiant si le endpoint commence déjà par /api/v1
      const adjustedEndpoint = endpoint.startsWith('/api/v1') ? endpoint.substring(7) : endpoint;
      const fullUrl = `${API_BASE_URL}${adjustedEndpoint}`;
      
      console.log(`[useAuth] ${options.method || 'GET'} ${fullUrl}`);
      
      const response = await fetch(fullUrl, {
        method: options.method || 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        signal: controller.signal,
        ...options,
      });

      const duration = Date.now() - startTime;
      console.log(`[useAuth] Réponse ${response.status} en ${duration}ms pour ${options.method || 'GET'} ${fullUrl}`);

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        let errorMessage = `HTTP ${response.status}`;
        let errorData: any = null;
        
        try {
          errorData = JSON.parse(text);
          errorMessage = errorData.error?.message || errorData.message || errorMessage;
        } catch {
          errorMessage = text || response.statusText || errorMessage;
        }
        
        console.error(`[useAuth] Erreur ${response.status}:`, errorMessage, errorData);
        throw new Error(errorMessage);
      }

      const responseData = await response.json();
      console.log(`[useAuth] Données reçues:`, responseData);
      return responseData;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      if (error.name === 'AbortError') {
        console.error(`[useAuth] Timeout après ${duration}ms pour ${endpoint}`);
        throw new Error('Délai d\'attente dépassé');
      }
      console.error(`[useAuth] Erreur réseau après ${duration}ms:`, error);
      throw new Error(`Erreur réseau: ${error.message || error}`);
    } finally {
      clearTimeout(timeoutId);
    }
  };

  // Fonction pour rafraîchir le token d'authentification
  const refreshToken = useCallback(async () => {
    const now = Date.now();
    // Éviter les rafraîchissements trop fréquents (moins de 5 minutes)
    if (now - lastRefreshRef.current < 5 * 60 * 1000) {
      console.log('[useAuth] Rafraîchissement de token ignoré (trop récent)');
      return;
    }

    try {
      console.log('[useAuth] Rafraîchissement du token...');
      await apiCall('/auth/refresh', { method: 'POST' });
      lastRefreshRef.current = now;
      console.log('[useAuth] Token rafraîchi avec succès');
    } catch (error) {
      console.error('[useAuth] Erreur lors du rafraîchissement du token:', error);
      // Si le rafraîchissement échoue, déconnecter l'utilisateur
      await logout();
    }
  }, []);

  // Vérifier l'authentification au chargement
  const refreshAuth = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log('[useAuth] Vérification de l\'authentification...');
      const data = await apiCall('/auth/me');
      
      if (data.success) {
        console.log('[useAuth] Utilisateur authentifié:', data.data.user.email);
        setUser(data.data.user);
        setOrganizations(data.data.organizations || []);
        setCurrentOrgId(data.data.currentOrgId || null);
        
        // Démarrer le rafraîchissement automatique du token
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
        }
        // Rafraîchir le token toutes les 10 minutes
        refreshIntervalRef.current = setInterval(refreshToken, 10 * 60 * 1000);
      }
    } catch (error) {
      console.log('[useAuth] Non authentifié:', error);
      setUser(null);
      setOrganizations([]);
      setCurrentOrgId(null);
      
      // Arrêter le rafraîchissement automatique
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    } finally {
      setIsLoading(false);
    }
  }, [refreshToken]);

  // Login
  const login = async (email: string, password: string) => {
    try {
      console.log('[useAuth] Tentative de connexion pour:', email);
      const data = await apiCall('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (data.success) {
        console.log('[useAuth] Connexion réussie, code:', data.code);
        
        if (data.code === 'NO_ORGANIZATIONS') {
          throw new Error('Aucune organisation associée à ce compte');
        }
        
        if (data.code === 'NEEDS_ORG_SELECTION') {
          // Utilisateur a plusieurs orgs, on les stocke temporairement
          console.log('[useAuth] Sélection d\'organisation requise');
          setOrganizations(data.data.organizations || []);
          setUser(data.data.user);
          // Rediriger vers sélection d'org (à implémenter)
          return;
        }

        // Login réussi avec org unique
        console.log('[useAuth] Connexion réussie avec organisation:', data.data.currentOrgId);
        setUser(data.data.user);
        setOrganizations(data.data.organizations || []);
        setCurrentOrgId(data.data.currentOrgId || null);
        
        // Démarrer le rafraîchissement automatique du token
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
        }
        refreshIntervalRef.current = setInterval(refreshToken, 10 * 60 * 1000);
        
        navigate('/');
      }
    } catch (error) {
      console.error('[useAuth] Erreur de connexion:', error);
      throw error;
    }
  };

  // Sélection d'organisation
  const selectOrganization = async (orgId: string) => {
    try {
      console.log('[useAuth] Sélection de l\'organisation:', orgId);
      const data = await apiCall('/auth/select-organization', {
        method: 'POST',
        body: JSON.stringify({ organizationId: orgId }),
      });

      if (data.success) {
        console.log('[useAuth] Organisation sélectionnée avec succès:', data.data.organizationName);
        setCurrentOrgId(orgId);
        
        // Démarrer le rafraîchissement automatique du token si pas déjà fait
        if (!refreshIntervalRef.current) {
          refreshIntervalRef.current = setInterval(refreshToken, 10 * 60 * 1000);
        }
        
        navigate('/');
      }
    } catch (error) {
      console.error('[useAuth] Erreur lors de la sélection d\'organisation:', error);
      throw error;
    }
  };

  // Logout
  const logout = async () => {
    try {
      console.log('[useAuth] Déconnexion...');
      await apiCall('/auth/logout', { method: 'POST' });
      console.log('[useAuth] Déconnexion réussie');
    } catch (error) {
      console.error('[useAuth] Erreur logout:', error);
    } finally {
      // Arrêter le rafraîchissement automatique
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
      
      setUser(null);
      setOrganizations([]);
      setCurrentOrgId(null);
      navigate('/login');
    }
  };

  // Vérifier l'auth au montage et nettoyer les intervalles au démontage
  useEffect(() => {
    refreshAuth();
    
    // Nettoyage au démontage du composant
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [refreshAuth]);

  // Gérer la visibilité de la page pour rafraîchir l'auth
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && isAuthenticated) {
        console.log('[useAuth] Page redevenue visible, vérification de l\'authentification');
        refreshAuth();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAuthenticated, refreshAuth]);

  const value: AuthContextType = {
    user,
    organizations,
    currentOrgId,
    isAuthenticated,
    isLoading,
    login,
    logout,
    selectOrganization,
    refreshAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
