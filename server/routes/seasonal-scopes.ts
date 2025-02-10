import { Router } from 'express';
import { db } from '@db';
import { seasonalScopes, ageGroupSettings } from '@db/schema';
import { and, eq } from 'drizzle-orm';

const router = Router();

// Get all seasonal scopes with their age groups
router.get('/', async (req, res) => {
  try {
    const scopes = await db.query.seasonalScopes.findMany({
      with: {
        ageGroups: true
      }
    });
    res.json(scopes);
  } catch (error) {
    console.error('Error fetching seasonal scopes:', error);
    res.status(500).json({ message: 'Failed to fetch seasonal scopes' });
  }
});

// Create a new seasonal scope with age groups
router.post('/', async (req, res) => {
  try {
    const { name, startYear, endYear, isActive, ageGroups } = req.body;

    // Create the seasonal scope
    const [scope] = await db.insert(seasonalScopes).values({
      name,
      startYear,
      endYear,
      isActive,
    }).returning();

    // Create age group settings for the scope
    if (ageGroups && ageGroups.length > 0) {
      await db.insert(ageGroupSettings).values(
        ageGroups.map((group: { 
          ageGroup: string; 
          birthYear: number;
          gender: string;
          divisionCode: string;
        }) => ({
          seasonalScopeId: scope.id,
          ageGroup: group.ageGroup,
          minBirthYear: group.birthYear,
          maxBirthYear: group.birthYear,
          birthYear: group.birthYear,
          gender: group.gender,
          divisionCode: group.divisionCode
        }))
      );
    }

    // Fetch the created scope with its age groups
    const createdScope = await db.query.seasonalScopes.findFirst({
      where: eq(seasonalScopes.id, scope.id),
      with: {
        ageGroups: true
      }
    });

    res.status(200).json(createdScope);
  } catch (error) {
    console.error('Error creating seasonal scope:', error);
    console.error('Detailed error:', error instanceof Error ? error.message : error);
    res.status(500).json({ message: 'Failed to create seasonal scope' });
  }
});

// Update a seasonal scope
router.patch('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, startYear, endYear } = req.body;

    // Update the seasonal scope
    const [updatedScope] = await db.update(seasonalScopes)
      .set({
        name,
        startYear,
        endYear,
        updatedAt: new Date(),
      })
      .where(eq(seasonalScopes.id, id))
      .returning();

    if (!updatedScope) {
      return res.status(404).json({ message: 'Seasonal scope not found' });
    }

    // Fetch the updated scope with its age groups
    const scope = await db.query.seasonalScopes.findFirst({
      where: eq(seasonalScopes.id, id),
      with: {
        ageGroups: true
      }
    });

    res.json(scope);
  } catch (error) {
    console.error('Error updating seasonal scope:', error);
    console.error('Detailed error:', error instanceof Error ? error.message : error);
    res.status(500).json({ message: 'Failed to update seasonal scope' });
  }
});

export default router;