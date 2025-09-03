import { supabase } from '../config/supabase';
import { config } from '../config/env';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';
import { OrganizationService } from './organization.service';
import { z } from 'zod';
import path from 'path';
import fs from 'fs/promises';

// Schémas de validation
export const uploadDocumentSchema = z.object({
  title: z.string().min(1, 'Le titre est requis'),
  folderId: z.string().uuid().optional(),
  description: z.string().optional(),
});

export const createFolderSchema = z.object({
  name: z.string().min(1, 'Le nom du dossier est requis'),
  parentId: z.string().uuid().optional(),
  description: z.string().optional(),
});

export interface Document {
  id: string;
  title: string;
  filename: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  organizationId: string;
  folderId?: string;
  uploadedBy: string;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
  downloadUrl?: string;
  uploader?: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
  folder?: {
    id: string;
    name: string;
  };
}

export interface DocumentFolder {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  organizationId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  documentCount?: number;
  subfolderCount?: number;
}

export interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

export class DocumentService {
  /**
   * Valider le type de fichier
   */
  private static validateFileType(mimetype: string, filename: string): boolean {
    const allowedTypes = config.upload.allowedTypes;
    const fileExtension = path.extname(filename).toLowerCase().substring(1);
    
    return allowedTypes.includes(fileExtension);
  }

  /**
   * Générer un nom de fichier unique
   */
  private static generateUniqueFilename(originalName: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const extension = path.extname(originalName);
    const baseName = path.basename(originalName, extension);
    
    return `${baseName}_${timestamp}_${random}${extension}`;
  }

  /**
   * Uploader un document
   */
  static async uploadDocument(
    organizationId: string,
    userId: string,
    file: UploadedFile,
    documentData: z.infer<typeof uploadDocumentSchema>
  ): Promise<Document> {
    try {
      const validatedData = uploadDocumentSchema.parse(documentData);

      // Vérifier les permissions
      const { hasPermission } = await OrganizationService.checkUserPermission(
        organizationId,
        userId,
        ['admin', 'manager', 'user']
      );

      if (!hasPermission) {
        throw new AppError('Permissions insuffisantes', 403);
      }

      // Valider le fichier
      if (!file) {
        throw new AppError('Aucun fichier fourni', 400);
      }

      if (file.size > config.upload.maxFileSize) {
        throw new AppError('Le fichier est trop volumineux', 400);
      }

      if (!this.validateFileType(file.mimetype, file.originalname)) {
        throw new AppError('Type de fichier non autorisé', 400);
      }

      // Générer un nom de fichier unique
      const uniqueFilename = this.generateUniqueFilename(file.originalname);
      const filePath = `organizations/${organizationId}/documents/${uniqueFilename}`;

      // Uploader vers Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          duplex: 'half'
        });

      if (uploadError) {
        logger.error('Erreur lors de l\'upload vers Supabase Storage:', uploadError);
        throw new AppError('Erreur lors de l\'upload du fichier', 500);
      }

      // Enregistrer les métadonnées en base
      const { data: document, error: dbError } = await supabase
        .from('documents')
        .insert({
          title: validatedData.title,
          filename: file.originalname,
          file_path: filePath,
          file_size: file.size,
          mime_type: file.mimetype,
          organization_id: organizationId,
          folder_id: validatedData.folderId,
          uploaded_by: userId,
          is_deleted: false,
        })
        .select('*')        .single();

      if (dbError || !document) {
        // Supprimer le fichier uploadé en cas d'erreur
        await supabase.storage.from('documents').remove([filePath]);
        logger.error('Erreur lors de l\'enregistrement des métadonnées:', dbError);
        throw new AppError('Erreur lors de l\'enregistrement du document', 500);
      }

      // Générer l'URL de téléchargement
      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      logger.info(`Document uploadé: ${document.title} par ${userId}`);

      return {
        id: document.id,
        title: document.title,
        filename: document.filename,
        filePath: document.file_path,
        fileSize: document.file_size,
        mimeType: document.mime_type,
        organizationId: document.organization_id,
        folderId: document.folder_id,
        uploadedBy: document.uploaded_by,
        createdAt: document.created_at,
        updatedAt: document.updated_at,
        isDeleted: document.is_deleted,
        downloadUrl: urlData.publicUrl,
        uploader: {
          id: document.profiles.id,
          email: document.profiles.email,
          firstName: document.profiles.first_name,
          lastName: document.profiles.last_name,
        },
        folder: document.document_folders ? {
          id: document.document_folders.id,
          name: document.document_folders.name,
        } : undefined,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Erreur lors de l\'upload du document:', error);
      throw new AppError('Erreur interne du serveur', 500);
    }
  }

  /**
   * Récupérer les documents d'une organisation
   */
  static async getOrganizationDocuments(
    organizationId: string,
    userId: string,
    folderId?: string
  ): Promise<Document[]> {
    try {
      // Vérifier les permissions
      const { hasPermission } = await OrganizationService.checkUserPermission(
        organizationId,
        userId,
        ['owner', 'admin', 'manager', 'user', 'viewer']
      );

      if (!hasPermission) {
        throw new AppError('Permissions insuffisantes', 403);
      }

      let query = supabase
        .from('documents')
        .select('*')        .eq('organization_id', organizationId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      if (folderId) {
        query = query.eq('folder_id', folderId);
      } else {
        query = query.is('folder_id', null);
      }

      const { data: documents, error } = await query;

      if (error) {
        logger.error('Erreur lors de la récupération des documents:', error);
        throw new AppError('Erreur lors de la récupération des documents', 500);
      }

      return documents.map((document: any) => {
        const { data: urlData } = supabase.storage
          .from('documents')
          .getPublicUrl(document.file_path);

        return {
          id: document.id,
          title: document.title,
          filename: document.filename,
          filePath: document.file_path,
          fileSize: document.file_size,
          mimeType: document.mime_type,
          organizationId: document.organization_id,
          folderId: document.folder_id,
          uploadedBy: document.uploaded_by,
          createdAt: document.created_at,
          updatedAt: document.updated_at,
          isDeleted: document.is_deleted,
          downloadUrl: urlData.publicUrl,
          uploader: {
            id: document.profiles.id,
            email: document.profiles.email,
            firstName: document.profiles.first_name,
            lastName: document.profiles.last_name,
          },
          folder: document.document_folders ? {
            id: document.document_folders.id,
            name: document.document_folders.name,
          } : undefined,
        };
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Erreur lors de la récupération des documents:', error);
      throw new AppError('Erreur interne du serveur', 500);
    }
  }

  /**
   * Récupérer un document par ID
   */
  static async getDocumentById(
    documentId: string,
    organizationId: string,
    userId: string
  ): Promise<Document> {
    try {
      // Vérifier les permissions
      const { hasPermission } = await OrganizationService.checkUserPermission(
        organizationId,
        userId,
        ['owner', 'admin', 'manager', 'user', 'viewer']
      );

      if (!hasPermission) {
        throw new AppError('Permissions insuffisantes', 403);
      }

      const { data: document, error } = await supabase
        .from('documents')
        .select('*')        .eq('id', documentId)
        .eq('organization_id', organizationId)
        .eq('is_deleted', false)
        .single();

      if (error || !document) {
        throw new AppError('Document non trouvé', 404);
      }

      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(document.file_path);

      return {
        id: document.id,
        title: document.title,
        filename: document.filename,
        filePath: document.file_path,
        fileSize: document.file_size,
        mimeType: document.mime_type,
        organizationId: document.organization_id,
        folderId: document.folder_id,
        uploadedBy: document.uploaded_by,
        createdAt: document.created_at,
        updatedAt: document.updated_at,
        isDeleted: document.is_deleted,
        downloadUrl: urlData.publicUrl,
        uploader: {
          id: document.profiles.id,
          email: document.profiles.email,
          firstName: document.profiles.first_name,
          lastName: document.profiles.last_name,
        },
        folder: document.document_folders ? {
          id: document.document_folders.id,
          name: document.document_folders.name,
        } : undefined,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Erreur lors de la récupération du document:', error);
      throw new AppError('Erreur interne du serveur', 500);
    }
  }

  /**
   * Supprimer un document
   */
  static async deleteDocument(
    documentId: string,
    organizationId: string,
    userId: string
  ): Promise<void> {
    try {
      // Vérifier les permissions
      const { hasPermission } = await OrganizationService.checkUserPermission(
        organizationId,
        userId,
        ['admin', 'manager', 'user']
      );

      if (!hasPermission) {
        throw new AppError('Permissions insuffisantes', 403);
      }

      // Récupérer le document pour obtenir le chemin du fichier
      const { data: document, error: fetchError } = await supabase
        .from('documents')
        .select('file_path')
        .eq('id', documentId)
        .eq('organization_id', organizationId)
        .single();

      if (fetchError || !document) {
        throw new AppError('Document non trouvé', 404);
      }

      // Supprimer le fichier du storage
      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([document.file_path]);

      if (storageError) {
        logger.error('Erreur lors de la suppression du fichier:', storageError);
      }

      // Soft delete en base
      const { error: dbError } = await supabase
        .from('documents')
        .update({
          is_deleted: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', documentId)
        .eq('organization_id', organizationId);

      if (dbError) {
        throw new AppError('Erreur lors de la suppression du document', 500);
      }

      logger.info(`Document supprimé: ${documentId} par ${userId}`);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Erreur lors de la suppression du document:', error);
      throw new AppError('Erreur interne du serveur', 500);
    }
  }

  /**
   * Créer un dossier
   */
  static async createFolder(
    organizationId: string,
    userId: string,
    folderData: z.infer<typeof createFolderSchema>
  ): Promise<DocumentFolder> {
    try {
      const validatedData = createFolderSchema.parse(folderData);

      // Vérifier les permissions
      const { hasPermission } = await OrganizationService.checkUserPermission(
        organizationId,
        userId,
        ['admin', 'manager', 'user']
      );

      if (!hasPermission) {
        throw new AppError('Permissions insuffisantes', 403);
      }

      const { data: folder, error } = await supabase
        .from('document_folders')
        .insert({
          name: validatedData.name,
          description: validatedData.description,
          parent_id: validatedData.parentId,
          organization_id: organizationId,
          created_by: userId,
        })
        .select()
        .single();

      if (error || !folder) {
        logger.error('Erreur lors de la création du dossier:', error);
        throw new AppError('Erreur lors de la création du dossier', 500);
      }

      return {
        id: folder.id,
        name: folder.name,
        description: folder.description,
        parentId: folder.parent_id,
        organizationId: folder.organization_id,
        createdBy: folder.created_by,
        createdAt: folder.created_at,
        updatedAt: folder.updated_at,
        documentCount: 0,
        subfolderCount: 0,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Erreur lors de la création du dossier:', error);
      throw new AppError('Erreur interne du serveur', 500);
    }
  }

  /**
   * Récupérer les dossiers d'une organisation
   */
  static async getOrganizationFolders(
    organizationId: string,
    userId: string,
    parentId?: string
  ): Promise<DocumentFolder[]> {
    try {
      // Vérifier les permissions
      const { hasPermission } = await OrganizationService.checkUserPermission(
        organizationId,
        userId,
        ['owner', 'admin', 'manager', 'user', 'viewer']
      );

      if (!hasPermission) {
        throw new AppError('Permissions insuffisantes', 403);
      }

      let query = supabase
        .from('document_folders')
        .select('*')
        .eq('organization_id', organizationId)
        .order('name', { ascending: true });

      if (parentId) {
        query = query.eq('parent_id', parentId);
      } else {
        query = query.is('parent_id', null);
      }

      const { data: folders, error } = await query;

      if (error) {
        logger.error('Erreur lors de la récupération des dossiers:', error);
        throw new AppError('Erreur lors de la récupération des dossiers', 500);
      }

      // Compter les documents et sous-dossiers pour chaque dossier
      const foldersWithCounts = await Promise.all(
        folders.map(async (folder: any) => {
          const [{ count: documentCount }, { count: subfolderCount }] = await Promise.all([
            supabase
              .from('documents')
              .select('*', { count: 'exact', head: true })
              .eq('folder_id', folder.id)
              .eq('is_deleted', false),
            supabase
              .from('document_folders')
              .select('*', { count: 'exact', head: true })
              .eq('parent_id', folder.id)
          ]);

          return {
            id: folder.id,
            name: folder.name,
            description: folder.description,
            parentId: folder.parent_id,
            organizationId: folder.organization_id,
            createdBy: folder.created_by,
            createdAt: folder.created_at,
            updatedAt: folder.updated_at,
            documentCount: documentCount || 0,
            subfolderCount: subfolderCount || 0,
          };
        })
      );

      return foldersWithCounts;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Erreur lors de la récupération des dossiers:', error);
      throw new AppError('Erreur interne du serveur', 500);
    }
  }

  /**
   * Rechercher des documents
   */
  static async searchDocuments(
    organizationId: string,
    userId: string,
    searchTerm: string
  ): Promise<Document[]> {
    try {
      // Vérifier les permissions
      const { hasPermission } = await OrganizationService.checkUserPermission(
        organizationId,
        userId,
        ['owner', 'admin', 'manager', 'user', 'viewer']
      );

      if (!hasPermission) {
        throw new AppError('Permissions insuffisantes', 403);
      }

      const { data: documents, error } = await supabase
        .from('documents')
        .select('*')        .eq('organization_id', organizationId)
        .eq('is_deleted', false)
        .or(`title.ilike.%${searchTerm}%,filename.ilike.%${searchTerm}%`)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Erreur lors de la recherche de documents:', error);
        throw new AppError('Erreur lors de la recherche de documents', 500);
      }

      return documents.map((document: any) => {
        const { data: urlData } = supabase.storage
          .from('documents')
          .getPublicUrl(document.file_path);

        return {
          id: document.id,
          title: document.title,
          filename: document.filename,
          filePath: document.file_path,
          fileSize: document.file_size,
          mimeType: document.mime_type,
          organizationId: document.organization_id,
          folderId: document.folder_id,
          uploadedBy: document.uploaded_by,
          createdAt: document.created_at,
          updatedAt: document.updated_at,
          isDeleted: document.is_deleted,
          downloadUrl: urlData.publicUrl,
          uploader: {
            id: document.profiles.id,
            email: document.profiles.email,
            firstName: document.profiles.first_name,
            lastName: document.profiles.last_name,
          },
          folder: document.document_folders ? {
            id: document.document_folders.id,
            name: document.document_folders.name,
          } : undefined,
        };
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Erreur lors de la recherche de documents:', error);
      throw new AppError('Erreur interne du serveur', 500);
    }
  }
}
