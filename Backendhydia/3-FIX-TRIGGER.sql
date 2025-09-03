-- =============================================================================
-- SCRIPT DE CORRECTION DU TRIGGER DE CRÉATION DE PROFIL
-- =============================================================================
-- Ce script corrige le trigger qui cause l'erreur "Database error saving new user"
-- =============================================================================

-- 1. SUPPRIMER L'ANCIEN TRIGGER ET FONCTION
-- =============================================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. CRÉER UNE NOUVELLE FONCTION SIMPLIFIÉE
-- =============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Insérer un profil basique avec gestion d'erreur
    INSERT INTO public.profiles (
        id, 
        email, 
        first_name, 
        last_name, 
        full_name,
        is_active
    ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'firstName', ''),
        COALESCE(NEW.raw_user_meta_data->>'lastName', ''),
        COALESCE(NEW.email, 'Utilisateur'),
        true
    );
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- En cas d'erreur, on log mais on n'empêche pas la création de l'utilisateur
        RAISE WARNING 'Erreur lors de la création du profil pour l''utilisateur %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. RECRÉER LE TRIGGER
-- =============================================================================
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================================================
-- ALTERNATIVE : DÉSACTIVER COMPLÈTEMENT LE TRIGGER
-- =============================================================================
-- Si le problème persiste, décommentez ces lignes pour désactiver le trigger :
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- DROP FUNCTION IF EXISTS public.handle_new_user();

-- =============================================================================
-- SCRIPT TERMINÉ
-- =============================================================================
