import { Router } from 'express';
import { db } from '@db';
import { sql } from 'drizzle-orm';
import { isAdmin } from '../../middleware/auth.js';

const router = Router();
router.use(isAdmin);

// Get bracket creation data for an event
router.get('/:eventId/bracket-creation', async (req, res) => {
  try {
    const eventId = req.params.eventId;
    console.log(`[Bracket Creation] GET /${eventId}/bracket-creation`);

    // Get flights with team counts using SQL
    const flightsResult = await db.execute(sql`
      SELECT 
        eb.id as flight_id,
        eb.name,
        eb.level,
        eag.age_group,
        eag.gender,
        COUNT(t.id) as team_count
      FROM event_brackets eb
      JOIN event_age_groups eag ON eb.age_group_id = eag.id
      LEFT JOIN teams t ON t.bracket_id = eb.id AND t.status = 'approved'
      WHERE eag.event_id = ${eventId}
      GROUP BY eb.id, eb.name, eb.level, eag.age_group, eag.gender
      ORDER BY eag.age_group, eag.gender, eb.level
    `);

    const flights = flightsResult.rows.map((row: any) => ({
      flightId: row.flight_id,
      name: row.name,
      level: row.level,
      ageGroup: row.age_group,
      gender: row.gender,
      teamCount: parseInt(row.team_count) || 0
    }));

    // Get unassigned teams count
    const unassignedResult = await db.execute(sql`
      SELECT COUNT(*) as count
      FROM teams t
      JOIN event_age_groups eag ON t.age_group_id = eag.id
      WHERE eag.event_id = ${eventId} 
        AND t.status = 'approved' 
        AND t.bracket_id IS NULL
    `);

    const unassignedCount = parseInt(unassignedResult.rows[0]?.count) || 0;

    // Get total teams count
    const totalResult = await db.execute(sql`
      SELECT COUNT(*) as count
      FROM teams t
      JOIN event_age_groups eag ON t.age_group_id = eag.id
      WHERE eag.event_id = ${eventId} 
        AND t.status = 'approved'
    `);

    const totalCount = parseInt(totalResult.rows[0]?.count) || 0;

    const stats = {
      totalFlights: flights.length,
      assignedFlights: flights.filter(f => f.teamCount > 0).length,
      unassignedTeams: unassignedCount,
      totalTeams: totalCount,
      readyForScheduling: unassignedCount === 0 && totalCount > 0
    };

    console.log(`[Bracket Creation] Stats:`, stats);
    res.json({ flights, stats });

  } catch (error: any) {
    console.error('[Bracket Creation] Error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch bracket creation data',
      details: error.message 
    });
  }
});

// Auto-assign teams
router.post('/:eventId/bracket-creation/auto-assign', async (req, res) => {
  try {
    const eventId = req.params.eventId;
    console.log(`[Bracket Creation] Auto-assign teams for event ${eventId}`);

    // Get unassigned teams with their age groups
    const unassignedResult = await db.execute(sql`
      SELECT 
        t.id as team_id,
        t.name as team_name,
        eag.age_group,
        eag.gender
      FROM teams t
      JOIN event_age_groups eag ON t.age_group_id = eag.id
      WHERE eag.event_id = ${eventId} 
        AND t.status = 'approved' 
        AND t.bracket_id IS NULL
    `);

    const unassignedTeams = unassignedResult.rows;

    if (unassignedTeams.length === 0) {
      return res.json({
        message: 'No unassigned teams found',
        assignedTeams: 0,
        method: 'balanced'
      });
    }

    let assignmentCount = 0;

    // Assign each team to appropriate flight
    for (const team of unassignedTeams) {
      // Find matching flights for this team's age group and gender
      const flightResult = await db.execute(sql`
        SELECT eb.id as flight_id, eb.name, eb.level
        FROM event_brackets eb
        JOIN event_age_groups eag ON eb.age_group_id = eag.id
        WHERE eag.event_id = ${eventId}
          AND eag.age_group = ${team.age_group}
          AND eag.gender = ${team.gender}
        ORDER BY 
          CASE eb.name 
            WHEN 'Elite' THEN 1 
            WHEN 'Premier' THEN 2 
            WHEN 'Classic' THEN 3 
            ELSE 4 
          END
        LIMIT 1
      `);

      if (flightResult.rows.length > 0) {
        const targetFlight = flightResult.rows[0];
        
        // Assign team to flight
        await db.execute(sql`
          UPDATE teams 
          SET bracket_id = ${targetFlight.flight_id}
          WHERE id = ${team.team_id}
        `);
        
        assignmentCount++;
        console.log(`[Bracket Creation] Assigned team ${team.team_name} to ${targetFlight.name} flight`);
      }
    }

    res.json({
      message: `Successfully assigned ${assignmentCount} teams`,
      assignedTeams: assignmentCount,
      method: 'balanced'
    });

  } catch (error: any) {
    console.error('[Bracket Creation] Auto-assign error:', error);
    res.status(500).json({ 
      error: 'Failed to auto-assign teams',
      details: error.message 
    });
  }
});

// Lock brackets
router.post('/:eventId/bracket-creation/lock', async (req, res) => {
  try {
    const eventId = req.params.eventId;
    console.log(`[Bracket Creation] Lock brackets for event ${eventId}`);

    await db.execute(sql`
      UPDATE events 
      SET status = 'brackets_locked', updated_at = NOW()
      WHERE id = ${eventId}
    `);

    res.json({
      message: 'Brackets locked successfully',
      status: 'brackets_locked',
      readyForScheduling: true
    });

  } catch (error: any) {
    console.error('[Bracket Creation] Lock error:', error);
    res.status(500).json({ 
      error: 'Failed to lock brackets',
      details: error.message 
    });
  }
});

export default router;