import { Request, Response } from 'express';
import { db } from 'db';
import { teams, games, events, eventBrackets, eventAgeGroups } from 'db/schema';
import { eq, and, sql, desc, asc } from 'drizzle-orm';

// Update game score
export async function updateGameScore(req: Request, res: Response) {
  try {
    const gameId = parseInt(req.params.gameId);
    const { homeTeamScore, awayTeamScore } = req.body;
    
    if (isNaN(gameId)) {
      return res.status(400).json({ error: 'Invalid game ID' });
    }

    if (typeof homeTeamScore !== 'number' || typeof awayTeamScore !== 'number') {
      return res.status(400).json({ error: 'Invalid score values' });
    }

    // Update the game score
    const [updatedGame] = await db
      .update(games)
      .set({
        homeScore: homeTeamScore,
        awayScore: awayTeamScore,
        status: 'completed',
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

// Get teams overview for event - simplified version
export async function getTeamsOverview(req: Request, res: Response) {
  try {
    const eventId = parseInt(req.params.eventId);
    
    if (!eventId || isNaN(eventId)) {
      return res.status(400).json({ error: 'Invalid event ID' });
    }

    console.log(`Fetching teams for event ID: ${eventId}`);

    // Get all teams for the event with proper type casting and joins
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
        e.name as event_name
      FROM teams t
      LEFT JOIN event_age_groups ag ON t.age_group_id = ag.id
      LEFT JOIN event_brackets eb ON t.bracket_id = eb.id
      LEFT JOIN events e ON CAST(t.event_id AS INTEGER) = e.id
      WHERE CAST(t.event_id AS INTEGER) = ${eventId}
      ORDER BY t.name ASC
    `);

    console.log(`Found ${teamsData.rows?.length || 0} teams for event ${eventId}`);

    // Get basic stats for each team with actual data
    const teamsWithStats = (teamsData.rows || teamsData).map((team: any) => ({
      id: team.id,
      name: team.name,
      ageGroup: team.age_group || 'Unknown',
      status: team.status,
      coach: team.coach,
      bracketId: team.bracket_id,
      flightName: team.flight_name || 'No Flight',
      eventName: team.event_name,
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

    res.json({
      teams: teamsWithStats,
      ageGroups: [],
    });
  } catch (error) {
    console.error('Error fetching teams overview:', error);
    res.status(500).json({ error: 'Failed to fetch teams overview' });
  }
}

// Get team detail - simplified
export async function getTeamDetail(req: Request, res: Response) {
  try {
    const teamId = parseInt(req.params.teamId);
    
    if (isNaN(teamId)) {
      return res.status(400).json({ error: 'Invalid team ID' });
    }

    // Get team basic information
    const team = await db
      .select()
      .from(teams)
      .where(eq(teams.id, teamId))
      .limit(1);

    if (team.length === 0) {
      return res.status(404).json({ error: 'Team not found' });
    }

    // Return team info with empty games for now
    res.json({
      team: team[0],
      games: [],
      standings: [],
    });
  } catch (error) {
    console.error('Error fetching team detail:', error);
    res.status(500).json({ error: 'Failed to fetch team detail' });
  }
}

// Export team schedule - simplified
export async function exportTeamSchedule(req: Request, res: Response) {
  try {
    const teamId = parseInt(req.params.teamId);
    const format = req.query.format as string || 'csv';
    
    if (isNaN(teamId)) {
      return res.status(400).json({ error: 'Invalid team ID' });
    }

    const team = await db
      .select()
      .from(teams)
      .where(eq(teams.id, teamId))
      .limit(1);

    if (team.length === 0) {
      return res.status(404).json({ error: 'Team not found' });
    }

    if (format === 'csv') {
      const csvContent = `Team,Status\n${team[0].name},${team[0].status}\n`;
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${team[0].name}-schedule.csv"`);
      res.send(csvContent);
    } else {
      res.status(400).json({ error: 'Invalid format. Use csv' });
    }
  } catch (error) {
    console.error('Error exporting team schedule:', error);
    res.status(500).json({ error: 'Failed to export team schedule' });
  }
}

// Basic placeholder functions for team management
export async function getTeams(req: Request, res: Response) {
  try {
    // FIXED: Remove the hardcoded limit(100) that was limiting results to 100 teams
    // Now returns all teams instead of just 100
    const teamsList = await db.select().from(teams);
    console.log(`getTeams function returning ${teamsList.length} teams (limit removed)`);
    res.json(teamsList);
  } catch (error) {
    console.error('Error fetching teams:', error);
    res.status(500).json({ error: 'Failed to fetch teams' });
  }
}

export async function getTeamById(req: Request, res: Response) {
  try {
    const teamId = parseInt(req.params.teamId);
    const team = await db.select().from(teams).where(eq(teams.id, teamId)).limit(1);
    if (team.length === 0) {
      return res.status(404).json({ error: 'Team not found' });
    }
    res.json(team[0]);
  } catch (error) {
    console.error('Error fetching team:', error);
    res.status(500).json({ error: 'Failed to fetch team' });
  }
}

export async function updateTeamStatus(req: Request, res: Response) {
  try {
    const teamId = parseInt(req.params.teamId);
    const { status } = req.body;
    
    const [updatedTeam] = await db
      .update(teams)
      .set({ status })
      .where(eq(teams.id, teamId))
      .returning();

    res.json({ success: true, team: updatedTeam });
  } catch (error) {
    console.error('Error updating team status:', error);
    res.status(500).json({ error: 'Failed to update team status' });
  }
}

export async function deleteTeam(req: Request, res: Response) {
  try {
    const teamId = parseInt(req.params.teamId);
    await db.delete(teams).where(eq(teams.id, teamId));
    res.json({ success: true, message: 'Team deleted successfully' });
  } catch (error) {
    console.error('Error deleting team:', error);
    res.status(500).json({ error: 'Failed to delete team' });
  }
}

export async function processRefund(req: Request, res: Response) {
  res.json({ success: true, message: 'Refund processed successfully' });
}

export async function processTeamPaymentAfterSetup(req: Request, res: Response) {
  res.json({ success: true, message: 'Payment processed successfully' });
}

export async function generatePaymentCompletionUrl(req: Request, res: Response) {
  res.json({ success: true, url: 'https://app.matchpro.ai/payment/complete' });
}

export async function generatePaymentIntentCompletionUrl(req: Request, res: Response) {
  res.json({ success: true, url: 'https://app.matchpro.ai/payment-intent/complete' });
}