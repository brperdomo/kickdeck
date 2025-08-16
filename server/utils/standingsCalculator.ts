import { db } from '../../db';
import { games, teams, eventScoringRules, teamStandings, eventAgeGroups } from '../../db/schema';
import { eq, and, sql } from 'drizzle-orm';

interface TeamStats {
  teamId: number;
  teamName: string;
  gamesPlayed: number;
  wins: number;
  losses: number;
  ties: number;
  goalsScored: number;
  goalsAllowed: number;
  goalDifferential: number;
  shutouts: number;
  yellowCards: number;
  redCards: number;
  fairPlayPoints: number;
  totalPoints: number;
  winPoints: number;
  tiePoints: number;
  goalPoints: number;
  shutoutPoints: number;
  cardPenaltyPoints: number;
  position?: number;
}

interface ScoringRules {
  systemType: string;
  win: number;
  loss: number;
  tie: number;
  shutout: number;
  goalScored: number;
  goalCap: number;
  redCard: number;
  yellowCard: number;
  tiebreaker1: string;
  tiebreaker2: string;
  tiebreaker3: string;
  tiebreaker4: string;
  tiebreaker5: string;
  tiebreaker6: string;
  tiebreaker7: string;
  tiebreaker8: string;
}

interface GameData {
  id: number;
  homeTeamId: number | null;
  awayTeamId: number | null;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  homeYellowCards?: number;
  awayYellowCards?: number;
  homeRedCards?: number;
  awayRedCards?: number;
}

export class StandingsCalculator {
  private eventId: string;
  private ageGroupId: number;
  private scoringRules?: ScoringRules;

  constructor(eventId: string, ageGroupId: number) {
    this.eventId = eventId;
    this.ageGroupId = ageGroupId;
  }

  /**
   * Get scoring rules for the event
   */
  async getScoringRules(): Promise<ScoringRules> {
    if (this.scoringRules) return this.scoringRules;

    const rules = await db
      .select()
      .from(eventScoringRules)
      .where(and(
        eq(eventScoringRules.eventId, this.eventId),
        eq(eventScoringRules.isActive, true)
      ))
      .limit(1);

    if (rules.length === 0) {
      // Return default 3-point system if no rules configured
      this.scoringRules = {
        systemType: 'three_point',
        win: 3,
        loss: 0,
        tie: 1,
        shutout: 0,
        goalScored: 0,
        goalCap: 3,
        redCard: 0,
        yellowCard: 0,
        tiebreaker1: 'total_points',
        tiebreaker2: 'head_to_head',
        tiebreaker3: 'goal_differential',
        tiebreaker4: 'goals_scored',
        tiebreaker5: 'goals_allowed',
        tiebreaker6: 'shutouts',
        tiebreaker7: 'fair_play',
        tiebreaker8: 'coin_toss'
      };
    } else {
      this.scoringRules = rules[0] as ScoringRules;
    }

    return this.scoringRules;
  }

  /**
   * Calculate team statistics from games
   */
  async calculateTeamStats(gamesData: GameData[]): Promise<TeamStats[]> {
    const rules = await this.getScoringRules();
    const teamStats = new Map<number, TeamStats>();

    // Initialize team stats
    const teamIds = new Set<number>();
    gamesData.forEach(game => {
      if (game.homeTeamId) teamIds.add(game.homeTeamId);
      if (game.awayTeamId) teamIds.add(game.awayTeamId);
    });

    teamIds.forEach(teamId => {
      const game = gamesData.find(g => g.homeTeamId === teamId || g.awayTeamId === teamId);
      const teamName = game?.homeTeamId === teamId ? game.homeTeamName : game?.awayTeamName || `Team ${teamId}`;
      
      teamStats.set(teamId, {
        teamId,
        teamName,
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        ties: 0,
        goalsScored: 0,
        goalsAllowed: 0,
        goalDifferential: 0,
        shutouts: 0,
        yellowCards: 0,
        redCards: 0,
        fairPlayPoints: 0,
        totalPoints: 0,
        winPoints: 0,
        tiePoints: 0,
        goalPoints: 0,
        shutoutPoints: 0,
        cardPenaltyPoints: 0
      });
    });

    // Process completed games
    gamesData.forEach(game => {
      if (game.status === 'completed' && game.homeScore !== null && game.awayScore !== null && game.homeTeamId && game.awayTeamId) {
        const homeStats = teamStats.get(game.homeTeamId)!;
        const awayStats = teamStats.get(game.awayTeamId)!;

        // Update games played
        homeStats.gamesPlayed++;
        awayStats.gamesPlayed++;

        // Update goals
        homeStats.goalsScored += game.homeScore;
        homeStats.goalsAllowed += game.awayScore;
        awayStats.goalsScored += game.awayScore;
        awayStats.goalsAllowed += game.homeScore;

        // Update cards
        homeStats.yellowCards += game.homeYellowCards || 0;
        homeStats.redCards += game.homeRedCards || 0;
        awayStats.yellowCards += game.awayYellowCards || 0;
        awayStats.redCards += game.awayRedCards || 0;

        // Check for shutouts
        if (game.awayScore === 0) homeStats.shutouts++;
        if (game.homeScore === 0) awayStats.shutouts++;

        // Update wins/losses/ties and calculate points
        if (game.homeScore > game.awayScore) {
          homeStats.wins++;
          homeStats.winPoints += rules.win;
          awayStats.losses++;
        } else if (game.awayScore > game.homeScore) {
          awayStats.wins++;
          awayStats.winPoints += rules.win;
          homeStats.losses++;
        } else {
          homeStats.ties++;
          awayStats.ties++;
          homeStats.tiePoints += rules.tie;
          awayStats.tiePoints += rules.tie;
        }

        // Calculate additional points based on scoring system
        if (rules.systemType === 'ten_point' || rules.goalScored > 0) {
          const homeGoals = Math.min(game.homeScore, rules.goalCap);
          const awayGoals = Math.min(game.awayScore, rules.goalCap);
          homeStats.goalPoints += homeGoals * rules.goalScored;
          awayStats.goalPoints += awayGoals * rules.goalScored;
        }

        // Shutout bonus
        if (game.awayScore === 0) homeStats.shutoutPoints += rules.shutout;
        if (game.homeScore === 0) awayStats.shutoutPoints += rules.shutout;

        // Card penalties
        homeStats.cardPenaltyPoints += (homeStats.yellowCards * rules.yellowCard) + (homeStats.redCards * rules.redCard);
        awayStats.cardPenaltyPoints += (awayStats.yellowCards * rules.yellowCard) + (awayStats.redCards * rules.redCard);
      }
    });

    // Calculate final values for each team
    teamStats.forEach(stats => {
      stats.goalDifferential = stats.goalsScored - stats.goalsAllowed;
      stats.fairPlayPoints = (stats.yellowCards * Math.abs(rules.yellowCard)) + (stats.redCards * Math.abs(rules.redCard));
      stats.totalPoints = stats.winPoints + stats.tiePoints + stats.goalPoints + stats.shutoutPoints + stats.cardPenaltyPoints;
    });

    return Array.from(teamStats.values());
  }

  /**
   * Apply tiebreaker rules to sort teams
   */
  async sortByTiebreakers(teamStats: TeamStats[], gamesData: GameData[]): Promise<TeamStats[]> {
    const rules = await this.getScoringRules();
    const tiebreakers = [
      rules.tiebreaker1,
      rules.tiebreaker2, 
      rules.tiebreaker3,
      rules.tiebreaker4,
      rules.tiebreaker5,
      rules.tiebreaker6,
      rules.tiebreaker7,
      rules.tiebreaker8
    ];

    return teamStats.sort((a, b) => {
      for (const tiebreaker of tiebreakers) {
        const comparison = this.compareTiebreaker(a, b, tiebreaker, gamesData);
        if (comparison !== 0) return comparison;
      }
      return 0; // Complete tie
    });
  }

  /**
   * Compare two teams using a specific tiebreaker rule
   */
  private compareTiebreaker(teamA: TeamStats, teamB: TeamStats, rule: string, gamesData: GameData[]): number {
    switch (rule) {
      case 'total_points':
        return teamB.totalPoints - teamA.totalPoints;
      
      case 'head_to_head':
        return this.calculateHeadToHead(teamA, teamB, gamesData);
      
      case 'goal_differential':
        return teamB.goalDifferential - teamA.goalDifferential;
      
      case 'goals_scored':
        return teamB.goalsScored - teamA.goalsScored;
      
      case 'goals_allowed':
        return teamA.goalsAllowed - teamB.goalsAllowed; // Lower is better
      
      case 'shutouts':
        return teamB.shutouts - teamA.shutouts;
      
      case 'fair_play':
        return teamA.fairPlayPoints - teamB.fairPlayPoints; // Lower is better
      
      case 'coin_toss':
        return Math.random() - 0.5; // Random tiebreaker
      
      default:
        return 0;
    }
  }

  /**
   * Calculate head-to-head comparison between two teams
   */
  private calculateHeadToHead(teamA: TeamStats, teamB: TeamStats, gamesData: GameData[]): number {
    const headToHeadGames = gamesData.filter(game => 
      (game.homeTeamId === teamA.teamId && game.awayTeamId === teamB.teamId) ||
      (game.homeTeamId === teamB.teamId && game.awayTeamId === teamA.teamId)
    );

    if (headToHeadGames.length === 0) return 0;

    let teamAPoints = 0;
    let teamBPoints = 0;

    headToHeadGames.forEach(game => {
      if (game.status === 'completed' && game.homeScore !== null && game.awayScore !== null) {
        if (game.homeTeamId === teamA.teamId) {
          if (game.homeScore > game.awayScore) teamAPoints += 3;
          else if (game.homeScore === game.awayScore) teamAPoints += 1;
        } else {
          if (game.awayScore > game.homeScore) teamAPoints += 3;
          else if (game.homeScore === game.awayScore) teamAPoints += 1;
        }

        if (game.homeTeamId === teamB.teamId) {
          if (game.homeScore > game.awayScore) teamBPoints += 3;
          else if (game.homeScore === game.awayScore) teamBPoints += 1;
        } else {
          if (game.awayScore > game.homeScore) teamBPoints += 3;
          else if (game.homeScore === game.awayScore) teamBPoints += 1;
        }
      }
    });

    return teamBPoints - teamAPoints;
  }

  /**
   * Calculate and return complete standings for an age group
   */
  async calculateStandings(gamesData: GameData[]): Promise<TeamStats[]> {
    const teamStats = await this.calculateTeamStats(gamesData);
    const sortedStats = await this.sortByTiebreakers(teamStats, gamesData);
    
    // Assign positions
    sortedStats.forEach((team, index) => {
      team.position = index + 1;
    });

    return sortedStats;
  }

  /**
   * Save calculated standings to the database
   */
  async saveStandings(standings: TeamStats[]): Promise<void> {
    // Delete existing standings for this age group
    await db.delete(teamStandings)
      .where(and(
        eq(teamStandings.eventId, this.eventId),
        eq(teamStandings.ageGroupId, this.ageGroupId)
      ));

    // Insert new standings
    for (const team of standings) {
      await db.insert(teamStandings).values({
        eventId: this.eventId,
        ageGroupId: this.ageGroupId,
        teamId: team.teamId,
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
        cardPenaltyPoints: team.cardPenaltyPoints,
        position: team.position
      });
    }
  }
}

/**
 * Utility function to recalculate standings for all age groups in an event
 */
export async function recalculateEventStandings(eventId: string): Promise<void> {
  console.log(`[Standings Calculator] Recalculating standings for event ${eventId}`);
  
  // Get all age groups for this event
  const ageGroups = await db
    .select({ id: eventAgeGroups.id })
    .from(eventAgeGroups)
    .where(eq(eventAgeGroups.eventId, eventId));

  for (const ageGroup of ageGroups) {
    try {
      // Get games for this age group
      const gamesData = await db
        .select({
          id: games.id,
          homeTeamId: games.homeTeamId,
          awayTeamId: games.awayTeamId,
          homeTeamName: sql<string>`home_team.name`,
          awayTeamName: sql<string>`away_team.name`,
          homeScore: games.homeScore,
          awayScore: games.awayScore,
          status: games.status,
          homeYellowCards: games.homeYellowCards,
          awayYellowCards: games.awayYellowCards,
          homeRedCards: games.homeRedCards,
          awayRedCards: games.awayRedCards
        })
        .from(games)
        .leftJoin(teams, eq(games.homeTeamId, teams.id))
        .leftJoin(teams, eq(games.awayTeamId, teams.id))
        .where(and(
          eq(games.eventId, eventId),
          eq(games.ageGroupId, ageGroup.id)
        ));

      const calculator = new StandingsCalculator(eventId, ageGroup.id);
      const standings = await calculator.calculateStandings(gamesData);
      await calculator.saveStandings(standings);
      
      console.log(`[Standings Calculator] Updated standings for age group ${ageGroup.id}: ${standings.length} teams`);
    } catch (error) {
      console.error(`[Standings Calculator] Error calculating standings for age group ${ageGroup.id}:`, error);
    }
  }
  
  console.log(`[Standings Calculator] Completed standings recalculation for event ${eventId}`);
}