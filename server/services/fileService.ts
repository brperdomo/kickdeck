import { db } from '@db';
import { files, folders } from '@db/schema';
import { eq, isNull, and, desc, sql, like, asc, or, inArray } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs/promises';

/**
 * Ensure the uploads directory exists
 */
async function ensureUploadDirectory() {
  const uploadsDir = './uploads';
  try {
    await fs.access(uploadsDir);
  } catch (error) {
    await fs.mkdir(uploadsDir, { recursive: true });
  }
  return uploadsDir;
}

// Ensure uploads directory exists at startup
ensureUploadDirectory().catch(err => {
  console.error('Failed to create uploads directory:', err);
});

/**
 * Get all files with optional filtering
 * @param options Filter options
 * @returns Array of files
 */
export async function getFiles(options: {
  folderId?: string | null;
  type?: string;
  relatedEntityId?: string;
  relatedEntityType?: string;
  query?: string;
  tags?: string[] | string;
  limit?: number;
  offset?: number;
}) {
  // Start building the query
  let query = db.select({
    ...files,
    folderName: folders.name
  })
  .from(files)
  .leftJoin(folders, eq(files.folderId, folders.id));
  
  // Add filter conditions
  const conditions = [];
  
  if (options.folderId !== undefined) {
    conditions.push(
      options.folderId === null
        ? isNull(files.folderId)
        : eq(files.folderId, options.folderId)
    );
  }
  
  if (options.type) {
    conditions.push(eq(files.type, options.type));
  }
  
  if (options.relatedEntityId) {
    conditions.push(eq(files.relatedEntityId, options.relatedEntityId));
  }
  
  if (options.relatedEntityType) {
    conditions.push(eq(files.relatedEntityType, options.relatedEntityType));
  }
  
  if (options.query) {
    conditions.push(
      or(
        like(files.name, `%${options.query}%`),
        like(files.description, `%${options.query}%`)
      )
    );
  }
  
  if (options.tags) {
    let tagsArray: string[];
    if (Array.isArray(options.tags)) {
      tagsArray = options.tags;
    } else {
      tagsArray = options.tags.split(',').map(tag => tag.trim());
    }
    
    if (tagsArray.length > 0) {
      // This is a simplified approach - in a real-world application with a jsonb/array column,
      // you would use a more sophisticated query to check array containment
      conditions.push(sql`${files.tags} && ${JSON.stringify(tagsArray)}`);
    }
  }
  
  // Apply all conditions if there are any
  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }
  
  // Order by creation date (newest first)
  query = query.orderBy(desc(files.createdAt));
  
  // Apply pagination if specified
  if (options.limit) {
    query = query.limit(options.limit);
  }
  
  if (options.offset) {
    query = query.offset(options.offset);
  }
  
  const result = await db.execute(query);

  // Normalize URLs: ensure leading slash for existing data
  return result.rows.map((row: any) => ({
    ...row,
    url: row.url && !row.url.startsWith('/') ? `/${row.url}` : row.url,
  }));
}

/**
 * Get a specific file by ID
 * @param fileId The file ID
 * @returns The file with folder name or null if not found
 */
export async function getFile(fileId: string) {
  const [file] = await db
    .select({
      ...files,
      folderName: folders.name
    })
    .from(files)
    .leftJoin(folders, eq(files.folderId, folders.id))
    .where(eq(files.id, fileId));

  if (!file) return null;

  // Normalize URL
  return {
    ...file,
    url: file.url && !file.url.startsWith('/') ? `/${file.url}` : file.url,
  };
}

/**
 * Create a new file record in the database
 * @param fileData The file data to create
 * @returns The created file
 */
export async function createFile(fileData: {
  name: string;
  path: string;
  mimeType: string;
  size: number;
  type: string;
  folderId?: string | null;
  description?: string | null;
  tags?: string[];
  relatedEntityId?: string | null;
  relatedEntityType?: string | null;
  metadata?: Record<string, any>;
}) {
  // Validate folder if provided
  if (fileData.folderId) {
    const [folder] = await db
      .select()
      .from(folders)
      .where(eq(folders.id, fileData.folderId));
    
    if (!folder) {
      throw new Error('Folder not found');
    }
  }
  
  // Create the file record
  // Ensure URL has a leading slash so it resolves from the server root
  const fileUrl = fileData.path.startsWith('/') ? fileData.path : `/${fileData.path}`;

  const [file] = await db
    .insert(files)
    .values({
      id: uuidv4(),
      name: fileData.name,
      type: fileData.type,
      size: fileData.size,
      url: fileUrl,
      folderId: fileData.folderId || null,
      description: fileData.description || null,
      tags: fileData.tags || null,
      relatedEntityId: fileData.relatedEntityId || null,
      relatedEntityType: fileData.relatedEntityType || null,
      metadata: fileData.metadata || {},
      createdAt: new Date(),
      updatedAt: new Date()
    })
    .returning();
  
  return file;
}

/**
 * Update a file's metadata
 * @param fileId The file ID
 * @param fileData The data to update
 * @returns The updated file or null if not found
 */
export async function updateFile(fileId: string, fileData: {
  name?: string;
  folderId?: string | null;
  description?: string | null;
  tags?: string[];
  relatedEntityId?: string | null;
  relatedEntityType?: string | null;
  metadata?: Record<string, any>;
}) {
  // Get the current file data
  const file = await getFile(fileId);
  
  if (!file) {
    return null;
  }
  
  // Validate folder if provided
  if (fileData.folderId && fileData.folderId !== file.folderId) {
    const [folder] = await db
      .select()
      .from(folders)
      .where(eq(folders.id, fileData.folderId));
    
    if (!folder) {
      throw new Error('Folder not found');
    }
  }
  
  // Prepare update data
  const updateData: any = {
    updatedAt: new Date()
  };
  
  if (fileData.name !== undefined) {
    updateData.name = fileData.name;
  }
  
  if (fileData.folderId !== undefined) {
    updateData.folderId = fileData.folderId;
  }
  
  if (fileData.description !== undefined) {
    updateData.description = fileData.description;
  }
  
  if (fileData.tags !== undefined) {
    updateData.tags = fileData.tags;
  }
  
  if (fileData.relatedEntityId !== undefined) {
    updateData.relatedEntityId = fileData.relatedEntityId;
  }
  
  if (fileData.relatedEntityType !== undefined) {
    updateData.relatedEntityType = fileData.relatedEntityType;
  }
  
  if (fileData.metadata !== undefined) {
    // Merge with existing metadata
    updateData.metadata = {
      ...(file.metadata || {}),
      ...(fileData.metadata || {})
    };
  }
  
  // Update the file record
  const [updatedFile] = await db
    .update(files)
    .set(updateData)
    .where(eq(files.id, fileId))
    .returning();
  
  return updatedFile;
}

/**
 * Delete a file
 * @param fileId The file ID
 * @returns True if deleted successfully, false if file not found
 */
export async function deleteFile(fileId: string) {
  // Get the file data to delete the physical file
  const file = await getFile(fileId);
  
  if (!file) {
    return false;
  }
  
  try {
    // Delete the file from the filesystem
    await fs.unlink(file.url);
  } catch (error) {
    console.warn(`Could not delete physical file at ${file.url}:`, error);
    // Continue with database deletion even if physical file deletion fails
  }
  
  // Delete from database
  await db
    .delete(files)
    .where(eq(files.id, fileId));
  
  return true;
}

/**
 * Get file path
 * @param fileId The file ID
 * @returns The filesystem path if found, null if file not found
 */
export async function getFilePath(fileId: string) {
  const file = await getFile(fileId);
  
  if (!file) {
    return null;
  }
  
  return file.url;
}

/**
 * Get files by folder ID
 * @param folderId The folder ID
 * @returns Array of files
 */
export async function getFilesByFolder(folderId: string | null) {
  let query;
  
  if (folderId === null) {
    query = db
      .select()
      .from(files)
      .where(isNull(files.folderId))
      .orderBy(desc(files.createdAt));
  } else {
    query = db
      .select()
      .from(files)
      .where(eq(files.folderId, folderId))
      .orderBy(desc(files.createdAt));
  }
  
  const result = await db.execute(query);

  // Normalize URLs: ensure leading slash for existing data
  return result.rows.map((row: any) => ({
    ...row,
    url: row.url && !row.url.startsWith('/') ? `/${row.url}` : row.url,
  }));
}

/**
 * Determine file type from extension
 * @param extension The file extension (without dot)
 * @returns The file type
 */
export function getFileTypeFromExtension(extension: string): string {
  const ext = extension.toLowerCase();
  
  // Image types
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'].includes(ext)) {
    return 'image';
  }
  
  // Document types
  if (['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'rtf', 'odt', 'ods', 'odp'].includes(ext)) {
    return 'document';
  }
  
  // Video types
  if (['mp4', 'mov', 'avi', 'wmv', 'flv', 'webm', 'mkv'].includes(ext)) {
    return 'video';
  }
  
  // Audio types
  if (['mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a', 'wma'].includes(ext)) {
    return 'audio';
  }
  
  // Archive types
  if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'tar.gz', 'tgz'].includes(ext)) {
    return 'archive';
  }
  
  // Code types
  if (['js', 'ts', 'jsx', 'tsx', 'py', 'rb', 'php', 'html', 'css', 'cpp', 'c', 'java', 'go', 'rust', 'sql'].includes(ext)) {
    return 'code';
  }
  
  // Default type for unknown extensions
  return 'other';
}