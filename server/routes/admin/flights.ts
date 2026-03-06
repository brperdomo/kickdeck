import { Router } from 'express';
import { db } from '../../../db';
import { eventBrackets, eventAgeGroups, teams } from '@db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { isAdmin } from '../../middleware/auth';

const router = Router();

// Get flights for an event
router.get('/:eventId/flights', isAdmin, async (req, res) => {
  try {
    const eventId = req.params.eventId;
    
    // Get all brackets for this event (flights are stored as brackets)
    const flights = await db
      .select({
        id: eventBrackets.id,
        name: eventBrackets.name,
        ageGroupId: eventBrackets.ageGroupId,
        maxTeams: eventBrackets.maxTeams,
        isActive: eventBrackets.isActive,
        ageGroup: eventAgeGroups.ageGroup,
        gender: eventAgeGroups.gender,
        fieldSize: eventAgeGroups.fieldSize
      })
      .from(eventBrackets)
      .leftJoin(eventAgeGroups, eq(eventBrackets.ageGroupId, eventAgeGroups.id))
      .where(eq(eventBrackets.eventId, eventId));

    // Get team counts for each flight
    const flightsWithTeams = await Promise.all(
      flights.map(async (flight) => {
        const teamCount = await db
          .select({ count: sql<number>`count(*)` })
          .from(teams)
          .where(
            and(
              eq(teams.eventId, eventId),
              eq(teams.status, 'approved'),
              sql`${teams.ageGroup} = ${flight.ageGroup}`,
              sql`${teams.gender} = ${flight.gender}`
            )
          );
        
        return {
          ...flight,
          teamCount: teamCount[0]?.count || 0,
          teams: [] // Will be populated when needed
        };
      })
    );

    res.json(flightsWithTeams);
  } catch (error) {
    console.error('Error fetching flights:', error);
    res.status(500).json({ error: 'Failed to fetch flights' });
  }
});

// Create a new flight
router.post('/:eventId/flights', isAdmin, async (req, res) => {
  try {
    const eventId = req.params.eventId;
    const { name, ageGroupId, gender, maxTeams } = req.body;

    if (!name || !ageGroupId || !gender || !maxTeams) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create the flight (stored as a bracket)
    const result = await db.insert(eventBrackets).values({
      eventId: eventId,
      name: name,
      ageGroupId: parseInt(ageGroupId),
      maxTeams: parseInt(maxTeams),
      isActive: true
    }).returning();

    res.json(result[0]);
  } catch (error) {
    console.error('Error creating flight:', error);
    res.status(500).json({ error: 'Failed to create flight' });
  }
});

// Auto-generate flights for all age groups
router.post('/:eventId/flights/auto-generate', isAdmin, async (req, res) => {
  try {
    const eventId = req.params.eventId;
    const { maxTeamsPerFlight = 8 } = req.body;

    // Get all age groups for this event
    const ageGroups = await db
      .select()
      .from(eventAgeGroups)
      .where(eq(eventAgeGroups.eventId, eventId));

    let flightsCreated = 0;
    let ageGroupsProcessed = 0;

    for (const ageGroup of ageGroups) {
      // Count approved teams for this age group
      const teamCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(teams)
        .where(
          and(
            eq(teams.eventId, eventId),
            eq(teams.status, 'approved'),
            sql`${teams.ageGroup} = ${ageGroup.ageGroup}`,
            sql`${teams.gender} = ${ageGroup.gender}`
          )
        );

      const totalTeams = teamCount[0]?.count || 0;
      
      if (totalTeams > 0) {
        // Calculate number of flights needed
        const flightsNeeded = Math.ceil(totalTeams / maxTeamsPerFlight);
        
        // Create flights for this age group
        for (let i = 1; i <= flightsNeeded; i++) {
          const flightName = flightsNeeded === 1 
            ? `${ageGroup.ageGroup} ${ageGroup.gender} Flight`
            : `${ageGroup.ageGroup} ${ageGroup.gender} Flight ${String.fromCharCode(64 + i)}`;

          await db.insert(eventBrackets).values({
            eventId: eventId,
            name: flightName,
            ageGroupId: ageGroup.id,
            maxTeams: maxTeamsPerFlight,
            isActive: true
          });

          flightsCreated++;
        }
        
        ageGroupsProcessed++;
      }
    }

    res.json({
      success: true,
      flightsCreated,
      ageGroupsProcessed,
      message: `Created ${flightsCreated} flights across ${ageGroupsProcessed} age groups`
    });
  } catch (error) {
    console.error('Error auto-generating flights:', error);
    res.status(500).json({ error: 'Failed to auto-generate flights' });
  }
});

// Bulk create brackets/flights for multiple age groups
router.post('/:eventId/bulk-brackets', isAdmin, async (req, res) => {
  try {
    const eventId = req.params.eventId;
    const { ageGroupIds, brackets, replaceExisting } = req.body;

    if (!ageGroupIds || !Array.isArray(ageGroupIds) || ageGroupIds.length === 0) {
      return res.status(400).json({ error: 'At least one age group must be selected' });
    }

    if (!brackets || !Array.isArray(brackets) || brackets.length === 0) {
      return res.status(400).json({ error: 'At least one bracket template is required' });
    }

    const createdBrackets: any[] = [];
    const errors: any[] = [];

    for (const ageGroupId of ageGroupIds) {
      try {
        // Get the age group details
        const [ageGroup] = await db
          .select()
          .from(eventAgeGroups)
          .where(
            and(
              eq(eventAgeGroups.id, Number(ageGroupId)),
              eq(eventAgeGroups.eventId, eventId)
            )
          );

        if (!ageGroup) {
          errors.push({ message: `Age group ${ageGroupId} not found for this event` });
          continue;
        }

        // Delete existing brackets for this age group if replacing
        if (replaceExisting) {
          await db
            .delete(eventBrackets)
            .where(
              and(
                eq(eventBrackets.eventId, eventId),
                eq(eventBrackets.ageGroupId, Number(ageGroupId))
              )
            );
        }

        // Create a bracket for each template
        for (const template of brackets) {
          const bracketName = template.name || `${ageGroup.ageGroup} ${ageGroup.gender} Flight`;

          const [created] = await db.insert(eventBrackets).values({
            eventId: eventId,
            name: bracketName,
            ageGroupId: Number(ageGroupId),
            maxTeams: 8,
            isActive: true
          }).returning();

          createdBrackets.push({
            ...created,
            ageGroup: ageGroup.ageGroup,
            gender: ageGroup.gender
          });
        }
      } catch (ageGroupError) {
        console.error(`Error creating brackets for age group ${ageGroupId}:`, ageGroupError);
        errors.push({ message: `Failed to create brackets for age group ${ageGroupId}` });
      }
    }

    console.log(`Bulk bracket creation: created ${createdBrackets.length} brackets, ${errors.length} errors`);
    res.json({ createdBrackets, errors });
  } catch (error) {
    console.error('Error in bulk bracket creation:', error);
    res.status(500).json({ error: 'Failed to create brackets in bulk' });
  }
});

// Delete a flight
router.delete('/:eventId/flights/:flightId', isAdmin, async (req, res) => {
  try {
    const { eventId, flightId } = req.params;

    await db
      .delete(eventBrackets)
      .where(
        and(
          eq(eventBrackets.id, parseInt(flightId)),
          eq(eventBrackets.eventId, eventId)
        )
      );

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting flight:', error);
    res.status(500).json({ error: 'Failed to delete flight' });
  }
});

export default router;