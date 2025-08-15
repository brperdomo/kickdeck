import { Router } from 'express';
import { db } from '@db';
import { 
  games, 
  teams, 
  eventBrackets, 
  eventAgeGroups,
  teamStandings,
  tournamentGroups
} from '@db/schema';
import { eq, and, or, desc } from 'drizzle-orm';
import { isAdmin } from '../../middleware/auth.js';
import { validateChampionshipGameScheduling } from '../../services/championship-conflict-validator.js';

const router = Router();

// Apply admin authentication to all routes
router.use(isAdmin);

/**
 * AI INTEGRATION: Get championship game status for AI queries
 * Allows AI chatbot to read and respond to championship game questions
 */
router.get('/:eventId/championship-ai-status', async (req, res) => {
  try {
    const { eventId } = req.params;
    
    console.log(`[Championship AI] Getting championship status for event ${eventId}`);

    // Get all championship games for this event
    const championshipGames = await db
      .select({
        id: games.id,
        homeTeamId: games.homeTeamId,
        homeTeamName: games.homeTeamName,
        awayTeamId: games.awayTeamId,
        awayTeamName: games.awayTeamName,
        bracketId: games.bracketId,
        bracketName: games.bracketName,
        startTime: games.startTime,
        duration: games.duration,
        fieldId: games.fieldId,
        timeSlotId: games.timeSlotId,
        gameType: games.gameType,
        isPending: games.isPending,
        notes: games.notes
      })
      .from(games)
      .where(and(
        eq(games.eventId, eventId),
        or(
          eq(games.gameType, 'final'),
          eq(games.gameType, 'championship')
        )
      ));

    // Get flight information for each championship game
    const flightInfo = await Promise.all(
      championshipGames.map(async (game) => {
        const flight = await db
          .select({
            flightId: eventBrackets.id,
            name: eventBrackets.name,
            level: eventBrackets.level,
            ageGroup: eventAgeGroups.ageGroup,
            gender: eventAgeGroups.gender
          })
          .from(eventBrackets)
          .innerJoin(eventAgeGroups, eq(eventBrackets.ageGroupId, eventAgeGroups.id))
          .where(eq(eventBrackets.id, game.bracketId))
          .limit(1);

        return {
          game,
          flight: flight[0] || null
        };
      })
    );

    // Get current standings for each flight to determine who would qualify
    const standingsData = await Promise.all(
      flightInfo.map(async ({ game, flight }) => {
        if (!flight) return null;

        // Get current standings for this flight
        const standings = await db
          .select({
            teamId: teamStandings.teamId,
            teamName: teamStandings.teamName,
            position: teamStandings.position,
            points: teamStandings.points,
            wins: teamStandings.wins,
            losses: teamStandings.losses,
            draws: teamStandings.draws,
            goalsFor: teamStandings.goalsFor,
            goalsAgainst: teamStandings.goalsAgainst
          })
          .from(teamStandings)
          .where(eq(teamStandings.bracketId, flight.flightId))
          .orderBy(teamStandings.position);

        return {
          flightId: flight.flightId,
          flightName: `${flight.ageGroup} ${flight.gender} ${flight.name}`,
          gameId: game.id,
          currentHomeTeam: game.homeTeamName,
          currentAwayTeam: game.awayTeamName,
          isScheduled: !!game.startTime,
          isPending: game.isPending,
          standings: standings.slice(0, 4), // Top 4 teams for context
          potentialFinalTeams: standings.slice(0, 2) // Top 2 would play in final
        };
      })
    );

    const validStandings = standingsData.filter(Boolean);

    res.json({
      success: true,
      eventId,
      championshipGamesCount: championshipGames.length,
      flightsWithChampionships: validStandings.length,
      championshipStatus: validStandings.map(standing => ({
        flight: standing!.flightName,
        gameId: standing!.gameId,
        currentMatchup: `${standing!.currentHomeTeam} vs ${standing!.currentAwayTeam}`,
        isScheduled: standing!.isScheduled,
        isPending: standing!.isPending,
        topTeams: standing!.potentialFinalTeams.map(team => ({
          position: team.position,
          team: team.teamName,
          points: team.points,
          record: `${team.wins}-${team.losses}-${team.draws}`
        })),
        standings: standing!.standings.map(team => ({
          position: team.position,
          team: team.teamName,
          points: team.points,
          record: `${team.wins}-${team.losses}-${team.draws}`,
          goalDiff: team.goalsFor - team.goalsAgainst
        }))
      })),
      aiSummary: generateAISummary(validStandings)
    });

  } catch (error) {
    console.error('[Championship AI] Error getting status:', error);
    res.status(500).json({ error: 'Failed to get championship status' });
  }
});

/**
 * AI INTEGRATION: Update championship teams based on current standings
 */
router.post('/:eventId/update-championship-from-standings', async (req, res) => {
  try {
    const { eventId } = req.params;
    const { flightId, reason } = req.body;

    console.log(`[Championship AI] Updating championship teams for flight ${flightId}`);

    // Get current standings for the flight
    const standings = await db
      .select({
        teamId: teamStandings.teamId,
        teamName: teamStandings.teamName,
        position: teamStandings.position,
        points: teamStandings.points
      })
      .from(teamStandings)
      .where(eq(teamStandings.bracketId, flightId))
      .orderBy(teamStandings.position)
      .limit(2);

    if (standings.length < 2) {
      return res.status(400).json({ 
        error: 'Not enough teams with standings to determine championship matchup' 
      });
    }

    const [firstPlace, secondPlace] = standings;

    // Find the championship game for this flight
    const championshipGame = await db
      .select()
      .from(games)
      .where(and(
        eq(games.eventId, eventId),
        eq(games.bracketId, flightId),
        or(
          eq(games.gameType, 'final'),
          eq(games.gameType, 'championship')
        )
      ))
      .limit(1);

    if (!championshipGame.length) {
      return res.status(404).json({ 
        error: 'No championship game found for this flight' 
      });
    }

    // Update the championship game with actual teams
    await db
      .update(games)
      .set({
        homeTeamId: firstPlace.teamId,
        homeTeamName: firstPlace.teamName,
        awayTeamId: secondPlace.teamId,
        awayTeamName: secondPlace.teamName,
        isPending: false,
        notes: `Auto-updated from standings: ${firstPlace.teamName} (1st, ${firstPlace.points} pts) vs ${secondPlace.teamName} (2nd, ${secondPlace.points} pts)${reason ? ` - ${reason}` : ''}`,
        updatedAt: new Date().toISOString()
      })
      .where(eq(games.id, championshipGame[0].id));

    console.log(`[Championship AI] Updated championship: ${firstPlace.teamName} vs ${secondPlace.teamName}`);

    res.json({
      success: true,
      updatedGame: {
        id: championshipGame[0].id,
        homeTeam: firstPlace.teamName,
        awayTeam: secondPlace.teamName,
        standings: standings
      },
      message: `Championship updated: ${firstPlace.teamName} vs ${secondPlace.teamName}`
    });

  } catch (error) {
    console.error('[Championship AI] Error updating from standings:', error);
    res.status(500).json({ error: 'Failed to update championship from standings' });
  }
});

/**
 * AI INTEGRATION: Validate championship game scheduling conflicts
 */
router.post('/:eventId/validate-championship-scheduling', async (req, res) => {
  try {
    const { eventId } = req.params;
    const { gameId, proposedStartTime, flightId } = req.body;

    if (!proposedStartTime || !flightId) {
      return res.status(400).json({ 
        error: 'proposedStartTime and flightId are required' 
      });
    }

    const startTime = new Date(proposedStartTime);
    
    console.log(`[Championship AI] Validating scheduling for game ${gameId} at ${startTime.toISOString()}`);

    const validationResult = await validateChampionshipGameScheduling(
      gameId,
      startTime,
      flightId
    );

    res.json({
      success: true,
      validation: validationResult,
      aiRecommendation: generateSchedulingRecommendation(validationResult)
    });

  } catch (error) {
    console.error('[Championship AI] Error validating scheduling:', error);
    res.status(500).json({ error: 'Failed to validate championship scheduling' });
  }
});

/**
 * Generate AI-friendly summary of championship status
 */
function generateAISummary(standings: any[]) {
  if (!standings.length) {
    return "No championship games configured for this event.";
  }

  const summaries = standings.map(s => {
    const flight = s!.flightName;
    const topTeam = s!.potentialFinalTeams[0];
    const secondTeam = s!.potentialFinalTeams[1];
    
    if (!topTeam || !secondTeam) {
      return `${flight}: Standings not yet determined`;
    }
    
    return `${flight}: ${topTeam.team} (${topTeam.points} pts) vs ${secondTeam.team} (${secondTeam.points} pts) for championship`;
  });

  return summaries.join('. ');
}

/**
 * Generate AI scheduling recommendation
 */
function generateSchedulingRecommendation(validation: any) {
  if (validation.isValid) {
    return "Championship game can be scheduled at the proposed time with no conflicts.";
  }

  const conflicts = validation.conflicts.map((c: any) => 
    `${c.teamName} needs ${c.restPeriodViolation} more minutes of rest`
  ).join(', ');

  let recommendation = `Scheduling conflict detected: ${conflicts}.`;
  
  if (validation.suggestedEarliestTime) {
    recommendation += ` Earliest recommended start time: ${new Date(validation.suggestedEarliestTime).toLocaleString()}.`;
  }

  return recommendation;
}

export default router;