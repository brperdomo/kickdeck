import { Router } from 'express';
import { validateAuth, isAdmin } from '../middleware/auth';
import * as fileService from '../services/fileService';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Configure multer storage
const storage = multer.diskStorage({
  destination: async function(req, file, cb) {
    const uploadsDir = './uploads';
    try {
      await fs.access(uploadsDir);
    } catch (error) {
      await fs.mkdir(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: function(req, file, cb) {
    // Generate a unique filename with the original extension
    const fileExt = path.extname(file.originalname);
    const fileName = `${uuidv4()}${fileExt}`;
    cb(null, fileName);
  }
});

// File filter function
const fileFilter = (req, file, cb) => {
  // Allow all file types for now, but we could restrict here if needed
  cb(null, true);
};

// Initialize multer with configured storage
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Get all files with optional filtering
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
    
    const files = await fileService.getFiles({
      folderId: folderId ? String(folderId) : undefined,
      type: type ? String(type) : undefined,
      relatedEntityId: relatedEntityId ? String(relatedEntityId) : undefined,
      relatedEntityType: relatedEntityType ? String(relatedEntityType) : undefined,
      query: query ? String(query) : undefined,
      tags: tags ? String(tags).split(',') : undefined,
      limit: limit ? parseInt(String(limit)) : undefined,
      offset: offset ? parseInt(String(offset)) : undefined
    });
    
    res.json(files);
  } catch (error) {
    console.error('Error fetching files:', error);
    res.status(500).json({ error: 'Failed to fetch files' });
  }
});

// Get files by folder ID
router.get('/folder/:folderId', async (req, res) => {
  try {
    const { folderId } = req.params;
    
    const files = await fileService.getFilesByFolder(
      folderId === 'null' ? null : folderId
    );
    
    res.json(files);
  } catch (error) {
    console.error(`Error fetching files for folder ${req.params.folderId}:`, error);
    res.status(500).json({ error: 'Failed to fetch files' });
  }
});

// Get a specific file by ID
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
    
    // Set appropriate content type for the file
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${file.name}"`);
    
    // Stream the file to the response
    const filePath = await fileService.getFilePath(id);
    if (!filePath) {
      return res.status(404).json({ error: 'File path not found' });
    }
    
    // Check if file exists in the filesystem
    try {
      await fs.access(filePath);
    } catch (error) {
      return res.status(404).json({ error: 'File not found on disk' });
    }
    
    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error(`Error downloading file ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to download file' });
  }
});

// Upload a file
router.post('/upload', validateAuth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const file = req.file;
    const {
      name,
      folderId,
      description,
      tags,
      type,
      relatedEntityId,
      relatedEntityType,
      metadata
    } = req.body;
    
    // Determine file type if not provided
    const fileExt = path.extname(file.originalname).replace('.', '');
    const fileType = type || fileService.getFileTypeFromExtension(fileExt);
    
    // Process tags if provided
    let tagArray = [];
    if (tags) {
      try {
        // Try parsing as JSON
        tagArray = JSON.parse(tags);
      } catch (error) {
        // Fall back to comma-separated string
        tagArray = tags.split(',').map(tag => tag.trim());
      }
    }
    
    // Process metadata if provided
    let metadataObj = {};
    if (metadata) {
      try {
        metadataObj = JSON.parse(metadata);
      } catch (error) {
        console.warn('Invalid metadata JSON, using empty object', error);
      }
    }
    
    // Create file record
    const newFile = await fileService.createFile({
      name: name || file.originalname,
      path: file.path,
      mimeType: file.mimetype,
      size: file.size,
      type: fileType,
      folderId: folderId || null,
      description: description || null,
      tags: tagArray,
      relatedEntityId: relatedEntityId || null,
      relatedEntityType: relatedEntityType || null,
      metadata: metadataObj
    });
    
    res.status(201).json(newFile);
  } catch (error) {
    // If error is about folder not found, send a specific message
    if (error.message === 'Folder not found') {
      return res.status(400).json({ error: error.message });
    }
    
    console.error('Error uploading file:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// Update a file's metadata
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
    
    // Process tags if provided
    let tagArray;
    if (tags) {
      if (Array.isArray(tags)) {
        tagArray = tags;
      } else {
        try {
          // Try parsing as JSON
          tagArray = JSON.parse(tags);
        } catch (error) {
          // Fall back to comma-separated string
          tagArray = tags.split(',').map(tag => tag.trim());
        }
      }
    }
    
    // Process metadata if provided
    let metadataObj;
    if (metadata) {
      if (typeof metadata === 'object') {
        metadataObj = metadata;
      } else {
        try {
          metadataObj = JSON.parse(metadata);
        } catch (error) {
          console.warn('Invalid metadata JSON, not updating metadata', error);
        }
      }
    }
    
    // Update file
    const updatedFile = await fileService.updateFile(id, {
      name,
      folderId,
      description,
      tags: tagArray,
      relatedEntityId,
      relatedEntityType,
      metadata: metadataObj
    });
    
    if (!updatedFile) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    res.json(updatedFile);
  } catch (error) {
    // If error is about folder not found, send a specific message
    if (error.message === 'Folder not found') {
      return res.status(400).json({ error: error.message });
    }
    
    console.error(`Error updating file ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to update file' });
  }
});

// Delete a file
router.delete('/:id', validateAuth, async (req, res) => {
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

export default router;