import { db } from '@db';
import { folders } from '@db/schema';
import { eq, isNull, desc, and } from 'drizzle-orm';
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
export const SUBFOLDER_CONFIGS: Record<string, string[]> = {
  'Documents': ['Legal', 'Waivers'],
  'Templates': ['Email Templates']
};

/**
 * Get all folders with optional parent filter
 * @param parentId Optional parent folder ID
 * @returns Array of folders
 */
export async function getFolders(parentId?: string | null) {
  let query = db.select().from(folders);
  
  if (parentId !== undefined) {
    query = query.where(
      parentId === null
        ? isNull(folders.parentId)
        : eq(folders.parentId, parentId)
    );
  }
  
  // Order by name
  query = query.orderBy(folders.name);
  
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
  let query = db
    .select()
    .from(folders)
    .where(
      and(
        eq(folders.name, name),
        parentId === null
          ? isNull(folders.parentId)
          : eq(folders.parentId, parentId)
      )
    );
  
  const result = await db.execute(query);
  
  // If the folder exists, return it
  if (result.rows.length > 0) {
    return result.rows[0];
  }
  
  // Otherwise, create it
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
  console.log('Initializing standard folder structure...');
  
  // Create all standard root folders
  const rootFolderPromises = STANDARD_FOLDERS.map(name => ensureFolder(name));
  const rootFolders = await Promise.all(rootFolderPromises);
  
  // Create nested subfolders where configured
  const subfolderPromises: Promise<any>[] = [];
  
  // Create a map of folder names to IDs for quick lookup
  const folderMap: Record<string, string> = {};
  rootFolders.forEach(folder => {
    folderMap[folder.name] = folder.id;
  });
  
  // Create subfolders where needed
  Object.entries(SUBFOLDER_CONFIGS).forEach(([parentName, subfolders]) => {
    const parentId = folderMap[parentName];
    if (parentId) {
      subfolders.forEach(subfolder => {
        subfolderPromises.push(ensureFolder(subfolder, parentId));
      });
    }
  });
  
  await Promise.all(subfolderPromises);
  
  console.log('Standard folder structure initialized successfully');
}

/**
 * Get folder tree structure
 * @returns Nested folder structure
 */
export async function getFolderTree(): Promise<any[]> {
  // First, get all folders
  const allFolders = await getFolders();
  
  // Group folders by parent ID
  const foldersByParent: Record<string | null, any[]> = {};
  
  allFolders.forEach(folder => {
    const parentId = folder.parentId || null;
    if (!foldersByParent[parentId]) {
      foldersByParent[parentId] = [];
    }
    foldersByParent[parentId].push(folder);
  });
  
  // Function to build the tree recursively
  function buildTree(parentId: string | null): any[] {
    const children = foldersByParent[parentId] || [];
    
    return children.map(folder => ({
      ...folder,
      children: buildTree(folder.id)
    }));
  }
  
  // Start with root folders (null parent)
  return buildTree(null);
}

/**
 * Get folder by ID
 * @param folderId The folder ID
 * @returns The folder object or null if not found
 */
export async function getFolder(folderId: string): Promise<any | null> {
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
    const parent = await getFolder(parentId);
    if (!parent) {
      throw new Error('Parent folder not found');
    }
  }
  
  // Create the folder
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
  // Get the current folder
  const folder = await getFolder(folderId);
  
  if (!folder) {
    return null;
  }
  
  // Validate parent folder if changing
  if (data.parentId !== undefined && data.parentId !== folder.parentId) {
    // Prevent circular references by ensuring the new parent is not a descendant of this folder
    if (data.parentId !== null) {
      // Check if the new parent exists
      const parent = await getFolder(data.parentId);
      if (!parent) {
        throw new Error('Parent folder not found');
      }
      
      // Check if the new parent would create a cycle
      let current = parent;
      while (current && current.parentId) {
        if (current.id === folderId) {
          throw new Error('Cannot move a folder to its own descendant');
        }
        current = await getFolder(current.parentId);
      }
    }
  }
  
  // Prepare update data
  const updateData: any = {
    updatedAt: new Date()
  };
  
  if (data.name !== undefined) {
    updateData.name = data.name;
  }
  
  if (data.parentId !== undefined) {
    updateData.parentId = data.parentId;
  }
  
  // Update the folder
  const [updatedFolder] = await db
    .update(folders)
    .set(updateData)
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
  // Get the folder to make sure it exists
  const folder = await getFolder(folderId);
  
  if (!folder) {
    return false;
  }
  
  // Check if the folder has child folders
  const children = await getFolders(folderId);
  
  if (children.length > 0) {
    throw new Error('Cannot delete a folder with subfolders');
  }
  
  // Check if the folder has files
  // This will be implemented in files routes
  
  // Delete the folder
  await db
    .delete(folders)
    .where(eq(folders.id, folderId));
  
  return true;
}

/**
 * Get breadcrumbs for a folder (path from root to folder)
 * @param folderId The folder ID
 * @returns Array of breadcrumb objects with id and name
 */
export async function getFolderBreadcrumbs(folderId: string): Promise<{ id: string | null; name: string }[]> {
  const breadcrumbs: { id: string | null; name: string }[] = [];
  
  let currentFolderId: string | null = folderId;
  
  // Traverse up the folder hierarchy
  while (currentFolderId) {
    const folder = await getFolder(currentFolderId);
    
    if (!folder) {
      break;
    }
    
    // Add to beginning of array to maintain correct order
    breadcrumbs.unshift({
      id: folder.id,
      name: folder.name
    });
    
    currentFolderId = folder.parentId;
  }
  
  return breadcrumbs;
}