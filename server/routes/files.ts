
import { Router } from 'express';
import { db } from '@db';
import { files } from '@db/schema';
import { eq, and, like, isNull, or } from 'drizzle-orm';
import { validateAuth } from '../middleware/auth';

const router = Router();

// Get all files with optional filtering
router.get('/', async (req, res) => {
  try {
    const { folderId, search, type } = req.query;
    
    let query = db.select().from(files);
    
    // Filter by folder
    if (folderId) {
      query = query.where(eq(files.folderId, folderId as string));
    } else {
      // If no folderId is specified, return files with null folderId (root files)
      query = query.where(isNull(files.folderId));
    }
    
    // Filter by search term
    if (search && typeof search === 'string') {
      query = query.where(like(files.name, `%${search}%`));
    }
    
    // Filter by file type
    if (type && Array.isArray(type)) {
      const typeConditions = type.map(t => like(files.type, `%${t}%`));
      query = query.where(or(...typeConditions));
    } else if (type && typeof type === 'string') {
      query = query.where(like(files.type, `%${type}%`));
    }
    
    const filesList = await query;
    res.json(filesList);
  } catch (error) {
    console.error('Error fetching files:', error);
    res.status(500).json({ error: 'Failed to fetch files' });
  }
});

// Additional endpoints for file operations can be added here

export default router;
