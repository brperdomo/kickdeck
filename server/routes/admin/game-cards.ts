import { Router } from 'express';
import { GameCardGenerator } from '../../utils/gameCardGenerator';
import { isAdmin } from '../../middleware/auth';
import { db } from '../../../db';
import { teams, events } from '@db/schema';
import { eq, and } from 'drizzle-orm';

const router = Router();

// Generate game card for a specific team
router.get('/:eventId/teams/:teamId/game-card', isAdmin, async (req, res) => {
  try {
    const { eventId, teamId } = req.params;

    // Validate team exists and belongs to event
    const team = await db
      .select()
      .from(teams)
      .where(
        and(
          eq(teams.id, parseInt(teamId)),
          eq(teams.eventId, eventId)
        )
      )
      .limit(1);

    if (team.length === 0) {
      return res.status(404).json({ error: 'Team not found for this event' });
    }

    // Generate the game card
    const generator = new GameCardGenerator();
    const pdfBuffer = await generator.generateGameCard(parseInt(teamId), eventId);

    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="game-card-${team[0].teamName.replace(/[^a-zA-Z0-9]/g, '-')}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generating game card:', error);
    res.status(500).json({ error: 'Failed to generate game card' });
  }
});

// Generate game cards for all teams in an event
router.get('/:eventId/game-cards/bulk', isAdmin, async (req, res) => {
  try {
    const { eventId } = req.params;

    // Get all approved teams for this event
    const eventTeams = await db
      .select()
      .from(teams)
      .where(
        and(
          eq(teams.eventId, eventId),
          eq(teams.status, 'approved')
        )
      );

    if (eventTeams.length === 0) {
      return res.status(404).json({ error: 'No approved teams found for this event' });
    }

    const generator = new GameCardGenerator();
    const gameCards = [];

    // Generate cards for each team
    for (const team of eventTeams) {
      try {
        const pdfBuffer = await generator.generateGameCard(team.id, eventId);
        gameCards.push({
          teamId: team.id,
          teamName: team.teamName,
          pdfBuffer: pdfBuffer.toString('base64')
        });
      } catch (error) {
        console.error(`Error generating card for team ${team.teamName}:`, error);
        gameCards.push({
          teamId: team.id,
          teamName: team.teamName,
          error: 'Failed to generate card'
        });
      }
    }

    res.json({
      success: true,
      eventId,
      totalTeams: eventTeams.length,
      gameCards
    });
  } catch (error) {
    console.error('Error generating bulk game cards:', error);
    res.status(500).json({ error: 'Failed to generate bulk game cards' });
  }
});

// Preview game card for a team (returns PDF in browser)
router.get('/:eventId/teams/:teamId/game-card/preview', isAdmin, async (req, res) => {
  try {
    const { eventId, teamId } = req.params;

    // Validate team exists and belongs to event
    const team = await db
      .select()
      .from(teams)
      .where(
        and(
          eq(teams.id, parseInt(teamId)),
          eq(teams.eventId, eventId)
        )
      )
      .limit(1);

    if (team.length === 0) {
      return res.status(404).json({ error: 'Team not found for this event' });
    }

    // Generate the game card
    const generator = new GameCardGenerator();
    const pdfBuffer = await generator.generateGameCard(parseInt(teamId), eventId);

    // Set response headers for PDF preview in browser
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('Content-Length', pdfBuffer.length);

    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generating game card preview:', error);
    res.status(500).json({ error: 'Failed to generate game card preview' });
  }
});

export default router;