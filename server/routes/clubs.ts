import { Router } from 'express';
import { db } from '@db';
import { clubs, teams, files, folders } from '@db/schema';
import { eq, sql, and } from 'drizzle-orm';
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
      try {
        await fs.access(uploadsDir);
      } catch {
        await fs.mkdir(uploadsDir, { recursive: true });
      }
      cb(null, uploadsDir);
    } catch (error) {
      cb(error as Error, './uploads/club-logos');
    }
  },
  filename: (req, file, cb) => {
    const uniqueId = uuidv4();
    const extension = path.extname(file.originalname).toLowerCase();
    cb(null, `${uniqueId}${extension}`);
  }
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});

/**
 * Ensure the "Clubs" and "Clubs > Logos" folders exist in the file manager.
 * Returns the Logos folder ID.
 */
async function ensureLogosFolder(): Promise<string> {
  // Find or create "Clubs" folder (top-level)
  let [clubsFolder] = await db
    .select()
    .from(folders)
    .where(and(eq(folders.name, 'Clubs'), sql`${folders.parentId} IS NULL`))
    .limit(1);

  if (!clubsFolder) {
    const clubsFolderId = uuidv4();
    [clubsFolder] = await db
      .insert(folders)
      .values({ id: clubsFolderId, name: 'Clubs', parentId: null })
      .returning();
  }

  // Find or create "Logos" subfolder under Clubs
  let [logosFolder] = await db
    .select()
    .from(folders)
    .where(and(eq(folders.name, 'Logos'), eq(folders.parentId, clubsFolder.id)))
    .limit(1);

  if (!logosFolder) {
    const logosFolderId = uuidv4();
    [logosFolder] = await db
      .insert(folders)
      .values({ id: logosFolderId, name: 'Logos', parentId: clubsFolder.id })
      .returning();
  }

  return logosFolder.id;
}

/**
 * Create a file manager entry for an uploaded logo.
 */
async function createFileManagerEntry(
  logoUrl: string,
  clubName: string,
  fileSize: number,
  mimeType: string,
  logosFolderId: string
) {
  const fileId = uuidv4();
  const extension = path.extname(logoUrl);
  const fileName = `${clubName}${extension}`;

  await db.insert(files).values({
    id: fileId,
    name: fileName,
    url: logoUrl,
    type: mimeType,
    size: fileSize,
    folderId: logosFolderId,
    relatedEntityType: 'club_logo',
    category: 'logo',
  });

  return fileId;
}

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
      SELECT DISTINCT club_name, club_id
      FROM teams
      WHERE event_id = ${eventId}
      AND club_name IS NOT NULL
      AND club_name != ''
    `);

    let clubsList: any[] = [];
    if (existingClubs.rows.length > 0) {
      const clubNames = existingClubs.rows.map((row: any) => row.club_name);
      const clubIds = existingClubs.rows
        .filter((row: any) => row.club_id !== null)
        .map((row: any) => row.club_id);

      // Check clubs by IDs
      if (clubIds.length > 0) {
        clubsList = await db
          .select()
          .from(clubs)
          .where(
            clubIds.length === 1
              ? eq(clubs.id, clubIds[0])
              : sql`${clubs.id} IN (${sql.join(clubIds.map((id: any) => sql`${id}`), sql`, `)})`
          )
          .orderBy(clubs.name);
      }

      // Check remaining club names
      if (clubNames.length > 0 && (clubIds.length === 0 || clubsList.length < clubNames.length)) {
        const nameClubs = await db
          .select()
          .from(clubs)
          .where(
            clubNames.length === 1
              ? eq(clubs.name, clubNames[0])
              : sql`${clubs.name} IN (${sql.join(clubNames.map((n: any) => sql`${n}`), sql`, `)})`
          )
          .orderBy(clubs.name);

        for (const club of nameClubs) {
          if (!clubsList.some((c: any) => c.id === club.id)) {
            clubsList.push(club);
          }
        }
      }
    }

    res.json(clubsList);
  } catch (error) {
    console.error('Error fetching clubs for event:', error);
    res.status(500).json({ error: 'Failed to fetch clubs for event' });
  }
});

// POST /api/clubs - Create a new club (with or without logo)
router.post('/', upload.single('logo'), async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Club name is required' });
    }

    // Check if club already exists (case-insensitive)
    const [existingClub] = await db
      .select()
      .from(clubs)
      .where(sql`LOWER(${clubs.name}) = LOWER(${name})`)
      .limit(1);

    if (existingClub) {
      // If club exists and a new logo was uploaded, update it
      if (req.file) {
        const logoUrl = await processLogo(req.file);
        await db.update(clubs).set({ logoUrl }).where(eq(clubs.id, existingClub.id));

        // Also save to file manager
        try {
          const logosFolderId = await ensureLogosFolder();
          const stat = await fs.stat(path.join('.', logoUrl));
          await createFileManagerEntry(logoUrl, existingClub.name, stat.size, req.file.mimetype, logosFolderId);
        } catch (fmErr) {
          console.error('Error saving logo to file manager:', fmErr);
        }

        return res.status(200).json({ ...existingClub, logoUrl });
      }
      // Return existing club (not an error — frontend can use the ID)
      return res.status(200).json(existingClub);
    }

    let logoUrl: string | null = null;

    if (req.file) {
      logoUrl = await processLogo(req.file);

      // Save logo to file manager under Clubs > Logos
      try {
        const logosFolderId = await ensureLogosFolder();
        const stat = await fs.stat(path.join('.', logoUrl));
        await createFileManagerEntry(logoUrl, name, stat.size, req.file.mimetype, logosFolderId);
      } catch (fmErr) {
        console.error('Error saving logo to file manager:', fmErr);
        // Non-fatal — club still gets created
      }
    }

    // Create the new club
    const [newClub] = await db.insert(clubs).values({
      name,
      logoUrl,
    }).returning();

    res.status(201).json(newClub);
  } catch (error) {
    console.error('Error creating club:', error);
    res.status(500).json({ error: 'Failed to create club' });
  }
});

/**
 * Process an uploaded logo file: resize and return the URL path.
 */
async function processLogo(file: Express.Multer.File): Promise<string> {
  try {
    const outputPath = path.join('./uploads/club-logos', `resized-${file.filename}`);
    await sharp(file.path)
      .resize(200, 200, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .toFile(outputPath);
    return `/uploads/club-logos/resized-${file.filename}`;
  } catch (error) {
    console.error('Error processing logo:', error);
    return `/uploads/club-logos/${file.filename}`;
  }
}

export default router;
