import { Router } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../../db';
import { seasonalScopes, ageGroupSettings, events, eventAgeGroups } from '@db/schema';
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

// Check if a seasonal scope is in use
router.get('/:id/in-use', async (req, res) => {
  try {
    const { id } = req.params;
    const scopeId = parseInt(id);

    // Get all age groups for this scope
    const ageGroups = await db.query.ageGroupSettings.findMany({
      where: eq(ageGroupSettings.seasonalScopeId, scopeId),
    });

    // Check if any events are using age groups from this scope
    const eventsUsingScope = await db.query.events.findFirst({
      where: (fields, { exists, and, eq: eqOp }) =>
        exists(eventAgeGroups, (eventAgeGroup) =>
          and(
            eqOp(eventAgeGroup.seasonalScopeId, scopeId)
          )
        ),
    });

    res.json({
      inUse: !!eventsUsingScope,
      message: eventsUsingScope 
        ? 'This seasonal scope is currently in use by an event and cannot be deleted.'
        : 'Seasonal scope can be safely deleted.',
    });
  } catch (error) {
    console.error('Error checking if seasonal scope is in use:', error);
    res.status(500).json({ error: 'Failed to check if seasonal scope is in use' });
  }
});

// Delete a seasonal scope
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const scopeId = parseInt(id);

    // Check if any events are using age groups from this scope
    const eventsUsingScope = await db.query.events.findFirst({
      where: (fields, { exists, and, eq: eqOp }) =>
        exists(eventAgeGroups, (eventAgeGroup) =>
          and(
            eqOp(eventAgeGroup.seasonalScopeId, scopeId)
          )
        ),
    });

    if (eventsUsingScope) {
      return res.status(400).json({
        error: 'This seasonal scope is currently in use by an event and cannot be deleted.'
      });
    }

    // If not in use, proceed with deletion
    await db.transaction(async (tx) => {
      // Delete age groups first (cascade will handle this, but being explicit)
      await tx.delete(ageGroupSettings)
        .where(eq(ageGroupSettings.seasonalScopeId, scopeId));

      // Then delete the scope
      await tx.delete(seasonalScopes)
        .where(eq(seasonalScopes.id, scopeId));
    });

    res.json({ message: 'Seasonal scope deleted successfully' });
  } catch (error) {
    console.error('Error deleting seasonal scope:', error);
    res.status(500).json({ error: 'Failed to delete seasonal scope' });
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