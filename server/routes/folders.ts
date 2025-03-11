import { Router } from 'express';
import { db } from '@db';
import { folders, files } from '@db/schema';
import { eq, and, isNull, asc } from 'drizzle-orm';
import { validateAuth } from '../middleware/auth';
import crypto from 'crypto';

const router = Router();

// Get all folders, optionally filtered by parentId
router.get('/', async (req, res) => {
  try {
    const { parentId } = req.query;

    let foldersList;

    if (parentId === 'root') {
      // Get root folders (where parentId is null)
      foldersList = await db
        .select()
        .from(folders)
        .where(isNull(folders.parentId))
        .orderBy(asc(folders.name));
    } else if (parentId) {
      // Get folders with specific parentId
      foldersList = await db
        .select()
        .from(folders)
        .where(eq(folders.parentId, parentId as string))
        .orderBy(asc(folders.name));
    } else {
      // Get all folders
      foldersList = await db
        .select()
        .from(folders)
        .orderBy(asc(folders.name));
    }

    res.json(foldersList);
  } catch (error) {
    console.error('Error fetching folders:', error);
    res.status(500).json({ error: 'Failed to fetch folders' });
  }
});

// Get folder breadcrumb
router.get('/:folderId/breadcrumb', async (req, res) => {
  try {
    const { folderId } = req.params;

    // Array to store breadcrumb folders
    const breadcrumb = [];
    let currentFolderId = folderId;

    // Loop to build the breadcrumb trail
    while (currentFolderId) {
      const [currentFolder] = await db
        .select()
        .from(folders)
        .where(eq(folders.id, currentFolderId))
        .limit(1);

      if (!currentFolder) break;

      // Add folder to breadcrumb (at beginning to maintain correct order)
      breadcrumb.unshift(currentFolder);

      // Move up to parent folder
      currentFolderId = currentFolder.parentId;
    }

    res.json(breadcrumb);
  } catch (error) {
    console.error('Error fetching folder breadcrumb:', error);
    res.status(500).json({ error: 'Failed to fetch folder breadcrumb' });
  }
});

// Create a new folder
router.post('/', validateAuth, async (req, res) => {
  try {
    const { name, parentId } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Folder name is required' });
    }

    // Generate a random ID for the folder
    const folderId = Math.random().toString(36).substring(2, 15);

    // Create the folder in the database
    const newFolder = await db
      .insert(folders)
      .values({
        id: folderId,
        name,
        parentId: parentId || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    res.status(201).json(newFolder[0]);
  } catch (error) {
    console.error('Error creating folder:', error);
    res.status(500).json({ error: 'Failed to create folder' });
  }
});

// Delete a folder
router.delete('/:folderId', validateAuth, async (req, res) => {
  try {
    const { folderId } = req.params;

    // Check if the folder exists
    const [folder] = await db
      .select()
      .from(folders)
      .where(eq(folders.id, folderId))
      .limit(1);

    if (!folder) {
      return res.status(404).json({ error: 'Folder not found' });
    }

    // Check if the folder has any files
    const folderFiles = await db
      .select()
      .from(files)
      .where(eq(files.folderId, folderId));

    if (folderFiles.length > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete folder containing files. Please move or delete the files first.' 
      });
    }

    // Check if the folder has any subfolders
    const subfolders = await db
      .select()
      .from(folders)
      .where(eq(folders.parentId, folderId));

    if (subfolders.length > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete folder containing subfolders. Please delete the subfolders first.' 
      });
    }

    // Delete the folder
    await db
      .delete(folders)
      .where(eq(folders.id, folderId));

    res.status(200).json({ message: 'Folder deleted successfully' });
  } catch (error) {
    console.error('Error deleting folder:', error);
    res.status(500).json({ error: 'Failed to delete folder' });
  }
});

// Rename a folder
router.patch('/:folderId/rename', validateAuth, async (req, res) => {
  try {
    const { folderId } = req.params;
    const { name } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Folder name is required' });
    }

    // Check if the folder exists
    const [folder] = await db
      .select()
      .from(folders)
      .where(eq(folders.id, folderId))
      .limit(1);

    if (!folder) {
      return res.status(404).json({ error: 'Folder not found' });
    }

    // Update the folder name
    const updatedFolder = await db
      .update(folders)
      .set({
        name,
        updatedAt: new Date(),
      })
      .where(eq(folders.id, folderId))
      .returning();

    res.status(200).json(updatedFolder[0]);
  } catch (error) {
    console.error('Error renaming folder:', error);
    res.status(500).json({ error: 'Failed to rename folder' });
  }
});

// Move a folder to another folder
router.patch('/:folderId/move', validateAuth, async (req, res) => {
  try {
    const { folderId } = req.params;
    const { targetFolderId } = req.body;

    // Check if the folder exists
    const [folder] = await db
      .select()
      .from(folders)
      .where(eq(folders.id, folderId))
      .limit(1);

    if (!folder) {
      return res.status(404).json({ error: 'Folder not found' });
    }

    // If targetFolderId is provided, check if it exists
    if (targetFolderId) {
      const [targetFolder] = await db
        .select()
        .from(folders)
        .where(eq(folders.id, targetFolderId))
        .limit(1);

      if (!targetFolder) {
        return res.status(404).json({ error: 'Target folder not found' });
      }

      // Make sure we're not creating a cycle
      if (folderId === targetFolderId) {
        return res.status(400).json({ error: 'Cannot move a folder into itself' });
      }
    }

    // Update the folder's parentId
    const updatedFolder = await db
      .update(folders)
      .set({
        parentId: targetFolderId || null,
        updatedAt: new Date(),
      })
      .where(eq(folders.id, folderId))
      .returning();

    res.status(200).json(updatedFolder[0]);
  } catch (error) {
    console.error('Error moving folder:', error);
    res.status(500).json({ error: 'Failed to move folder' });
  }
});

export default router;