import { Router } from 'express';
import { db } from '@db';
import { games, teams, events, gameTimeSlots, fields, complexes } from '@db/schema';
import { eq, and } from 'drizzle-orm';

const router = Router();

interface ScoreReport {
  gameId: number;
  homeScore: number;
  awayScore: number;
  halftimeHomeScore?: number;
  halftimeAwayScore?: number;
  reportedBy: string;
  reportedAt: string;
  notes?: string;
}

interface CardReport {
  gameId: number;
  playerName: string;
  playerNumber: string;
  teamId: number;
  cardType: 'yellow' | 'red';
  minute: number;
  reason: string;
  reportedBy: string;
  reportedAt: string;
}

// Get game details for score/card reporting
router.get('/games/:gameId/details', async (req, res) => {
  try {
    const { gameId } = req.params;
    
    const gameDetails = await db
      .select({
        gameId: games.id,
        homeTeamId: games.homeTeamId,
        awayTeamId: games.awayTeamId,
        homeTeamName: teams.name,
        awayTeamName: teams.name,
        eventName: events.name,
        fieldName: fields.name,
        complexName: complexes.name,
        startTime: gameTimeSlots.startTime,
        endTime: gameTimeSlots.endTime,
        gameDate: gameTimeSlots.startTime,
        status: games.status,
        homeScore: games.homeScore,
        awayScore: games.awayScore
      })
      .from(games)
      .leftJoin(teams, eq(games.homeTeamId, teams.id))
      .leftJoin(events, eq(games.eventId, events.id))
      .leftJoin(gameTimeSlots, eq(games.timeSlotId, gameTimeSlots.id))
      .leftJoin(fields, eq(gameTimeSlots.fieldId, fields.id))
      .leftJoin(complexes, eq(fields.complexId, complexes.id))
      .where(eq(games.id, parseInt(gameId)))
      .limit(1);

    if (gameDetails.length === 0) {
      return res.status(404).json({ error: 'Game not found' });
    }

    // Get away team details separately due to SQL join limitations  
    const awayTeamQuery = db
      .select({ name: teams.name })
      .from(teams)
      .where(eq(teams.id, gameDetails[0].awayTeamId))
      .limit(1);
    
    const awayTeamDetails = await awayTeamQuery;

    const gameInfo = {
      ...gameDetails[0],
      awayTeamName: awayTeamDetails[0]?.name || 'Unknown Team'
    };

    res.json({ success: true, game: gameInfo });
    
  } catch (error) {
    console.error('Error fetching game details:', error);
    res.status(500).json({ 
      error: 'Failed to fetch game details',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Submit score report
router.post('/games/:gameId/score-report', async (req, res) => {
  try {
    const { gameId } = req.params;
    const scoreReport: Omit<ScoreReport, 'gameId' | 'reportedAt'> = req.body;
    
    // Validate required fields
    if (typeof scoreReport.homeScore !== 'number' || typeof scoreReport.awayScore !== 'number') {
      return res.status(400).json({ error: 'Home and away scores are required' });
    }

    if (!scoreReport.reportedBy) {
      return res.status(400).json({ error: 'Reporter name is required' });
    }

    // Update game with scores
    await db
      .update(games)
      .set({
        homeScore: scoreReport.homeScore,
        awayScore: scoreReport.awayScore,
        status: 'completed',
        // Note: We would store additional score details in a separate score_reports table
      })
      .where(eq(games.id, parseInt(gameId)));

    console.log(`[Game Reports] Score submitted for game ${gameId}: ${scoreReport.homeScore}-${scoreReport.awayScore} by ${scoreReport.reportedBy}`);
    
    res.json({
      success: true,
      message: 'Score report submitted successfully',
      data: {
        gameId: parseInt(gameId),
        homeScore: scoreReport.homeScore,
        awayScore: scoreReport.awayScore,
        reportedBy: scoreReport.reportedBy,
        reportedAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Error submitting score report:', error);
    res.status(500).json({ 
      error: 'Failed to submit score report',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Submit card report
router.post('/games/:gameId/card-report', async (req, res) => {
  try {
    const { gameId } = req.params;
    const cardReport: Omit<CardReport, 'gameId' | 'reportedAt'> = req.body;
    
    // Validate required fields
    if (!cardReport.playerName || !cardReport.teamId || !cardReport.cardType || typeof cardReport.minute !== 'number') {
      return res.status(400).json({ 
        error: 'Player name, team ID, card type, and minute are required' 
      });
    }

    if (!['yellow', 'red'].includes(cardReport.cardType)) {
      return res.status(400).json({ error: 'Card type must be yellow or red' });
    }

    if (!cardReport.reportedBy) {
      return res.status(400).json({ error: 'Reporter name is required' });
    }

    // In a production system, we would store this in a separate disciplinary_reports table
    // For now, we'll log it and return success
    console.log(`[Game Reports] Card issued in game ${gameId}: ${cardReport.cardType} card to ${cardReport.playerName} (#${cardReport.playerNumber}) at minute ${cardReport.minute} - ${cardReport.reason} (reported by ${cardReport.reportedBy})`);
    
    res.json({
      success: true,
      message: 'Card report submitted successfully',
      data: {
        gameId: parseInt(gameId),
        playerName: cardReport.playerName,
        playerNumber: cardReport.playerNumber,
        teamId: cardReport.teamId,
        cardType: cardReport.cardType,
        minute: cardReport.minute,
        reason: cardReport.reason,
        reportedBy: cardReport.reportedBy,
        reportedAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Error submitting card report:', error);
    res.status(500).json({ 
      error: 'Failed to submit card report',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;