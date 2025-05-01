import { Router } from 'express';
import { db } from '@db';
import { teams, clubs } from '@db/schema';
import { eq, and, sql } from 'drizzle-orm';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import { hasEventAccess } from '../../middleware/event-access';

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

// GET /api/admin/events/:eventId/clubs - Get all clubs for an event
router.get('/:eventId/clubs', hasEventAccess, async (req, res) => {
  try {
    const { eventId } = req.params;

    // Get all unique club IDs from teams registered for this event
    const teamClubs = await db
      .select({
        clubId: teams.clubId,
        clubName: teams.clubName
      })
      .from(teams)
      .where(eq(teams.eventId, eventId))
      .groupBy(teams.clubId, teams.clubName);
    
    // Create a list of club IDs
    const clubIds = teamClubs
      .filter(tc => tc.clubId !== null)
      .map(tc => tc.clubId) as number[];
    
    // Get club details from the clubs table
    const clubsList = clubIds.length > 0 
      ? await db
          .select()
          .from(clubs)
          .where(sql`${clubs.id} IN (${clubIds.join(',')})`)
      : [];
    
    // Get team counts for each club
    const clubTeamCounts = await Promise.all(clubIds.map(async (clubId) => {
      const count = await db
        .select({ count: sql<number>`count(*)` })
        .from(teams)
        .where(and(
          eq(teams.eventId, eventId),
          eq(teams.clubId, clubId)
        ));
      
      return { clubId, count: count[0].count };
    }));

    // Merge club details with team counts
    const clubsWithCounts = clubsList.map(club => {
      const teamCount = clubTeamCounts.find(c => c.clubId === club.id)?.count || 0;
      return { ...club, teamCount };
    });
    
    // Check for unlinked clubs (teams with club name but no club ID)
    const unlinkedClubs = teamClubs
      .filter(tc => tc.clubId === null && tc.clubName && tc.clubName.trim() !== '')
      .map(tc => tc.clubName);
    
    // Add placeholder entries for unlinked clubs
    const unlinkedClubEntries = unlinkedClubs.map(name => {
      // Count teams for this unlinked club
      const teamCount = teamClubs.filter(tc => tc.clubName === name).length;
      
      return {
        id: -1, // Use a placeholder ID for unlinked clubs
        name,
        logoUrl: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        teamCount
      };
    });

    res.json([...clubsWithCounts, ...unlinkedClubEntries]);
  } catch (error) {
    console.error('Error fetching clubs for event:', error);
    res.status(500).json({ error: 'Failed to fetch clubs for event' });
  }
});

// POST /api/admin/events/:eventId/clubs - Add a new club and associate with the event
router.post('/:eventId/clubs', hasEventAccess, upload.single('logo'), async (req, res) => {
  try {
    const { eventId } = req.params;
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
    
    // If club exists, just return it
    if (existingClub.length > 0) {
      return res.status(200).json({
        ...existingClub[0],
        message: 'Club already exists'
      });
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
    
    // Get count of teams for this club in this event (will be 0 for new clubs)
    const teamCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(teams)
      .where(and(
        eq(teams.eventId, eventId),
        eq(teams.clubName, name)
      ));
    
    res.status(201).json({
      ...newClub[0],
      teamCount: teamCount[0].count
    });
  } catch (error) {
    console.error('Error creating club:', error);
    res.status(500).json({ error: 'Failed to create club' });
  }
});

// Export the router
export default router;