#!/usr/bin/env node

/**
 * Script d'exécution des migrations pour Supabase
 * 
 * Utilisation:
 * node migrate.js [options]
 * 
 * Options:
 * --env <environment> : Environnement de déploiement (dev, test, prod)
 * --up : Appliquer les migrations (par défaut)
 * --down <version> : Rétrograder à une version spécifique
 * --create <name> : Créer une nouvelle migration
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

// Charger les variables d'environnement
dotenv.config();

// Répertoire des migrations
const MIGRATIONS_DIR = path.resolve(__dirname, '../config/migrations');
const MIGRATION_TABLE = 'migrations';

// Traitement des arguments
const args = process.argv.slice(2);
let command = 'up';
let env = 'dev';
let migrationName = '';
let migrationVersion = '';

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--env' && args[i + 1]) {
    env = args[i + 1];
    i++;
  } else if (args[i] === '--up') {
    command = 'up';
  } else if (args[i] === '--down' && args[i + 1]) {
    command = 'down';
    migrationVersion = args[i + 1];
    i++;
  } else if (args[i] === '--create' && args[i + 1]) {
    command = 'create';
    migrationName = args[i + 1];
    i++;
  }
}

// Vérifier que les variables d'environnement requises sont définies
const requiredEnvVars = {
  dev: ['SUPABASE_URL_DEV', 'SUPABASE_KEY_DEV'],
  test: ['SUPABASE_URL_TEST', 'SUPABASE_KEY_TEST'],
  prod: ['SUPABASE_URL_PROD', 'SUPABASE_KEY_PROD']
};

for (const envVar of requiredEnvVars[env]) {
  if (!process.env[envVar]) {
    console.error(`Erreur: La variable d'environnement ${envVar} n'est pas définie.`);
    process.exit(1);
  }
}

// Connexion à Supabase
let supabaseUrl;
let supabaseKey;

switch (env) {
  case 'dev':
    supabaseUrl = process.env.SUPABASE_URL_DEV;
    supabaseKey = process.env.SUPABASE_KEY_DEV;
    break;
  case 'test':
    supabaseUrl = process.env.SUPABASE_URL_TEST;
    supabaseKey = process.env.SUPABASE_KEY_TEST;
    break;
  case 'prod':
    supabaseUrl = process.env.SUPABASE_URL_PROD;
    supabaseKey = process.env.SUPABASE_KEY_PROD;
    break;
  default:
    console.error(`Environnement inconnu: ${env}`);
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Créer la table de migrations si elle n'existe pas
async function initMigrationTable() {
  const { error } = await supabase.rpc('execute_sql', { 
    sql_query: `
      CREATE TABLE IF NOT EXISTS ${MIGRATION_TABLE} (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `
  });

  if (error) {
    console.error('Erreur lors de la création de la table de migrations:', error);
    process.exit(1);
  }
}

// Obtenir les migrations déjà exécutées
async function getExecutedMigrations() {
  const { data, error } = await supabase
    .from(MIGRATION_TABLE)
    .select('name')
    .order('id', { ascending: true });

  if (error) {
    console.error('Erreur lors de la récupération des migrations exécutées:', error);
    process.exit(1);
  }

  return data.map(m => m.name);
}

// Appliquer une migration
async function applyMigration(migrationFile) {
  console.log(`Exécution de la migration: ${migrationFile}`);
  
  try {
    const migrationPath = path.join(MIGRATIONS_DIR, migrationFile);
    const migrationSql = fs.readFileSync(migrationPath, 'utf8');
    
    // Diviser le SQL en commandes individuelles pour une exécution plus fiable
    const commands = migrationSql.split(';').filter(cmd => cmd.trim().length > 0);
    
    for (const command of commands) {
      const { error } = await supabase.rpc('execute_sql', { sql_query: command.trim() + ';' });
      if (error) {
        console.error(`Erreur lors de l'exécution de la commande SQL: ${error}`);
        throw error;
      }
    }
    
    // Enregistrer la migration comme exécutée
    const { error } = await supabase
      .from(MIGRATION_TABLE)
      .insert({ name: migrationFile });
    
    if (error) {
      console.error(`Erreur lors de l'enregistrement de la migration: ${error}`);
      throw error;
    }
    
    console.log(`Migration ${migrationFile} exécutée avec succès`);
  } catch (error) {
    console.error(`Erreur lors de l'application de la migration ${migrationFile}:`, error);
    throw error;
  }
}

// Rétrograder une migration
async function revertMigration(migrationFile) {
  console.log(`Rétrogradation de la migration: ${migrationFile}`);
  
  try {
    const migrationDownPath = path.join(MIGRATIONS_DIR, migrationFile.replace('.sql', '.down.sql'));
    
    if (!fs.existsSync(migrationDownPath)) {
      console.error(`Fichier de rétrogradation non trouvé: ${migrationDownPath}`);
      return false;
    }
    
    const migrationSql = fs.readFileSync(migrationDownPath, 'utf8');
    
    // Diviser le SQL en commandes individuelles pour une exécution plus fiable
    const commands = migrationSql.split(';').filter(cmd => cmd.trim().length > 0);
    
    for (const command of commands) {
      const { error } = await supabase.rpc('execute_sql', { sql_query: command.trim() + ';' });
      if (error) {
        console.error(`Erreur lors de l'exécution de la commande SQL: ${error}`);
        throw error;
      }
    }
    
    // Supprimer la migration de la table
    const { error } = await supabase
      .from(MIGRATION_TABLE)
      .delete()
      .eq('name', migrationFile);
    
    if (error) {
      console.error(`Erreur lors de la suppression de l'enregistrement de migration: ${error}`);
      throw error;
    }
    
    console.log(`Rétrogradation de ${migrationFile} exécutée avec succès`);
    return true;
  } catch (error) {
    console.error(`Erreur lors de la rétrogradation de la migration ${migrationFile}:`, error);
    throw error;
  }
}

// Créer une nouvelle migration
function createNewMigration(name) {
  // Générer un nom de fichier avec timestamp
  const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').substring(0, 14);
  const fileName = `${timestamp}_${name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}.sql`;
  const downFileName = `${timestamp}_${name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}.down.sql`;
  
  // Créer les fichiers
  const migrationPath = path.join(MIGRATIONS_DIR, fileName);
  const downMigrationPath = path.join(MIGRATIONS_DIR, downFileName);
  
  fs.writeFileSync(migrationPath, `-- Migration: ${name}\n\n-- Placez vos instructions SQL ici\n\n`);
  fs.writeFileSync(downMigrationPath, `-- Migration de rétrogradation: ${name}\n\n-- Placez vos instructions SQL de rétrogradation ici\n\n`);
  
  console.log(`Nouvelle migration créée: ${fileName}`);
  console.log(`Fichier de rétrogradation créé: ${downFileName}`);
}

// Exécution principale
async function main() {
  try {
    // Créer la table de migrations si elle n'existe pas
    await initMigrationTable();
    
    switch (command) {
      case 'up':
        // Appliquer les migrations non exécutées
        const executedMigrations = await getExecutedMigrations();
        const migrationFiles = fs.readdirSync(MIGRATIONS_DIR)
          .filter(file => file.endsWith('.sql') && !file.endsWith('.down.sql'))
          .sort();
        
        const pendingMigrations = migrationFiles.filter(file => !executedMigrations.includes(file));
        
        if (pendingMigrations.length === 0) {
          console.log('Aucune nouvelle migration à appliquer.');
          return;
        }
        
        console.log(`${pendingMigrations.length} migration(s) à appliquer...`);
        
        for (const migration of pendingMigrations) {
          await applyMigration(migration);
        }
        
        console.log('Toutes les migrations ont été appliquées avec succès.');
        break;
        
      case 'down':
        // Rétrograder à une version spécifique
        const allMigrations = await getExecutedMigrations();
        
        if (allMigrations.length === 0) {
          console.log('Aucune migration à rétrograder.');
          return;
        }
        
        // Si aucune version spécifiée, rétrograder la dernière migration
        if (!migrationVersion) {
          const lastMigration = allMigrations[allMigrations.length - 1];
          await revertMigration(lastMigration);
        } else {
          // Rétrograder jusqu'à la version spécifiée
          const targetIndex = allMigrations.findIndex(m => m.startsWith(migrationVersion));
          
          if (targetIndex === -1) {
            console.error(`Migration avec version ${migrationVersion} non trouvée.`);
            process.exit(1);
          }
          
          // Rétrograder dans l'ordre inverse
          for (let i = allMigrations.length - 1; i > targetIndex; i--) {
            await revertMigration(allMigrations[i]);
          }
        }
        
        console.log('Rétrogradation terminée avec succès.');
        break;
        
      case 'create':
        // Créer une nouvelle migration
        createNewMigration(migrationName);
        break;
        
      default:
        console.error(`Commande inconnue: ${command}`);
        process.exit(1);
    }
  } catch (error) {
    console.error('Erreur lors de l\'exécution des migrations:', error);
    process.exit(1);
  }
}

main();
