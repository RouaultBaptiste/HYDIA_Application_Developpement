import { describe, expect, it } from '@jest/globals';

describe('Backend Hydia - Tests de Configuration', () => {
  it('devrait valider l\'environnement de test', () => {
    expect(process.env.NODE_ENV).toBe('test');
    expect(1 + 1).toBe(2);
  });

  it('devrait avoir accès aux variables d\'environnement de test', () => {
    expect(process.env.NODE_ENV).toBe('test');
    expect(process.env.JWT_SECRET).toBeDefined();
    expect(process.env.ENCRYPTION_KEY).toBeDefined();
  });

  it('devrait valider les configurations de test', () => {
    // Vérifier que les variables d'environnement de test sont présentes
    expect(process.env.NODE_ENV).toBe('test');
    expect(process.env.JWT_SECRET).toBeDefined();
    expect(process.env.ENCRYPTION_KEY).toBeDefined();
    
    // Vérifier que les valeurs par défaut sont utilisées
    expect(process.env.JWT_SECRET).toContain('test-jwt-secret');
    expect(process.env.ENCRYPTION_KEY).toContain('test-encryption-key');
  });
});
