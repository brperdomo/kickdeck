import { Router } from 'express';
import { db } from '../../db';
import { and, eq } from 'drizzle-orm';
import { eventBrackets, eventAgeGroups } from '../../db/schema';

const router = Router();

// Get brackets for a specific age group (public endpoint for registration)
router.get('/:ageGroupId/brackets', async (req, res) => {
  try {
    const { ageGroupId } = req.params;
    
    // Get all brackets for the specific age group
    const brackets = await db
      .select()
      .from(eventBrackets)
      .where(eq(eventBrackets.ageGroupId, parseInt(ageGroupId)))
      .orderBy(eventBrackets.sortOrder);
    
    res.json(brackets);
  } catch (error) {
    console.error('Error fetching age group brackets:', error);
    res.status(500).json({ error: 'Failed to fetch age group brackets' });
  }
});

// Get information about a specific age group (public endpoint for registration)
router.get('/:ageGroupId', async (req, res) => {
  try {
    const { ageGroupId } = req.params;
    
    // Get the age group information
    const ageGroup = await db
      .select()
      .from(eventAgeGroups)
      .where(eq(eventAgeGroups.id, parseInt(ageGroupId)))
      .limit(1);
    
    if (ageGroup.length === 0) {
      return res.status(404).json({ error: 'Age group not found' });
    }
    
    res.json(ageGroup[0]);
  } catch (error) {
    console.error('Error fetching age group:', error);
    res.status(500).json({ error: 'Failed to fetch age group' });
  }
});

export default router;