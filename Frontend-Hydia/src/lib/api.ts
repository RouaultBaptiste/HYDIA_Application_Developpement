// Enhanced API client with automatic token refresh and detailed error handling
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'

const API_URL = import.meta.env.VITE_API_URL as string | undefined

if (!API_URL) {
  // Non-fatal: we allow local UI to work without backend. Log once in dev.
  // eslint-disable-next-line no-console
  console.warn('[api] VITE_API_URL is not set. Backend calls will fail; UI should gracefully fallback.')
}

// Interface pour les erreurs API structurées
interface APIError {
  success: false;
  error: {
    message: string;
    code?: string;
    statusCode: number;
    details?: any;
  };
}

// Interface pour les réponses API réussies
interface APIResponse<T> {
  success: true;
  data: T;
  message?: string;
}

// Flag pour éviter les tentatives de refresh multiples simultanées
let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

// Queue des requêtes en attente pendant le refresh
interface PendingRequest {
  resolve: (value: any) => void;
  reject: (error: any) => void;
  path: string;
  options: RequestInit;
}
let pendingRequests: PendingRequest[] = [];

/**
 * Tente de rafraîchir le token d'authentification
 * @returns Promise<boolean> - true si le refresh a réussi, false sinon
 */
async function refreshAuthToken(): Promise<boolean> {
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      console.log('[API] Tentative de rafraîchissement du token...');
      
      const refreshUrl = `${API_URL}/auth/refresh`;
      const refreshRes = await fetch(refreshUrl, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        console.log('[API] Token rafraîchi avec succès');
        
        // Traiter les requêtes en attente
        const requests = [...pendingRequests];
        pendingRequests = [];
        
        for (const request of requests) {
          try {
            const result = await apiFetchInternal(request.path, request.options, false);
            request.resolve(result);
          } catch (error) {
            request.reject(error);
          }
        }
        
        return true;
      } else {
        console.warn('[API] Échec du rafraîchissement du token:', refreshRes.status);
        
        // Rejeter toutes les requêtes en attente
        const requests = [...pendingRequests];
        pendingRequests = [];
        
        for (const request of requests) {
          request.reject(new Error('Session expirée. Veuillez vous reconnecter.'));
        }
        
        // Rediriger vers la page de connexion
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        
        return false;
      }
    } catch (error) {
      console.error('[API] Erreur lors du rafraîchissement du token:', error);
      
      // Rejeter toutes les requêtes en attente
      const requests = [...pendingRequests];
      pendingRequests = [];
      
      for (const request of requests) {
        request.reject(new Error('Erreur de connexion. Veuillez réessayer.'));
      }
      
      return false;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/**
 * Fonction interne pour les appels API avec gestion du retry
 */
async function apiFetchInternal<T>(path: string, options: RequestInit = {}, allowRetry: boolean = true): Promise<T> {
  // Éviter le double préfixe /api/v1 en vérifiant si le chemin commence déjà par /api/v1
  const adjustedPath = path.startsWith('/api/v1') ? path.substring(7) : path
  const url = `${API_URL ?? ''}${adjustedPath}`
  
  console.log(`[API] ${options.method || 'GET'} ${url}`);
  
  const res = await fetch(url, {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    credentials: 'include',
    body: options.body,
    signal: options.signal,
  })

  console.log(`[API] Réponse ${res.status} pour ${options.method || 'GET'} ${url}`);

  if (!res.ok) {
    let errorDetail: APIError | any = null;
    
    try {
      const text = await res.text();
      if (text) {
        errorDetail = JSON.parse(text);
      }
    } catch {
      // Ignore parsing errors
    }

    // Gestion spécifique des erreurs 401 (token expiré)
    if (res.status === 401 && allowRetry && !path.includes('/auth/refresh')) {
      console.log('[API] Token expiré, tentative de rafraîchissement...');
      
      if (isRefreshing) {
        // Si un refresh est déjà en cours, ajouter la requête à la queue
        return new Promise<T>((resolve, reject) => {
          pendingRequests.push({ resolve, reject, path, options });
        });
      }
      
      const refreshSuccess = await refreshAuthToken();
      if (refreshSuccess) {
        // Réessayer la requête originale
        return apiFetchInternal<T>(path, options, false);
      }
    }

    // Gestion spécifique des erreurs 403 (permissions insuffisantes)
    if (res.status === 403) {
      const errorMessage = errorDetail?.error?.message || 'Accès refusé';
      const errorCode = errorDetail?.error?.code;
      
      if (errorCode === 'ORGANIZATION_PERMISSION_DENIED') {
        throw new Error('Vous n\'avez pas les permissions nécessaires pour effectuer cette action dans cette organisation.');
      } else if (errorCode === 'ORGANIZATION_ACCESS_DENIED') {
        throw new Error('Vous n\'avez pas accès à cette organisation.');
      } else {
        throw new Error(`Accès refusé: ${errorMessage}`);
      }
    }

    // Gestion des autres erreurs
    const errorMessage = errorDetail?.error?.message || errorDetail?.message || res.statusText || 'Erreur inconnue';
    console.error(`[API] Erreur ${res.status}:`, errorMessage, errorDetail);
    
    throw new Error(`${errorMessage} (${res.status})`);
  }

  // Some endpoints may return 204
  if (res.status === 204) return undefined as T
  
  const responseData = await res.json();
  console.log(`[API] Données reçues pour ${options.method || 'GET'} ${url}:`, responseData);
  
  return responseData as T;
}

/**
 * Fonction principale pour les appels API avec gestion automatique des erreurs et du refresh
 */
export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  return apiFetchInternal<T>(path, options, true);
}

// Notes endpoints
export interface NoteDTO {
  id: string
  title: string
  content: string
  tags: string[]
  encrypted: boolean
  favorite: boolean
  updatedAt?: string
  version?: number
  author?: string
}

export const NotesAPI = {
  list: (organizationId: string) =>
    apiFetch<any>(`/notes`, {
      headers: {
        'x-organization-id': organizationId
      }
    }).then(response => {
      // Handle wrapped response from backend
      if (response?.success && response?.data?.notes) {
        return response.data.notes;
      }
      if (response?.notes) {
        return response.notes;
      }
      if (Array.isArray(response)) {
        return response;
      }
      console.warn('[NotesAPI] Unexpected response format:', response);
      return [];
    }),

  create: (organizationId: string, payload: Partial<NoteDTO>) =>
    apiFetch<any>(`/notes`, {
      method: 'POST',
      headers: {
        'x-organization-id': organizationId
      },
      body: JSON.stringify(payload),
    }).then(response => {
      // Handle wrapped response from backend
      if (response?.success && response?.data) {
        return response.data;
      }
      return response;
    }),

  update: (organizationId: string, noteId: string, payload: Partial<NoteDTO>) =>
    apiFetch<any>(`/notes/${noteId}`, {
      method: 'PUT',
      headers: {
        'x-organization-id': organizationId
      },
      body: JSON.stringify(payload),
    }).then(response => {
      // Handle wrapped response from backend
      if (response?.success && response?.data) {
        return response.data;
      }
      return response;
    }),

  remove: (organizationId: string, noteId: string) =>
    apiFetch<void>(`/notes/${noteId}`, {
      method: 'DELETE',
      headers: {
        'x-organization-id': organizationId
      }
    }),

  search: (organizationId: string, searchTerm: string) =>
    apiFetch<NoteDTO[]>(`/notes/search?q=${encodeURIComponent(searchTerm)}`, {
      headers: {
        'x-organization-id': organizationId
      }
    }),

  getByTags: (organizationId: string, tags: string[]) =>
    apiFetch<NoteDTO[]>(`/notes/by-tags?tags=${tags.map(t => encodeURIComponent(t)).join(',')}`, {
      headers: {
        'x-organization-id': organizationId
      }
    }),

  getStats: (organizationId: string) =>
    apiFetch<any>(`/notes/stats`, {
      headers: {
        'x-organization-id': organizationId
      }
    }),

  export: (organizationId: string) =>
    apiFetch<any>(`/notes/export`, {
      headers: {
        'x-organization-id': organizationId
      }
    }),

  duplicate: (organizationId: string, noteId: string) =>
    apiFetch<NoteDTO>(`/notes/${noteId}/duplicate`, {
      method: 'POST',
      headers: {
        'x-organization-id': organizationId
      }
    }),

  // Catégories de notes
  listCategories: (organizationId: string) =>
    apiFetch<any[]>(`/note-categories`, {
      headers: {
        'x-organization-id': organizationId
      }
    }),

  createCategory: (organizationId: string, payload: { name: string; description?: string }) =>
    apiFetch<any>(`/note-categories`, {
      method: 'POST',
      headers: {
        'x-organization-id': organizationId
      },
      body: JSON.stringify(payload),
    }),
}
