import { db } from '@db';
import { files, users } from '@db/schema';
import { eq, and, like, or, isNull, desc } from 'drizzle-orm';
import fs from 'fs/promises';
import path from 'path';

// Types for file metadata
export interface FileMetadata {
  description?: string;
  tags?: string[];
  category?: string;
  isFavorite?: boolean;
  relatedEntityId?: string;
  relatedEntityType?: string;
  uploadedById?: number;
  folderId?: string;
  customMetadata?: Record<string, any>;
}

// Function to get files with metadata
export async function getFiles(options: {
  folderId?: string | null;
  search?: string;
  type?: string[];
  tags?: string[];
  category?: string;
  relatedEntityId?: string;
  relatedEntityType?: string;
  isFavorite?: boolean;
}) {
  try {
    let query = db.select({
      file: files,
      uploadedBy: {
        id: users.id,
        name: users.username,
        email: users.email
      }
    })
    .from(files)
    .leftJoin(users, eq(files.uploadedById, users.id))
    .orderBy(desc(files.createdAt));
    
    // Apply filters
    const conditions = [];
    
    // Filter by folder
    if (options.folderId) {
      conditions.push(eq(files.folderId, options.folderId));
    } else if (options.folderId === null) {
      conditions.push(isNull(files.folderId));
    }
    
    // Filter by search term
    if (options.search) {
      conditions.push(
        or(
          like(files.name, `%${options.search}%`),
          like(files.description || '', `%${options.search}%`)
        )
      );
    }
    
    // Filter by file type
    if (options.type && options.type.length > 0) {
      const typeConditions = options.type.map(t => like(files.type, `%${t}%`));
      conditions.push(or(...typeConditions));
    }
    
    // Filter by category
    if (options.category) {
      conditions.push(eq(files.category, options.category));
    }
    
    // Filter by related entity
    if (options.relatedEntityId) {
      conditions.push(eq(files.relatedEntityId, options.relatedEntityId));
    }
    
    if (options.relatedEntityType) {
      conditions.push(eq(files.relatedEntityType, options.relatedEntityType));
    }
    
    // Filter by favorite status
    if (options.isFavorite !== undefined) {
      conditions.push(eq(files.isFavorite, options.isFavorite));
    }
    
    // Apply all conditions
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    const result = await query;
    
    // Format the result to match the FileItem structure expected by the frontend
    return result.map(item => ({
      id: item.file.id,
      name: item.file.name,
      url: item.file.url,
      type: item.file.type,
      size: item.file.size,
      createdAt: item.file.createdAt,
      updatedAt: item.file.updatedAt,
      folderId: item.file.folderId,
      thumbnailUrl: item.file.thumbnailUrl,
      description: item.file.description,
      tags: item.file.tags,
      category: item.file.category,
      isFavorite: item.file.isFavorite,
      relatedEntityId: item.file.relatedEntityId,
      relatedEntityType: item.file.relatedEntityType,
      metadata: item.file.metadata,
      uploadedBy: item.uploadedBy && item.uploadedBy.id ? {
        id: item.uploadedBy.id,
        name: item.uploadedBy.name,
        email: item.uploadedBy.email
      } : undefined
    }));
  } catch (error) {
    console.error('Error fetching files:', error);
    throw error;
  }
}

// Function to create a file record with metadata
export async function createFile(fileData: {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  metadata?: FileMetadata;
}) {
  try {
    const { id, name, url, type, size, metadata = {} } = fileData;
    
    const newFile = await db.insert(files).values({
      id,
      name,
      url,
      type,
      size,
      folderId: metadata.folderId || null,
      description: metadata.description,
      tags: metadata.tags || [],
      category: metadata.category,
      isFavorite: metadata.isFavorite || false,
      relatedEntityId: metadata.relatedEntityId,
      relatedEntityType: metadata.relatedEntityType,
      uploadedById: metadata.uploadedById,
      metadata: metadata.customMetadata || {},
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    
    return newFile[0];
  } catch (error) {
    console.error('Error creating file:', error);
    throw error;
  }
}

// Function to update file metadata
export async function updateFileMetadata(fileId: string, metadata: Partial<FileMetadata>) {
  try {
    const fileUpdate: any = {
      updatedAt: new Date()
    };
    
    // Only include fields that are provided in the update
    if (metadata.description !== undefined) fileUpdate.description = metadata.description;
    if (metadata.tags !== undefined) fileUpdate.tags = metadata.tags;
    if (metadata.category !== undefined) fileUpdate.category = metadata.category;
    if (metadata.isFavorite !== undefined) fileUpdate.isFavorite = metadata.isFavorite;
    if (metadata.folderId !== undefined) fileUpdate.folderId = metadata.folderId;
    if (metadata.relatedEntityId !== undefined) fileUpdate.relatedEntityId = metadata.relatedEntityId;
    if (metadata.relatedEntityType !== undefined) fileUpdate.relatedEntityType = metadata.relatedEntityType;
    if (metadata.customMetadata !== undefined) fileUpdate.metadata = metadata.customMetadata;
    
    const updatedFile = await db.update(files)
      .set(fileUpdate)
      .where(eq(files.id, fileId))
      .returning();
    
    return updatedFile[0];
  } catch (error) {
    console.error(`Error updating file metadata for ${fileId}:`, error);
    throw error;
  }
}

// Function to delete file from storage and database
export async function deleteFile(fileId: string) {
  try {
    // First get the file info
    const [file] = await db
      .select()
      .from(files)
      .where(eq(files.id, fileId))
      .limit(1);
    
    if (!file) {
      throw new Error(`File not found: ${fileId}`);
    }
    
    // Delete physical file if it's stored locally
    if (file.url.startsWith('/uploads/')) {
      const filePath = path.join(process.cwd(), file.url.replace(/^\//, ''));
      try {
        await fs.unlink(filePath);
      } catch (error) {
        console.warn(`Physical file not found: ${filePath}`, error);
        // Continue even if file doesn't exist on disk
      }
    }
    
    // Delete from database
    await db.delete(files).where(eq(files.id, fileId));
    
    return { success: true, message: 'File deleted successfully' };
  } catch (error) {
    console.error(`Error deleting file ${fileId}:`, error);
    throw error;
  }
}

// Function to move files to a different folder
export async function moveFiles(fileIds: string[], targetFolderId: string | null) {
  try {
    const updatedFiles = await db.update(files)
      .set({ 
        folderId: targetFolderId,
        updatedAt: new Date()
      })
      .where(inArray(files.id, fileIds))
      .returning();
    
    return updatedFiles;
  } catch (error) {
    console.error('Error moving files:', error);
    throw error;
  }
}

// Function to handle bulk operations
export async function bulkFilesOperation(
  operation: 'move' | 'delete' | 'update',
  fileIds: string[],
  options?: { targetFolderId?: string | null, metadata?: Partial<FileMetadata> }
) {
  try {
    switch (operation) {
      case 'move':
        if (options?.targetFolderId === undefined) {
          throw new Error('Target folder ID is required for move operation');
        }
        return await moveFiles(fileIds, options.targetFolderId);
      
      case 'delete':
        const results = [];
        for (const fileId of fileIds) {
          try {
            const result = await deleteFile(fileId);
            results.push({ id: fileId, ...result });
          } catch (error) {
            results.push({ id: fileId, success: false, error: (error as Error).message });
          }
        }
        return results;
      
      case 'update':
        if (!options?.metadata) {
          throw new Error('Metadata is required for update operation');
        }
        
        const updateResults = [];
        for (const fileId of fileIds) {
          try {
            const updated = await updateFileMetadata(fileId, options.metadata);
            updateResults.push({ id: fileId, success: true, file: updated });
          } catch (error) {
            updateResults.push({ id: fileId, success: false, error: (error as Error).message });
          }
        }
        return updateResults;
      
      default:
        throw new Error(`Unsupported operation: ${operation}`);
    }
  } catch (error) {
    console.error(`Error in bulk operation (${operation}):`, error);
    throw error;
  }
}

// Helper to check if an array contains all elements
function inArray(column: any, values: any[]) {
  return values.length > 0 ? or(...values.map(value => eq(column, value))) : isNull(column);
}