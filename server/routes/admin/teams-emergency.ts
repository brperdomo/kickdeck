import { Request, Response } from 'express';
import { db } from 'db';
import { sql } from 'drizzle-orm';

// EMERGENCY TEAMS API - Minimal, working version for production fix
export async function getTeamsOverviewEmergency(req: Request, res: Response) {
  try {
    const eventId = parseInt(req.params.eventId);
    
    if (!eventId || isNaN(eventId)) {
      return res.status(400).json({ error: 'Invalid event ID' });
    }

    console.log(`[EMERGENCY] Fetching teams for event ID: ${eventId}`);

    // Direct SQL query with proper type casting to avoid schema conflicts
    const teamsData = await db.execute(sql`
      SELECT 
        t.id,
        t.name,
        t.status,
        t.bracket_id,
        t.age_group_id,
        t.coach,
        ag.age_group,
        eb.name as flight_name,
        e.name as event_name,
        t.submitter_email,
        t.created_at,
        t.total_amount
      FROM teams t
      LEFT JOIN event_age_groups ag ON t.age_group_id = ag.id
      LEFT JOIN event_brackets eb ON t.bracket_id = eb.id
      LEFT JOIN events e ON CAST(t.event_id AS INTEGER) = e.id
      WHERE CAST(t.event_id AS INTEGER) = ${eventId}
      ORDER BY t.created_at DESC
    `);

    console.log(`[EMERGENCY] Found ${teamsData.rows?.length || 0} teams for event ${eventId}`);

    // Process teams data safely
    const teams = (teamsData.rows || []).map((team: any) => ({
      id: team.id,
      name: team.name,
      ageGroup: team.age_group || 'Unknown',
      status: team.status,
      coach: team.coach,
      bracketId: team.bracket_id,
      flightName: team.flight_name || 'No Flight',
      eventName: team.event_name || 'Unknown Event',
      submitterEmail: team.submitter_email,
      dateApproved: team.created_at,
      finalTotal: `$${(team.total_amount || 0).toFixed(2)}`,
      gamesPlayed: 0,
      wins: 0,
      losses: 0,
      ties: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifferential: 0,
      points: 0,
      rank: 0,
    }));

    // Get unique age groups for filter
    const ageGroups = Array.from(new Set(teams.map((t: any) => t.ageGroup).filter(Boolean)));

    res.json({
      teams,
      ageGroups,
      success: true,
      message: `Retrieved ${teams.length} teams successfully`
    });

  } catch (error) {
    console.error('[EMERGENCY] Error fetching teams overview:', error);
    res.status(500).json({ 
      error: 'Failed to fetch teams overview',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Get all teams across all events - for debugging
export async function getAllTeamsEmergency(req: Request, res: Response) {
  try {
    console.log('[EMERGENCY] Fetching ALL teams across all events');

    const allTeams = await db.execute(sql`
      SELECT 
        t.id,
        t.name,
        t.status,
        t.event_id,
        e.name as event_name,
        ag.age_group,
        COUNT(*) OVER() as total_count
      FROM teams t
      LEFT JOIN events e ON CAST(t.event_id AS INTEGER) = e.id  
      LEFT JOIN event_age_groups ag ON t.age_group_id = ag.id
      ORDER BY t.created_at DESC
      LIMIT 50
    `);

    console.log(`[EMERGENCY] Retrieved ${allTeams.rows?.length || 0} teams`);

    const teams = (allTeams.rows || []).map((team: any) => ({
      id: team.id,
      name: team.name,
      status: team.status,
      eventId: team.event_id,
      eventName: team.event_name || 'Unknown Event',
      ageGroup: team.age_group || 'Unknown'
    }));

    const totalCount = (allTeams.rows && allTeams.rows[0]) ? allTeams.rows[0].total_count : 0;
    
    res.json({
      teams,
      totalCount: totalCount || 0,
      success: true
    });

  } catch (error) {
    console.error('[EMERGENCY] Error fetching all teams:', error);
    res.status(500).json({ 
      error: 'Failed to fetch teams',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}