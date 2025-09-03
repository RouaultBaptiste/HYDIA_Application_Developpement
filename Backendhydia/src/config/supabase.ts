import { createClient } from '@supabase/supabase-js';
import { config } from './env';
import { logger } from '../utils/logger';

// Types pour la base de données
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          created_at: string;
          updated_at: string;
          first_name?: string;
          last_name?: string;
          avatar_url?: string;
          is_active: boolean;
          last_login?: string;
        };
        Insert: {
          id?: string;
          email: string;
          first_name?: string;
          last_name?: string;
          avatar_url?: string;
          is_active?: boolean;
        };
        Update: {
          email?: string;
          first_name?: string;
          last_name?: string;
          avatar_url?: string;
          is_active?: boolean;
          last_login?: string;
        };
      };
      organizations: {
        Row: {
          id: string;
          name: string;
          description?: string;
          created_at: string;
          updated_at: string;
          owner_id: string;
          is_active: boolean;
          settings: any;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string;
          owner_id: string;
          is_active?: boolean;
          settings?: any;
        };
        Update: {
          name?: string;
          description?: string;
          is_active?: boolean;
          settings?: any;
        };
      };
      organization_members: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string;
          role: string;
          created_at: string;
          updated_at: string;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id: string;
          role: string;
          is_active?: boolean;
        };
        Update: {
          role?: string;
          is_active?: boolean;
        };
      };
      passwords: {
        Row: {
          id: string;
          title: string;
          username?: string;
          encrypted_password: string;
          url?: string;
          notes?: string;
          category_id?: string;
          organization_id: string;
          created_by: string;
          created_at: string;
          updated_at: string;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          title: string;
          username?: string;
          encrypted_password: string;
          url?: string;
          notes?: string;
          category_id?: string;
          organization_id: string;
          created_by: string;
          is_active?: boolean;
        };
        Update: {
          title?: string;
          username?: string;
          encrypted_password?: string;
          url?: string;
          notes?: string;
          category_id?: string;
          is_active?: boolean;
        };
      };
      documents: {
        Row: {
          id: string;
          title: string;
          filename: string;
          file_path: string;
          file_size: number;
          mime_type: string;
          organization_id: string;
          folder_id?: string;
          uploaded_by: string;
          created_at: string;
          updated_at: string;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          title: string;
          filename: string;
          file_path: string;
          file_size: number;
          mime_type: string;
          organization_id: string;
          folder_id?: string;
          uploaded_by: string;
          is_active?: boolean;
        };
        Update: {
          title?: string;
          folder_id?: string;
          is_active?: boolean;
        };
      };
      notes: {
        Row: {
          id: string;
          title: string;
          content: string;
          category_id?: string;
          organization_id: string;
          created_by: string;
          created_at: string;
          updated_at: string;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          title: string;
          content: string;
          category_id?: string;
          organization_id: string;
          created_by: string;
          is_active?: boolean;
        };
        Update: {
          title?: string;
          content?: string;
          category_id?: string;
          is_active?: boolean;
        };
      };
    };
  };
}

// Client Supabase avec types
export const supabase = createClient<Database>(
  config.supabase.url,
  config.supabase.serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Client pour l'authentification côté client
export const supabaseAuth = createClient(
  config.supabase.url,
  config.supabase.anonKey
);

// Test de connexion
export const testSupabaseConnection = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error) {
      logger.error('Supabase connection test failed:', error);
      return false;
    }
    
    logger.info('Supabase connection successful');
    return true;
  } catch (error) {
    logger.error('Supabase connection error:', error);
    return false;
  }
};

export default supabase;
