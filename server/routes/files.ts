
import { Router } from 'express';
import { db } from '@db';
import { files, users } from '@db/schema';
import { eq, and, like, isNull, or, desc } from 'drizzle-orm';
import { validateAuth } from '../middleware/auth';
import * as fileService from '../services/fileService';
import { isAdmin } from '../middleware';

const router = Router();

// Get files with enhanced filtering
router.get('/', async (req, res) => {
  try {
    const { 
      folderId, 
      search, 
      type, 
      tags, 
      category,
      relatedEntityId,
      relatedEntityType,
      isFavorite 
    } = req.query;
    
    // Build query options
    const options: any = {};
    
    if (folderId === 'root') {
      options.folderId = null;
    } else if (folderId) {
      options.folderId = folderId as string;
    }
    
    if (search) options.search = search as string;
    
    // Handle type filter (can be array or string)
    if (type) {
      if (Array.isArray(type)) {
        options.type = type as string[];
      } else {
        options.type = [type as string];
      }
    }
    
    // Handle tags filter (can be array or string)
    if (tags) {
      if (Array.isArray(tags)) {
        options.tags = tags as string[];
      } else {
        options.tags = [tags as string];
      }
    }
    
    if (category) options.category = category as string;
    if (relatedEntityId) options.relatedEntityId = relatedEntityId as string;
    if (relatedEntityType) options.relatedEntityType = relatedEntityType as string;
    if (isFavorite !== undefined) options.isFavorite = isFavorite === 'true';
    
    const filesList = await fileService.getFiles(options);
    res.json(filesList);
  } catch (error) {
    console.error('Error fetching files:', error);
    res.status(500).json({ error: 'Failed to fetch files' });
  }
});

// Get a specific file by ID
router.get('/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    
    const [file] = await db
      .select({
        file: files,
        uploadedBy: {
          id: users.id,
          name: users.username,
          email: users.email
        }
      })
      .from(files)
      .leftJoin(users, eq(files.uploadedById, users.id))
      .where(eq(files.id, fileId))
      .limit(1);
    
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    // Format the response to match the FileItem structure
    const formattedFile = {
      id: file.file.id,
      name: file.file.name,
      url: file.file.url,
      type: file.file.type,
      size: file.file.size,
      createdAt: file.file.createdAt,
      updatedAt: file.file.updatedAt,
      folderId: file.file.folderId,
      thumbnailUrl: file.file.thumbnailUrl,
      description: file.file.description,
      tags: file.file.tags,
      category: file.file.category,
      isFavorite: file.file.isFavorite,
      relatedEntityId: file.file.relatedEntityId,
      relatedEntityType: file.file.relatedEntityType,
      metadata: file.file.metadata,
      uploadedBy: file.uploadedBy.id ? {
        id: file.uploadedBy.id,
        name: file.uploadedBy.name,
        email: file.uploadedBy.email
      } : undefined
    };
    
    res.json(formattedFile);
  } catch (error) {
    console.error(`Error fetching file ${req.params.fileId}:`, error);
    res.status(500).json({ error: 'Failed to fetch file' });
  }
});

// Update file metadata
router.patch('/:fileId/metadata', validateAuth, async (req, res) => {
  try {
    const { fileId } = req.params;
    const metadata = req.body;
    
    const updatedFile = await fileService.updateFileMetadata(fileId, metadata);
    
    res.json(updatedFile);
  } catch (error) {
    console.error(`Error updating file metadata for ${req.params.fileId}:`, error);
    res.status(500).json({ error: 'Failed to update file metadata' });
  }
});

// Toggle favorite status
router.patch('/:fileId/favorite', validateAuth, async (req, res) => {
  try {
    const { fileId } = req.params;
    const { isFavorite } = req.body;
    
    if (isFavorite === undefined) {
      return res.status(400).json({ error: 'isFavorite property is required' });
    }
    
    const updatedFile = await fileService.updateFileMetadata(fileId, { isFavorite });
    
    res.json(updatedFile);
  } catch (error) {
    console.error(`Error toggling favorite status for ${req.params.fileId}:`, error);
    res.status(500).json({ error: 'Failed to update favorite status' });
  }
});

// Delete a file
router.delete('/:fileId', validateAuth, async (req, res) => {
  try {
    const { fileId } = req.params;
    
    const result = await fileService.deleteFile(fileId);
    
    res.json(result);
  } catch (error) {
    console.error(`Error deleting file ${req.params.fileId}:`, error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

// Handle bulk operations
router.post('/bulk', validateAuth, async (req, res) => {
  try {
    const { operation, fileIds, targetFolderId, metadata } = req.body;
    
    if (!operation || !fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
      return res.status(400).json({ 
        error: 'Invalid request. Operation and fileIds array are required.' 
      });
    }
    
    const result = await fileService.bulkFilesOperation(
      operation, 
      fileIds, 
      { targetFolderId, metadata }
    );
    
    res.json(result);
  } catch (error) {
    console.error('Error performing bulk operation:', error);
    res.status(500).json({ error: 'Failed to perform bulk operation' });
  }
});

// Get files by related entity
router.get('/entity/:type/:entityId', async (req, res) => {
  try {
    const { type, entityId } = req.params;
    
    const files = await fileService.getFiles({
      relatedEntityType: type,
      relatedEntityId: entityId
    });
    
    res.json(files);
  } catch (error) {
    console.error(`Error fetching files for ${req.params.type}/${req.params.entityId}:`, error);
    res.status(500).json({ error: 'Failed to fetch entity files' });
  }
});

export default router;
