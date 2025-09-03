# 🧪 Tests Backend Hydia - Organisation

## 📁 Structure des Tests

```
src/tests/
├── setup.ts                           # Configuration globale des tests
├── run-tests.js                       # Script de lancement des tests
├── README.md                          # Cette documentation
├── unit/                              # Tests unitaires par service
│   └── auth.service.test.ts           # Tests authentification (5 tests)
├── integration/                       # Tests d'intégration
│   └── workflows.test.ts              # Tests workflows complets (3 tests)
└── environment/                       # Tests environnement et configuration
    ├── config.test.ts                 # Tests configuration (3 tests)
    └── validation.test.ts             # Tests validation métier (6 tests)
```

## 🚀 Lancement des Tests

### Tests par Catégorie

```bash
# Tests unitaires uniquement
npm test -- src/tests/unit/*.test.ts

# Tests d'intégration uniquement  
npm test -- src/tests/integration/*.test.ts

# Tests d'environnement uniquement
npm test -- src/tests/environment/*.test.ts

# Tous les tests organisés
npm test -- src/tests/unit/*.test.ts src/tests/integration/*.test.ts src/tests/environment/*.test.ts
```

### Script de Lancement Simplifié

```bash
# Utiliser le script de lancement
node src/tests/run-tests.js unit          # Tests unitaires
node src/tests/run-tests.js integration   # Tests d'intégration
node src/tests/run-tests.js environment   # Tests environnement
node src/tests/run-tests.js all           # Tous les tests
```

## ✅ Tests Validés et Fonctionnels

### 📊 Résumé des Tests
- **Total** : 17 tests organisés
- **Tests unitaires** : 5 tests (authentification)
- **Tests d'intégration** : 3 tests (workflows)
- **Tests environnement** : 9 tests (config + validation)

### 🔍 Couverture Fonctionnelle

#### Tests Unitaires (`unit/`)
- ✅ **AuthService** : Inscription, connexion, refresh tokens

#### Tests d'Intégration (`integration/`)
- ✅ **Workflows complets** : Authentification, notes, utilisateur
- ✅ **Inter-services** : Communication entre modules

#### Tests Environnement (`environment/`)
- ✅ **Configuration** : Variables d'environnement, setup Jest
- ✅ **Validation métier** : Données utilisateur, notes, permissions
- ✅ **Structures** : Entités User, Organization, etc.

## 🛠️ Configuration Technique

### Mocks Configurés
- **Supabase** : Base de données mockée
- **JWT** : Tokens simulés
- **Variables d'env** : Valeurs de test par défaut

### Corrections Appliquées
- ✅ Configuration Jest (`moduleNameMapper`)
- ✅ Variables d'environnement adaptées
- ✅ Imports relatifs (pas d'alias `@/`)
- ✅ Mocks Supabase correctement configurés

## 📈 Utilisation en Production

### CI/CD
Ces tests peuvent être intégrés dans votre pipeline CI/CD :

```yaml
# Exemple GitHub Actions
- name: Run Tests
  run: |
    npm test -- src/tests/unit/*.test.ts src/tests/integration/*.test.ts src/tests/environment/*.test.ts
```

### Développement
Pendant le développement, lancez les tests pertinents :

```bash
# Après modification d'un service
npm test -- src/tests/unit/auth.service.test.ts

# Avant un commit
node src/tests/run-tests.js all
```

## 🎯 Prochaines Étapes

1. **Étendre les tests unitaires** : Ajouter note.service.test.ts, password.service.test.ts, etc.
2. **Ajouter des tests d'erreur** : Cas d'échec et edge cases
3. **Tests de performance** : Temps de réponse et charge
4. **Tests de sécurité** : Validation des permissions et chiffrement

## 📞 Support

Les tests sont organisés pour être :
- **Clairs** : Structure logique par type
- **Maintenables** : Séparation des responsabilités
- **Extensibles** : Facile d'ajouter de nouveaux tests
- **Fiables** : 100% de réussite validée

Pour toute question sur les tests, référez-vous à cette documentation ou aux commentaires dans les fichiers de test.
