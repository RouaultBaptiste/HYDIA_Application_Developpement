-- Migration: Créer la fonction RPC set_app_context pour RLS
-- Cette fonction permet de définir le contexte utilisateur/organisation pour les politiques RLS

-- Créer le schéma app s'il n'existe pas
create schema if not exists app;

-- Fonction principale pour définir le contexte applicatif
create or replace function app.set_app_context(user_id uuid, org_id uuid default null)
returns void
language plpgsql
security definer
as $$
begin
  -- Définir l'ID utilisateur dans la configuration de session
  perform set_config('app.user_id', coalesce(user_id::text, ''), true);
  
  -- Définir l'ID organisation dans la configuration de session
  perform set_config('app.org_id', coalesce(org_id::text, ''), true);
end;
$$;

-- Fonction RPC publique compatible Supabase
create or replace function set_app_context(user_id uuid, org_id uuid default null)
returns void
language sql
security definer
as $$
  select app.set_app_context(user_id, org_id);
$$;

-- Accorder les permissions d'exécution
grant execute on function app.set_app_context(uuid, uuid) to authenticated;
grant execute on function set_app_context(uuid, uuid) to authenticated;

-- Fonction utilitaire pour récupérer l'utilisateur courant
create or replace function app.current_user_id()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('app.user_id', true), '')::uuid;
$$;

-- Fonction utilitaire pour récupérer l'organisation courante
create or replace function app.current_org_id()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('app.org_id', true), '')::uuid;
$$;

-- Accorder les permissions sur les fonctions utilitaires
grant execute on function app.current_user_id() to authenticated;
grant execute on function app.current_org_id() to authenticated;
