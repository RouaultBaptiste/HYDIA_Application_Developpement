import { describe, expect, it } from '@jest/globals';

// Test très simple pour valider l'environnement
describe('Tests de base', () => {
  it('devrait fonctionner avec Jest', () => {
    expect(1 + 1).toBe(2);
  });

  it('devrait avoir accès aux variables d\'environnement', () => {
    expect(process.env.NODE_ENV).toBe('test');
  });

  it('devrait pouvoir importer des modules TypeScript', () => {
    const testObject = { name: 'test', value: 42 };
    expect(testObject.name).toBe('test');
    expect(testObject.value).toBe(42);
  });
});
