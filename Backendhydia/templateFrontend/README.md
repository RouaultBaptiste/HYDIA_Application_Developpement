# HYDIA@client - Frontend React

Ce dossier contient le frontend React de l'application HYDIA, intégré avec le backend Node.js/TypeScript et la base de données PostgreSQL via Supabase et Prisma.

## 📋 Table des matières

- [Installation](#installation)
- [Configuration](#configuration)
- [Démarrage](#démarrage)
- [Architecture](#architecture)
- [Intégration avec le backend](#intégration-avec-le-backend)
- [Fonctionnalités](#fonctionnalités)
- [Roadmap](#roadmap)

## 🚀 Installation

```bash
# Se placer dans le dossier client
cd /Users/user/Downloads/HydiaSaas/Saas_Hydia/client

# Installer les dépendances
npm install
```

> **Note**: Si vous rencontrez des erreurs liées aux dépendances, essayez d'utiliser l'option `--legacy-peer-deps` :
> ```bash
> npm install --legacy-peer-deps
> ```

## ⚙️ Configuration

1. Créez un fichier `.env` à partir du modèle `.env.example` :

```bash
cp .env.example .env
```

2. Modifiez les variables d'environnement selon votre configuration :

```
# URL de l'API backend
REACT_APP_API_URL=http://localhost:3001/api

# Configuration Supabase
REACT_APP_SUPABASE_URL=https://eldheqbjgcwjavnosnus.supabase.co
REACT_APP_SUPABASE_ANON_KEY=votre_clé_anon
```

## 🏁 Démarrage

```bash
# Démarrer l'application en mode développement
npm start
```

L'application sera accessible à l'adresse [http://localhost:3000](http://localhost:3000).

## 🏗️ Architecture

Le frontend est structuré comme suit :

```
client/
├── public/              # Fichiers statiques
├── src/
│   ├── assets/          # Images, icônes, etc.
│   ├── components/      # Composants React réutilisables
│   ├── context/         # Contextes React (auth, thème, etc.)
│   ├── lib/             # Bibliothèques et utilitaires
│   │   └── supabaseClient.js  # Configuration du client Supabase
│   ├── pages/           # Composants de pages (nettoyé)
│   │   ├── DocumentManager.js # Gestion des documents
│   │   ├── Home.js            # Page d'accueil
│   │   ├── Login.js           # Authentification
│   │   ├── NotesManager.js    # Gestion des notes
│   │   ├── PasswordManager.js # Gestion des mots de passe
│   │   └── ...                # Autres pages essentielles
│   ├── services/        # Services d'API et logique métier
│   │   ├── api.js       # Services Supabase existants
│   │   ├── backendApi.js # Nouvelle API pour le backend Node.js
│   │   └── supabaseService.js # Services Supabase détaillés
│   └── styles/          # Styles et thèmes
├── .env                 # Variables d'environnement
└── package.json         # Dépendances et scripts
```

## 🔄 Intégration avec le backend

### Services API

Le frontend utilise deux approches pour communiquer avec le backend :

1. **Direct via Supabase** (`supabaseClient.js` et `supabaseService.js`)
   - Accès direct à la base de données via le SDK Supabase
   - Utilisé pour l'authentification et certaines opérations de base

2. **Via le backend Node.js** (`backendApi.js`)
   - Communique avec l'API REST du backend
   - Gère la logique métier complexe, les autorisations et les validations

### Exemple d'utilisation

```javascript
// Exemple d'utilisation du service API backend
import { DocumentAPI } from '../services/backendApi';

// Dans un composant React
const fetchDocuments = async () => {
  try {
    const documents = await DocumentAPI.getAll();
    setDocuments(documents);
  } catch (error) {
    console.error('Erreur:', error);
  }
};
```

## 🎯 Fonctionnalités

- **Authentification** : Connexion, inscription, réinitialisation de mot de passe
- **Gestion de documents** : Création, édition, suppression, partage
- **Gestion de notes** : Création et organisation de notes
- **Gestion de mots de passe** : Stockage sécurisé de mots de passe

## 🧹 Nettoyage des pages

### Pages conservées
- **Login.js** : Authentification des utilisateurs
- **ForgotPassword.js / ResetPassword.js** : Récupération de compte
- **Home.js** : Page d'accueil de l'application
- **PasswordManager.js** : Gestion des mots de passe
- **DocumentManager.js** : Gestion des documents
- **NotesManager.js** : Gestion des notes
- **ShareView.js** : Affichage des documents partagés
- **NotFound.js** : Page 404

### Pages supprimées
- **HydixAI.js** : Assistant IA
- **AdminPanel.js** : Administration
- **Settings.js** : Configuration
- **UserManagement.js** : Gestion des utilisateurs
- **Help.js** : Aide et support
- **DataSharing.js** : Partage de données
- **Dossier /pages/dsi/** : Outils DSI (AD Sync, SSO, etc.)
- **Dossier /pages/rssi/** : Outils RSSI (Sécurité)
- **Dossier /pages/collaboration/** : Outils collaboratifs

### Routes mises à jour
Le fichier `App.js` a été nettoyé pour ne conserver que les routes essentielles :
- `/login`, `/forgot-password`, `/reset-password` : Authentification
- `/` : Accueil
- `/passwords` : Gestionnaire de mots de passe
- `/documents` : Gestionnaire de documents
- `/notes` : Gestionnaire de notes
- `/share/:shareId` : Partage de documents
- `/404` : Page non trouvée

## 🛣️ Roadmap

### Prochaines étapes pour le frontend

1. **Refonte UI/UX**
   - Migration vers des composants Material-UI plus récents
   - Implémentation d'un design system cohérent
   - Amélioration de la réactivité et de l'accessibilité

2. **Modernisation technique**
   - Migration vers TypeScript
   - Intégration de React Query pour la gestion des états serveur
   - Ajout de Tailwind CSS pour le styling
   - Configuration de tests avec React Testing Library

3. **Amélioration des performances**
   - Implémentation du code splitting
   - Optimisation des rendus avec React.memo et useCallback
   - Mise en cache des requêtes API

## 🧪 Tests

```bash
# Exécuter les tests
npm test
```

## 🏗️ Build pour la production

```bash
# Créer une version optimisée pour la production
npm run build
```

---

© HYDIA - Documentation frontend
