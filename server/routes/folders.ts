
import { Router } from 'express';
import { db } from '@db';
import { folders, files } from '@db/schema';
import { eq, and, isNull, asc } from 'drizzle-orm';
import { validateAuth } from '../middleware/auth';

const router = Router();

// Get all folders with optional parentId filter
router.get('/', async (req, res) => {
  try {
    const { parentId } = req.query;
    
    let foldersList;
    if (parentId === 'root' || !parentId) {
      // Get root folders (folders with no parent)
      foldersList = await db.query.folders.findMany({
        where: isNull(folders.parentId),
        orderBy: asc(folders.name)
      });
    } else {
      // Get folders with specific parentId
      foldersList = await db.query.folders.findMany({
        where: eq(folders.parentId, parentId as string),
        orderBy: asc(folders.name)
      });
    }
    
    res.json(foldersList);
  } catch (error) {
    console.error('Error fetching folders:', error);
    res.status(500).json({ error: 'Failed to fetch folders' });
  }
});

// Create a new folder
router.post('/', validateAuth, async (req, res) => {
  try {
    const { name, parentId } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Folder name is required' });
    }
    
    const id = crypto.randomUUID();
    const newFolder = await db.insert(folders).values({
      id,
      name,
      parentId: parentId || null,
    }).returning();
    
    res.status(201).json(newFolder[0]);
  } catch (error) {
    console.error('Error creating folder:', error);
    res.status(500).json({ error: 'Failed to create folder' });
  }
});

// Get breadcrumb path for a folder
router.get('/breadcrumbs/:folderId', async (req, res) => {
  try {
    const { folderId } = req.params;
    
    const breadcrumbs = [];
    let currentFolderId = folderId;
    
    while (currentFolderId) {
      const folder = await db.query.folders.findFirst({
        where: eq(folders.id, currentFolderId)
      });
      
      if (!folder) break;
      
      breadcrumbs.unshift(folder);
      currentFolderId = folder.parentId;
    }
    
    res.json(breadcrumbs);
  } catch (error) {
    console.error('Error getting folder breadcrumbs:', error);
    res.status(500).json({ error: 'Failed to get folder breadcrumbs' });
  }
});

// Update a folder
router.put('/:id', validateAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Folder name is required' });
    }
    
    const updatedFolder = await db.update(folders)
      .set({ name, updatedAt: new Date() })
      .where(eq(folders.id, id))
      .returning();
    
    if (!updatedFolder.length) {
      return res.status(404).json({ error: 'Folder not found' });
    }
    
    res.json(updatedFolder[0]);
  } catch (error) {
    console.error('Error updating folder:', error);
    res.status(500).json({ error: 'Failed to update folder' });
  }
});

// Delete a folder
router.delete('/:id', validateAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if folder has any subfolders
    const subfolders = await db.query.folders.findMany({
      where: eq(folders.parentId, id)
    });
    
    if (subfolders.length > 0) {
      return res.status(400).json({ error: 'Cannot delete folder with subfolders' });
    }
    
    // Check if folder has any files
    const folderFiles = await db.query.files.findMany({
      where: eq(files.folderId, id)
    });
    
    if (folderFiles.length > 0) {
      return res.status(400).json({ error: 'Cannot delete folder with files' });
    }
    
    const deleted = await db.delete(folders)
      .where(eq(folders.id, id))
      .returning();
    
    if (!deleted.length) {
      return res.status(404).json({ error: 'Folder not found' });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting folder:', error);
    res.status(500).json({ error: 'Failed to delete folder' });
  }
});

export default router;

const router = Router();

// Get all folders (with optional parent filter)
router.get('/', validateAuth, async (req, res) => {
  try {
    const parentId = req.query.parentId ? String(req.query.parentId) : null;
    
    let query = db.select()
      .from(folders);
    
    if (parentId === 'root') {
      // Get root folders (parentId is null)
      query = query.where(isNull(folders.parentId));
    } else if (parentId) {
      // Get folders with specific parentId
      query = query.where(eq(folders.parentId, parentId));
    }
    
    const foldersList = await query.orderBy(folders.name);
    res.json(foldersList);
  } catch (error) {
    console.error('Error fetching folders:', error);
    res.status(500).json({ error: 'Failed to fetch folders' });
  }
});

// Create a new folder
router.post('/', validateAuth, async (req, res) => {
  try {
    const { name, parentId } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Folder name is required' });
    }
    
    const folderId = crypto.randomUUID();
    
    const [newFolder] = await db
      .insert(folders)
      .values({
        id: folderId,
        name,
        parentId: parentId || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
      
    res.status(201).json(newFolder);
  } catch (error) {
    console.error('Error creating folder:', error);
    res.status(500).json({ error: 'Failed to create folder' });
  }
});

// Update a folder
router.patch('/:id', validateAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, parentId } = req.body;
    
    const [updatedFolder] = await db
      .update(folders)
      .set({
        name,
        parentId: parentId || null,
        updatedAt: new Date(),
      })
      .where(eq(folders.id, id))
      .returning();
      
    if (!updatedFolder) {
      return res.status(404).json({ error: 'Folder not found' });
    }
    
    res.json(updatedFolder);
  } catch (error) {
    console.error('Error updating folder:', error);
    res.status(500).json({ error: 'Failed to update folder' });
  }
});

// Delete a folder
router.delete('/:id', validateAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if folder has files
    const filesInFolder = await db
      .select()
      .from(files)
      .where(eq(files.folderId, id))
      .limit(1);
      
    if (filesInFolder.length > 0) {
      return res.status(400).json({ error: 'Cannot delete folder with files' });
    }
    
    // Check if folder has subfolders
    const subfolders = await db
      .select()
      .from(folders)
      .where(eq(folders.parentId, id))
      .limit(1);
      
    if (subfolders.length > 0) {
      return res.status(400).json({ error: 'Cannot delete folder with subfolders' });
    }
    
    const [deletedFolder] = await db
      .delete(folders)
      .where(eq(folders.id, id))
      .returning();
      
    if (!deletedFolder) {
      return res.status(404).json({ error: 'Folder not found' });
    }
    
    res.json({ message: 'Folder deleted successfully' });
  } catch (error) {
    console.error('Error deleting folder:', error);
    res.status(500).json({ error: 'Failed to delete folder' });
  }
});

// Get folder contents (files and subfolders)
router.get('/:id/contents', validateAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get the folder
    const [folder] = await db
      .select()
      .from(folders)
      .where(eq(folders.id, id));
      
    if (!folder) {
      return res.status(404).json({ error: 'Folder not found' });
    }
    
    // Get subfolders
    const subfolders = await db
      .select()
      .from(folders)
      .where(eq(folders.parentId, id))
      .orderBy(folders.name);
      
    // Get files
    const filesInFolder = await db
      .select()
      .from(files)
      .where(eq(files.folderId, id))
      .orderBy(files.name);
      
    res.json({
      folder,
      subfolders,
      files: filesInFolder
    });
  } catch (error) {
    console.error('Error fetching folder contents:', error);
    res.status(500).json({ error: 'Failed to fetch folder contents' });
  }
});

export default router;
