import { Router } from 'express';
import { db } from '../../db';
import { events, eventAgeGroups, eventAgeGroupFees, eventFees } from '@db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { sql } from 'drizzle-orm/sql';

const router = Router();

// Update event endpoint
router.patch('/:id', async (req, res) => {
  try {
    const eventId = req.params.id;
    const eventData = req.body;

    console.log('Updating event:', eventId);
    console.log('Received update data:', JSON.stringify(eventData, null, 2));

    // Begin a transaction
    const result = await db.transaction(async (tx) => {
      // Update event basic info
      const [updatedEvent] = await tx
        .update(events)
        .set({
          name: eventData.name,
          startDate: eventData.startDate,
          endDate: eventData.endDate,
          timezone: eventData.timezone,
          applicationDeadline: eventData.applicationDeadline,
          details: eventData.details,
          agreement: eventData.agreement,
          refundPolicy: eventData.refundPolicy,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(events.id, BigInt(eventId)))
        .returning();

      console.log('Event basic info updated');

      // First, delete all existing age groups and their fee assignments
      await tx.delete(eventAgeGroupFees)
        .where(
          eq(eventAgeGroupFees.ageGroupId, 
            sql`(SELECT id FROM event_age_groups WHERE event_id = ${eventId.toString()})`
          )
        );

      await tx.delete(eventAgeGroups)
        .where(eq(eventAgeGroups.eventId, eventId.toString()));

      console.log('Existing age groups and fee assignments deleted');

      // Insert new age groups and their fee assignments
      if (eventData.ageGroups && eventData.ageGroups.length > 0) {
        console.log('Processing age groups:', eventData.ageGroups);

        // Filter only selected age groups
        const selectedGroups = eventData.ageGroups.filter(group => group.selected);
        console.log('Selected age groups:', selectedGroups);

        // Use a Map to prevent duplicate age groups based on gender and age group
        const processedGroups = new Map();

        for (const group of selectedGroups) {
          // Create a unique key for this group
          const groupKey = `${group.gender}-${group.ageGroup}`;

          // Skip if we've already processed this group
          if (processedGroups.has(groupKey)) {
            console.log(`Skipping duplicate group: ${groupKey}`);
            continue;
          }

          processedGroups.set(groupKey, group);
          console.log('Processing selected group:', group);

          // Insert age group
          const [insertedAgeGroup] = await tx
            .insert(eventAgeGroups)
            .values({
              eventId: eventId.toString(),
              ageGroup: group.ageGroup,
              birthYear: group.birthYear,
              gender: group.gender,
              projectedTeams: group.projectedTeams || null,
              fieldSize: group.fieldSize || null,
              scoringRule: group.scoringRule || null,
              amountDue: group.amountDue || null,
              createdAt: new Date().toISOString(),
              birth_date_start: group.birth_date_start || null,
              divisionCode: group.divisionCode || null,
            })
            .returning();

          console.log('Inserted age group:', insertedAgeGroup);

          // If fee is assigned, create the fee assignment
          if (group.feeId) {
            console.log('Creating fee assignment for group:', {
              ageGroupId: insertedAgeGroup.id,
              feeId: group.feeId
            });

            await tx
              .insert(eventAgeGroupFees)
              .values({
                ageGroupId: insertedAgeGroup.id,
                feeId: group.feeId,
                createdAt: new Date().toISOString(),
              });

            console.log('Fee assignment created successfully');
          }
        }
      }

      return updatedEvent;
    });

    console.log('Event update completed:', result);
    res.json({ message: "Event updated successfully", event: result });
  } catch (error) {
    console.error("Error updating event:", error);
    res.status(500).json({ 
      error: "Failed to update event", 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

// Added route to fetch age groups with deduplication
app.get('/api/admin/events/:eventId/age-groups', isAdmin, async (req, res) => {
  try {
    const eventId = req.params.eventId;

    // Use a direct SQL query to ensure we get only the distinct age groups
    const ageGroups = await db
      .select()
      .from(eventAgeGroups)
      .where(eq(eventAgeGroups.eventId, eventId))
      .orderBy(eventAgeGroups.gender, eventAgeGroups.ageGroup);

    // Create unique groups based on age group and gender only
    // This should drastically reduce the number of duplicates
    const uniqueMap = new Map();
    const uniqueGroups = [];

    for (const group of ageGroups) {
      // Use only gender and ageGroup as the key to match boys/girls U4-U18
      const key = `${group.gender}-${group.ageGroup}`;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, group);
        uniqueGroups.push(group);
      }
    }

    console.log(`Fetched ${ageGroups.length} age groups for event ${eventId}`);
    console.log(`Returning ${uniqueGroups.length} unique age groups after deduplication`);

    res.json(uniqueGroups);
  } catch (error) {
    console.error('Error fetching age groups:', error);
    res.status(500).json({ error: 'Failed to fetch age groups' });
  }
});

export default router;