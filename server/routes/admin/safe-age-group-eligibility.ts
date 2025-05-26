/**
 * Safe Age Group Eligibility API
 * 
 * This endpoint ONLY updates eligibility settings without touching age groups.
 * Prevents all constraint violations by never deleting age group records.
 */

import { Router } from 'express';
import { db } from '../../../db';
import { eventAgeGroupEligibilitySettings } from '../../../db/schema';
import { eq, and } from 'drizzle-orm';

const router = Router();

// Update age group eligibility safely (no deletions)
router.patch('/events/:eventId/age-groups/:ageGroupId/eligibility', async (req, res) => {
  try {
    const { eventId, ageGroupId } = req.params;
    const { isEligible } = req.body;
    
    console.log(`Safe eligibility update: Event ${eventId}, Age Group ${ageGroupId}, Eligible: ${isEligible}`);
    
    // Check if eligibility setting exists
    const existing = await db
      .select()
      .from(eventAgeGroupEligibilitySettings)
      .where(
        and(
          eq(eventAgeGroupEligibilitySettings.eventId, eventId),
          eq(eventAgeGroupEligibilitySettings.ageGroupId, parseInt(ageGroupId))
        )
      )
      .limit(1);
    
    if (existing.length > 0) {
      // Update existing eligibility setting
      await db
        .update(eventAgeGroupEligibilitySettings)
        .set({ 
          isEligible: Boolean(isEligible),
          updatedAt: new Date().toISOString()
        })
        .where(
          and(
            eq(eventAgeGroupEligibilitySettings.eventId, eventId),
            eq(eventAgeGroupEligibilitySettings.ageGroupId, parseInt(ageGroupId))
          )
        );
        
      console.log(`✅ Updated eligibility setting for age group ${ageGroupId}`);
    } else {
      // Create new eligibility setting
      await db
        .insert(eventAgeGroupEligibilitySettings)
        .values({
          eventId,
          ageGroupId: parseInt(ageGroupId),
          isEligible: Boolean(isEligible),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        
      console.log(`✅ Created new eligibility setting for age group ${ageGroupId}`);
    }
    
    res.json({ 
      success: true, 
      message: `Age group eligibility updated successfully`,
      ageGroupId: parseInt(ageGroupId),
      isEligible: Boolean(isEligible)
    });
    
  } catch (error) {
    console.error('Safe eligibility update error:', error);
    res.status(500).json({ 
      error: 'Failed to update age group eligibility',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;