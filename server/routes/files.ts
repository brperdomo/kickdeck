import { Router } from 'express';
import { validateAuth, isAdmin } from '../middleware/auth';
import * as fileService from '../services/fileService';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { createReadStream } from 'fs';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Configure multer storage
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      const uploadsDir = './uploads';
      // Ensure the uploads directory exists
      try {
        await fs.access(uploadsDir);
      } catch (error) {
        await fs.mkdir(uploadsDir, { recursive: true });
      }
      cb(null, uploadsDir);
    } catch (error) {
      cb(error as Error, './uploads');
    }
  },
  filename: (req, file, cb) => {
    // Create a unique filename with the original extension
    const uniqueId = uuidv4();
    const extension = path.extname(file.originalname);
    cb(null, `${uniqueId}${extension}`);
  }
});

// Create the multer upload middleware
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

// Get files with optional filtering
router.get('/', async (req, res) => {
  try {
    const {
      folderId,
      type,
      relatedEntityId,
      relatedEntityType,
      query,
      tags,
      limit,
      offset
    } = req.query;
    
    // Process query parameters
    const options: any = {};
    
    if (folderId !== undefined) {
      options.folderId = folderId === 'null' ? null : String(folderId);
    }
    
    if (type) options.type = String(type);
    if (relatedEntityId) options.relatedEntityId = String(relatedEntityId);
    if (relatedEntityType) options.relatedEntityType = String(relatedEntityType);
    if (query) options.query = String(query);
    if (tags) options.tags = String(tags);
    if (limit) options.limit = parseInt(String(limit), 10);
    if (offset) options.offset = parseInt(String(offset), 10);
    
    const files = await fileService.getFiles(options);
    
    res.json(files);
  } catch (error) {
    console.error('Error fetching files:', error);
    res.status(500).json({ error: 'Failed to fetch files' });
  }
});

// Get a specific file
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const file = await fileService.getFile(id);
    
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    res.json(file);
  } catch (error) {
    console.error(`Error fetching file ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to fetch file' });
  }
});

// Download a file
router.get('/:id/download', async (req, res) => {
  try {
    const { id } = req.params;
    
    const file = await fileService.getFile(id);
    
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    // Set Content-Disposition header to trigger download
    res.setHeader('Content-Disposition', `attachment; filename="${file.name}"`);
    
    // Set Content-Type based on the file's MIME type if available
    if (file.mimeType) {
      res.setHeader('Content-Type', file.mimeType);
    }
    
    // Stream the file to the response
    try {
      const fileStream = createReadStream(file.url);
      fileStream.pipe(res);
    } catch (error) {
      console.error(`Error streaming file ${id}:`, error);
      res.status(500).json({ error: 'Failed to download file' });
    }
  } catch (error) {
    console.error(`Error downloading file ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to download file' });
  }
});

// Upload a file
router.post('/', validateAuth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }
    
    const {
      folderId,
      description,
      tags,
      relatedEntityId,
      relatedEntityType,
      metadata
    } = req.body;
    
    // Process the tags if provided
    let parsedTags: string[] | null = null;
    if (tags) {
      try {
        if (Array.isArray(tags)) {
          parsedTags = tags;
        } else if (typeof tags === 'string') {
          // If it's a comma-separated string, split it
          if (tags.includes(',')) {
            parsedTags = tags.split(',').map(tag => tag.trim());
          } else if (tags.startsWith('[') && tags.endsWith(']')) {
            // If it's a JSON array string, parse it
            parsedTags = JSON.parse(tags);
          } else {
            // Single tag
            parsedTags = [tags.trim()];
          }
        }
      } catch (error) {
        console.warn('Error parsing tags:', error);
        // Default to null if parsing fails
      }
    }
    
    // Process metadata if provided
    let parsedMetadata = null;
    if (metadata) {
      try {
        if (typeof metadata === 'string') {
          parsedMetadata = JSON.parse(metadata);
        } else {
          parsedMetadata = metadata;
        }
      } catch (error) {
        console.warn('Error parsing metadata:', error);
        // Default to null if parsing fails
      }
    }
    
    // Determine file type based on extension
    const extension = path.extname(req.file.originalname).substring(1);
    const fileType = fileService.getFileTypeFromExtension(extension);
    
    // Create file record in the database
    const file = await fileService.createFile({
      name: req.file.originalname,
      path: req.file.path,
      mimeType: req.file.mimetype,
      size: req.file.size,
      type: fileType,
      folderId: folderId === 'null' ? null : folderId || null,
      description: description || null,
      tags: parsedTags,
      relatedEntityId: relatedEntityId || null,
      relatedEntityType: relatedEntityType || null,
      metadata: parsedMetadata
    });
    
    res.status(201).json(file);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Folder not found') {
        return res.status(400).json({ error: error.message });
      }
    }
    
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// Update file metadata
router.patch('/:id', validateAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      folderId,
      description,
      tags,
      relatedEntityId,
      relatedEntityType,
      metadata
    } = req.body;
    
    // Process the tags if provided
    let parsedTags: string[] | undefined = undefined;
    if (tags !== undefined) {
      try {
        if (tags === null) {
          parsedTags = [];
        } else if (Array.isArray(tags)) {
          parsedTags = tags;
        } else if (typeof tags === 'string') {
          // If it's a comma-separated string, split it
          if (tags.includes(',')) {
            parsedTags = tags.split(',').map(tag => tag.trim());
          } else if (tags.startsWith('[') && tags.endsWith(']')) {
            // If it's a JSON array string, parse it
            parsedTags = JSON.parse(tags);
          } else {
            // Single tag
            parsedTags = [tags.trim()];
          }
        }
      } catch (error) {
        console.warn('Error parsing tags:', error);
        // Keep undefined if parsing fails
      }
    }
    
    // Process metadata if provided
    let parsedMetadata = undefined;
    if (metadata !== undefined) {
      try {
        if (metadata === null) {
          parsedMetadata = {};
        } else if (typeof metadata === 'string') {
          parsedMetadata = JSON.parse(metadata);
        } else {
          parsedMetadata = metadata;
        }
      } catch (error) {
        console.warn('Error parsing metadata:', error);
        // Keep undefined if parsing fails
      }
    }
    
    // Update the file
    const file = await fileService.updateFile(id, {
      name,
      folderId: folderId === 'null' ? null : folderId,
      description,
      tags: parsedTags,
      relatedEntityId,
      relatedEntityType,
      metadata: parsedMetadata
    });
    
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    res.json(file);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Folder not found') {
        return res.status(400).json({ error: error.message });
      }
    }
    
    console.error(`Error updating file ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to update file' });
  }
});

// Delete a file
router.delete('/:id', validateAuth, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await fileService.deleteFile(id);
    
    if (!result) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    res.json({ success: true, message: 'File deleted successfully' });
  } catch (error) {
    console.error(`Error deleting file ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

// Get files by folder
router.get('/folder/:folderId', async (req, res) => {
  try {
    const { folderId } = req.params;
    
    const files = await fileService.getFilesByFolder(
      folderId === 'null' ? null : folderId
    );
    
    res.json(files);
  } catch (error) {
    console.error(`Error fetching files for folder ${req.params.folderId}:`, error);
    res.status(500).json({ error: 'Failed to fetch files for folder' });
  }
});

export default router;