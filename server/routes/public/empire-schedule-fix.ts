import { Router, Request, Response } from 'express';
import { db } from '../../../db';
import { sql } from 'drizzle-orm';

const router = Router();

// EMPIRE SUPER CUP CRITICAL FIX - Direct SQL implementation
router.get('/empire/:eventId', async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const eventIdNum = parseInt(eventId);
    
    console.log(`[EMPIRE CRITICAL FIX] Processing Empire Super Cup event ${eventId}`);
    
    // Only handle Empire Super Cup
    if (eventIdNum !== 1844329078) {
      return res.status(404).json({ error: 'This endpoint is only for Empire Super Cup' });
    }
    
    // Get event info
    const eventQuery = await db.execute(sql`
      SELECT name, start_date as "startDate", end_date as "endDate", logo_url as "logoUrl"
      FROM events 
      WHERE id = 1844329078
    `);
    
    if (!eventQuery.rows.length) {
      return res.status(404).json({ error: 'Empire Super Cup event not found' });
    }
    
    const eventInfo = eventQuery.rows[0];
    console.log(`[EMPIRE CRITICAL FIX] Found event: ${eventInfo.name}`);
    
    // Get games directly - this should return 471 games
    const gamesQuery = await db.execute(sql`
      SELECT 
        g.id,
        g.home_team_id as "homeTeamId",
        g.away_team_id as "awayTeamId", 
        ht.name as "homeTeamName",
        at.name as "awayTeamName",
        g.scheduled_date as "scheduledDate",
        g.scheduled_time as "scheduledTime",
        g.field_id as "fieldId",
        f.name as "fieldName",
        g.duration,
        g.status,
        g.age_group_id as "ageGroupId",
        g.match_number as "matchNumber",
        g.home_score as "homeScore",
        g.away_score as "awayScore",
        g.round,
        ag.name as "ageGroupName",
        ag.gender
      FROM games g
      LEFT JOIN fields f ON g.field_id = f.id
      LEFT JOIN teams ht ON g.home_team_id = ht.id  
      LEFT JOIN teams at ON g.away_team_id = at.id
      LEFT JOIN event_age_groups ag ON g.age_group_id = ag.id
      WHERE g.event_id = 1844329078
      ORDER BY g.scheduled_date, g.scheduled_time
    `);
    
    const games = gamesQuery.rows;
    console.log(`[EMPIRE CRITICAL FIX] SUCCESS! Retrieved ${games.length} games for Empire Super Cup`);
    
    // Get age groups with game counts
    const ageGroupsQuery = await db.execute(sql`
      SELECT DISTINCT
        ag.id as "ageGroupId",
        ag.name as "ageGroupName", 
        ag.gender,
        ag.division_code as "divisionCode",
        COUNT(g.id) as "gameCount"
      FROM event_age_groups ag
      LEFT JOIN games g ON ag.id = g.age_group_id AND g.event_id = 1844329078
      WHERE ag.event_id = 1844329078
      GROUP BY ag.id, ag.name, ag.gender, ag.division_code
      HAVING COUNT(g.id) > 0
      ORDER BY ag.name
    `);
    
    const ageGroups = ageGroupsQuery.rows;
    console.log(`[EMPIRE CRITICAL FIX] Found ${ageGroups.length} age groups with games`);
    
    // Simple response structure focused on proving games exist
    return res.json({
      success: true,
      message: 'Empire Super Cup Critical Fix Applied',
      eventInfo: eventInfo,
      totalGames: games.length,
      totalAgeGroups: ageGroups.length,
      sampleGames: games.slice(0, 5).map(g => ({
        id: g.id,
        matchNumber: g.matchNumber,
        homeTeam: g.homeTeamName || `Team ${g.homeTeamId}`,
        awayTeam: g.awayTeamName || `Team ${g.awayTeamId}`,
        ageGroup: g.ageGroupName,
        scheduledDate: g.scheduledDate,
        scheduledTime: g.scheduledTime
      })),
      ageGroupsWithGames: ageGroups.map(ag => ({
        id: ag.ageGroupId,
        name: ag.ageGroupName,
        gender: ag.gender,
        gameCount: ag.gameCount
      }))
    });
    
  } catch (error) {
    console.error(`[EMPIRE CRITICAL FIX] Error:`, error);
    return res.status(500).json({ error: 'Empire Super Cup fix failed', details: error.message });
  }
});

export default router;