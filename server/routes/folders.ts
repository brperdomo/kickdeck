import { Router } from 'express';
import { validateAuth, isAdmin } from '../middleware/auth';
import * as folderService from '../services/folderService';

const router = Router();

// Get all folders (with optional filtering by parent)
router.get('/', async (req, res) => {
  try {
    const { parentId } = req.query;
    
    let folders;
    
    if (parentId === undefined) {
      // Get all folders
      folders = await folderService.getFolders();
    } else {
      // Get folders by parent ID (if parentId is "null", it means root folders)
      folders = await folderService.getFolders(
        parentId === 'null' ? null : String(parentId)
      );
    }
    
    res.json(folders);
  } catch (error) {
    console.error('Error fetching folders:', error);
    res.status(500).json({ error: 'Failed to fetch folders' });
  }
});

// Get folder tree for hierarchical display
router.get('/tree', async (req, res) => {
  try {
    const folderTree = await folderService.getFolderTree();
    res.json(folderTree);
  } catch (error) {
    console.error('Error fetching folder tree:', error);
    res.status(500).json({ error: 'Failed to fetch folder tree' });
  }
});

// Get a specific folder by ID
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
    
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Folder name is required' });
    }
    
    // Normalize parentId for root folders
    const normalizedParentId = parentId === 'null' ? null : parentId;
    
    const folder = await folderService.createFolder(name, normalizedParentId);
    
    res.status(201).json(folder);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Parent folder not found') {
        return res.status(400).json({ error: error.message });
      }
    }
    
    console.error('Error creating folder:', error);
    res.status(500).json({ error: 'Failed to create folder' });
  }
});

// Update a folder
router.patch('/:id', validateAuth, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, parentId } = req.body;
    
    if (!name && parentId === undefined) {
      return res.status(400).json({ error: 'At least one field to update is required' });
    }
    
    const folder = await folderService.updateFolder(id, { name, parentId });
    
    if (!folder) {
      return res.status(404).json({ error: 'Folder not found' });
    }
    
    res.json(folder);
  } catch (error) {
    if (error instanceof Error) {
      if (
        error.message === 'Parent folder not found' ||
        error.message === 'A folder cannot be its own parent' ||
        error.message === 'Circular folder reference detected'
      ) {
        return res.status(400).json({ error: error.message });
      }
    }
    
    console.error(`Error updating folder ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to update folder' });
  }
});

// Delete a folder
router.delete('/:id', validateAuth, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await folderService.deleteFolder(id);
    
    if (!result) {
      return res.status(404).json({ error: 'Folder not found' });
    }
    
    res.json({ success: true, message: 'Folder deleted successfully' });
  } catch (error) {
    if (error instanceof Error) {
      if (
        error.message === 'Cannot delete folder with files' ||
        error.message === 'Cannot delete folder with subfolders'
      ) {
        return res.status(400).json({ error: error.message });
      }
    }
    
    console.error(`Error deleting folder ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to delete folder' });
  }
});

export default router;