import { Router } from 'express';
import { db } from '@db';
import { events, games, teams, complexes, fields, eventAgeGroups } from '@db/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { isAdmin } from '../../middleware/auth';

const router = Router();

// GET /api/admin/games/all-tournaments - Get all games across all tournaments
router.get('/all-tournaments', isAdmin, async (req, res) => {
  try {
    console.log('Fetching games from all tournaments...');

    // Get all games with event, team, and venue information
    const allGames = await db
      .select({
        id: games.id,
        eventId: games.eventId,
        eventName: events.name,
        gameDate: games.gameDate,
        gameTime: games.gameTime,
        homeTeamId: games.homeTeamId,
        awayTeamId: games.awayTeamId,
        ageGroupId: games.ageGroupId,
        fieldId: games.fieldId,
        status: games.status
      })
      .from(games)
      .leftJoin(events, eq(games.eventId, events.id))
      .where(eq(events.isArchived, false))
      .orderBy(desc(games.gameDate), desc(games.gameTime));

    // Get team names and field information for each game
    const gamesWithDetails = await Promise.all(
      allGames.map(async (game) => {
        try {
          // Get home team name
          const homeTeam = await db.query.teams.findFirst({
            where: eq(teams.id, game.homeTeamId || 0)
          });

          // Get away team name
          const awayTeam = await db.query.teams.findFirst({
            where: eq(teams.id, game.awayTeamId || 0)
          });

          // Get age group name
          const ageGroup = await db.query.eventAgeGroups.findFirst({
            where: eq(eventAgeGroups.id, game.ageGroupId || 0)
          });

          // Get field and complex information
          let fieldName = 'TBD';
          let complexName = 'TBD';
          
          if (game.fieldId) {
            const field = await db.query.fields.findFirst({
              where: eq(fields.id, game.fieldId)
            });
            
            if (field) {
              fieldName = field.name;
              
              // Get complex name
              if (field.complexId) {
                const complex = await db.query.complexes.findFirst({
                  where: eq(complexes.id, field.complexId)
                });
                if (complex) {
                  complexName = complex.name;
                }
              }
            }
          }

          return {
            id: game.id,
            eventId: game.eventId,
            eventName: game.eventName || 'Unknown Event',
            date: game.date || new Date().toISOString().split('T')[0],
            time: game.time || 'TBD',
            homeTeam: homeTeam?.name || 'TBD',
            awayTeam: awayTeam?.name || 'TBD',
            ageGroup: ageGroup?.ageGroup || `Age Group ${game.ageGroupId}`,
            field: fieldName,
            complex: complexName,
            status: game.status || 'scheduled'
          };
        } catch (gameError) {
          console.error(`Error processing game ${game.id}:`, gameError);
          return {
            id: game.id,
            eventId: game.eventId,
            eventName: game.eventName || 'Unknown Event',
            date: game.date || new Date().toISOString().split('T')[0],
            time: game.time || 'TBD',
            homeTeam: 'TBD',
            awayTeam: 'TBD',
            ageGroup: `Age Group ${game.ageGroupId}`,
            field: 'TBD',
            complex: 'TBD',
            status: game.status || 'scheduled'
          };
        }
      })
    );

    console.log(`Found ${gamesWithDetails.length} games across all tournaments`);
    res.json(gamesWithDetails);

  } catch (error) {
    console.error('Error fetching games from all tournaments:', error);
    res.status(500).json({ 
      error: 'Failed to fetch games from all tournaments',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;