-- Migration SQL pour Supabase : Fonctionnalités de partage avancées
-- Cette migration ajoute des fonctionnalités supplémentaires pour le partage et des règles de sécurité

-- Ajout de nouvelles options de partage dans les paramètres des organisations
DO $$
BEGIN
    -- Vérifier si les paramètres existent déjà dans les organisations
    UPDATE public.organizations
    SET settings = settings || 
        '{"passwordSharingPolicy": {"maxShares": 20, "requireApproval": false, "allowExternalSharing": false, "allowLinks": true}, 
          "documentSharingPolicy": {"maxShares": 50, "requireApproval": false, "allowExternalSharing": false, "allowLinks": true},
          "auditSharing": true}'::jsonb
    WHERE (settings->>'passwordSharingPolicy') IS NULL;
END $$;

-- Table des demandes d'approbation de partage (pour les organisations avec requireApproval=true)
CREATE TABLE IF NOT EXISTS public.share_approvals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resource_id UUID NOT NULL,
    resource_type TEXT NOT NULL CHECK (resource_type IN ('password', 'document')),
    requested_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    requested_for UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    permissions JSONB NOT NULL DEFAULT '{"read": true, "write": false, "delete": false}'::jsonb,
    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    notes TEXT,
    CONSTRAINT unique_share_approval_request UNIQUE (resource_id, resource_type, requested_for, status)
);

-- Table des historiques d'accès aux liens de partage
CREATE TABLE IF NOT EXISTS public.share_link_accesses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    link_id UUID NOT NULL REFERENCES public.share_links(id) ON DELETE CASCADE,
    access_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ip_address TEXT,
    user_agent TEXT,
    success BOOLEAN NOT NULL DEFAULT TRUE,
    failure_reason TEXT
);

-- Table pour la rotation des mots de passe
CREATE TABLE IF NOT EXISTS public.password_rotation_policies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.password_categories(id) ON DELETE SET NULL,
    rotation_period_days INTEGER NOT NULL DEFAULT 90,
    notification_days_before INTEGER NOT NULL DEFAULT 7,
    enforce_rotation BOOLEAN NOT NULL DEFAULT FALSE,
    created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Vue pour les mots de passe qui doivent être changés
CREATE OR REPLACE VIEW public.passwords_to_rotate AS
SELECT 
    p.id,
    p.title,
    p.organization_id,
    p.updated_at,
    pr.rotation_period_days,
    pr.notification_days_before,
    (p.updated_at + (pr.rotation_period_days || ' days')::interval) AS rotation_due_date,
    NOW() > (p.updated_at + (pr.rotation_period_days || ' days')::interval) AS is_expired,
    NOW() > (p.updated_at + ((pr.rotation_period_days - pr.notification_days_before) || ' days')::interval) AS should_notify
FROM 
    public.passwords p
JOIN 
    public.password_rotation_policies pr ON 
        (p.organization_id = pr.organization_id) AND 
        (p.category_id = pr.category_id OR pr.category_id IS NULL)
WHERE 
    p.is_deleted = FALSE;

-- Ajouter une contrainte de validation sur les permissions des partages
ALTER TABLE public.password_shares
ADD CONSTRAINT check_password_share_permissions
CHECK (permissions ? 'read' AND jsonb_typeof(permissions->'read') = 'boolean');

ALTER TABLE public.document_shares
ADD CONSTRAINT check_document_share_permissions
CHECK (permissions ? 'read' AND jsonb_typeof(permissions->'read') = 'boolean');

-- Déclencheur pour vérifier les politiques de partage lors de l'ajout d'un nouveau partage de mot de passe
CREATE OR REPLACE FUNCTION check_password_sharing_policy()
RETURNS TRIGGER AS $$
DECLARE
    org_settings JSONB;
    max_shares INTEGER;
    current_shares INTEGER;
    require_approval BOOLEAN;
BEGIN
    -- Récupérer les paramètres de l'organisation
    SELECT settings INTO org_settings FROM public.organizations WHERE id = NEW.organization_id;
    
    -- Vérifier si le partage est activé
    IF NOT (org_settings->>'allowPasswordSharing')::BOOLEAN THEN
        RAISE EXCEPTION 'Le partage de mots de passe est désactivé pour cette organisation';
    END IF;
    
    -- Récupérer la politique de partage
    max_shares := (org_settings->'passwordSharingPolicy'->>'maxShares')::INTEGER;
    require_approval := (org_settings->'passwordSharingPolicy'->>'requireApproval')::BOOLEAN;
    
    -- Vérifier le nombre maximum de partages
    IF max_shares IS NOT NULL THEN
        SELECT COUNT(*) INTO current_shares FROM public.password_shares WHERE password_id = NEW.password_id;
        IF current_shares >= max_shares THEN
            RAISE EXCEPTION 'Le nombre maximum de partages (%) pour ce mot de passe a été atteint', max_shares;
        END IF;
    END IF;
    
    -- Si la validation est requise, vérifier si une approbation existe
    IF require_approval THEN
        IF NOT EXISTS (
            SELECT 1 FROM public.share_approvals 
            WHERE resource_id = NEW.password_id 
            AND resource_type = 'password' 
            AND requested_for = NEW.shared_with 
            AND status = 'approved'
        ) THEN
            RAISE EXCEPTION 'Ce partage nécessite une approbation préalable';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_password_sharing_policy
BEFORE INSERT ON public.password_shares
FOR EACH ROW EXECUTE FUNCTION check_password_sharing_policy();

-- Déclencheur pour vérifier les politiques de partage lors de l'ajout d'un nouveau partage de document
CREATE OR REPLACE FUNCTION check_document_sharing_policy()
RETURNS TRIGGER AS $$
DECLARE
    org_settings JSONB;
    max_shares INTEGER;
    current_shares INTEGER;
    require_approval BOOLEAN;
BEGIN
    -- Récupérer les paramètres de l'organisation
    SELECT settings INTO org_settings FROM public.organizations WHERE id = NEW.organization_id;
    
    -- Vérifier si le partage est activé
    IF NOT (org_settings->>'allowDocumentSharing')::BOOLEAN THEN
        RAISE EXCEPTION 'Le partage de documents est désactivé pour cette organisation';
    END IF;
    
    -- Récupérer la politique de partage
    max_shares := (org_settings->'documentSharingPolicy'->>'maxShares')::INTEGER;
    require_approval := (org_settings->'documentSharingPolicy'->>'requireApproval')::BOOLEAN;
    
    -- Vérifier le nombre maximum de partages
    IF max_shares IS NOT NULL THEN
        SELECT COUNT(*) INTO current_shares FROM public.document_shares WHERE document_id = NEW.document_id;
        IF current_shares >= max_shares THEN
            RAISE EXCEPTION 'Le nombre maximum de partages (%) pour ce document a été atteint', max_shares;
        END IF;
    END IF;
    
    -- Si la validation est requise, vérifier si une approbation existe
    IF require_approval THEN
        IF NOT EXISTS (
            SELECT 1 FROM public.share_approvals 
            WHERE resource_id = NEW.document_id 
            AND resource_type = 'document' 
            AND requested_for = NEW.shared_with 
            AND status = 'approved'
        ) THEN
            RAISE EXCEPTION 'Ce partage nécessite une approbation préalable';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_document_sharing_policy
BEFORE INSERT ON public.document_shares
FOR EACH ROW EXECUTE FUNCTION check_document_sharing_policy();

-- Déclencheur pour journaliser les activités de partage
CREATE OR REPLACE FUNCTION log_sharing_activity()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Déterminer le type d'entité
        IF TG_TABLE_NAME = 'password_shares' THEN
            INSERT INTO public.activity_logs (
                user_id, organization_id, action, entity_type, entity_id, details
            ) VALUES (
                NEW.shared_by,
                NEW.organization_id,
                'share',
                'password',
                NEW.password_id,
                jsonb_build_object(
                    'shared_with', NEW.shared_with,
                    'permissions', NEW.permissions
                )
            );
        ELSIF TG_TABLE_NAME = 'document_shares' THEN
            INSERT INTO public.activity_logs (
                user_id, organization_id, action, entity_type, entity_id, details
            ) VALUES (
                NEW.shared_by,
                NEW.organization_id,
                'share',
                'document',
                NEW.document_id,
                jsonb_build_object(
                    'shared_with', NEW.shared_with,
                    'permissions', NEW.permissions
                )
            );
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        -- Déterminer le type d'entité
        IF TG_TABLE_NAME = 'password_shares' THEN
            INSERT INTO public.activity_logs (
                user_id, organization_id, action, entity_type, entity_id, details
            ) VALUES (
                OLD.shared_by,
                OLD.organization_id,
                'unshare',
                'password',
                OLD.password_id,
                jsonb_build_object(
                    'shared_with', OLD.shared_with
                )
            );
        ELSIF TG_TABLE_NAME = 'document_shares' THEN
            INSERT INTO public.activity_logs (
                user_id, organization_id, action, entity_type, entity_id, details
            ) VALUES (
                OLD.shared_by,
                OLD.organization_id,
                'unshare',
                'document',
                OLD.document_id,
                jsonb_build_object(
                    'shared_with', OLD.shared_with
                )
            );
        END IF;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_password_share_activity
AFTER INSERT OR DELETE ON public.password_shares
FOR EACH ROW EXECUTE FUNCTION log_sharing_activity();

CREATE TRIGGER log_document_share_activity
AFTER INSERT OR DELETE ON public.document_shares
FOR EACH ROW EXECUTE FUNCTION log_sharing_activity();

-- Ajout d'index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_share_approvals_resource ON public.share_approvals(resource_id, resource_type);
CREATE INDEX IF NOT EXISTS idx_share_approvals_status ON public.share_approvals(status);
CREATE INDEX IF NOT EXISTS idx_share_link_accesses_link ON public.share_link_accesses(link_id);
CREATE INDEX IF NOT EXISTS idx_password_rotation_policies_org ON public.password_rotation_policies(organization_id);
