import { Router } from 'express';
import { db } from '../../../db';
import { clubs } from '@db/schema';
import { eq, sql, and, like } from 'drizzle-orm';
import { z } from 'zod';

const router = Router();

// Get all clubs
router.get('/', async (req, res) => {
  try {
    const clubs_list = await db.select().from(clubs);
    return res.json(clubs_list);
  } catch (error) {
    console.error('Error getting clubs:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Get club by ID
router.get('/:id', async (req, res) => {
  try {
    const clubId = parseInt(req.params.id);
    const [club] = await db
      .select()
      .from(clubs)
      .where(eq(clubs.id, clubId))
      .limit(1);

    if (!club) {
      return res.status(404).json({ error: 'Club not found' });
    }

    return res.json(club);
  } catch (error) {
    console.error('Error getting club by ID:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Create club
router.post('/', async (req, res) => {
  try {
    const clubSchema = z.object({
      name: z.string().min(1, "Club name is required"),
      logoUrl: z.string().optional().nullable(),
    });

    const validatedData = clubSchema.parse(req.body);

    const [club] = await db
      .insert(clubs)
      .values({
        name: validatedData.name,
        logoUrl: validatedData.logoUrl || null,
        createdAt: new Date().toISOString(),
      })
      .returning();

    return res.status(201).json(club);
  } catch (error) {
    console.error('Error creating club:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Update club
router.patch('/:id', async (req, res) => {
  try {
    const clubId = parseInt(req.params.id);
    const clubSchema = z.object({
      name: z.string().min(1, "Club name is required").optional(),
      logoUrl: z.string().optional().nullable(),
    });

    const validatedData = clubSchema.parse(req.body);

    const [updatedClub] = await db
      .update(clubs)
      .set({
        name: validatedData.name,
        logoUrl: validatedData.logoUrl,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(clubs.id, clubId))
      .returning();

    if (!updatedClub) {
      return res.status(404).json({ error: 'Club not found' });
    }

    return res.json(updatedClub);
  } catch (error) {
    console.error('Error updating club:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete club
router.delete('/:id', async (req, res) => {
  try {
    const clubId = parseInt(req.params.id);
    const [deletedClub] = await db
      .delete(clubs)
      .where(eq(clubs.id, clubId))
      .returning();

    if (!deletedClub) {
      return res.status(404).json({ error: 'Club not found' });
    }

    return res.json({ message: 'Club deleted successfully' });
  } catch (error) {
    console.error('Error deleting club:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Search clubs
router.get('/search/:query', async (req, res) => {
  try {
    const searchQuery = req.params.query;
    const clubs_list = await db
      .select()
      .from(clubs)
      .where(like(clubs.name, `%${searchQuery}%`))
      .limit(10);

    return res.json(clubs_list);
  } catch (error) {
    console.error('Error searching clubs:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;