import { Router } from 'express';
import { db } from '@db';
import { seasonalScopes, ageGroupSettings } from '@db/schema';
import { and, eq } from 'drizzle-orm';

const router = Router();

// Get all seasonal scopes with their age groups
router.get('/', async (req, res) => {
  try {
    console.log('Fetching seasonal scopes...');
    const scopes = await db.query.seasonalScopes.findMany({
      with: {
        ageGroups: {
          columns: {
            id: true,
            seasonalScopeId: true,
            ageGroup: true,
            birthYear: true,
            gender: true,
            divisionCode: true,
            minBirthYear: true,
            maxBirthYear: true,
            createdAt: true,
            updatedAt: true,
          }
        }
      },
      orderBy: (seasonalScopes, { desc }) => [desc(seasonalScopes.createdAt)]
    });

    // Log the first scope for debugging
    if (scopes.length > 0) {
      console.log('Sample scope data:', JSON.stringify(scopes[0], null, 2));
    }

    res.json(scopes);
  } catch (error) {
    console.error('Error fetching seasonal scopes:', error);
    res.status(500).json({ message: 'Failed to fetch seasonal scopes' });
  }
});

// Create a new seasonal scope with age groups
router.post('/', async (req, res) => {
  try {
    const { name, startYear, endYear, ageGroups } = req.body;
    console.log('Creating seasonal scope with data:', { name, startYear, endYear, ageGroups });

    // Create the seasonal scope
    const [scope] = await db.insert(seasonalScopes).values({
      name,
      startYear,
      endYear,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();

    // Create age group settings for the scope
    if (ageGroups && Array.isArray(ageGroups) && ageGroups.length > 0) {
      const ageGroupsToInsert = ageGroups.map(group => ({
        seasonalScopeId: scope.id,
        ageGroup: group.ageGroup,
        birthYear: group.birthYear,
        gender: group.gender,
        divisionCode: group.divisionCode,
        minBirthYear: group.birthYear,
        maxBirthYear: group.birthYear,
        createdAt: new Date(),
        updatedAt: new Date()
      }));

      console.log('Inserting age groups:', JSON.stringify(ageGroupsToInsert, null, 2));
      await db.insert(ageGroupSettings).values(ageGroupsToInsert);
    }

    // Fetch the created scope with its age groups
    const createdScope = await db.query.seasonalScopes.findFirst({
      where: eq(seasonalScopes.id, scope.id),
      with: {
        ageGroups: true
      }
    });

    console.log('Created scope with age groups:', JSON.stringify(createdScope, null, 2));
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
        ageGroups: {
          columns: {
            id: true,
            seasonalScopeId: true,
            ageGroup: true,
            birthYear: true,
            gender: true,
            divisionCode: true,
            minBirthYear: true,
            maxBirthYear: true,
            createdAt: true,
            updatedAt: true,
          }
        }
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