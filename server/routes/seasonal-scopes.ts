import { Router } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../../db';
import { seasonalScopes, ageGroupSettings } from '@db/schema';
import { z } from 'zod';

const router = Router();

const ageGroupSettingsSchema = z.object({
  ageGroup: z.string(),
  birthYear: z.number(),
  gender: z.string(),
  divisionCode: z.string(),
  minBirthYear: z.number(),
  maxBirthYear: z.number(),
});

const seasonalScopeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  startYear: z.number().min(2000).max(2100),
  endYear: z.number().min(2000).max(2100),
  isActive: z.boolean(),
  ageGroups: z.array(ageGroupSettingsSchema),
});

// Get all seasonal scopes
router.get('/', async (req, res) => {
  try {
    const scopes = await db.query.seasonalScopes.findMany({
      with: {
        ageGroups: true,
      },
    });
    res.json(scopes);
  } catch (error) {
    console.error('Error fetching seasonal scopes:', error);
    res.status(500).json({ error: 'Failed to fetch seasonal scopes' });
  }
});

// Create a new seasonal scope
router.post('/', async (req, res) => {
  try {
    const validatedData = seasonalScopeSchema.parse(req.body);

    const scope = await db.transaction(async (tx) => {
      const [newScope] = await tx.insert(seasonalScopes).values({
        name: validatedData.name,
        startYear: validatedData.startYear,
        endYear: validatedData.endYear,
        isActive: validatedData.isActive,
      }).returning();

      const ageGroupsWithScopeId = validatedData.ageGroups.map(group => ({
        ...group,
        seasonalScopeId: newScope.id,
      }));

      await tx.insert(ageGroupSettings).values(ageGroupsWithScopeId);

      return newScope;
    });

    res.status(201).json(scope);
  } catch (error) {
    console.error('Error creating seasonal scope:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
    } else {
      res.status(500).json({ error: 'Failed to create seasonal scope' });
    }
  }
});

// Update a seasonal scope
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = seasonalScopeSchema.parse(req.body);

    await db.transaction(async (tx) => {
      await tx.update(seasonalScopes)
        .set({
          name: validatedData.name,
          startYear: validatedData.startYear,
          endYear: validatedData.endYear,
          isActive: validatedData.isActive,
        })
        .where(eq(seasonalScopes.id, parseInt(id)));

      // Update age groups
      await tx.delete(ageGroupSettings)
        .where(eq(ageGroupSettings.seasonalScopeId, parseInt(id)));

      const ageGroupsWithScopeId = validatedData.ageGroups.map(group => ({
        ...group,
        seasonalScopeId: parseInt(id),
      }));

      await tx.insert(ageGroupSettings).values(ageGroupsWithScopeId);
    });

    res.json({ message: 'Seasonal scope updated successfully' });
  } catch (error) {
    console.error('Error updating seasonal scope:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
    } else {
      res.status(500).json({ error: 'Failed to update seasonal scope' });
    }
  }
});

export default router;