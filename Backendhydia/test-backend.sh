#!/bin/bash

# =============================================================================
# SCRIPT DE TEST COMPLET DU BACKEND HYDIA
# =============================================================================
# Ce script teste toutes les fonctionnalités du backend avec un utilisateur réel
# Utilisateur: rouaultbaptistepro@gmail.com
# =============================================================================

set -e  # Arrêter le script en cas d'erreur

# Configuration
BASE_URL="http://localhost:3001"
API_URL="$BASE_URL/api/v1"
# Générer un email unique pour éviter les conflits
TIMESTAMP=$(date +%s)
USER_EMAIL="test-${TIMESTAMP}@hydia.com"
USER_PASSWORD="TestPassword123!"
USER_FIRSTNAME="Test"
USER_LASTNAME="User"
USER_AGENT="hydia-test"
# Fichier de cookies pour l'authentification par cookies HttpOnly
COOKIES_FILE="cookies.txt"

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Variables globales
ORG_ID=""
PASSWORD_ID=""
NOTE_ID=""
DOCUMENT_ID=""

# =============================================================================
# FONCTIONS UTILITAIRES
# =============================================================================

print_header() {
    echo -e "\n${BLUE}=== $1 ===${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

# Fonction pour extraire le token JWT de la réponse
extract_token() {
    echo "$1" | jq -r '.data.tokens.accessToken // empty' 2>/dev/null || echo "$1" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4
}

# Fonction pour extraire l'ID d'une réponse JSON
extract_id() {
    echo "$1" | grep -o '"id":"[^"]*' | cut -d'"' -f4
}

# =============================================================================
# TESTS DES FONCTIONNALITÉS
# =============================================================================

test_health_check() {
    print_header "TEST 1: HEALTH CHECK"
    
    response=$(curl -s -H "User-Agent: $USER_AGENT" -X GET "$BASE_URL/health")
    
    if echo "$response" | grep -q '"status":"OK"'; then
        print_success "Health check réussi"
        print_info "Réponse: $response"
    else
        print_error "Health check échoué"
        print_info "Réponse: $response"
        exit 1
    fi
}

test_user_registration() {
    print_header "TEST 2: INSCRIPTION UTILISATEUR"
    
    response=$(curl -s -X POST "$API_URL/auth/register" \
        -H "User-Agent: $USER_AGENT" \
        -H "Content-Type: application/json" \
        -c "$COOKIES_FILE" \
        -d "{
            \"email\": \"$USER_EMAIL\",
            \"password\": \"$USER_PASSWORD\",
            \"firstName\": \"$USER_FIRSTNAME\",
            \"lastName\": \"$USER_LASTNAME\"
        }")
    
    if echo "$response" | grep -q '"success":true'; then
        print_success "Inscription réussie"
        print_info "Cookies enregistrés dans: $COOKIES_FILE"
    else
        print_error "Inscription échouée"
        print_info "Réponse: $response"
        # Continuer avec le test de connexion
    fi
}

test_user_login() {
    print_header "TEST 3: CONNEXION UTILISATEUR"
    
    response=$(curl -s -X POST "$API_URL/auth/login" \
        -H "User-Agent: $USER_AGENT" \
        -H "Content-Type: application/json" \
        -c "$COOKIES_FILE" \
        -d "{
            \"email\": \"$USER_EMAIL\",
            \"password\": \"$USER_PASSWORD\"
        }")
    
    if echo "$response" | grep -q '"success":true'; then
        print_success "Connexion réussie"
        print_info "Cookies enregistrés dans: $COOKIES_FILE"
    else
        print_error "Connexion échouée"
        print_info "Réponse: $response"
        print_info "Tentative de création d'un utilisateur de test..."
        
        # Créer un utilisateur de test avec email unique
        test_email="fallback-${TIMESTAMP}@hydia.com"
        test_response=$(curl -s -X POST "$API_URL/auth/register" \
            -H "User-Agent: $USER_AGENT" \
            -H "Content-Type: application/json" \
            -c "$COOKIES_FILE" \
            -d "{
                \"email\": \"$test_email\",
                \"password\": \"TestPassword123!\",
                \"firstName\": \"Test\",
                \"lastName\": \"User\"
            }")
        
        if echo "$test_response" | grep -q '"success":true'; then
            print_success "Utilisateur de test créé et connecté"
            print_info "Cookies enregistrés dans: $COOKIES_FILE"
        else
            print_error "Impossible de créer un utilisateur de test"
            print_info "Réponse: $test_response"
            exit 1
        fi
    fi
}

test_profile_access() {
    print_header "TEST 3b: PROFIL AVEC COOKIES"
    response=$(curl -s -X GET "$API_URL/auth/profile" \
        -H "User-Agent: $USER_AGENT" \
        -b "$COOKIES_FILE")
    if echo "$response" | grep -q '"success":true'; then
        print_success "Accès au profil réussi via cookies"
    else
        print_error "Accès au profil échoué"
        print_info "Réponse: $response"
    fi
}

test_token_refresh() {
    print_header "TEST 3c: RAFRAÎCHISSEMENT DES JETONS (COOKIES)"
    response=$(curl -s -X POST "$API_URL/auth/refresh" \
        -H "User-Agent: $USER_AGENT" \
        -b "$COOKIES_FILE" \
        -c "$COOKIES_FILE")
    if echo "$response" | grep -q '"success":true'; then
        print_success "Refresh des tokens réussi (cookies mis à jour)"
    else
        print_error "Refresh tokens échoué"
        print_info "Réponse: $response"
    fi
}

test_logout() {
    print_header "TEST 3d: DÉCONNEXION (COOKIES)"
    # Appel logout
    response=$(curl -s -X POST "$API_URL/auth/logout" \
        -H "User-Agent: $USER_AGENT" \
        -b "$COOKIES_FILE" \
        -c "$COOKIES_FILE")
    if echo "$response" | grep -q '"success":true'; then
        print_success "Déconnexion réussie"
    else
        print_error "Déconnexion échouée"
        print_info "Réponse: $response"
    fi

    # Vérifier qu'on ne peut plus accéder au profil avec les cookies
    check=$(curl -s -X GET "$API_URL/auth/profile" \
        -H "User-Agent: $USER_AGENT" \
        -b "$COOKIES_FILE")
    if echo "$check" | grep -q '"success":true'; then
        print_error "Accès au profil encore possible après logout (attendu: échec)"
        print_info "Réponse: $check"
    else
        print_success "Les cookies ne permettent plus l'accès au profil (logout effectif)"
    fi
}

test_organization_creation() {
    print_header "TEST 4: CRÉATION D'ORGANISATION"
    
    response=$(curl -s -X POST "$API_URL/organizations" \
        -H "User-Agent: $USER_AGENT" \
        -H "Content-Type: application/json" \
        -b "$COOKIES_FILE" \
        -d '{
            "name": "Mon Entreprise Test",
            "description": "Organisation créée pour les tests"
        }')
    
    if echo "$response" | grep -q '"success":true'; then
        ORG_ID=$(extract_id "$response")
        print_success "Organisation créée avec succès"
        print_info "ID Organisation: $ORG_ID"
    else
        print_error "Création d'organisation échouée"
        print_info "Réponse: $response"
    fi
}

test_password_creation() {
    print_header "TEST 5: CRÉATION DE MOT DE PASSE"
    
    response=$(curl -s -X POST "$API_URL/passwords" \
        -H "User-Agent: $USER_AGENT" \
        -H "Content-Type: application/json" \
        -b "$COOKIES_FILE" \
        -d '{
            "title": "Gmail Test",
            "username": "test@gmail.com",
            "password": "MonMotDePasseSecret123!",
            "url": "https://gmail.com",
            "notes": "Compte Gmail de test"
        }')
    
    if echo "$response" | grep -q '"success":true'; then
        PASSWORD_ID=$(extract_id "$response")
        print_success "Mot de passe créé avec succès"
        print_info "ID Mot de passe: $PASSWORD_ID"
    else
        print_error "Création de mot de passe échouée"
        print_info "Réponse: $response"
    fi
}

test_note_creation() {
    print_header "TEST 6: CRÉATION DE NOTE"
    
    response=$(curl -s -X POST "$API_URL/notes" \
        -H "User-Agent: $USER_AGENT" \
        -H "Content-Type: application/json" \
        -b "$COOKIES_FILE" \
        -d '{
            "title": "Ma Note de Test",
            "content": "Ceci est le contenu de ma note de test créée automatiquement par le script.",
            "isPrivate": false
        }')
    
    if echo "$response" | grep -q '"success":true'; then
        NOTE_ID=$(extract_id "$response")
        print_success "Note créée avec succès"
        print_info "ID Note: $NOTE_ID"
    else
        print_error "Création de note échouée"
        print_info "Réponse: $response"
    fi
}

test_document_folder_creation() {
    print_header "TEST 7: CRÉATION DE DOSSIER DOCUMENT"
    
    response=$(curl -s -X POST "$API_URL/documents/folders" \
        -H "User-Agent: $USER_AGENT" \
        -H "Content-Type: application/json" \
        -b "$COOKIES_FILE" \
        -d '{
            "name": "Dossier Test",
            "description": "Dossier créé pour les tests automatiques"
        }')
    
    if echo "$response" | grep -q '"success":true'; then
        print_success "Dossier document créé avec succès"
        print_info "Réponse: $response"
    else
        print_error "Création de dossier échouée"
        print_info "Réponse: $response"
    fi
}

test_list_resources() {
    print_header "TEST 8: LISTE DES RESSOURCES"
    
    # Test liste des organisations
    print_info "Test: Liste des organisations"
    response=$(curl -s -X GET "$API_URL/organizations" \
        -H "User-Agent: $USER_AGENT" \
        -b "$COOKIES_FILE")
    
    if echo "$response" | grep -q '"success":true'; then
        print_success "Liste des organisations récupérée"
    else
        print_error "Échec récupération des organisations"
        print_info "Réponse: $response"
    fi
    
    # Test liste des mots de passe
    print_info "Test: Liste des mots de passe"
    response=$(curl -s -X GET "$API_URL/passwords" \
        -H "User-Agent: $USER_AGENT" \
        -b "$COOKIES_FILE")
    
    if echo "$response" | grep -q '"success":true'; then
        print_success "Liste des mots de passe récupérée"
    else
        print_error "Échec récupération des mots de passe"
        print_info "Réponse: $response"
    fi
    
    # Test liste des notes
    print_info "Test: Liste des notes"
    response=$(curl -s -X GET "$API_URL/notes" \
        -H "User-Agent: $USER_AGENT" \
        -b "$COOKIES_FILE")
    
    if echo "$response" | grep -q '"success":true'; then
        print_success "Liste des notes récupérée"
    else
        print_error "Échec récupération des notes"
        print_info "Réponse: $response"
    fi
    
    # Test liste des documents
    print_info "Test: Liste des documents"
    response=$(curl -s -X GET "$API_URL/documents" \
        -H "User-Agent: $USER_AGENT" \
        -b "$COOKIES_FILE")
    
    if echo "$response" | grep -q '"success":true'; then
        print_success "Liste des documents récupérée"
    else
        print_error "Échec récupération des documents"
        print_info "Réponse: $response"
    fi
}

test_validation_errors() {
    print_header "TEST 9: VALIDATION DES ERREURS"
    
    # Test validation email invalide
    print_info "Test: Email invalide"
    response=$(curl -s -X POST "$API_URL/auth/register" \
        -H "User-Agent: $USER_AGENT" \
        -H "Content-Type: application/json" \
        -d '{
            "email": "email-invalide",
            "password": "123"
        }')
    
    if echo "$response" | grep -q '"type":"VALIDATION"'; then
        print_success "Validation des erreurs fonctionne correctement"
    else
        print_error "Validation des erreurs ne fonctionne pas"
        print_info "Réponse: $response"
    fi
}

test_authentication_protection() {
    print_header "TEST 10: PROTECTION AUTHENTIFICATION"
    
    # Test accès sans token
    print_info "Test: Accès sans token d'authentification"
    response=$(curl -s -H "User-Agent: $USER_AGENT" -X GET "$API_URL/passwords")
    
    if echo "$response" | grep -q '"type":"AUTHENTICATION"'; then
        print_success "Protection par authentification fonctionne"
    else
        print_error "Protection par authentification défaillante"
        print_info "Réponse: $response"
    fi
}

# =============================================================================
# EXÉCUTION DES TESTS
# =============================================================================

main() {
    print_header "🚀 DÉBUT DES TESTS DU BACKEND HYDIA"
    print_info "Utilisateur de test: $USER_EMAIL"
    print_info "URL de base: $BASE_URL"
    # Réinitialiser le fichier de cookies
    : > "$COOKIES_FILE"
    
    # Vérifier que le serveur est démarré
    if ! curl -s "$BASE_URL/health" > /dev/null; then
        print_error "Le serveur n'est pas accessible sur $BASE_URL"
        print_info "Assurez-vous que le serveur est démarré avec: npm run dev"
        exit 1
    fi
    
    # Exécution des tests
    test_health_check
    test_user_registration
    test_user_login
    test_profile_access
    test_token_refresh
    test_logout
    # Se reconnecter après le logout pour tester les routes protégées avec des cookies valides
    test_user_login
    test_profile_access
    test_organization_creation
    test_password_creation
    test_note_creation
    test_document_folder_creation
    test_list_resources
    test_validation_errors
    test_authentication_protection
    
    print_header "🎉 TESTS TERMINÉS"
    print_success "Tous les tests ont été exécutés"
    print_info "Vérifiez les résultats ci-dessus pour identifier les fonctionnalités opérationnelles"
}

# Exécuter le script principal
main "$@"
