// Contrôleur de mots de passe mock pour les tests
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

// Fonction asyncHandler simplifiée avec types corrects
const asyncHandler = (fn: (req: Request, res: Response, next: (err?: any) => void) => Promise<any>) => 
  (req: Request, res: Response, next: (err?: any) => void) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

// Chemin vers le fichier de données mock
const MOCK_DATA_FILE = path.join(process.cwd(), 'mock-passwords.json');

// Fonction pour charger les mots de passe depuis le fichier
const loadMockPasswords = (): any[] => {
  try {
    if (fs.existsSync(MOCK_DATA_FILE)) {
      const data = fs.readFileSync(MOCK_DATA_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Erreur lors du chargement des mots de passe mock:', error);
  }
  return [];
};

// Fonction pour sauvegarder les mots de passe dans le fichier
const saveMockPasswords = (passwords: any[]): void => {
  try {
    fs.writeFileSync(MOCK_DATA_FILE, JSON.stringify(passwords, null, 2));
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des mots de passe mock:', error);
  }
};

// Base de données persistante pour les mots de passe
let mockPasswords: any[] = loadMockPasswords();

export class MockPasswordController {
  /**
   * Créer un nouveau mot de passe (mock)
   * POST /api/v1/passwords
   */
  static createPassword = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { title, username, password, url, notes, category } = req.body;
      const organizationId = req.body.organizationId || req.headers['x-organization-id'] || 'test-org-id-123';
      const userId = req.headers['x-user-id'] || req.body.userId || 'test-user-id-123';
      
      console.log(`[CreatePassword] REQUÊTE REÇUE - Organization ID: ${organizationId}, User ID: ${userId}`);
      console.log(`[CreatePassword] Données reçues:`, { title, username, password: password ? '***' : 'vide', url, notes, category });
      
      if (!title) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Le titre est requis',
            statusCode: 400
          }
        });
      }
      
      // Créer un nouveau mot de passe
      const newPassword = {
        id: uuidv4(),
        title,
        username: username || '',
        password: password || '',
        url: url || '',
        notes: notes || '',
        category: category || 'Général',
        organizationId,
        userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Ajouter à la liste des mots de passe mock
      mockPasswords.push(newPassword);
      
      // Sauvegarder dans le fichier pour persistance
      saveMockPasswords(mockPasswords);
      
      return res.status(201).json({
        success: true,
        message: 'Mot de passe créé avec succès',
        data: newPassword
      });
    } catch (error: any) {
      console.error('Erreur lors de la création du mot de passe:', error);
      return res.status(500).json({
        success: false,
        error: {
          message: 'Erreur lors de la création du mot de passe',
          statusCode: 500
        }
      });
    }
  });
  
  /**
   * Récupérer les mots de passe d'une organisation (mock)
   * GET /api/v1/passwords
   */
  static getOrganizationPasswords = asyncHandler(async (req: Request, res: Response) => {
    try {
      const organizationId = req.body.organizationId || req.headers['x-organization-id'] || 'test-org-id-123';
      
      // Recharger les données depuis le fichier pour s'assurer d'avoir les dernières données
      mockPasswords = loadMockPasswords();
      
      console.log(`[GetOrganizationPasswords] Organization ID: ${organizationId}`);
      console.log(`[GetOrganizationPasswords] Tous les mots de passe: ${JSON.stringify(mockPasswords.map(p => ({ id: p.id, title: p.title, orgId: p.organizationId })))}`);
      
      // Filtrer les mots de passe par organisation
      const passwords = mockPasswords.filter(p => p.organizationId === organizationId);
      
      console.log(`[GetOrganizationPasswords] Mots de passe filtrés: ${passwords.length}`);
      
      return res.status(200).json({
        success: true,
        data: passwords
      });
    } catch (error: any) {
      console.error('Erreur lors de la récupération des mots de passe:', error);
      return res.status(500).json({
        success: false,
        error: {
          message: 'Erreur lors de la récupération des mots de passe',
          statusCode: 500
        }
      });
    }
  });
  
  /**
   * Récupérer un mot de passe par son ID (mock)
   * GET /api/v1/passwords/:passwordId
   */
  static getPasswordById = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { passwordId } = req.params;
      const organizationId = req.body.organizationId || req.headers['x-organization-id'] || 'test-org-id-123';
      
      // Recharger les données depuis le fichier pour s'assurer d'avoir les dernières données
      mockPasswords = loadMockPasswords();
      
      // Rechercher le mot de passe et vérifier qu'il appartient à l'organisation
      const password = mockPasswords.find(p => p.id === passwordId && p.organizationId === organizationId);
      
      if (!password) {
        return res.status(404).json({
          success: false,
          error: {
            message: 'Mot de passe non trouvé',
            statusCode: 404
          }
        });
      }
      
      return res.status(200).json({
        success: true,
        data: password
      });
    } catch (error: any) {
      console.error('Erreur lors de la récupération du mot de passe:', error);
      return res.status(500).json({
        success: false,
        error: {
          message: 'Erreur lors de la récupération du mot de passe',
          statusCode: 500
        }
      });
    }
  });
  
  /**
   * Mettre à jour un mot de passe (mock)
   * PUT /api/v1/passwords/:passwordId
   */
  static updatePassword = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { passwordId } = req.params;
      const { title, username, password, url, notes, category } = req.body;
      const organizationId = req.body.organizationId || req.headers['x-organization-id'] || 'test-org-id-123';
      
      // Rechercher le mot de passe et vérifier qu'il appartient à l'organisation
      const passwordIndex = mockPasswords.findIndex(p => p.id === passwordId && p.organizationId === organizationId);
      
      if (passwordIndex === -1) {
        return res.status(404).json({
          success: false,
          error: {
            message: 'Mot de passe non trouvé',
            statusCode: 404
          }
        });
      }
      
      // Mettre à jour le mot de passe
      mockPasswords[passwordIndex] = {
        ...mockPasswords[passwordIndex],
        title: title || mockPasswords[passwordIndex].title,
        username: username !== undefined ? username : mockPasswords[passwordIndex].username,
        password: password || mockPasswords[passwordIndex].password,
        url: url !== undefined ? url : mockPasswords[passwordIndex].url,
        notes: notes !== undefined ? notes : mockPasswords[passwordIndex].notes,
        category: category || mockPasswords[passwordIndex].category,
        updatedAt: new Date().toISOString()
      };
      
      return res.status(200).json({
        success: true,
        message: 'Mot de passe mis à jour avec succès',
        data: mockPasswords[passwordIndex]
      });
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour du mot de passe:', error);
      return res.status(500).json({
        success: false,
        error: {
          message: 'Erreur lors de la mise à jour du mot de passe',
          statusCode: 500
        }
      });
    }
  });
  
  /**
   * Supprimer un mot de passe (mock)
   * DELETE /api/v1/passwords/:passwordId
   */
  static deletePassword = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { passwordId } = req.params;
      const organizationId = req.body.organizationId || req.headers['x-organization-id'] || 'test-org-id-123';
      
      // Rechercher le mot de passe et vérifier qu'il appartient à l'organisation
      const passwordIndex = mockPasswords.findIndex(p => p.id === passwordId && p.organizationId === organizationId);
      
      if (passwordIndex === -1) {
        return res.status(404).json({
          success: false,
          error: {
            message: 'Mot de passe non trouvé',
            statusCode: 404
          }
        });
      }
      
      // Supprimer le mot de passe
      mockPasswords.splice(passwordIndex, 1);
      
      return res.status(200).json({
        success: true,
        message: 'Mot de passe supprimé avec succès'
      });
    } catch (error: any) {
      console.error('Erreur lors de la suppression du mot de passe:', error);
      return res.status(500).json({
        success: false,
        error: {
          message: 'Erreur lors de la suppression du mot de passe',
          statusCode: 500
        }
      });
    }
  });
  
  /**
   * Générer un mot de passe aléatoire (mock)
   * POST /api/v1/passwords/generate
   */
  static generatePassword = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { length = 12, includeNumbers = true, includeSymbols = true, includeUppercase = true } = req.body;
      
      // Générer un mot de passe aléatoire (simplifié)
      const chars = 'abcdefghijklmnopqrstuvwxyz';
      const numbers = '0123456789';
      const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      
      let allChars = chars;
      if (includeNumbers) allChars += numbers;
      if (includeSymbols) allChars += symbols;
      if (includeUppercase) allChars += uppercase;
      
      let password = '';
      for (let i = 0; i < length; i++) {
        password += allChars.charAt(Math.floor(Math.random() * allChars.length));
      }
      
      return res.status(200).json({
        success: true,
        data: {
          password,
          strength: 'fort'
        }
      });
    } catch (error: any) {
      console.error('Erreur lors de la génération du mot de passe:', error);
      return res.status(500).json({
        success: false,
        error: {
          message: 'Erreur lors de la génération du mot de passe',
          statusCode: 500
        }
      });
    }
  });
  
  /**
   * Rechercher des mots de passe (mock)
   * GET /api/v1/passwords/search
   */
  static searchPasswords = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { query } = req.query;
      const organizationId = req.body.organizationId || req.headers['x-organization-id'] || 'test-org-id-123';
      
      if (!query) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Le paramètre de recherche est requis',
            statusCode: 400
          }
        });
      }
      
      // Filtrer les mots de passe par organisation et recherche
      const passwords = mockPasswords.filter(p => 
        p.organizationId === organizationId && 
        (p.title.toLowerCase().includes(String(query).toLowerCase()) || 
         p.username.toLowerCase().includes(String(query).toLowerCase()) || 
         p.url.toLowerCase().includes(String(query).toLowerCase()) || 
         p.notes.toLowerCase().includes(String(query).toLowerCase()))
      );
      
      return res.status(200).json({
        success: true,
        data: passwords
      });
    } catch (error: any) {
      console.error('Erreur lors de la recherche des mots de passe:', error);
      return res.status(500).json({
        success: false,
        error: {
          message: 'Erreur lors de la recherche des mots de passe',
          statusCode: 500
        }
      });
    }
  });
  
  /**
   * Analyser la force des mots de passe (mock)
   * GET /api/v1/passwords/strength-analysis
   */
  static analyzePasswordStrength = asyncHandler(async (req: Request, res: Response) => {
    try {
      const organizationId = req.body.organizationId || req.headers['x-organization-id'] || 'test-org-id-123';
      
      // Données d'analyse fictives
      const analysis = {
        totalPasswords: mockPasswords.filter(p => p.organizationId === organizationId).length,
        weakPasswords: 0,
        mediumPasswords: 0,
        strongPasswords: mockPasswords.filter(p => p.organizationId === organizationId).length,
        averageStrength: 'fort',
        recommendations: [
          'Continuez à utiliser des mots de passe forts et uniques pour chaque service',
          'Pensez à activer l\'authentification à deux facteurs quand c\'est possible'
        ]
      };
      
      return res.status(200).json({
        success: true,
        data: analysis
      });
    } catch (error: any) {
      console.error('Erreur lors de l\'analyse des mots de passe:', error);
      return res.status(500).json({
        success: false,
        error: {
          message: 'Erreur lors de l\'analyse des mots de passe',
          statusCode: 500
        }
      });
    }
  });
  
  /**
   * Exporter les mots de passe (mock)
   * GET /api/v1/passwords/export
   */
  static exportPasswords = asyncHandler(async (req: Request, res: Response) => {
    try {
      const organizationId = req.body.organizationId || req.headers['x-organization-id'] || 'test-org-id-123';
      const { format = 'json' } = req.query;
      
      // Filtrer les mots de passe par organisation
      const passwords = mockPasswords.filter(p => p.organizationId === organizationId);
      
      if (format === 'csv') {
        // Simuler un export CSV
        const csv = 'id,title,username,password,url,notes,category,createdAt\n' + 
          passwords.map(p => `${p.id},"${p.title}","${p.username}","${p.password}","${p.url}","${p.notes}","${p.category}","${p.createdAt}"`).join('\n');
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="passwords.csv"');
        return res.status(200).send(csv);
      }
      
      // Format JSON par défaut
      return res.status(200).json({
        success: true,
        data: passwords
      });
    } catch (error: any) {
      console.error('Erreur lors de l\'export des mots de passe:', error);
      return res.status(500).json({
        success: false,
        error: {
          message: 'Erreur lors de l\'export des mots de passe',
          statusCode: 500
        }
      });
    }
  });
  
  /**
   * Créer une catégorie de mots de passe (mock)
   * POST /api/v1/password-categories
   */
  static createCategory = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { name, description } = req.body;
      const organizationId = req.body.organizationId || req.headers['x-organization-id'] || 'test-org-id-123';
      
      if (!name) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Le nom de la catégorie est requis',
            statusCode: 400
          }
        });
      }
      
      // Créer une nouvelle catégorie (fictive)
      const category = {
        id: uuidv4(),
        name,
        description: description || '',
        organizationId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      return res.status(201).json({
        success: true,
        message: 'Catégorie créée avec succès',
        data: category
      });
    } catch (error: any) {
      console.error('Erreur lors de la création de la catégorie:', error);
      return res.status(500).json({
        success: false,
        error: {
          message: 'Erreur lors de la création de la catégorie',
          statusCode: 500
        }
      });
    }
  });
  
  /**
   * Récupérer les catégories de mots de passe (mock)
   * GET /api/v1/password-categories
   */
  static getCategories = asyncHandler(async (req: Request, res: Response) => {
    try {
      const organizationId = req.body.organizationId || req.headers['x-organization-id'] || 'test-org-id-123';
      
      // Catégories par défaut adaptées à l'organisation
      const categories = [
        {
          id: 'cat-1',
          name: 'Général',
          description: 'Catégorie par défaut',
          organizationId,
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z'
        },
        {
          id: 'cat-2',
          name: 'Travail',
          description: 'Mots de passe professionnels',
          organizationId,
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z'
        },
        {
          id: 'cat-3',
          name: 'Personnel',
          description: 'Mots de passe personnels',
          organizationId,
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z'
        }
      ];
      
      return res.status(200).json({
        success: true,
        data: categories
      });
    } catch (error: any) {
      console.error('Erreur lors de la récupération des catégories:', error);
      return res.status(500).json({
        success: false,
        error: {
          message: 'Erreur lors de la récupération des catégories',
          statusCode: 500
        }
      });
    }
  });
}
