import { db } from '@db';
import { folders, files } from '@db/schema';
import { eq, isNull, and, desc, sql, asc } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

/**
 * Predefined folder names that should be created by default
 */
export const STANDARD_FOLDERS = [
  'Teams',
  'Players',
  'Logos',
  'Documents',
  'Receipts', 
  'Templates',
  'Forms',
  'Images',
  'Reports & Exports'
];

/**
 * Nested subfolders configuration
 */
export const SUBFOLDER_CONFIGS = {
  'Documents': ['Legal', 'Waivers'],
  'Templates': ['Email Templates']
};

/**
 * Get all folders with optional parent filter
 * @param parentId Optional parent folder ID
 * @returns Array of folders
 */
export async function getFolders(parentId?: string | null) {
  let query;
  
  if (parentId === undefined) {
    // Get all folders
    query = db
      .select()
      .from(folders)
      .orderBy(asc(folders.name));
  } else if (parentId === null) {
    // Get root folders
    query = db
      .select()
      .from(folders)
      .where(isNull(folders.parentId))
      .orderBy(asc(folders.name));
  } else {
    // Get folders with specific parent
    query = db
      .select()
      .from(folders)
      .where(eq(folders.parentId, parentId))
      .orderBy(asc(folders.name));
  }
  
  const result = await db.execute(query);
  
  return result.rows;
}

/**
 * Check if a standard folder exists and create it if it doesn't
 * @param name The name of the folder to create
 * @param parentId The parent folder ID (null for root)
 * @returns The folder object
 */
async function ensureFolder(name: string, parentId: string | null = null): Promise<any> {
  // Check if folder already exists
  let query;
  if (parentId === null) {
    query = db
      .select()
      .from(folders)
      .where(and(
        eq(folders.name, name),
        isNull(folders.parentId)
      ));
  } else {
    query = db
      .select()
      .from(folders)
      .where(and(
        eq(folders.name, name),
        eq(folders.parentId, parentId)
      ));
  }
  
  const result = await db.execute(query);
  
  if (result.rows.length > 0) {
    return result.rows[0];
  }
  
  // Create folder if it doesn't exist
  const [folder] = await db
    .insert(folders)
    .values({
      id: uuidv4(),
      name,
      parentId,
      createdAt: new Date(),
      updatedAt: new Date()
    })
    .returning();
  
  return folder;
}

/**
 * Ensures all standard folders exist in the system
 */
export async function ensureStandardFolders(): Promise<void> {
  // Create standard top-level folders
  const createdFolders = {};
  
  for (const folderName of STANDARD_FOLDERS) {
    const folder = await ensureFolder(folderName);
    createdFolders[folderName] = folder;
  }
  
  // Create configured subfolders
  for (const [parentName, subfolderNames] of Object.entries(SUBFOLDER_CONFIGS)) {
    const parentFolder = createdFolders[parentName];
    if (parentFolder) {
      for (const subfolderName of subfolderNames) {
        await ensureFolder(subfolderName, parentFolder.id);
      }
    }
  }
}

/**
 * Get folder tree structure
 * @returns Nested folder structure
 */
export async function getFolderTree(): Promise<any[]> {
  // Get all folders ordered by parent relationship and name
  const query = db
    .select()
    .from(folders)
    .orderBy(asc(folders.name));
  
  const result = await db.execute(query);
  const allFolders = result.rows;
  
  // Create a map for quick lookups
  const folderMap = {};
  allFolders.forEach(folder => {
    // Add children array to each folder
    folder.children = [];
    folderMap[folder.id] = folder;
  });
  
  // Build the tree structure
  const rootFolders = [];
  
  allFolders.forEach(folder => {
    if (folder.parentId === null) {
      // This is a root folder
      rootFolders.push(folder);
    } else if (folderMap[folder.parentId]) {
      // This is a child folder, add it to its parent's children
      folderMap[folder.parentId].children.push(folder);
    } else {
      // Parent doesn't exist (shouldn't happen), treat as root
      rootFolders.push(folder);
    }
  });
  
  return rootFolders;
}

/**
 * Get folder by ID
 * @param folderId The folder ID
 * @returns The folder object or null if not found
 */
export async function getFolder(folderId: string): Promise<any | null> {
  if (!folderId) return null;
  
  const [folder] = await db
    .select()
    .from(folders)
    .where(eq(folders.id, folderId));
  
  return folder || null;
}

/**
 * Create a new folder
 * @param name The name of the folder
 * @param parentId The parent folder ID (null for root)
 * @returns The created folder
 */
export async function createFolder(name: string, parentId: string | null = null): Promise<any> {
  // Validate parent folder if provided
  if (parentId) {
    const parentFolder = await getFolder(parentId);
    if (!parentFolder) {
      throw new Error('Parent folder not found');
    }
  }
  
  // Create folder
  const [folder] = await db
    .insert(folders)
    .values({
      id: uuidv4(),
      name,
      parentId,
      createdAt: new Date(),
      updatedAt: new Date()
    })
    .returning();
  
  return folder;
}

/**
 * Update a folder
 * @param folderId The folder ID
 * @param data The data to update
 * @returns The updated folder or null if not found
 */
export async function updateFolder(folderId: string, data: { name?: string, parentId?: string | null }): Promise<any | null> {
  // Get the folder to update
  const folder = await getFolder(folderId);
  if (!folder) {
    return null;
  }
  
  // Validate parent folder if provided
  if (data.parentId && data.parentId !== 'null') {
    if (data.parentId === folderId) {
      throw new Error('A folder cannot be its own parent');
    }
    
    const parentFolder = await getFolder(data.parentId);
    if (!parentFolder) {
      throw new Error('Parent folder not found');
    }
    
    // Check for circular references
    let currentFolder = parentFolder;
    while (currentFolder.parentId) {
      if (currentFolder.parentId === folderId) {
        throw new Error('Circular folder reference detected');
      }
      
      currentFolder = await getFolder(currentFolder.parentId);
      if (!currentFolder) break;
    }
  }
  
  // Update folder
  const [updatedFolder] = await db
    .update(folders)
    .set({
      name: data.name || folder.name,
      parentId: data.parentId === 'null' ? null : (data.parentId ?? folder.parentId),
      updatedAt: new Date()
    })
    .where(eq(folders.id, folderId))
    .returning();
  
  return updatedFolder;
}

/**
 * Delete a folder by ID
 * @param folderId The folder ID to delete
 * @returns True if deleted, false if not found
 */
export async function deleteFolder(folderId: string): Promise<boolean> {
  // Check if folder exists
  const folder = await getFolder(folderId);
  if (!folder) {
    return false;
  }
  
  // Check if folder has files
  const fileQuery = db
    .select()
    .from(files)
    .where(eq(files.folderId, folderId));
  
  const fileResult = await db.execute(fileQuery);
  
  if (fileResult.rows.length > 0) {
    throw new Error('Cannot delete folder with files');
  }
  
  // Check if folder has subfolders
  const subfolderQuery = db
    .select()
    .from(folders)
    .where(eq(folders.parentId, folderId));
  
  const subfolderResult = await db.execute(subfolderQuery);
  
  if (subfolderResult.rows.length > 0) {
    throw new Error('Cannot delete folder with subfolders');
  }
  
  // Delete the folder
  await db
    .delete(folders)
    .where(eq(folders.id, folderId));
  
  return true;
}

// Ensure standard folders are created at startup
ensureStandardFolders().catch(err => {
  console.error('Failed to create standard folders:', err);
});