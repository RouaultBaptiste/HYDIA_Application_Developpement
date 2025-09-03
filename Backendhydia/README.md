# Hydia SaaS Backend

## 📋 Description

Hydia est une plateforme SaaS moderne pour la gestion sécurisée d'informations personnelles et professionnelles. Ce backend fournit une API RESTful robuste pour la gestion des mots de passe, documents, notes et collaboration en équipe.

## 🏗️ Architecture

### Stack Technique
- **Runtime**: Node.js 18+
- **Framework**: Express.js avec TypeScript
- **Base de données**: Supabase (PostgreSQL)
- **Authentification**: JWT + Supabase Auth
- **Validation**: Zod
- **Logging**: Winston + Morgan
- **Tests**: Jest
- **Sécurité**: Helmet, CORS, Rate Limiting

### Structure du Projet
```
src/
├── config/           # Configuration (env, supabase)
├── controllers/      # Contrôleurs HTTP
├── middlewares/      # Middlewares (auth, sécurité, logging)
├── routes/          # Définition des routes
├── services/        # Logique métier
├── utils/           # Utilitaires (erreurs, logger, réponses)
├── tests/           # Tests automatisés
├── app.ts           # Configuration Express
└── server.ts        # Point d'entrée
```

## 🚀 Installation et Configuration

### Prérequis
- Node.js 18+
- npm ou yarn
- Compte Supabase

### Installation
```bash
# Cloner le repository
git clone <repository-url>
cd HydiaNewSaas

# Installer les dépendances
npm install

# Copier le fichier d'environnement
cp .env.example .env
```

### Configuration Environnement
Créer un fichier `.env` avec les variables suivantes :

```env
# Serveur
NODE_ENV=development
PORT=3000
API_VERSION=v1

# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_JWT_SECRET=your_supabase_jwt_secret

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Sécurité
BCRYPT_ROUNDS=12
ENCRYPTION_KEY=your_32_character_encryption_key

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:3001

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Upload
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=pdf,doc,docx,txt,jpg,jpeg,png

# Logging
LOG_LEVEL=info
LOG_FILE_PATH=logs/app.log

# Optionnel
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
REDIS_URL=
SENTRY_DSN=
```

### Configuration Supabase

1. **Créer un projet Supabase**
2. **Configurer l'authentification** dans le dashboard Supabase
3. **Exécuter les migrations SQL** (voir `database/` pour les schémas)
4. **Configurer les politiques RLS** pour la sécurité

## 🏃‍♂️ Démarrage

### Développement
```bash
# Démarrer en mode développement
npm run dev

# Ou avec nodemon
npm run start:dev
```

### Production
```bash
# Build du projet
npm run build

# Démarrer en production
npm start
```

### Tests
```bash
# Lancer tous les tests
npm test

# Tests en mode watch
npm run test:watch

# Coverage
npm run test:coverage
```

## 📚 API Documentation

### Authentification

#### POST `/api/v1/auth/register`
Créer un nouveau compte utilisateur.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe"
    },
    "tokens": {
      "accessToken": "jwt_token",
      "refreshToken": "refresh_token"
    }
  }
}
```

#### POST `/api/v1/auth/login`
Connexion utilisateur.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

### Organisations

#### GET `/api/v1/organizations`
Lister les organisations de l'utilisateur.

**Headers:**
```
Authorization: Bearer <token>
```

#### POST `/api/v1/organizations`
Créer une nouvelle organisation.

**Body:**
```json
{
  "name": "Mon Organisation",
  "description": "Description de l'organisation"
}
```

### Mots de passe

#### GET `/api/v1/passwords`
Lister les mots de passe de l'organisation.

**Headers:**
```
Authorization: Bearer <token>
X-Organization-ID: <org_id>
```

#### POST `/api/v1/passwords`
Créer un nouveau mot de passe.

**Body:**
```json
{
  "title": "Mon Site Web",
  "username": "user@example.com",
  "password": "SecurePassword123!",
  "url": "https://example.com",
  "notes": "Notes optionnelles",
  "categoryId": "uuid"
}
```

### Documents

#### POST `/api/v1/documents/upload`
Upload d'un document.

**Headers:**
```
Authorization: Bearer <token>
X-Organization-ID: <org_id>
Content-Type: multipart/form-data
```

**Body:** FormData avec le fichier

### Notes

#### GET `/api/v1/notes`
Lister les notes de l'organisation.

#### POST `/api/v1/notes`
Créer une nouvelle note.

**Body:**
```json
{
  "title": "Ma Note",
  "content": "Contenu de la note",
  "isPrivate": false,
  "tags": ["tag1", "tag2"],
  "categoryId": "uuid"
}
```

## 🔒 Sécurité

### Authentification
- JWT avec expiration automatique
- Refresh tokens pour la session persistante
- Hachage des mots de passe avec bcrypt

### Autorisation
- Contrôle d'accès basé sur les rôles (RBAC)
- Vérification des permissions au niveau organisation
- Isolation des données par organisation

### Protection
- Rate limiting par IP
- Validation des entrées avec Zod
- Sanitisation des données
- Headers de sécurité avec Helmet
- CORS configuré
- Détection d'activité suspecte

### Chiffrement
- Mots de passe chiffrés en base
- Clés de chiffrement séparées
- Communication HTTPS obligatoire en production

## 📊 Monitoring et Logs

### Logging
- Logs structurés avec Winston
- Niveaux : error, warn, info, http, debug
- Rotation automatique des fichiers de logs
- Logs des accès HTTP avec Morgan

### Monitoring
- Health check endpoint : `GET /health`
- Métriques de performance
- Logging des erreurs et exceptions
- Intégration Sentry (optionnelle)

## 🧪 Tests

### Structure des Tests
```
src/tests/
├── setup.ts              # Configuration Jest
├── services/             # Tests des services
├── controllers/          # Tests des contrôleurs
├── middlewares/          # Tests des middlewares
└── integration/          # Tests d'intégration
```

### Types de Tests
- **Unit Tests**: Services et utilitaires
- **Integration Tests**: API endpoints
- **Middleware Tests**: Authentification, validation
- **Security Tests**: Rate limiting, validation

### Commandes
```bash
npm test                  # Tous les tests
npm run test:unit        # Tests unitaires
npm run test:integration # Tests d'intégration
npm run test:coverage    # Coverage report
```

## 🚀 Déploiement

### Variables d'Environnement Production
```env
NODE_ENV=production
PORT=3000
# ... autres variables avec valeurs de production
```

### Docker (Optionnel)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3000
CMD ["node", "dist/server.js"]
```

### CI/CD Suggestions
1. **GitHub Actions** pour l'intégration continue
2. **Tests automatiques** sur chaque PR
3. **Déploiement automatique** sur merge main
4. **Vérification de sécurité** avec npm audit

## 🔧 Maintenance

### Scripts Utiles
```bash
npm run lint              # Vérification ESLint
npm run lint:fix          # Correction automatique
npm run format            # Formatage Prettier
npm run type-check        # Vérification TypeScript
```

### Base de Données
- Migrations SQL dans `database/`
- Backup automatique recommandé
- Monitoring des performances

## 🤝 Contribution

### Standards de Code
- TypeScript strict
- ESLint + Prettier
- Conventional Commits
- Tests obligatoires pour nouvelles fonctionnalités

### Workflow
1. Fork du repository
2. Créer une branche feature
3. Développer avec tests
4. Soumettre une PR

## 📞 Support

### Logs et Debugging
- Logs détaillés en mode développement
- Request ID pour traçabilité
- Stack traces en développement uniquement

### Problèmes Courants
1. **Erreur de connexion Supabase** : Vérifier les variables d'environnement
2. **Token expiré** : Utiliser le refresh token
3. **Rate limit** : Attendre ou augmenter les limites
4. **Upload échoué** : Vérifier la taille et le type de fichier

## 📄 Licence

MIT License - voir le fichier LICENSE pour plus de détails.

---

**Version**: 1.0.0  
**Dernière mise à jour**: $(date)  
**Équipe**: Hydia Development Team
