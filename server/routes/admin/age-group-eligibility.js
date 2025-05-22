import { Router } from 'express';
import { db } from '../../../db/index.js';
import { eventAgeGroups } from '../../../db/schema.js';
import { eq } from 'drizzle-orm';

const router = Router();

// Update age group eligibility status
router.put('/:ageGroupId', async (req, res) => {
  try {
    const { ageGroupId } = req.params;
    const { isEligible } = req.body;
    
    console.log(`Updating age group ${ageGroupId} eligibility to: ${isEligible}`);
    
    if (isEligible === undefined) {
      return res.status(400).json({ error: 'isEligible field is required' });
    }

    // Update the age group's eligibility
    await db
      .update(eventAgeGroups)
      .set({ isEligible: isEligible })
      .where(eq(eventAgeGroups.id, parseInt(ageGroupId)));
    
    return res.json({ success: true, message: 'Age group eligibility updated successfully' });
  } catch (error) {
    console.error('Error updating age group eligibility:', error);
    return res.status(500).json({ error: 'Failed to update age group eligibility' });
  }
});

// Bulk update age group eligibility for multiple age groups
router.put('/', async (req, res) => {
  try {
    const { ageGroups } = req.body;
    
    if (!ageGroups || !Array.isArray(ageGroups)) {
      return res.status(400).json({ error: 'ageGroups array is required' });
    }

    console.log(`Bulk updating eligibility for ${ageGroups.length} age groups`);
    
    // Update each age group's eligibility
    for (const ag of ageGroups) {
      if (ag.id && ag.isEligible !== undefined) {
        await db
          .update(eventAgeGroups)
          .set({ isEligible: ag.isEligible })
          .where(eq(eventAgeGroups.id, parseInt(ag.id)));
      }
    }
    
    return res.json({ 
      success: true, 
      message: `Updated eligibility for ${ageGroups.length} age groups` 
    });
  } catch (error) {
    console.error('Error bulk updating age group eligibility:', error);
    return res.status(500).json({ error: 'Failed to update age group eligibility' });
  }
});

export default router;