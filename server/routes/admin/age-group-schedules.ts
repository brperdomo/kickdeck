import { Router } from 'express';
import { db } from '../../../db';
import { games, teams, fields, eventAgeGroups, gameTimeSlots, complexes } from '@db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { isAdmin } from '../../middleware/auth';

const router = Router();

// GET /api/admin/age-group-schedules/:eventId - Get schedules grouped by age group/division
router.get('/:eventId', isAdmin, async (req, res) => {
  try {
    const { eventId } = req.params;
    console.log(`[Age Group Schedules] Fetching for event ${eventId}`);

    // Get all age groups for this event with their division codes
    const ageGroups = await db
      .select({
        id: eventAgeGroups.id,
        ageGroup: eventAgeGroups.ageGroup,
        gender: eventAgeGroups.gender,
        birthYear: eventAgeGroups.birthYear,
        divisionCode: eventAgeGroups.divisionCode,
        fieldSize: eventAgeGroups.fieldSize
      })
      .from(eventAgeGroups);

    // Get all games for each age group
    const schedulesByAgeGroup = await Promise.all(
      ageGroups.map(async (ageGroup) => {
        const ageGroupGames = await db
          .select({
            id: games.id,
            gameNumber: games.matchNumber,
            homeTeamId: games.homeTeamId,
            awayTeamId: games.awayTeamId,
            fieldId: games.fieldId,
            timeSlotId: games.timeSlotId,
            status: games.status,
            homeScore: games.homeScore,
            awayScore: games.awayScore,
            round: games.round,
            scheduledDate: games.scheduledDate,
            scheduledTime: games.scheduledTime,
            notes: games.notes,
            homeTeamRefId: games.homeTeamRefId,
            awayTeamRefId: games.awayTeamRefId
          })
          .from(games)
          .where(eq(games.ageGroupId, ageGroup.id));

        // Get team names, field names, and time slot details for each game
        const gamesWithDetails = await Promise.all(
          ageGroupGames.map(async (game) => {
            const [homeTeam, awayTeam, field, timeSlot] = await Promise.all([
              game.homeTeamId ? db.query.teams.findFirst({ where: eq(teams.id, game.homeTeamId) }) : null,
              game.awayTeamId ? db.query.teams.findFirst({ where: eq(teams.id, game.awayTeamId) }) : null,
              game.fieldId ? db.query.fields.findFirst({ 
                where: eq(fields.id, game.fieldId),
                with: { complex: true }
              }) : null,
              game.timeSlotId ? db.query.gameTimeSlots.findFirst({ where: eq(gameTimeSlots.id, game.timeSlotId) }) : null
            ]);

            // Extract coach information from notes if available
            const coachInfo = {
              homeCoach: null as string | null,
              awayCoach: null as string | null
            };
            
            if (game.notes) {
              const homeCoachMatch = game.notes.match(/Home Coach:\s*([^|]+)/);
              const awayCoachMatch = game.notes.match(/Away Coach:\s*([^|]+)/);
              if (homeCoachMatch) coachInfo.homeCoach = homeCoachMatch[1].trim();
              if (awayCoachMatch) coachInfo.awayCoach = awayCoachMatch[1].trim();
            }

            return {
              ...game,
              homeTeamName: homeTeam?.name || 'TBD',
              awayTeamName: awayTeam?.name || 'TBD',
              fieldName: field?.name || 'TBD',
              complexName: field?.complex?.name || 'TBD',
              gameDate: timeSlot?.startTime || game.scheduledDate,
              gameTime: timeSlot ? timeSlot.startTime : `${game.scheduledDate}T${game.scheduledTime}:00`,
              hasScore: game.homeScore !== null && game.awayScore !== null,
              isCompleted: game.status === 'completed',
              coachInfo
            };
          })
        );

        // Calculate division statistics
        const totalGames = gamesWithDetails.length;
        const completedGames = gamesWithDetails.filter(g => g.isCompleted).length;
        const scheduledGames = gamesWithDetails.filter(g => g.status === 'scheduled').length;
        const postponedGames = gamesWithDetails.filter(g => g.status === 'postponed').length;

        // Get unique teams in this age group
        const teamIds = new Set([
          ...gamesWithDetails.map(g => g.homeTeamId).filter(Boolean),
          ...gamesWithDetails.map(g => g.awayTeamId).filter(Boolean)
        ]);

        return {
          ageGroup: {
            id: ageGroup.id,
            name: ageGroup.ageGroup,
            divisionCode: ageGroup.divisionCode,
            gender: ageGroup.gender,
            birthYear: ageGroup.birthYear,
            fieldSize: ageGroup.fieldSize
          },
          games: gamesWithDetails.sort((a, b) => {
            // Sort by date/time, then by game number
            const dateA = new Date(a.gameTime).getTime();
            const dateB = new Date(b.gameTime).getTime();
            if (dateA !== dateB) return dateA - dateB;
            return (a.gameNumber || 0) - (b.gameNumber || 0);
          }),
          statistics: {
            totalGames,
            completedGames,
            scheduledGames,
            postponedGames,
            totalTeams: teamIds.size,
            completionRate: totalGames > 0 ? Math.round((completedGames / totalGames) * 100) : 0
          }
        };
      })
    );

    // Filter out age groups with no games and sort by division code
    const filteredSchedules = schedulesByAgeGroup
      .filter(schedule => schedule.games.length > 0)
      .sort((a, b) => {
        // Sort by gender (Boys first, then Girls), then by birth year (older first)
        if (a.ageGroup.gender !== b.ageGroup.gender) {
          if (a.ageGroup.gender === 'Boys') return -1;
          if (b.ageGroup.gender === 'Boys') return 1;
        }
        return (b.ageGroup.birthYear || 0) - (a.ageGroup.birthYear || 0);
      });

    console.log(`[Age Group Schedules] Found ${filteredSchedules.length} age groups with games`);

    res.json({
      success: true,
      eventId,
      ageGroups: filteredSchedules,
      summary: {
        totalAgeGroups: filteredSchedules.length,
        totalGames: filteredSchedules.reduce((sum, ag) => sum + ag.statistics.totalGames, 0),
        totalCompleted: filteredSchedules.reduce((sum, ag) => sum + ag.statistics.completedGames, 0),
        totalTeams: filteredSchedules.reduce((sum, ag) => sum + ag.statistics.totalTeams, 0)
      }
    });

  } catch (error) {
    console.error('[Age Group Schedules] Error:', error);
    res.status(500).json({
      error: 'Failed to fetch age group schedules',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/admin/age-group-schedules/:eventId/:ageGroupId - Get detailed schedule for specific age group
router.get('/:eventId/:ageGroupId', isAdmin, async (req, res) => {
  try {
    const { eventId, ageGroupId } = req.params;
    
    // Get age group details
    const ageGroup = await db.query.eventAgeGroups.findFirst({
      where: eq(eventAgeGroups.id, parseInt(ageGroupId))
    });

    if (!ageGroup) {
      return res.status(404).json({ error: 'Age group not found' });
    }

    // Get all teams in this age group
    const ageGroupTeams = await db
      .select({
        id: teams.id,
        name: teams.name,
        status: teams.status,
        managerName: teams.managerName,
        notes: teams.notes
      })
      .from(teams)
      .where(eq(teams.ageGroupId, parseInt(ageGroupId)));

    // Get all games for this age group with full details
    const ageGroupGames = await db
      .select()
      .from(games)
      .where(eq(games.ageGroupId, parseInt(ageGroupId)));

    // Enhanced game details with standings implications
    const gamesWithFullDetails = await Promise.all(
      ageGroupGames.map(async (game) => {
        const [homeTeam, awayTeam, field, timeSlot] = await Promise.all([
          db.query.teams.findFirst({ where: eq(teams.id, game.homeTeamId) }),
          db.query.teams.findFirst({ where: eq(teams.id, game.awayTeamId) }),
          db.query.fields.findFirst({ 
            where: eq(fields.id, game.fieldId),
            with: { complex: true }
          }),
          db.query.gameTimeSlots.findFirst({ where: eq(gameTimeSlots.id, game.timeSlotId) })
        ]);

        return {
          ...game,
          homeTeamName: homeTeam?.name || 'TBD',
          awayTeamName: awayTeam?.name || 'TBD',
          fieldName: field?.name || 'TBD',
          complexName: field?.complex?.name || 'TBD',
          gameDateTime: timeSlot?.startTime || `${game.scheduledDate}T${game.scheduledTime}:00`,
          hasScore: game.homeScore !== null && game.awayScore !== null,
          winner: game.homeScore !== null && game.awayScore !== null ? 
            (game.homeScore > game.awayScore ? 'home' : 
             game.awayScore > game.homeScore ? 'away' : 'tie') : null
        };
      })
    );

    res.json({
      success: true,
      ageGroup: {
        id: ageGroup.id,
        name: ageGroup.ageGroup,
        divisionCode: ageGroup.divisionCode,
        gender: ageGroup.gender,
        birthYear: ageGroup.birthYear,
        fieldSize: ageGroup.fieldSize
      },
      teams: ageGroupTeams,
      games: gamesWithFullDetails.sort((a, b) => 
        new Date(a.gameDateTime).getTime() - new Date(b.gameDateTime).getTime()
      ),
      statistics: {
        totalTeams: ageGroupTeams.length,
        totalGames: gamesWithFullDetails.length,
        completedGames: gamesWithFullDetails.filter(g => g.hasScore).length,
        upcomingGames: gamesWithFullDetails.filter(g => !g.hasScore && g.status === 'scheduled').length
      }
    });

  } catch (error) {
    console.error('[Age Group Detail] Error:', error);
    res.status(500).json({
      error: 'Failed to fetch age group details',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;