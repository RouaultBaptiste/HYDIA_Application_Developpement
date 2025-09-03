import crypto from 'crypto';

/**
 * Génère un token sécurisé pour les liens de partage
 * @param length Longueur du token (par défaut 32 caractères)
 * @returns Un token aléatoire sécurisé
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Hache une chaîne de caractères avec SHA-256
 * @param data Chaîne à hacher
 * @returns Empreinte SHA-256 en hexadécimal
 */
export function hashString(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Génère un salt aléatoire pour le hachage
 * @param length Longueur du salt (par défaut 16 bytes)
 * @returns Salt en format base64
 */
export function generateSalt(length: number = 16): string {
  return crypto.randomBytes(length).toString('base64');
}

/**
 * Hache un mot de passe avec un salt
 * @param password Mot de passe à hacher
 * @param salt Salt à utiliser (optionnel, en génère un nouveau si non fourni)
 * @returns Objet contenant le hash et le salt utilisé
 */
export function hashPassword(password: string, salt?: string): { hash: string, salt: string } {
  const actualSalt = salt || generateSalt();
  const hash = crypto.pbkdf2Sync(password, actualSalt, 10000, 64, 'sha512').toString('hex');
  return { hash, salt: actualSalt };
}

/**
 * Vérifie si un mot de passe correspond à un hash
 * @param password Mot de passe à vérifier
 * @param hash Hash attendu
 * @param salt Salt utilisé pour le hachage
 * @returns true si le mot de passe correspond, false sinon
 */
export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const calculatedHash = hashPassword(password, salt).hash;
  return calculatedHash === hash;
}

/**
 * Chiffre des données avec AES-256-GCM
 * @param data Données à chiffrer (chaîne ou objet)
 * @param key Clé de chiffrement
 * @returns Données chiffrées en format base64 avec IV et authTag
 */
export function encryptData(data: string | object, key: string): string {
  // Convertir l'objet en chaîne JSON si nécessaire
  const stringData = typeof data === 'string' ? data : JSON.stringify(data);
  
  // Générer un IV aléatoire
  const iv = crypto.randomBytes(16);
  
  // Dériver une clé à partir du mot de passe
  const derivedKey = crypto.scryptSync(key, 'salt', 32);
  
  // Créer le chiffreur
  const cipher = crypto.createCipheriv('aes-256-gcm', derivedKey, iv);
  
  // Chiffrer les données
  let encrypted = cipher.update(stringData, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  
  // Obtenir le tag d'authentification
  const authTag = cipher.getAuthTag();
  
  // Retourner les données chiffrées, l'IV et le tag d'authentification
  return JSON.stringify({
    iv: iv.toString('base64'),
    encrypted,
    authTag: authTag.toString('base64')
  });
}

/**
 * Déchiffre des données chiffrées avec AES-256-GCM
 * @param encryptedData Données chiffrées en format JSON
 * @param key Clé de déchiffrement
 * @returns Données déchiffrées (chaîne)
 */
export function decryptData(encryptedData: string, key: string): string {
  // Analyser les données chiffrées
  const { iv, encrypted, authTag } = JSON.parse(encryptedData);
  
  // Dériver la clé
  const derivedKey = crypto.scryptSync(key, 'salt', 32);
  
  // Créer le déchiffreur
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm', 
    derivedKey, 
    Buffer.from(iv, 'base64')
  );
  
  // Définir le tag d'authentification
  decipher.setAuthTag(Buffer.from(authTag, 'base64'));
  
  // Déchiffrer les données
  let decrypted = decipher.update(encrypted, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}
