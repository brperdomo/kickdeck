import { Request, Response } from 'express';
import { db } from 'db';
import { teams, games, events, eventBrackets, eventAgeGroups } from 'db/schema';
import { eq, and, sql, desc, asc } from 'drizzle-orm';

// Update game score
export async function updateGameScore(req: Request, res: Response) {
  try {
    const gameId = parseInt(req.params.gameId);
    const { homeScore, awayScore } = req.body;
    
    if (isNaN(gameId)) {
      return res.status(400).json({ error: 'Invalid game ID' });
    }

    if (typeof homeScore !== 'number' || typeof awayScore !== 'number') {
      return res.status(400).json({ error: 'Invalid score values' });
    }

    // Update the game score
    const [updatedGame] = await db
      .update(games)
      .set({
        homeScore: homeScore,
        awayScore: awayScore,
        status: 'completed',
        updatedAt: new Date().toISOString(),
      })
      .where(eq(games.id, gameId))
      .returning();

    if (!updatedGame) {
      return res.status(404).json({ error: 'Game not found' });
    }

    res.json({
      success: true,
      game: updatedGame,
    });
  } catch (error) {
    console.error('Error updating game score:', error);
    res.status(500).json({ error: 'Failed to update game score' });
  }
}

// Get teams overview for event
export async function getTeamsOverview(req: Request, res: Response) {
  try {
    const eventId = parseInt(req.params.eventId);
    
    if (isNaN(eventId)) {
      return res.status(400).json({ error: 'Invalid event ID' });
    }

    console.log('TEAMS API: Fetching teams for event ID:', eventId);

    // Use raw SQL to handle potential type mismatches
    try {
      const teamsData = await db.execute(sql`
        SELECT 
          t.id,
          t.name,
          t.age_group_id as "ageGroupId",
          ag.age_group as "ageGroup",
          t.status,
          t.coach,
          t.bracket_id as "bracketId",
          eb.name as "flightName"
        FROM teams t
        LEFT JOIN event_brackets eb ON t.bracket_id = eb.id
        LEFT JOIN event_age_groups ag ON t.age_group_id = ag.id
        WHERE t.event_id = ${eventId}
        ORDER BY t.name ASC
      `);

      console.log('TEAMS API: Found', teamsData.length, 'teams');

      const teamsWithStats = teamsData.map((team: any) => ({
        ...team,
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        ties: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        points: 0,
        totalGames: 0,
        rank: 0,
      }));

      // Get age groups for the event
      const ageGroups = await db.execute(sql`
        SELECT DISTINCT age_group as "ageGroup"
        FROM event_age_groups 
        WHERE event_id = ${eventId}
        ORDER BY age_group
      `);

      res.json({
        teams: teamsWithStats,
        ageGroups: ageGroups.map((ag: any) => ag.ageGroup),
      });
    } catch (ormError) {
      console.error('TEAMS API: ORM Error, using fallback SQL:', ormError);
      
      // Fallback raw SQL query
      const fallbackTeams = await db.execute(sql`
        SELECT 
          t.id,
          t.name,
          COALESCE(ag.age_group, 'Unknown') as "ageGroup",
          t.status,
          t.coach
        FROM teams t
        LEFT JOIN event_age_groups ag ON t.age_group_id = ag.id
        WHERE t.event_id = ${eventId}::text OR t.event_id::integer = ${eventId}
        ORDER BY t.name ASC
      `);

      res.json({
        teams: fallbackTeams.map((team: any) => ({
          ...team,
          gamesPlayed: 0,
          wins: 0,
          losses: 0,
          ties: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          goalDifference: 0,
          points: 0,
          totalGames: 0,
          rank: 0,
        })),
        ageGroups: [],
      });
    }
  } catch (error) {
    console.error('TEAMS API: Error fetching teams overview:', error);
    res.status(500).json({ error: 'Failed to fetch teams overview' });
  }
}

// Get detailed team information
export async function getTeamDetail(req: Request, res: Response) {
  try {
    const teamId = parseInt(req.params.teamId);
    const eventId = parseInt(req.query.eventId as string);
    
    if (isNaN(teamId) || isNaN(eventId)) {
      return res.status(400).json({ error: 'Invalid team ID or event ID' });
    }

    // Get team basic information using raw SQL
    const teamInfo = await db.execute(sql`
      SELECT 
        t.id,
        t.name,
        t.age_group_id as "ageGroupId",
        ag.age_group as "ageGroup",
        t.status,
        t.coach,
        t.bracket_id as "bracketId",
        t.group_id as "groupId",
        eb.name as "flightName"
      FROM teams t
      LEFT JOIN event_brackets eb ON t.bracket_id = eb.id
      LEFT JOIN event_age_groups ag ON t.age_group_id = ag.id
      WHERE t.id = ${teamId} 
        AND (t.event_id = ${eventId}::text OR t.event_id::integer = ${eventId})
      LIMIT 1
    `);

    if (teamInfo.length === 0) {
      return res.status(404).json({ error: 'Team not found' });
    }

    const team = teamInfo[0];

    // Get games using raw SQL to handle schema issues
    const teamGames = await db.execute(sql`
      SELECT 
        g.id,
        g.scheduled_date as date,
        g.scheduled_time as time,
        g.field_id as "fieldId",
        g.home_team_id as "homeTeamId",
        g.away_team_id as "awayTeamId",
        g.home_score as "homeScore",
        g.away_score as "awayScore",
        g.status,
        ht.name as "homeTeamName",
        at.name as "awayTeamName"
      FROM games g
      JOIN teams ht ON g.home_team_id = ht.id
      JOIN teams at ON g.away_team_id = at.id
      WHERE (g.home_team_id = ${teamId} OR g.away_team_id = ${teamId})
        AND (ht.event_id = ${eventId}::text OR ht.event_id::integer = ${eventId})
        AND (at.event_id = ${eventId}::text OR at.event_id::integer = ${eventId})
      ORDER BY g.scheduled_date ASC, g.scheduled_time ASC
    `);

    // Format games with opponent information
    const formattedGames = teamGames.map((game: any) => ({
      id: game.id,
      date: game.date,
      time: game.time,
      fieldId: game.fieldId,
      opponent: game.homeTeamId === teamId ? game.awayTeamName : game.homeTeamName,
      homeScore: game.homeScore,
      awayScore: game.awayScore,
      status: game.status || 'scheduled',
      isHomeTeam: game.homeTeamId === teamId,
      homeTeamId: game.homeTeamId,
      awayTeamId: game.awayTeamId,
    }));

    res.json({
      team,
      games: formattedGames,
      standings: [], // Simplified for now
    });
  } catch (error) {
    console.error('Error fetching team detail:', error);
    res.status(500).json({ error: 'Failed to fetch team detail' });
  }
}

// Export team schedule
export async function exportTeamSchedule(req: Request, res: Response) {
  try {
    const teamId = parseInt(req.params.teamId);
    const eventId = parseInt(req.query.eventId as string);
    const format = req.query.format as string;
    
    if (isNaN(teamId) || isNaN(eventId)) {
      return res.status(400).json({ error: 'Invalid team ID or event ID' });
    }

    // Get team info using raw SQL
    const teamInfo = await db.execute(sql`
      SELECT 
        t.name,
        ag.age_group as "ageGroup",
        eb.name as "flightName"
      FROM teams t
      LEFT JOIN event_brackets eb ON t.bracket_id = eb.id
      LEFT JOIN event_age_groups ag ON t.age_group_id = ag.id
      WHERE t.id = ${teamId} 
        AND (t.event_id = ${eventId}::text OR t.event_id::integer = ${eventId})
      LIMIT 1
    `);

    if (teamInfo.length === 0) {
      return res.status(404).json({ error: 'Team not found' });
    }

    const team = teamInfo[0];

    // Get games
    const teamGames = await db.execute(sql`
      SELECT 
        g.id,
        g.scheduled_date as date,
        g.scheduled_time as time,
        g.field_id as "fieldId",
        g.home_team_id as "homeTeamId",
        g.away_team_id as "awayTeamId",
        g.home_score as "homeScore",
        g.away_score as "awayScore",
        g.status,
        ht.name as "homeTeamName",
        at.name as "awayTeamName"
      FROM games g
      JOIN teams ht ON g.home_team_id = ht.id
      JOIN teams at ON g.away_team_id = at.id
      WHERE (g.home_team_id = ${teamId} OR g.away_team_id = ${teamId})
        AND (ht.event_id = ${eventId}::text OR ht.event_id::integer = ${eventId})
        AND (at.event_id = ${eventId}::text OR at.event_id::integer = ${eventId})
      ORDER BY g.scheduled_date ASC, g.scheduled_time ASC
    `);

    if (format === 'csv') {
      // Generate CSV
      const csvHeader = 'Game ID,Date,Time,Field,Opponent,Home/Away,Score,Status\n';
      const csvRows = teamGames.map((game: any) => {
        const isHome = game.homeTeamId === teamId;
        const opponent = isHome ? game.awayTeamName : game.homeTeamName;
        const homeAway = isHome ? 'Home' : 'Away';
        const score = game.homeScore !== null && game.awayScore !== null
          ? `${isHome ? game.homeScore : game.awayScore}-${isHome ? game.awayScore : game.homeScore}`
          : 'TBD';
        
        return `${game.id},"${game.date}","${game.time}","${game.fieldId}","${opponent}","${homeAway}","${score}","${game.status || 'scheduled'}"`;
      }).join('\n');

      const csvContent = csvHeader + csvRows;
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${team.name}-schedule.csv"`);
      res.send(csvContent);
    } else {
      res.json({
        team,
        games: teamGames.map((game: any) => ({
          id: game.id,
          date: game.date,
          time: game.time,
          fieldId: game.fieldId,
          opponent: game.homeTeamId === teamId ? game.awayTeamName : game.homeTeamName,
          homeScore: game.homeScore,
          awayScore: game.awayScore,
          status: game.status || 'scheduled',
          isHomeTeam: game.homeTeamId === teamId,
        })),
      });
    }
  } catch (error) {
    console.error('Error exporting team schedule:', error);
    res.status(500).json({ error: 'Failed to export team schedule' });
  }
}

// Bulk update teams
export async function bulkUpdateTeams(req: Request, res: Response) {
  try {
    const { updates } = req.body;
    const eventId = parseInt(req.params.eventId);
    
    if (!Array.isArray(updates) || isNaN(eventId)) {
      return res.status(400).json({ error: 'Invalid updates data or event ID' });
    }

    const results = [];
    
    for (const update of updates) {
      const { teamId, changes } = update;
      
      if (!teamId || !changes) {
        continue;
      }

      try {
        // Build update object with only valid fields
        const updateData: any = {};
        if (changes.name !== undefined) updateData.name = changes.name;
        if (changes.status !== undefined) updateData.status = changes.status;
        if (changes.coach !== undefined) updateData.coach = changes.coach;
        if (changes.bracketId !== undefined) updateData.bracketId = changes.bracketId;
        if (changes.ageGroupId !== undefined) updateData.ageGroupId = changes.ageGroupId;
        
        const [updatedTeam] = await db
          .update(teams)
          .set(updateData)
          .where(and(eq(teams.id, teamId), eq(teams.eventId, eventId)))
          .returning();

        if (updatedTeam) {
          results.push({ teamId, success: true, team: updatedTeam });
        } else {
          results.push({ teamId, success: false, error: 'Team not found' });
        }
      } catch (error) {
        console.error(`Error updating team ${teamId}:`, error);
        results.push({ teamId, success: false, error: 'Update failed' });
      }
    }

    res.json({ results });
  } catch (error) {
    console.error('Error in bulk update teams:', error);
    res.status(500).json({ error: 'Failed to bulk update teams' });
  }
}

// Get all teams for admin (simplified version)
export async function getAllTeams(req: Request, res: Response) {
  try {
    const { eventId, status, ageGroup, search } = req.query;
    
    console.log('TEAMS API: Getting all teams with filters:', { eventId, status, ageGroup, search });
    
    // Build where conditions for the raw SQL
    let whereConditions = [];
    let params: any[] = [];
    
    if (eventId) {
      whereConditions.push(`(t.event_id = $${params.length + 1}::text OR t.event_id::integer = $${params.length + 1})`);
      params.push(eventId);
    }
    
    if (status) {
      whereConditions.push(`t.status = $${params.length + 1}`);
      params.push(status);
    }
    
    if (search) {
      whereConditions.push(`t.name ILIKE $${params.length + 1}`);
      params.push(`%${search}%`);
    }
    
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    const query = `
      SELECT 
        t.id,
        t.name,
        t.event_id as "eventId",
        e.name as "eventName",
        t.age_group_id as "ageGroupId", 
        ag.age_group as "ageGroup",
        t.status,
        t.coach,
        t.manager_name as "managerName",
        t.manager_email as "managerEmail",
        t.created_at as "createdAt",
        t.approved_at as "approvedAt",
        t.total_amount as "totalAmount",
        t.payment_status as "paymentStatus"
      FROM teams t
      LEFT JOIN events e ON (t.event_id = e.id::text OR t.event_id::integer = e.id)
      LEFT JOIN event_age_groups ag ON t.age_group_id = ag.id
      ${whereClause}
      ORDER BY t.created_at DESC
      LIMIT 1000
    `;
    
    const allTeams = await db.execute(sql.raw(query, params));
    
    console.log('TEAMS API: Found', allTeams.length, 'teams total');
    
    res.json({ teams: allTeams });
  } catch (error) {
    console.error('TEAMS API: Error fetching all teams:', error);
    res.status(500).json({ error: 'Failed to fetch teams' });
  }
}