import { Router } from 'express';
import { eq, and, sql } from 'drizzle-orm';
import { db } from '../../db';
import { seasonalScopes, ageGroupSettings, events } from '@db/schema';
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
  createCoedGroups: z.boolean().default(false),
  coedOnly: z.boolean().default(false),
  ageGroups: z.array(ageGroupSettingsSchema),
});

// Get all seasonal scopes
router.get('/', async (req, res) => {
  try {
    // Use explicit select with only columns we know exist in the DB
    const scopes = await db
      .select({
        id: seasonalScopes.id,
        name: seasonalScopes.name,
        startYear: seasonalScopes.startYear,
        endYear: seasonalScopes.endYear,
        isActive: seasonalScopes.isActive,
        createdAt: seasonalScopes.createdAt,
        updatedAt: seasonalScopes.updatedAt,
        // Explicitly omit potentially missing columns like createCoedGroups and coedOnly
      })
      .from(seasonalScopes);
      
    // Fetch age groups separately for each scope
    const scopesWithAgeGroups = await Promise.all(
      scopes.map(async (scope) => {
        const ageGroups = await db.query.ageGroupSettings.findMany({
          where: eq(ageGroupSettings.seasonalScopeId, scope.id),
        });
        
        return {
          ...scope,
          // Add default values for potentially missing columns
          createCoedGroups: false,
          coedOnly: false,
          ageGroups,
        };
      })
    );
    
    res.json(scopesWithAgeGroups);
  } catch (error) {
    console.error('Error fetching seasonal scopes:', error);
    res.status(500).json({ error: 'Failed to fetch seasonal scopes' });
  }
});

// Get age groups for a specific seasonal scope
router.get('/:id/age-groups', async (req, res) => {
  try {
    const { id } = req.params;
    const scopeId = parseInt(id);
    
    const ageGroups = await db.query.ageGroupSettings.findMany({
      where: eq(ageGroupSettings.seasonalScopeId, scopeId),
    });
    
    console.log(`Found ${ageGroups.length} age groups for seasonal scope ${scopeId}`);
    res.json(ageGroups);
  } catch (error) {
    console.error('Error fetching age groups for seasonal scope:', error);
    res.status(500).json({ error: 'Failed to fetch age groups for seasonal scope' });
  }
});


// Delete a seasonal scope
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const scopeId = parseInt(id);

    // Proceed with deletion using a transaction
    await db.transaction(async (tx) => {
      // Delete age groups first
      await tx.delete(ageGroupSettings)
        .where(eq(ageGroupSettings.seasonalScopeId, scopeId));

      // Then delete the scope
      const deleteResult = await tx.delete(seasonalScopes)
        .where(eq(seasonalScopes.id, scopeId));

      if (!deleteResult) {
        throw new Error('Failed to delete seasonal scope');
      }
    });

    res.json({ message: 'Seasonal scope deleted successfully' });
  } catch (error) {
    console.error('Error deleting seasonal scope:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to delete seasonal scope'
    });
  }
});

// Create a new seasonal scope
router.post('/', async (req, res) => {
  try {
    const validatedData = seasonalScopeSchema.parse(req.body);

    const scope = await db.transaction(async (tx) => {
      // Only include columns we know exist in the DB
      // Check if create_coed_groups column exists in the database
      let hasCreateCoedGroups = true;
      let hasCoedOnly = true;
      
      try {
        // Try to query a record with these columns to check if they exist
        await tx.execute(sql`SELECT create_coed_groups, coed_only FROM seasonal_scopes LIMIT 1`);
      } catch (e) {
        // If error contains "column does not exist", check which column is missing
        const errorMsg = String(e);
        if (errorMsg.includes("column \"create_coed_groups\" does not exist")) {
          hasCreateCoedGroups = false;
        }
        if (errorMsg.includes("column \"coed_only\" does not exist")) {
          hasCoedOnly = false;
        }
      }
      
      // Create base values object with required fields
      const baseValues = {
        name: validatedData.name,
        startYear: validatedData.startYear,
        endYear: validatedData.endYear,
        isActive: validatedData.isActive,
      };
      
      // Only add columns if they exist in the database
      const valuesWithOptionalColumns = {
        ...baseValues,
        ...(hasCreateCoedGroups ? { createCoedGroups: validatedData.createCoedGroups } : {}),
        ...(hasCoedOnly ? { coedOnly: validatedData.coedOnly } : {})
      };
      
      const [newScope] = await tx.insert(seasonalScopes)
        .values(valuesWithOptionalColumns)
        .returning();

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
      // Check if column exists in the database, similar to create endpoint
      let hasCreateCoedGroups = true;
      let hasCoedOnly = true;
      
      try {
        // Try to query a record with these columns to check if they exist
        await tx.execute(sql`SELECT create_coed_groups, coed_only FROM seasonal_scopes LIMIT 1`);
      } catch (e) {
        // If error contains "column does not exist", check which column is missing
        const errorMsg = String(e);
        if (errorMsg.includes("column \"create_coed_groups\" does not exist")) {
          hasCreateCoedGroups = false;
        }
        if (errorMsg.includes("column \"coed_only\" does not exist")) {
          hasCoedOnly = false;
        }
      }
      
      // Create base values object with required fields
      const baseValues = {
        name: validatedData.name,
        startYear: validatedData.startYear,
        endYear: validatedData.endYear,
        isActive: validatedData.isActive,
      };
      
      // Only add columns if they exist in the database
      const valuesWithOptionalColumns = {
        ...baseValues,
        ...(hasCreateCoedGroups ? { createCoedGroups: validatedData.createCoedGroups } : {}),
        ...(hasCoedOnly ? { coedOnly: validatedData.coedOnly } : {})
      };

      await tx.update(seasonalScopes)
        .set(valuesWithOptionalColumns)
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