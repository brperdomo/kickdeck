/**
 * Dedicated Age Group Eligibility Routes
 * 
 * This file contains routes specifically for managing age group eligibility
 * without triggering any age group deletions that cause constraint violations.
 */

import { Router } from 'express';
import { db } from '@db';
import { eventAgeGroupEligibility } from '@db/schema';
import { eq, and } from 'drizzle-orm';

const router = Router();

// Update age group eligibility status
router.patch('/events/:eventId/age-groups/:ageGroupId/eligibility', async (req, res) => {
  try {
    const { eventId, ageGroupId } = req.params;
    const { isEligible } = req.body;

    console.log(`Updating eligibility for age group ${ageGroupId} in event ${eventId} to ${isEligible}`);

    // Check if eligibility record exists
    const existingRecord = await db.query.eventAgeGroupEligibility.findFirst({
      where: and(
        eq(eventAgeGroupEligibility.eventId, eventId),
        eq(eventAgeGroupEligibility.ageGroupId, parseInt(ageGroupId))
      )
    });

    if (existingRecord) {
      // Update existing record
      await db.update(eventAgeGroupEligibility)
        .set({ 
          isEligible,
          updatedAt: new Date().toISOString()
        })
        .where(and(
          eq(eventAgeGroupEligibility.eventId, eventId),
          eq(eventAgeGroupEligibility.ageGroupId, parseInt(ageGroupId))
        ));
    } else {
      // Create new record
      await db.insert(eventAgeGroupEligibility).values({
        eventId,
        ageGroupId: parseInt(ageGroupId),
        isEligible,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    console.log(`Successfully updated eligibility for age group ${ageGroupId}`);
    
    res.json({ 
      success: true, 
      message: 'Age group eligibility updated successfully',
      ageGroupId: parseInt(ageGroupId),
      isEligible 
    });
  } catch (error) {
    console.error('Error updating age group eligibility:', error);
    res.status(500).json({ 
      error: 'Failed to update age group eligibility',
      details: error.message 
    });
  }
});

// Get eligibility status for all age groups in an event
router.get('/events/:eventId/eligibility', async (req, res) => {
  try {
    const { eventId } = req.params;
    
    const eligibilityRecords = await db.query.eventAgeGroupEligibility.findMany({
      where: eq(eventAgeGroupEligibility.eventId, eventId)
    });

    res.json(eligibilityRecords);
  } catch (error) {
    console.error('Error fetching age group eligibility:', error);
    res.status(500).json({ 
      error: 'Failed to fetch age group eligibility',
      details: error.message 
    });
  }
});

export default router;