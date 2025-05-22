import { Router } from 'express';
import { db } from '../../../db/index.js';
import { eventAgeGroupEligibility } from '../../../db/schema-updates.js';
import { eq, and } from 'drizzle-orm';

const router = Router();

/**
 * Get eligibility settings for all age groups in an event
 */
router.get('/event/:eventId', async (req, res) => {
  try {
    const eventId = parseInt(req.params.eventId);
    
    // Validate event ID
    if (isNaN(eventId)) {
      return res.status(400).json({ error: 'Invalid event ID' });
    }
    
    // Get all eligibility settings for this event
    const eligibilitySettings = await db
      .select()
      .from(eventAgeGroupEligibility)
      .where(eq(eventAgeGroupEligibility.eventId, eventId));
    
    return res.json(eligibilitySettings);
  } catch (error) {
    console.error('Error fetching age group eligibility settings:', error);
    return res.status(500).json({ error: 'Failed to fetch age group eligibility settings' });
  }
});

/**
 * Update eligibility setting for a specific age group in an event
 */
router.put('/:ageGroupId', async (req, res) => {
  try {
    const ageGroupId = req.params.ageGroupId; // Keep as string for composite IDs like "male-2014-U11"
    const { isEligible, eventId } = req.body;
    
    // Validate input
    if (!ageGroupId || isNaN(eventId)) {
      return res.status(400).json({ error: 'Invalid age group ID or event ID' });
    }
    
    if (typeof isEligible !== 'boolean') {
      return res.status(400).json({ error: 'isEligible must be a boolean value' });
    }
    
    console.log(`Updating eligibility setting for event ${eventId}, age group ${ageGroupId}, isEligible: ${isEligible}`);

    // Check if a record already exists
    const existingSettings = await db
      .select()
      .from(eventAgeGroupEligibility)
      .where(
        and(
          eq(eventAgeGroupEligibility.eventId, eventId),
          eq(eventAgeGroupEligibility.ageGroupId, ageGroupId)
        )
      );
    
    if (existingSettings.length > 0) {
      console.log(`Found existing eligibility setting, updating to ${isEligible}`);
      // Update existing record
      await db
        .update(eventAgeGroupEligibility)
        .set({ isEligible })
        .where(
          and(
            eq(eventAgeGroupEligibility.eventId, eventId),
            eq(eventAgeGroupEligibility.ageGroupId, ageGroupId)
          )
        );
    } else {
      console.log(`No existing eligibility setting found, creating new record with isEligible: ${isEligible}`);
      // Create new record
      await db.insert(eventAgeGroupEligibility).values({
        eventId,
        ageGroupId,
        isEligible
      });
    }
    
    return res.json({ success: true, message: 'Eligibility setting updated successfully' });
  } catch (error) {
    console.error('Error updating age group eligibility setting:', error);
    return res.status(500).json({ error: 'Failed to update age group eligibility setting' });
  }
});

export default router;