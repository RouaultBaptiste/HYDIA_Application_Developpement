import { startServer } from '@/app';

// Démarrer le serveur
startServer().catch((error) => {
  console.error('Impossible de démarrer le serveur:', error);
  process.exit(1);
});
