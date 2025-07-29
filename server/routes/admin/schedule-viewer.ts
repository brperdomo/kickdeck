import { Router } from 'express';
import { db } from '@db';
import { games, teams, eventAgeGroups, fields, complexes } from '@db/schema';
import { eq, count } from 'drizzle-orm';

const router = Router();

// GET /api/admin/events/:eventId/schedule - Get complete tournament schedule
router.get('/:eventId/schedule', async (req, res) => {
  try {
    const eventId = req.params.eventId; // Keep as string
    
    if (!eventId) {
      return res.status(400).json({ error: 'Invalid event ID' });
    }

    // Get basic game count and team information
    const [gamesCount] = await db
      .select({ count: count() })
      .from(games)
      .where(eq(games.eventId, eventId));

    const [teamsCount] = await db
      .select({ count: count() })
      .from(teams)
      .where(eq(teams.eventId, eventId));

    // Get age groups for this event
    const ageGroupsData = await db
      .select({
        ageGroup: eventAgeGroups.ageGroup,
      })
      .from(eventAgeGroups)
      .where(eq(eventAgeGroups.eventId, eventId));

    const ageGroups = ageGroupsData.map(ag => ag.ageGroup);

    // Get actual team names from database
    const actualTeamsData = await db
      .select({
        id: teams.id,
        name: teams.name,
        ageGroupId: teams.ageGroupId,
        clubName: teams.clubName,
        status: teams.status
      })
      .from(teams)
      .where(eq(teams.eventId, eventId));

    // Get actual games with real team and field data
    const actualGamesData = await db
      .select({
        gameId: games.id,
        homeTeamId: games.homeTeamId,
        awayTeamId: games.awayTeamId,
        ageGroupId: games.ageGroupId,
        fieldId: games.fieldId,
        status: games.status,
        homeScore: games.homeScore,
        awayScore: games.awayScore,
        createdAt: games.createdAt,
        fieldName: fields.name,
        fieldSize: fields.fieldSize,
        complexName: complexes.name,
        complexAddress: complexes.address
      })
      .from(games)
      .leftJoin(fields, eq(games.fieldId, fields.id))
      .leftJoin(complexes, eq(fields.complexId, complexes.id))
      .where(eq(games.eventId, eventId));

    // Create team lookup map
    const teamsMap = actualTeamsData.reduce((acc, team) => {
      acc[team.id] = team;
      return acc;
    }, {} as Record<number, any>);

    // Transform actual games with real team names and field data
    const realGames = actualGamesData.map((game, index) => {
      const homeTeam = game.homeTeamId ? teamsMap[game.homeTeamId] : null;
      const awayTeam = game.awayTeamId ? teamsMap[game.awayTeamId] : null;
      const ageGroup = ageGroups.find((ag, idx) => idx === (game.ageGroupId - 1)) || ageGroups[0] || 'Unknown';
      
      // Use real field data from database
      const fieldName = game.fieldName || `Field ${game.fieldId}`;
      const venue = game.complexName ? `${fieldName} (${game.complexName})` : fieldName;
      
      return {
        id: game.gameId,
        homeTeam: homeTeam?.name || `Team ${game.homeTeamId}`,
        awayTeam: awayTeam?.name || `Team ${game.awayTeamId}`,
        homeTeamClub: homeTeam?.clubName || '',
        awayTeamClub: awayTeam?.clubName || '',
        ageGroup: ageGroup,
        field: venue,
        fieldName: fieldName,
        complexName: game.complexName || '',
        complexAddress: game.complexAddress || '',
        fieldSize: game.fieldSize || '',
        date: '2025-08-01', // TODO: Get from actual time slots
        time: `${8 + Math.floor(index / 4)}:${(index % 4) * 15}0`, // TODO: Get from actual time slots
        duration: 90,
        status: game.status || 'scheduled',
        homeScore: game.homeScore,
        awayScore: game.awayScore
      };
    });

    // If no actual games exist, show sample with real team names
    const displayGames = realGames.length > 0 ? realGames : actualTeamsData.slice(0, 20).map((team, index) => {
      const otherTeam = actualTeamsData[index + 1] || actualTeamsData[0];
      return {
        id: index + 1,
        homeTeam: team.name,
        awayTeam: otherTeam?.name || 'TBD',
        homeTeamClub: team.clubName || '',
        awayTeamClub: otherTeam?.clubName || '',
        ageGroup: ageGroups[index % ageGroups.length] || 'U12',
        field: realFieldsData.length > 0 ? `${realFieldsData[index % realFieldsData.length].name} (${realFieldsData[index % realFieldsData.length].complexName || 'Main Complex'})` : `Field ${(index % 4) + 1}`,
        date: '2025-08-01',
        time: `${8 + Math.floor(index / 4)}:${(index % 4) * 15}0`,
        duration: 90,
        status: 'scheduled'
      };
    });

    // Get real field data from database
    const realFieldsData = await db
      .select({
        id: fields.id,
        name: fields.name,
        fieldSize: fields.fieldSize,
        hasLights: fields.hasLights,
        complexName: complexes.name,
        complexAddress: complexes.address,
        openTime: fields.openTime,
        closeTime: fields.closeTime
      })
      .from(fields)
      .leftJoin(complexes, eq(fields.complexId, complexes.id))
      .where(eq(fields.isOpen, true));

    const fieldsData = realFieldsData.map(field => ({
      name: field.complexName ? `${field.name} (${field.complexName})` : field.name,
      surface: 'Grass', // Default since surface not in schema
      size: field.fieldSize || '11v11',
      hasLights: field.hasLights,
      complexName: field.complexName,
      address: field.complexAddress,
      hours: `${field.openTime || '08:00'} - ${field.closeTime || '22:00'}`
    }));

    const dates = ['2025-08-01', '2025-08-02'];

    res.json({
      games: displayGames,
      fields: fieldsData,
      ageGroups,
      dates,
      totalGames: actualGamesData.length || displayGames.length,
      actualData: {
        gamesInDatabase: actualGamesData.length,
        teamsInDatabase: actualTeamsData.length,
        ageGroupsConfigured: ageGroups.length,
        realTeamsFound: actualTeamsData.length,
        scheduledGamesFound: actualGamesData.length
      },
      teamsList: actualTeamsData.map(t => ({ id: t.id, name: t.name, club: t.clubName })),
      eventId
    });

  } catch (error) {
    console.error('Error fetching tournament schedule:', error);
    res.status(500).json({ error: 'Failed to fetch tournament schedule' });
  }
});

// GET /api/admin/events/:eventId/fields - Get fields for the event
router.get('/:eventId/fields', async (req, res) => {
  try {
    const eventId = parseInt(req.params.eventId);
    
    if (isNaN(eventId)) {
      return res.status(400).json({ error: 'Invalid event ID' });
    }

    // Return basic field structure
    const fields = [
      { id: 1, name: 'Field 1', surface: 'Grass', size: '11v11' },
      { id: 2, name: 'Field 2', surface: 'Grass', size: '11v11' },
      { id: 3, name: 'Field 3', surface: 'Grass', size: '9v9' },
      { id: 4, name: 'Field 4', surface: 'Turf', size: '7v7' }
    ];

    res.json(fields);

  } catch (error) {
    console.error('Error fetching fields:', error);
    res.status(500).json({ error: 'Failed to fetch fields' });
  }
});

export default router;