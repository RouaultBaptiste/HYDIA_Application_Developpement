import swaggerJSDoc from 'swagger-jsdoc';
import { version } from '../../package.json';

// Options de base pour Swagger
const swaggerOptions: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Hydia Backend API',
      version: version,
      description: 'Documentation de l\'API backend Hydia - gestionnaire de mots de passe, notes, documents et partage sécurisé',
      license: {
        name: 'Propriétaire',
        url: 'https://hydia.com',
      },
      contact: {
        name: 'Équipe Hydia',
        url: 'https://hydia.com/contact',
        email: 'contact@hydia.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Serveur de développement local',
      },
      {
        url: 'https://api.hydia.com',
        description: 'Serveur de production',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'object',
              properties: {
                message: {
                  type: 'string',
                  example: 'Message d\'erreur',
                },
                code: {
                  type: 'integer',
                  example: 400,
                },
                details: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      path: {
                        type: 'string',
                        example: 'email',
                      },
                      message: {
                        type: 'string',
                        example: 'Email invalide',
                      },
                    },
                  },
                },
              },
            },
          },
        },
        Success: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            data: {
              type: 'object',
              example: {},
            },
            message: {
              type: 'string',
              example: 'Opération réussie',
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'utilisateur@exemple.com',
            },
            firstName: {
              type: 'string',
              example: 'John',
            },
            lastName: {
              type: 'string',
              example: 'Doe',
            },
            isActive: {
              type: 'boolean',
              example: true,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              example: '2023-01-01T12:00:00Z',
            },
          },
        },
        Organization: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
            },
            name: {
              type: 'string',
              example: 'Ma Société',
            },
            description: {
              type: 'string',
              example: 'Description de ma société',
            },
            settings: {
              type: 'object',
              properties: {
                allowPasswordSharing: {
                  type: 'boolean',
                  example: true,
                },
                allowDocumentSharing: {
                  type: 'boolean',
                  example: true,
                },
              },
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              example: '2023-01-01T12:00:00Z',
            },
          },
        },
        Password: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
            },
            title: {
              type: 'string',
              example: 'Mon compte Gmail',
            },
            username: {
              type: 'string',
              example: 'john.doe@gmail.com',
            },
            password: {
              type: 'string',
              example: '********',
            },
            url: {
              type: 'string',
              example: 'https://gmail.com',
            },
            notes: {
              type: 'string',
              example: 'Notes personnelles sur ce compte',
            },
            categoryId: {
              type: 'string',
              format: 'uuid',
              example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
            },
            organizationId: {
              type: 'string',
              format: 'uuid',
              example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
            },
            createdBy: {
              type: 'string',
              format: 'uuid',
              example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              example: '2023-01-01T12:00:00Z',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              example: '2023-01-01T12:00:00Z',
            },
          },
        },
        Note: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
            },
            title: {
              type: 'string',
              example: 'Ma note importante',
            },
            content: {
              type: 'string',
              example: 'Contenu de la note avec formatage markdown...',
            },
            categoryId: {
              type: 'string',
              format: 'uuid',
              example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
            },
            isPrivate: {
              type: 'boolean',
              example: false,
            },
            organizationId: {
              type: 'string',
              format: 'uuid',
              example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
            },
            createdBy: {
              type: 'string',
              format: 'uuid',
              example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              example: '2023-01-01T12:00:00Z',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              example: '2023-01-01T12:00:00Z',
            },
          },
        },
        Document: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
            },
            title: {
              type: 'string',
              example: 'Contrat client',
            },
            filename: {
              type: 'string',
              example: 'contrat-client.pdf',
            },
            filePath: {
              type: 'string',
              example: 'documents/org-123/contrat-client.pdf',
            },
            fileSize: {
              type: 'integer',
              example: 2048576,
            },
            mimeType: {
              type: 'string',
              example: 'application/pdf',
            },
            folderId: {
              type: 'string',
              format: 'uuid',
              example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
            },
            organizationId: {
              type: 'string',
              format: 'uuid',
              example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
            },
            uploadedBy: {
              type: 'string',
              format: 'uuid',
              example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              example: '2023-01-01T12:00:00Z',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              example: '2023-01-01T12:00:00Z',
            },
          },
        },
        Share: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
            },
            resourceId: {
              type: 'string',
              format: 'uuid',
              example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
            },
            sharedBy: {
              type: 'string',
              format: 'uuid',
              example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
            },
            sharedWith: {
              type: 'string',
              format: 'uuid',
              example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
            },
            permissions: {
              type: 'object',
              properties: {
                read: {
                  type: 'boolean',
                  example: true,
                },
                write: {
                  type: 'boolean',
                  example: false,
                },
                delete: {
                  type: 'boolean',
                  example: false,
                },
              },
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              example: '2023-01-01T12:00:00Z',
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  // Chemins vers les fichiers contenant les annotations JSDoc Swagger
  apis: [
    './src/routes/*.ts',
    './src/controllers/*.ts',
    './src/models/*.ts',
    './src/schemas/*.ts',
  ],
};

// Générer les spécifications Swagger
const swaggerSpec = swaggerJSDoc(swaggerOptions);

export { swaggerSpec };
