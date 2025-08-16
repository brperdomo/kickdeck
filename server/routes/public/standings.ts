import { Router, Request, Response } from 'express';
import { db } from '../../../db';
import { games, teams, teamStandings, eventScoringRules, eventAgeGroups, events } from '../../../db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { StandingsCalculator } from '../../utils/standingsCalculator';

const router = Router();

// Create table aliases for joining teams table twice
const homeTeamTable = alias(teams, 'homeTeam');
const awayTeamTable = alias(teams, 'awayTeam');

// Get live standings for public viewing (no authentication required)
router.get('/:eventId', async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const eventIdNum = parseInt(eventId);
    
    console.log(`[Public Standings] Fetching standings for event ${eventId}`);
    
    // Get event info
    const eventInfo = await db
      .select({
        name: events.name,
        startDate: events.startDate,
        endDate: events.endDate,
        logoUrl: events.logoUrl
      })
      .from(events)
      .where(eq(events.id, eventIdNum))
      .limit(1);

    if (!eventInfo.length) {
      console.log(`[Public Standings] Event ${eventId} not found`);
      return res.status(404).json({ 
        error: 'Event not found',
        message: 'The requested tournament does not exist.'
      });
    }

    console.log(`[Public Standings] Found event: ${eventInfo[0].name}`);

    // Get scoring rules to understand the point system
    const scoringRules = await db
      .select()
      .from(eventScoringRules)
      .where(and(
        eq(eventScoringRules.eventId, eventId),
        eq(eventScoringRules.isActive, true)
      ))
      .limit(1);

    // Get all age groups for this event
    const ageGroups = await db
      .select({
        id: eventAgeGroups.id,
        ageGroup: eventAgeGroups.ageGroup,
        gender: eventAgeGroups.gender,
        birthYear: eventAgeGroups.birthYear,
        divisionCode: eventAgeGroups.divisionCode
      })
      .from(eventAgeGroups)
      .where(eq(eventAgeGroups.eventId, eventId));

    console.log(`[Public Standings] Found ${ageGroups.length} age groups`);

    // Get standings for each age group
    const standingsByAgeGroup = await Promise.all(
      ageGroups.map(async (ageGroup) => {
        try {
          // First try to get pre-calculated standings from database
          let standings = await db
            .select({
              teamId: teamStandings.teamId,
              teamName: sql<string>`teams.name`,
              position: teamStandings.position,
              gamesPlayed: teamStandings.gamesPlayed,
              wins: teamStandings.wins,
              losses: teamStandings.losses,
              ties: teamStandings.ties,
              goalsScored: teamStandings.goalsScored,
              goalsAllowed: teamStandings.goalsAllowed,
              goalDifferential: teamStandings.goalDifferential,
              shutouts: teamStandings.shutouts,
              yellowCards: teamStandings.yellowCards,
              redCards: teamStandings.redCards,
              fairPlayPoints: teamStandings.fairPlayPoints,
              totalPoints: teamStandings.totalPoints,
              winPoints: teamStandings.winPoints,
              tiePoints: teamStandings.tiePoints,
              goalPoints: teamStandings.goalPoints,
              shutoutPoints: teamStandings.shutoutPoints,
              cardPenaltyPoints: teamStandings.cardPenaltyPoints
            })
            .from(teamStandings)
            .leftJoin(teams, eq(teamStandings.teamId, teams.id))
            .where(and(
              eq(teamStandings.eventId, eventId),
              eq(teamStandings.ageGroupId, ageGroup.id)
            ))
            .orderBy(teamStandings.position);

          // If no pre-calculated standings exist, calculate them dynamically
          if (standings.length === 0) {
            console.log(`[Public Standings] No pre-calculated standings found for age group ${ageGroup.id}, calculating dynamically`);
            
            // Get games data for dynamic calculation
            const gamesData = await db
              .select({
                id: games.id,
                homeTeamId: games.homeTeamId,
                awayTeamId: games.awayTeamId,
                homeTeamName: homeTeamTable.name,
                awayTeamName: awayTeamTable.name,
                homeScore: games.homeScore,
                awayScore: games.awayScore,
                status: games.status,
                homeYellowCards: games.homeYellowCards,
                awayYellowCards: games.awayYellowCards,
                homeRedCards: games.homeRedCards,
                awayRedCards: games.awayRedCards
              })
              .from(games)
              .leftJoin(homeTeamTable, eq(games.homeTeamId, homeTeamTable.id))
              .leftJoin(awayTeamTable, eq(games.awayTeamId, awayTeamTable.id))
              .where(and(
                eq(games.eventId, eventId),
                eq(games.ageGroupId, ageGroup.id)
              ));

            if (gamesData.length > 0) {
              const calculator = new StandingsCalculator(eventId, ageGroup.id);
              const calculatedStandings = await calculator.calculateStandings(gamesData);
              
              // Convert to expected format
              standings = calculatedStandings.map(team => ({
                teamId: team.teamId,
                teamName: team.teamName,
                position: team.position || 0,
                gamesPlayed: team.gamesPlayed,
                wins: team.wins,
                losses: team.losses,
                ties: team.ties,
                goalsScored: team.goalsScored,
                goalsAllowed: team.goalsAllowed,
                goalDifferential: team.goalDifferential,
                shutouts: team.shutouts,
                yellowCards: team.yellowCards,
                redCards: team.redCards,
                fairPlayPoints: team.fairPlayPoints,
                totalPoints: team.totalPoints,
                winPoints: team.winPoints,
                tiePoints: team.tiePoints,
                goalPoints: team.goalPoints,
                shutoutPoints: team.shutoutPoints,
                cardPenaltyPoints: team.cardPenaltyPoints
              }));
            }
          }

          return {
            ageGroupId: ageGroup.id,
            ageGroup: ageGroup.ageGroup,
            gender: ageGroup.gender,
            birthYear: ageGroup.birthYear,
            divisionCode: ageGroup.divisionCode,
            displayName: `${ageGroup.ageGroup} ${ageGroup.gender}`,
            teamCount: standings.length,
            standings: standings
          };
        } catch (error) {
          console.error(`[Public Standings] Error calculating standings for age group ${ageGroup.id}:`, error);
          return {
            ageGroupId: ageGroup.id,
            ageGroup: ageGroup.ageGroup,
            gender: ageGroup.gender,
            birthYear: ageGroup.birthYear,
            divisionCode: ageGroup.divisionCode,
            displayName: `${ageGroup.ageGroup} ${ageGroup.gender}`,
            teamCount: 0,
            standings: []
          };
        }
      })
    );

    // Filter out age groups with no teams
    const ageGroupsWithStandings = standingsByAgeGroup.filter(ag => ag.teamCount > 0);

    // Group by gender for frontend display
    const standingsByGender = {
      boys: ageGroupsWithStandings.filter(ag => ag.gender?.toLowerCase() === 'boys'),
      girls: ageGroupsWithStandings.filter(ag => ag.gender?.toLowerCase() === 'girls'),
      coed: ageGroupsWithStandings.filter(ag => ag.gender?.toLowerCase() === 'coed')
    };

    const totalTeams = ageGroupsWithStandings.reduce((sum, ag) => sum + ag.teamCount, 0);

    console.log(`[Public Standings] Calculated standings for ${ageGroupsWithStandings.length} age groups with ${totalTeams} total teams`);

    res.json({
      success: true,
      eventInfo: eventInfo[0],
      scoringRules: scoringRules.length > 0 ? {
        title: scoringRules[0].title,
        systemType: scoringRules[0].systemType,
        scoring: {
          win: scoringRules[0].win,
          loss: scoringRules[0].loss,
          tie: scoringRules[0].tie,
          shutout: scoringRules[0].shutout,
          goalScored: scoringRules[0].goalScored,
          goalCap: scoringRules[0].goalCap,
          redCard: scoringRules[0].redCard,
          yellowCard: scoringRules[0].yellowCard
        },
        tiebreakers: [
          scoringRules[0].tiebreaker1,
          scoringRules[0].tiebreaker2,
          scoringRules[0].tiebreaker3,
          scoringRules[0].tiebreaker4,
          scoringRules[0].tiebreaker5,
          scoringRules[0].tiebreaker6,
          scoringRules[0].tiebreaker7,
          scoringRules[0].tiebreaker8
        ]
      } : null,
      standingsByGender,
      totalAgeGroups: ageGroupsWithStandings.length,
      totalTeams,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Public Standings] Error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch standings data',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

// Get standings for a specific age group
router.get('/:eventId/age-group/:ageGroupId', async (req: Request, res: Response) => {
  try {
    const { eventId, ageGroupId } = req.params;
    const ageGroupIdNum = parseInt(ageGroupId);
    
    console.log(`[Public Standings] Fetching standings for event ${eventId}, age group ${ageGroupId}`);
    
    // Get event info
    const eventInfo = await db
      .select({
        name: events.name,
        startDate: events.startDate,
        endDate: events.endDate,
        logoUrl: events.logoUrl
      })
      .from(events)
      .where(eq(events.id, parseInt(eventId)))
      .limit(1);

    if (!eventInfo.length) {
      return res.status(404).json({ 
        error: 'Event not found',
        message: 'The requested tournament does not exist.'
      });
    }

    // Get age group info
    const ageGroupInfo = await db
      .select({
        ageGroup: eventAgeGroups.ageGroup,
        gender: eventAgeGroups.gender,
        birthYear: eventAgeGroups.birthYear,
        divisionCode: eventAgeGroups.divisionCode
      })
      .from(eventAgeGroups)
      .where(and(
        eq(eventAgeGroups.eventId, eventId),
        eq(eventAgeGroups.id, ageGroupIdNum)
      ))
      .limit(1);

    if (!ageGroupInfo.length) {
      return res.status(404).json({ 
        error: 'Age group not found',
        message: 'The requested age group does not exist.'
      });
    }

    // Get scoring rules
    const scoringRules = await db
      .select()
      .from(eventScoringRules)
      .where(and(
        eq(eventScoringRules.eventId, eventId),
        eq(eventScoringRules.isActive, true)
      ))
      .limit(1);

    // Get standings for this age group
    let standings = await db
      .select({
        teamId: teamStandings.teamId,
        teamName: sql<string>`teams.name`,
        position: teamStandings.position,
        gamesPlayed: teamStandings.gamesPlayed,
        wins: teamStandings.wins,
        losses: teamStandings.losses,
        ties: teamStandings.ties,
        goalsScored: teamStandings.goalsScored,
        goalsAllowed: teamStandings.goalsAllowed,
        goalDifferential: teamStandings.goalDifferential,
        shutouts: teamStandings.shutouts,
        yellowCards: teamStandings.yellowCards,
        redCards: teamStandings.redCards,
        fairPlayPoints: teamStandings.fairPlayPoints,
        totalPoints: teamStandings.totalPoints,
        winPoints: teamStandings.winPoints,
        tiePoints: teamStandings.tiePoints,
        goalPoints: teamStandings.goalPoints,
        shutoutPoints: teamStandings.shutoutPoints,
        cardPenaltyPoints: teamStandings.cardPenaltyPoints
      })
      .from(teamStandings)
      .leftJoin(teams, eq(teamStandings.teamId, teams.id))
      .where(and(
        eq(teamStandings.eventId, eventId),
        eq(teamStandings.ageGroupId, ageGroupIdNum)
      ))
      .orderBy(teamStandings.position);

    // If no pre-calculated standings, calculate dynamically
    if (standings.length === 0) {
      const gamesData = await db
        .select({
          id: games.id,
          homeTeamId: games.homeTeamId,
          awayTeamId: games.awayTeamId,
          homeTeamName: homeTeamTable.name,
          awayTeamName: awayTeamTable.name,
          homeScore: games.homeScore,
          awayScore: games.awayScore,
          status: games.status,
          homeYellowCards: games.homeYellowCards,
          awayYellowCards: games.awayYellowCards,
          homeRedCards: games.homeRedCards,
          awayRedCards: games.awayRedCards
        })
        .from(games)
        .leftJoin(homeTeamTable, eq(games.homeTeamId, homeTeamTable.id))
        .leftJoin(awayTeamTable, eq(games.awayTeamId, awayTeamTable.id))
        .where(and(
          eq(games.eventId, eventId),
          eq(games.ageGroupId, ageGroupIdNum)
        ));

      if (gamesData.length > 0) {
        const calculator = new StandingsCalculator(eventId, ageGroupIdNum);
        const calculatedStandings = await calculator.calculateStandings(gamesData);
        
        standings = calculatedStandings.map(team => ({
          teamId: team.teamId,
          teamName: team.teamName,
          position: team.position || 0,
          gamesPlayed: team.gamesPlayed,
          wins: team.wins,
          losses: team.losses,
          ties: team.ties,
          goalsScored: team.goalsScored,
          goalsAllowed: team.goalsAllowed,
          goalDifferential: team.goalDifferential,
          shutouts: team.shutouts,
          yellowCards: team.yellowCards,
          redCards: team.redCards,
          fairPlayPoints: team.fairPlayPoints,
          totalPoints: team.totalPoints,
          winPoints: team.winPoints,
          tiePoints: team.tiePoints,
          goalPoints: team.goalPoints,
          shutoutPoints: team.shutoutPoints,
          cardPenaltyPoints: team.cardPenaltyPoints
        }));
      }
    }

    console.log(`[Public Standings] Retrieved ${standings.length} team standings for age group ${ageGroupId}`);

    res.json({
      success: true,
      eventInfo: eventInfo[0],
      ageGroupInfo: {
        ageGroup: ageGroupInfo[0].ageGroup,
        gender: ageGroupInfo[0].gender,
        birthYear: ageGroupInfo[0].birthYear,
        divisionCode: ageGroupInfo[0].divisionCode,
        displayName: `${ageGroupInfo[0].ageGroup} ${ageGroupInfo[0].gender}`
      },
      scoringRules: scoringRules.length > 0 ? {
        title: scoringRules[0].title,
        systemType: scoringRules[0].systemType,
        scoring: {
          win: scoringRules[0].win,
          loss: scoringRules[0].loss,
          tie: scoringRules[0].tie,
          shutout: scoringRules[0].shutout,
          goalScored: scoringRules[0].goalScored,
          goalCap: scoringRules[0].goalCap,
          redCard: scoringRules[0].redCard,
          yellowCard: scoringRules[0].yellowCard
        },
        tiebreakers: [
          scoringRules[0].tiebreaker1,
          scoringRules[0].tiebreaker2,
          scoringRules[0].tiebreaker3,
          scoringRules[0].tiebreaker4,
          scoringRules[0].tiebreaker5,
          scoringRules[0].tiebreaker6,
          scoringRules[0].tiebreaker7,
          scoringRules[0].tiebreaker8
        ]
      } : null,
      standings,
      teamCount: standings.length
    });

  } catch (error) {
    console.error('[Public Standings] Error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch age group standings',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
});

export default router;