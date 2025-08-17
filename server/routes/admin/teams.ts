import { Request, Response } from 'express';
import { db } from 'db';
import { teams, games, events, eventBrackets } from 'db/schema';
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
        homeTeamScore,
        awayTeamScore,
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

    // Get all teams for the event with their bracket/flight information
    const teamsData = await db
      .select({
        id: teams.id,
        name: teams.name,
        ageGroup: teams.ageGroup,
        gender: teams.gender,
        status: teams.status,
        coachName: teams.coachName,
        bracketId: teams.bracketId,
        flightName: eventBrackets.name,
      })
      .from(teams)
      .leftJoin(eventBrackets, eq(teams.bracketId, eventBrackets.id))
      .where(eq(teams.eventId, eventId))
      .orderBy(asc(teams.name));

    // Get game statistics for each team
    const gameStats = await db
      .select({
        teamId: sql<number>`CASE 
          WHEN ${games.homeTeamId} = ${teams.id} THEN ${teams.id}
          WHEN ${games.awayTeamId} = ${teams.id} THEN ${teams.id}
          ELSE NULL
        END`.as('teamId'),
        gamesPlayed: sql<number>`COUNT(*)`.as('gamesPlayed'),
        wins: sql<number>`SUM(CASE 
          WHEN (${games.homeTeamId} = ${teams.id} AND ${games.homeTeamScore} > ${games.awayTeamScore}) 
            OR (${games.awayTeamId} = ${teams.id} AND ${games.awayTeamScore} > ${games.homeTeamScore})
          THEN 1 ELSE 0 END)`.as('wins'),
        losses: sql<number>`SUM(CASE 
          WHEN (${games.homeTeamId} = ${teams.id} AND ${games.homeTeamScore} < ${games.awayTeamScore}) 
            OR (${games.awayTeamId} = ${teams.id} AND ${games.awayTeamScore} < ${games.homeTeamScore})
          THEN 1 ELSE 0 END)`.as('losses'),
        ties: sql<number>`SUM(CASE 
          WHEN ${games.homeTeamScore} = ${games.awayTeamScore} AND ${games.homeTeamScore} IS NOT NULL
          THEN 1 ELSE 0 END)`.as('ties'),
        goalsFor: sql<number>`SUM(CASE 
          WHEN ${games.homeTeamId} = ${teams.id} THEN COALESCE(${games.homeTeamScore}, 0)
          WHEN ${games.awayTeamId} = ${teams.id} THEN COALESCE(${games.awayTeamScore}, 0)
          ELSE 0 END)`.as('goalsFor'),
        goalsAgainst: sql<number>`SUM(CASE 
          WHEN ${games.homeTeamId} = ${teams.id} THEN COALESCE(${games.awayTeamScore}, 0)
          WHEN ${games.awayTeamId} = ${teams.id} THEN COALESCE(${games.homeTeamScore}, 0)
          ELSE 0 END)`.as('goalsAgainst'),
        totalGames: sql<number>`COUNT(*)`.as('totalGames'),
      })
      .from(games)
      .innerJoin(teams, sql`${teams.id} IN (${games.homeTeamId}, ${games.awayTeamId})`)
      .where(
        and(
          eq(teams.eventId, eventId),
          sql`${games.homeTeamScore} IS NOT NULL AND ${games.awayTeamScore} IS NOT NULL`
        )
      )
      .groupBy(teams.id);

    // Get total scheduled games per team (including unplayed)
    const totalGameCounts = await db
      .select({
        teamId: sql<number>`CASE 
          WHEN ${games.homeTeamId} = ${teams.id} THEN ${teams.id}
          WHEN ${games.awayTeamId} = ${teams.id} THEN ${teams.id}
          ELSE NULL
        END`.as('teamId'),
        totalGames: sql<number>`COUNT(*)`.as('totalGames'),
      })
      .from(games)
      .innerJoin(teams, sql`${teams.id} IN (${games.homeTeamId}, ${games.awayTeamId})`)
      .where(eq(teams.eventId, eventId))
      .groupBy(teams.id);

    // Combine team data with statistics
    const teamsWithStats = teamsData.map(team => {
      const stats = gameStats.find(stat => stat.teamId === team.id) || {
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        ties: 0,
        goalsFor: 0,
        goalsAgainst: 0,
      };

      const totalCount = totalGameCounts.find(count => count.teamId === team.id);
      
      // Calculate points (3 for win, 1 for tie)
      const points = (stats.wins * 3) + (stats.ties * 1);
      const goalDifference = stats.goalsFor - stats.goalsAgainst;

      return {
        ...team,
        gamesPlayed: stats.gamesPlayed,
        wins: stats.wins,
        losses: stats.losses,
        ties: stats.ties,
        goalsFor: stats.goalsFor,
        goalsAgainst: stats.goalsAgainst,
        goalDifference,
        points,
        totalGames: totalCount?.totalGames || 0,
        rank: 0, // Will be calculated below
      };
    });

    // Calculate rankings within each flight
    const flightGroups = teamsWithStats.reduce((acc, team) => {
      const flightKey = `${team.ageGroup}-${team.flightName || 'Default'}`;
      if (!acc[flightKey]) acc[flightKey] = [];
      acc[flightKey].push(team);
      return acc;
    }, {} as Record<string, typeof teamsWithStats>);

    // Rank teams within each flight
    Object.values(flightGroups).forEach(flightTeams => {
      flightTeams.sort((a, b) => {
        // Sort by points desc, then goal difference desc, then goals for desc
        if (b.points !== a.points) return b.points - a.points;
        if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
        return b.goalsFor - a.goalsFor;
      });

      // Assign ranks
      flightTeams.forEach((team, index) => {
        team.rank = index + 1;
      });
    });

    // Get unique age groups and genders for filtering
    const ageGroups = [...new Set(teamsData.map(team => team.ageGroup))].filter(Boolean);
    const genders = [...new Set(teamsData.map(team => team.gender))].filter(Boolean);

    res.json({
      teams: teamsWithStats,
      ageGroups,
      genders,
    });
  } catch (error) {
    console.error('Error fetching teams overview:', error);
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

    // Get team basic information
    const teamInfo = await db
      .select({
        id: teams.id,
        name: teams.name,
        ageGroup: teams.ageGroup,
        gender: teams.gender,
        status: teams.status,
        coachName: teams.coachName,
        bracketId: teams.bracketId,
        groupId: teams.groupId,
        flightName: eventBrackets.name,
      })
      .from(teams)
      .leftJoin(eventBrackets, eq(teams.bracketId, eventBrackets.id))
      .where(and(eq(teams.id, teamId), eq(teams.eventId, eventId)))
      .limit(1);

    if (teamInfo.length === 0) {
      return res.status(404).json({ error: 'Team not found' });
    }

    const team = teamInfo[0];

    // Get all games for this team
    const teamGames = await db
      .select({
        id: games.id,
        date: games.date,
        time: games.time,
        field: games.field,
        homeTeamId: games.homeTeamId,
        awayTeamId: games.awayTeamId,
        homeTeamScore: games.homeTeamScore,
        awayTeamScore: games.awayTeamScore,
        status: games.status,
        homeTeamName: sql<string>`ht.name`.as('homeTeamName'),
        awayTeamName: sql<string>`at.name`.as('awayTeamName'),
      })
      .from(games)
      .innerJoin(teams.as('ht'), eq(games.homeTeamId, sql`ht.id`))
      .innerJoin(teams.as('at'), eq(games.awayTeamId, sql`at.id`))
      .where(
        and(
          sql`${teamId} IN (${games.homeTeamId}, ${games.awayTeamId})`,
          sql`ht.event_id = ${eventId} AND at.event_id = ${eventId}`
        )
      )
      .orderBy(asc(games.date), asc(games.time));

    // Format games with opponent information
    const formattedGames = teamGames.map(game => ({
      id: game.id,
      date: game.date,
      time: game.time,
      field: game.field,
      opponent: game.homeTeamId === teamId ? game.awayTeamName : game.homeTeamName,
      homeTeamScore: game.homeTeamScore,
      awayTeamScore: game.awayTeamScore,
      status: game.status || 'scheduled',
      isHomeTeam: game.homeTeamId === teamId,
      homeTeamId: game.homeTeamId,
      awayTeamId: game.awayTeamId,
    }));

    // Get standings for the team's flight/bracket
    const standingsQuery = await db
      .select({
        teamId: teams.id,
        teamName: teams.name,
        gamesPlayed: sql<number>`COUNT(CASE WHEN ${games.homeTeamScore} IS NOT NULL AND ${games.awayTeamScore} IS NOT NULL THEN 1 END)`.as('gamesPlayed'),
        wins: sql<number>`SUM(CASE 
          WHEN (${games.homeTeamId} = ${teams.id} AND ${games.homeTeamScore} > ${games.awayTeamScore}) 
            OR (${games.awayTeamId} = ${teams.id} AND ${games.awayTeamScore} > ${games.homeTeamScore})
          THEN 1 ELSE 0 END)`.as('wins'),
        losses: sql<number>`SUM(CASE 
          WHEN (${games.homeTeamId} = ${teams.id} AND ${games.homeTeamScore} < ${games.awayTeamScore}) 
            OR (${games.awayTeamId} = ${teams.id} AND ${games.awayTeamScore} < ${games.homeTeamScore})
          THEN 1 ELSE 0 END)`.as('losses'),
        ties: sql<number>`SUM(CASE 
          WHEN ${games.homeTeamScore} = ${games.awayTeamScore} AND ${games.homeTeamScore} IS NOT NULL
          THEN 1 ELSE 0 END)`.as('ties'),
        goalsFor: sql<number>`SUM(CASE 
          WHEN ${games.homeTeamId} = ${teams.id} THEN COALESCE(${games.homeTeamScore}, 0)
          WHEN ${games.awayTeamId} = ${teams.id} THEN COALESCE(${games.awayTeamScore}, 0)
          ELSE 0 END)`.as('goalsFor'),
        goalsAgainst: sql<number>`SUM(CASE 
          WHEN ${games.homeTeamId} = ${teams.id} THEN COALESCE(${games.awayTeamScore}, 0)
          WHEN ${games.awayTeamId} = ${teams.id} THEN COALESCE(${games.homeTeamScore}, 0)
          ELSE 0 END)`.as('goalsAgainst'),
      })
      .from(teams)
      .leftJoin(games, sql`${teams.id} IN (${games.homeTeamId}, ${games.awayTeamId})`)
      .where(
        and(
          eq(teams.eventId, eventId),
          eq(teams.ageGroup, team.ageGroup),
          team.bracketId ? eq(teams.bracketId, team.bracketId) : sql`1=1`
        )
      )
      .groupBy(teams.id, teams.name);

    // Calculate standings with points and rankings
    const standings = standingsQuery.map(standing => {
      const points = (standing.wins * 3) + (standing.ties * 1);
      const goalDifference = standing.goalsFor - standing.goalsAgainst;
      
      return {
        ...standing,
        points,
        goalDifference,
        rank: 0, // Will be assigned below
      };
    });

    // Sort and rank standings
    standings.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
      return b.goalsFor - a.goalsFor;
    });

    standings.forEach((standing, index) => {
      standing.rank = index + 1;
    });

    // Calculate team stats
    const currentTeamStanding = standings.find(s => s.teamId === teamId);
    const teamStats = {
      wins: currentTeamStanding?.wins || 0,
      losses: currentTeamStanding?.losses || 0,
      ties: currentTeamStanding?.ties || 0,
      points: currentTeamStanding?.points || 0,
      rank: currentTeamStanding?.rank || 0,
      totalGames: formattedGames.length,
      gamesRemaining: formattedGames.filter(g => g.status === 'scheduled').length,
    };

    res.json({
      team,
      games: formattedGames,
      standings,
      teamStats,
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

    // Get team info and games (reusing logic from getTeamDetail)
    const teamInfo = await db
      .select({
        name: teams.name,
        ageGroup: teams.ageGroup,
        flightName: eventBrackets.name,
      })
      .from(teams)
      .leftJoin(eventBrackets, eq(teams.bracketId, eventBrackets.id))
      .where(and(eq(teams.id, teamId), eq(teams.eventId, eventId)))
      .limit(1);

    if (teamInfo.length === 0) {
      return res.status(404).json({ error: 'Team not found' });
    }

    const team = teamInfo[0];

    // Get games
    const teamGames = await db
      .select({
        id: games.id,
        date: games.date,
        time: games.time,
        field: games.field,
        homeTeamId: games.homeTeamId,
        awayTeamId: games.awayTeamId,
        homeTeamScore: games.homeTeamScore,
        awayTeamScore: games.awayTeamScore,
        status: games.status,
        homeTeamName: sql<string>`ht.name`.as('homeTeamName'),
        awayTeamName: sql<string>`at.name`.as('awayTeamName'),
      })
      .from(games)
      .innerJoin(teams.as('ht'), eq(games.homeTeamId, sql`ht.id`))
      .innerJoin(teams.as('at'), eq(games.awayTeamId, sql`at.id`))
      .where(
        and(
          sql`${teamId} IN (${games.homeTeamId}, ${games.awayTeamId})`,
          sql`ht.event_id = ${eventId} AND at.event_id = ${eventId}`
        )
      )
      .orderBy(asc(games.date), asc(games.time));

    if (format === 'csv') {
      // Generate CSV
      const csvHeader = 'Game ID,Date,Time,Field,Opponent,Home/Away,Score,Status\n';
      const csvRows = teamGames.map(game => {
        const isHome = game.homeTeamId === teamId;
        const opponent = isHome ? game.awayTeamName : game.homeTeamName;
        const homeAway = isHome ? 'Home' : 'Away';
        const score = game.homeTeamScore !== null && game.awayTeamScore !== null
          ? `${isHome ? game.homeTeamScore : game.awayTeamScore}-${isHome ? game.awayTeamScore : game.homeTeamScore}`
          : 'TBD';
        
        return `${game.id},"${game.date}","${game.time}","${game.field}","${opponent}","${homeAway}","${score}","${game.status || 'scheduled'}"`;
      }).join('\n');

      const csvContent = csvHeader + csvRows;
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${team.name}-schedule.csv"`);
      res.send(csvContent);
    } else if (format === 'pdf') {
      // For now, return a simple text response for PDF
      // In a full implementation, you'd use a PDF library like jsPDF or puppeteer
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', `attachment; filename="${team.name}-schedule.txt"`);
      
      let content = `Team Schedule: ${team.name}\n`;
      content += `Age Group: ${team.ageGroup}\n`;
      content += `Flight: ${team.flightName || 'N/A'}\n\n`;
      content += 'Games:\n';
      content += '='.repeat(50) + '\n';
      
      teamGames.forEach(game => {
        const isHome = game.homeTeamId === teamId;
        const opponent = isHome ? game.awayTeamName : game.homeTeamName;
        const homeAway = isHome ? 'vs' : '@';
        const score = game.homeTeamScore !== null && game.awayTeamScore !== null
          ? `${isHome ? game.homeTeamScore : game.awayTeamScore}-${isHome ? game.awayTeamScore : game.homeTeamScore}`
          : 'TBD';
        
        content += `${game.date} ${game.time} - ${game.field}\n`;
        content += `${homeAway} ${opponent} - ${score}\n\n`;
      });
      
      res.send(content);
    } else {
      res.status(400).json({ error: 'Invalid format. Use csv or pdf' });
    }
  } catch (error) {
    console.error('Error exporting team schedule:', error);
    res.status(500).json({ error: 'Failed to export team schedule' });
  }
}