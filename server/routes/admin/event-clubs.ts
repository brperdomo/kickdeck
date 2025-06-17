import { Router } from 'express';
import { db } from '../../../db';
import { clubs, teams, events } from '@db/schema';
import { eq, sql, and, isNotNull, isNull, desc, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { hasEventAccess } from '../../middleware/event-access';

const router = Router();

// Get clubs for a specific event
router.get('/:eventId/clubs', hasEventAccess, async (req, res) => {
  try {
    const eventId = parseInt(req.params.eventId);

    // Get teams for this event that have club information
    const teamsWithClubs = await db
      .select({
        teamId: teams.id,
        teamName: teams.name,
        clubId: teams.clubId,
        clubName: teams.clubName,
      })
      .from(teams)
      .where(and(
        eq(teams.eventId, eventId),
        isNotNull(teams.clubId)
      ));

    // Get unique club IDs from teams
    const clubIds = [...new Set(teamsWithClubs
      .filter(team => team.clubId !== null)
      .map(team => team.clubId))];

    // Get club details for these club IDs
    let clubsData = [];
    if (clubIds.length > 0) {
      if (clubIds.length === 1) {
        clubsData = await db
          .select()
          .from(clubs)
          .where(eq(clubs.id, clubIds[0]));
      } else {
        clubsData = await db
          .select()
          .from(clubs)
          .where(inArray(clubs.id, clubIds));
      }
    }

    // Count teams per club
    const clubStats = clubIds.map(clubId => {
      const teamsForClub = teamsWithClubs.filter(team => team.clubId === clubId);
      const clubData = clubsData.find(club => club.id === clubId) || { 
        id: clubId,
        name: teamsForClub[0]?.clubName || 'Unknown Club',
        logoUrl: null,
      };
      
      return {
        ...clubData,
        teamCount: teamsForClub.length,
      };
    });

    return res.json(clubStats);
  } catch (error) {
    console.error(`Error getting clubs for event ID ${req.params.eventId}:`, error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// This route handles the specific /clubs/clubs endpoint that the frontend is calling
router.get('/:eventId/clubs/clubs', hasEventAccess, async (req, res) => {
  try {
    const eventId = parseInt(req.params.eventId);

    // Get teams for this event that have club information (either club_id or club_name)
    const teamsWithClubs = await db
      .select({
        teamId: teams.id,
        teamName: teams.name,
        clubId: teams.clubId,
        clubName: teams.clubName,
      })
      .from(teams)
      .where(and(
        eq(teams.eventId, eventId),
        sql`(${teams.clubId} IS NOT NULL OR (${teams.clubName} IS NOT NULL AND ${teams.clubName} != ''))`
      ));

    // Get unique club IDs from teams that have them
    const clubIds = [...new Set(teamsWithClubs
      .filter(team => team.clubId !== null)
      .map(team => team.clubId))];

    // Get club details for these club IDs
    let clubsData = [];
    if (clubIds.length > 0) {
      if (clubIds.length === 1) {
        clubsData = await db
          .select()
          .from(clubs)
          .where(eq(clubs.id, clubIds[0]));
      } else {
        clubsData = await db
          .select()
          .from(clubs)
          .where(inArray(clubs.id, clubIds));
      }
    }

    // Get unique club names from teams without club IDs
    const clubNamesOnly = [...new Set(teamsWithClubs
      .filter(team => team.clubId === null && team.clubName && team.clubName.trim() !== '')
      .map(team => team.clubName))];

    // Count teams per club (both with IDs and name-only)
    const clubStats = [];
    
    // Add clubs with IDs
    clubIds.forEach(clubId => {
      const teamsForClub = teamsWithClubs.filter(team => team.clubId === clubId);
      const clubData = clubsData.find(club => club.id === clubId) || { 
        id: clubId,
        name: teamsForClub[0]?.clubName || 'Unknown Club',
        logoUrl: null,
      };
      
      clubStats.push({
        ...clubData,
        teamCount: teamsForClub.length,
      });
    });

    // Add clubs with names only (no ID in clubs table)
    clubNamesOnly.forEach(clubName => {
      const teamsForClub = teamsWithClubs.filter(team => team.clubName === clubName && team.clubId === null);
      
      clubStats.push({
        id: null, // No ID since it's not in the clubs table
        name: clubName,
        logoUrl: null,
        teamCount: teamsForClub.length,
      });
    });

    return res.json(clubStats);
  } catch (error) {
    console.error(`Error getting clubs for event ID ${req.params.eventId}:`, error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Merge clubs
router.post('/:eventId/clubs/merge', hasEventAccess, async (req, res) => {
  try {
    const eventId = parseInt(req.params.eventId);

    const mergeSchema = z.object({
      targetClubName: z.string().min(1, "Target club name is required"),
      sourceClubNames: z.array(z.string()).min(1, "At least one source club is required"),
      logoUrl: z.string().optional().nullable(),
    });

    const validatedData = mergeSchema.parse(req.body);

    // Create or update the target club in the clubs table
    let targetClub;
    const existingTargetClub = await db
      .select()
      .from(clubs)
      .where(eq(clubs.name, validatedData.targetClubName))
      .limit(1);

    if (existingTargetClub.length > 0) {
      // Update existing club
      [targetClub] = await db
        .update(clubs)
        .set({
          name: validatedData.targetClubName,
          logoUrl: validatedData.logoUrl,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(clubs.id, existingTargetClub[0].id))
        .returning();
    } else {
      // Create new club
      [targetClub] = await db
        .insert(clubs)
        .values({
          name: validatedData.targetClubName,
          logoUrl: validatedData.logoUrl || null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .returning();
    }

    // Update all teams from source clubs to the target club
    const updateResult = await db
      .update(teams)
      .set({
        clubId: targetClub.id,
        clubName: validatedData.targetClubName,
      })
      .where(and(
        eq(teams.eventId, eventId),
        sql`${teams.clubName} IN (${sql.join(validatedData.sourceClubNames.map(name => sql`${name}`), sql`, `)})`
      ))
      .returning({ id: teams.id, name: teams.name });

    return res.json({
      targetClub,
      mergedTeamsCount: updateResult.length,
      mergedTeams: updateResult,
    });
  } catch (error) {
    console.error(`Error merging clubs for event ID ${req.params.eventId}:`, error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Update club information
router.patch('/:eventId/clubs/:clubId', hasEventAccess, async (req, res) => {
  try {
    const eventId = parseInt(req.params.eventId);
    const clubId = parseInt(req.params.clubId);

    const clubSchema = z.object({
      name: z.string().min(1, "Club name is required"),
      logoUrl: z.string().optional().nullable(),
    });

    const validatedData = clubSchema.parse(req.body);

    // First, check if the club exists
    const [existingClub] = await db
      .select()
      .from(clubs)
      .where(eq(clubs.id, clubId))
      .limit(1);

    let club;

    if (existingClub) {
      // Update existing club
      [club] = await db
        .update(clubs)
        .set({
          name: validatedData.name,
          logoUrl: validatedData.logoUrl,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(clubs.id, clubId))
        .returning();
    } else {
      // Create new club
      [club] = await db
        .insert(clubs)
        .values({
          id: clubId,
          name: validatedData.name,
          logoUrl: validatedData.logoUrl || null,
          createdAt: new Date().toISOString(),
        })
        .returning();
    }

    // Update all teams for this event with this club ID
    await db
      .update(teams)
      .set({
        clubName: validatedData.name,
      })
      .where(and(
        eq(teams.eventId, eventId),
        eq(teams.clubId, clubId)
      ));

    return res.json(club);
  } catch (error) {
    console.error(`Error updating club for event ID ${req.params.eventId}:`, error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Get event details with club count
router.get('/:eventId', hasEventAccess, async (req, res) => {
  try {
    const eventId = parseInt(req.params.eventId);

    // Get event details
    const [event] = await db
      .select()
      .from(events)
      .where(eq(events.id, eventId))
      .limit(1);

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Count unique club IDs for this event
    const uniqueClubCount = await db
      .select({
        count: sql<number>`COUNT(DISTINCT ${teams.clubId})`,
      })
      .from(teams)
      .where(and(
        eq(teams.eventId, eventId),
        isNotNull(teams.clubId)
      ))
      .then(result => result[0]?.count || 0);

    // Get total teams count
    const totalTeamsCount = await db
      .select({
        count: sql<number>`COUNT(*)`,
      })
      .from(teams)
      .where(eq(teams.eventId, eventId))
      .then(result => result[0]?.count || 0);

    return res.json({
      ...event,
      clubCount: uniqueClubCount,
      teamCount: totalTeamsCount,
    });
  } catch (error) {
    console.error(`Error getting event details for ID ${req.params.eventId}:`, error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;