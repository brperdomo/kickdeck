import { Router } from 'express';
import { db } from '@db';
import { clubs, teams } from '@db/schema';
import { eq, sql } from 'drizzle-orm';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';

const router = Router();

// Setup multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      const uploadsDir = './uploads/club-logos';
      // Ensure the uploads directory exists
      try {
        await fs.access(uploadsDir);
      } catch (error) {
        await fs.mkdir(uploadsDir, { recursive: true });
      }
      cb(null, uploadsDir);
    } catch (error) {
      cb(error as Error, './uploads/club-logos');
    }
  },
  filename: (req, file, cb) => {
    // Create a unique filename with the original extension
    const uniqueId = uuidv4();
    const extension = path.extname(file.originalname).toLowerCase();
    cb(null, `${uniqueId}${extension}`);
  }
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Accept image files only
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'));
  }
};

const upload = multer({ 
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// GET /api/admin/clubs - Get all clubs
router.get('/', async (req, res) => {
  try {
    const clubsList = await db.select().from(clubs).orderBy(clubs.name);
    
    res.json(clubsList);
  } catch (error) {
    console.error('Error fetching clubs:', error);
    res.status(500).json({ error: 'Failed to fetch clubs' });
  }
});

// GET /api/admin/clubs/:id - Get a specific club
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const club = await db
      .select()
      .from(clubs)
      .where(eq(clubs.id, parseInt(id)))
      .limit(1);
    
    if (club.length === 0) {
      return res.status(404).json({ error: 'Club not found' });
    }
    
    res.json(club[0]);
  } catch (error) {
    console.error('Error fetching club:', error);
    res.status(500).json({ error: 'Failed to fetch club' });
  }
});

// PUT /api/admin/clubs/:id - Update a club
router.put('/:id', upload.single('logo'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    
    // Validate input
    if (!name) {
      return res.status(400).json({ error: 'Club name is required' });
    }
    
    // Check if club exists
    const existingClub = await db
      .select()
      .from(clubs)
      .where(eq(clubs.id, parseInt(id)))
      .limit(1);
    
    if (existingClub.length === 0) {
      return res.status(404).json({ error: 'Club not found' });
    }
    
    // Check if name already exists for another club
    const duplicateClub = await db
      .select()
      .from(clubs)
      .where(sql`${clubs.name} = ${name} AND ${clubs.id} != ${parseInt(id)}`)
      .limit(1);
    
    if (duplicateClub.length > 0) {
      return res.status(400).json({ error: 'Another club with this name already exists' });
    }
    
    // Update values
    const updateValues: any = {
      name,
      updatedAt: new Date().toISOString()
    };
    
    // Handle logo upload
    if (req.file) {
      try {
        // Resize the image to a standard size
        const outputPath = path.join('./uploads/club-logos', `resized-${req.file.filename}`);
        await sharp(req.file.path)
          .resize(200, 200, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
          .toFile(outputPath);
        
        // Update the logo URL to point to the resized image
        updateValues.logoUrl = `/uploads/club-logos/resized-${req.file.filename}`;
        
        // Delete the old logo if it exists
        if (existingClub[0].logoUrl) {
          const oldLogoPath = path.join('.', existingClub[0].logoUrl);
          try {
            await fs.access(oldLogoPath);
            await fs.unlink(oldLogoPath);
          } catch (err) {
            // File doesn't exist or can't be deleted, ignore
          }
        }
      } catch (error) {
        console.error('Error processing logo:', error);
        // If image processing fails, use the original file
        updateValues.logoUrl = `/uploads/club-logos/${req.file.filename}`;
      }
    }
    
    // Update the club
    const updatedClub = await db
      .update(clubs)
      .set(updateValues)
      .where(eq(clubs.id, parseInt(id)))
      .returning();
    
    // Also update all teams that reference this club to maintain consistency
    if (existingClub[0].name !== name) {
      await db
        .update(teams)
        .set({ clubName: name })
        .where(eq(teams.clubId, parseInt(id)));
    }
    
    res.json(updatedClub[0]);
  } catch (error) {
    console.error('Error updating club:', error);
    res.status(500).json({ error: 'Failed to update club' });
  }
});

// DELETE /api/admin/clubs/:id - Delete a club
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if club exists
    const existingClub = await db
      .select()
      .from(clubs)
      .where(eq(clubs.id, parseInt(id)))
      .limit(1);
    
    if (existingClub.length === 0) {
      return res.status(404).json({ error: 'Club not found' });
    }
    
    // Check if club is referenced by any teams
    const teamsWithClub = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(teams)
      .where(eq(teams.clubId, parseInt(id)));
    
    if (teamsWithClub[0].count > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete club that has teams associated with it',
        teamCount: teamsWithClub[0].count
      });
    }
    
    // Delete the club logo if it exists
    if (existingClub[0].logoUrl) {
      const logoPath = path.join('.', existingClub[0].logoUrl);
      try {
        await fs.access(logoPath);
        await fs.unlink(logoPath);
      } catch (err) {
        // File doesn't exist or can't be deleted, ignore
      }
    }
    
    // Delete the club
    await db
      .delete(clubs)
      .where(eq(clubs.id, parseInt(id)));
    
    res.json({ message: 'Club deleted successfully' });
  } catch (error) {
    console.error('Error deleting club:', error);
    res.status(500).json({ error: 'Failed to delete club' });
  }
});

// Export the router
export default router;