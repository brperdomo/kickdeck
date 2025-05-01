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

// GET /api/clubs - Get all clubs
router.get('/', async (req, res) => {
  try {
    const clubsList = await db.select().from(clubs).orderBy(clubs.name);
    
    res.json(clubsList);
  } catch (error) {
    console.error('Error fetching clubs:', error);
    res.status(500).json({ error: 'Failed to fetch clubs' });
  }
});

// GET /api/clubs/event/:eventId - Get clubs for a specific event
router.get('/event/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    
    // Get unique club names from teams in this event
    const existingClubs = await db.execute(sql`
      SELECT DISTINCT club_name 
      FROM teams 
      WHERE event_id = ${eventId} 
      AND club_name IS NOT NULL 
      AND club_name != ''
    `);
    
    // Get club records that match these names
    let clubsList = [];
    if (existingClubs.rows.length > 0) {
      const clubNames = existingClubs.rows.map((row: any) => row.club_name);
      
      // First check if these clubs exist in the clubs table
      clubsList = await db
        .select()
        .from(clubs)
        .where(
          clubNames.length === 1 
            ? eq(clubs.name, clubNames[0]) 
            : sql`${clubs.name} IN (${sql.join(clubNames.map(name => sql`${name}`), sql`, `)})`)
        .orderBy(clubs.name);
    }
    
    // Also get all other clubs
    const allClubs = await db.select().from(clubs).orderBy(clubs.name);
    
    // Merge the results, prioritizing clubs for this event
    const combinedClubs = [
      ...clubsList,
      ...allClubs.filter(club => !clubsList.some(c => c.id === club.id))
    ];
    
    res.json(combinedClubs);
  } catch (error) {
    console.error('Error fetching clubs for event:', error);
    res.status(500).json({ error: 'Failed to fetch clubs for event' });
  }
});

// POST /api/clubs - Create a new club
router.post('/', upload.single('logo'), async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Club name is required' });
    }
    
    // Check if club already exists
    const existingClub = await db
      .select()
      .from(clubs)
      .where(eq(clubs.name, name))
      .limit(1);
    
    if (existingClub.length > 0) {
      return res.status(400).json({ error: 'A club with this name already exists' });
    }
    
    let logoUrl = null;
    
    // If a logo was uploaded, process and save it
    if (req.file) {
      try {
        // Resize the image to a standard size
        const outputPath = path.join('./uploads/club-logos', `resized-${req.file.filename}`);
        await sharp(req.file.path)
          .resize(200, 200, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
          .toFile(outputPath);
        
        // Update the logo URL to point to the resized image
        logoUrl = `/uploads/club-logos/resized-${req.file.filename}`;
      } catch (error) {
        console.error('Error processing logo:', error);
        // If image processing fails, use the original file
        logoUrl = `/uploads/club-logos/${req.file.filename}`;
      }
    }
    
    // Create the new club
    const newClub = await db.insert(clubs).values({
      name,
      logoUrl,
    }).returning();
    
    res.status(201).json(newClub[0]);
  } catch (error) {
    console.error('Error creating club:', error);
    res.status(500).json({ error: 'Failed to create club' });
  }
});

export default router;