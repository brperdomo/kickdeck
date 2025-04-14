import { Router } from 'express';
import { validateAuth, isAdmin } from '../middleware/auth';
import * as folderService from '../services/folderService';

const router = Router();

// Get all root folders (no parent)
router.get('/root', async (req, res) => {
  try {
    const folders = await folderService.getFolders(null);
    res.json(folders);
  } catch (error) {
    console.error('Error fetching root folders:', error);
    res.status(500).json({ error: 'Failed to fetch root folders' });
  }
});

// Get all folders
router.get('/', async (req, res) => {
  try {
    const folders = await folderService.getFolders();
    res.json(folders);
  } catch (error) {
    console.error('Error fetching all folders:', error);
    res.status(500).json({ error: 'Failed to fetch folders' });
  }
});

// Get subfolders for a specific folder
router.get('/:id/subfolders', async (req, res) => {
  try {
    const { id } = req.params;
    
    const subfolders = await folderService.getFolders(id);
    res.json(subfolders);
  } catch (error) {
    console.error(`Error fetching subfolders for folder ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to fetch subfolders' });
  }
});

// Get folder by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const folder = await folderService.getFolder(id);
    
    if (!folder) {
      return res.status(404).json({ error: 'Folder not found' });
    }
    
    res.json(folder);
  } catch (error) {
    console.error(`Error fetching folder ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to fetch folder' });
  }
});

// Create a new folder
router.post('/', validateAuth, isAdmin, async (req, res) => {
  try {
    const { name, parentId } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Folder name is required' });
    }
    
    const folder = await folderService.createFolder(name, parentId || null);
    
    res.status(201).json(folder);
  } catch (error) {
    console.error('Error creating folder:', error);
    
    if (error instanceof Error) {
      if (error.message === 'Parent folder not found') {
        return res.status(400).json({ error: error.message });
      }
    }
    
    res.status(500).json({ error: 'Failed to create folder' });
  }
});

// Update folder
router.patch('/:id', validateAuth, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, parentId } = req.body;
    
    // Check if at least one field is provided
    if (name === undefined && parentId === undefined) {
      return res.status(400).json({ error: 'At least one field to update is required' });
    }
    
    const updatedFolder = await folderService.updateFolder(id, {
      name,
      parentId
    });
    
    if (!updatedFolder) {
      return res.status(404).json({ error: 'Folder not found' });
    }
    
    res.json(updatedFolder);
  } catch (error) {
    console.error(`Error updating folder ${req.params.id}:`, error);
    
    if (error instanceof Error) {
      if (error.message === 'Parent folder not found' || 
          error.message === 'Cannot move a folder to its own descendant') {
        return res.status(400).json({ error: error.message });
      }
    }
    
    res.status(500).json({ error: 'Failed to update folder' });
  }
});

// Delete folder
router.delete('/:id', validateAuth, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await folderService.deleteFolder(id);
    
    if (!result) {
      return res.status(404).json({ error: 'Folder not found' });
    }
    
    res.json({ success: true, message: 'Folder deleted successfully' });
  } catch (error) {
    console.error(`Error deleting folder ${req.params.id}:`, error);
    
    if (error instanceof Error) {
      if (error.message === 'Cannot delete a folder with subfolders') {
        return res.status(400).json({ error: error.message });
      }
    }
    
    res.status(500).json({ error: 'Failed to delete folder' });
  }
});

// Get folder tree structure
router.get('/tree', async (req, res) => {
  try {
    const tree = await folderService.getFolderTree();
    res.json(tree);
  } catch (error) {
    console.error('Error fetching folder tree:', error);
    res.status(500).json({ error: 'Failed to fetch folder tree' });
  }
});

// Ensure standard folders
router.post('/ensure-standard', validateAuth, isAdmin, async (req, res) => {
  try {
    await folderService.ensureStandardFolders();
    res.json({ success: true, message: 'Standard folders have been created successfully' });
  } catch (error) {
    console.error('Error creating standard folders:', error);
    res.status(500).json({ error: 'Failed to create standard folders' });
  }
});

export default router;