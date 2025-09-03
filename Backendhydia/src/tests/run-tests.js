#!/usr/bin/env node

/**
 * Script de lancement des tests organisés pour le backend Hydia
 * Usage: node run-tests.js [type]
 * Types: unit, integration, environment, all
 */

const { execSync } = require('child_process');
const path = require('path');

const testTypes = {
  unit: 'src/tests/unit/*.test.ts',
  integration: 'src/tests/integration/*.test.ts', 
  environment: 'src/tests/environment/*.test.ts',
  all: 'src/tests/unit/*.test.ts src/tests/integration/*.test.ts src/tests/environment/*.test.ts'
};

const type = process.argv[2] || 'all';

if (!testTypes[type]) {
  console.error('❌ Type de test invalide. Types disponibles:', Object.keys(testTypes).join(', '));
  process.exit(1);
}

console.log(`🧪 Lancement des tests ${type}...`);
console.log('📁 Fichiers:', testTypes[type]);
console.log('');

try {
  const command = `npm test -- ${testTypes[type]} --verbose`;
  execSync(command, { stdio: 'inherit', cwd: path.join(__dirname, '../..') });
  console.log('');
  console.log('✅ Tous les tests sont passés avec succès !');
} catch (error) {
  console.log('');
  console.error('❌ Certains tests ont échoué');
  process.exit(1);
}
