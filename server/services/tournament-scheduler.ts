/**
 * Traditional Tournament Scheduling Service
 * 
 * Implements standard soccer tournament scheduling algorithms without AI dependency.
 * 
 * CRITICAL TOURNAMENT FORMAT RULES:
 * - Group of 4: Single 4-team round-robin bracket (6 games + 1 championship)
 * - Group of 6: CROSSPLAY ONLY - Pool A (3) vs Pool B (3) = 9 games + 1 championship  
 * - Group of 8: Dual bracket - Two separate 4-team round-robins + 1 championship (Winner A vs Winner B)
 * 
 * NO EXCEPTIONS: Group of 6 is the ONLY format that uses crossplay.
 * Group of 8 has NO cross-bracket play except the final championship game.
 */

import { db } from "../../db";
import { eq, and, inArray } from "drizzle-orm";
import { 
  teams, 
  events, 
  eventAgeGroups, 
  eventBrackets, 
  games, 
  fields, 
  gameTimeSlots,
  complexes,
  eventComplexes
} from "../../db/schema";

export interface Team {
  id: number;
  name: string;
  bracketId: string;
  groupId?: number;
  seedRanking?: number;
  poolAssignment?: string;
}

export interface Field {
  id: number;
  name: string;
  complexId: number;
  complexName?: string;
  duration: number; // minutes per game
}

export interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  date: string;
}

export interface Game {
  id: string;
  homeTeamId: number;
  homeTeamName: string;
  awayTeamId: number;
  awayTeamName: string;
  bracketId: string;
  bracketName: string;
  poolId?: string;
  poolName?: string;
  round: string;
  gameType: 'pool_play' | 'knockout' | 'final' | 'third_place';
  gameNumber: number;
  duration: number;
  fieldId?: number;
  fieldName?: string;
  timeSlotId?: string;
  startTime?: string;
  endTime?: string;
  date?: string;
}

export interface Schedule {
  games: Game[];
  summary: {
    totalGames: number;
    poolPlayGames: number;
    knockoutGames: number;
    gamesPerBracket: Record<string, number>;
    estimatedDuration: string;
  };
}

export class TournamentScheduler {
  
  /**
   * Generate complete tournament schedule based on bracket format
   */
  static async generateSchedule(
    eventId: string,
    workflowData: any,
    options: {
      optimizeFieldUsage?: boolean;
      minRestPeriod?: number; // minutes between games for same team
      allowBackToBack?: boolean;
    } = {}
  ): Promise<Schedule> {
    
    console.log('🏆 Starting deterministic tournament scheduling...');
    
    // Extract data from workflow
    const { workflowGames, workflowTimeBlocks } = workflowData;
    
    if (!workflowGames || workflowGames.length === 0) {
      throw new Error('No game data found in workflow');
    }
    
    const allGames: Game[] = [];
    let gameCounter = 1;
    
    // Process each bracket from workflow games
    for (const bracketData of workflowGames) {
      console.log(`📋 Processing bracket: ${bracketData.bracketName} (${bracketData.format})`);
      
      // Convert workflow games to our Game format
      for (const workflowGame of bracketData.games) {
        const game: Game = {
          id: workflowGame.id,
          gameNumber: gameCounter++,
          bracketId: bracketData.bracketId,
          bracketName: bracketData.bracketName,
          homeTeamId: workflowGame.homeTeamId,
          homeTeamName: workflowGame.homeTeamName,
          awayTeamId: workflowGame.awayTeamId,
          awayTeamName: workflowGame.awayTeamName,
          round: workflowGame.round,
          gameType: workflowGame.gameType,
          duration: workflowGame.duration || 90,
          poolId: workflowGame.poolId,
          poolName: workflowGame.poolName,
          fieldId: undefined,
          startTime: undefined,
          endTime: undefined,
          date: undefined
        };
        allGames.push(game);
      }
    }
    
    // Get available fields and time slots
    const fieldsData = await this.getAvailableFields(eventId);
    const timeSlots = await this.getAvailableTimeSlots(eventId);
    
    // DIRECT FIELD ASSIGNMENT FALLBACK: If no time slots exist, assign fields directly
    let scheduledGames: Game[];
    if (timeSlots.length === 0) {
      console.log('⚠️ No time slots configured - using direct field assignment fallback');
      scheduledGames = await this.assignFieldsDirectly(allGames, fieldsData, options);
    } else {
      // Assign games to fields and time slots
      scheduledGames = await this.assignFieldsAndTimes(
        allGames,
        fieldsData,
        timeSlots,
        options
      );
    }
    
    // Generate schedule summary
    const summary = this.generateSummary(scheduledGames);
    
    console.log('✅ Tournament schedule generated successfully');
    console.log(`📊 Summary: ${summary.totalGames} total games, ${summary.poolPlayGames} pool play, ${summary.knockoutGames} knockout`);
    
    return {
      games: scheduledGames,
      summary
    };
  }
  
  /**
   * Generate games for a specific bracket based on its format
   */
  private static async generateBracketGames(
    bracket: any,
    startingGameNumber: number
  ): Promise<Game[]> {
    
    const games: Game[] = [];
    let gameCounter = startingGameNumber;
    
    const teams = bracket.teams || [];
    const pools = bracket.pools || [];
    
    if (teams.length === 0) {
      console.log(`⚠️  No teams found for bracket ${bracket.bracketName}`);
      return games;
    }
    
    console.log(`🎯 Generating games for ${teams.length} teams in ${bracket.format} format`);
    console.log(`🔍 BRACKET DEBUG: bracketId=${bracket.bracketId}, tournamentFormat=${bracket.tournamentFormat}, format=${bracket.format}, templateName=${bracket.templateName}`);
    
    // Use the bracket's configured tournament format - WITH TEMPLATE FALLBACK ONLY FOR VALID FORMATS
    const format = bracket.tournamentFormat || bracket.format || bracket.templateName;
    console.log(`🎯 FINAL FORMAT DECISION: '${format}' for ${teams.length} teams`);
    console.log(`🔍 FORMAT SOURCE: tournamentFormat=${bracket.tournamentFormat}, format=${bracket.format}, templateName=${bracket.templateName}`);
    
    if (!format) {
      console.error(`❌ NO FORMAT CONFIGURED: Bracket must have explicit format configured, got: tournamentFormat=${bracket.tournamentFormat}, format=${bracket.format}, templateName=${bracket.templateName}`);
      throw new Error(`No format configured for bracket ${bracket.bracketName}. Format must be explicitly set in Tournament Control Center.`);
    }
    
    switch (format) {
      case 'round_robin':
        games.push(...this.generateRoundRobinGames(bracket, teams, gameCounter));
        break;
        
      case 'crossplay':
      case 'full_crossplay':
      case 'crossover_bracket_6_teams':
      case 'group_of_6_crossplay':
        // CRITICAL FIX: ONLY 6-team brackets use crossplay
        console.log(`🚨 CROSSPLAY DETECTED: Generating crossplay games for format '${format}'`);
        if (teams.length === 6) {
          games.push(...this.generateCrossplayGames(bracket, teams, gameCounter, 6));
        } else {
          console.error(`❌ CROSSPLAY ERROR: ONLY 6-team brackets use crossplay format, got ${teams.length} teams`);
          throw new Error(`Crossplay format is ONLY for 6-team brackets, got ${teams.length} teams`);
        }
        break;
        
      case 'single_bracket_4_teams':
      case 'dual_bracket_8_teams':
      case 'group_of_4':
      case 'group_of_6':
      case 'group_of_8':
        // Use smart bracket generation based on team count and template
        const smartBracketGames = this.generateSmartBracketGames(bracket, teams, gameCounter);
        games.push(...smartBracketGames);
        break;
        
      case '4-Team Single Bracket':
      case 'round_robin_final':
        // Legacy format - Generate pool play games (6 games) + championship final (1 game) = 7 total
        const poolPlayGames = this.generateRoundRobinGames(bracket, teams, gameCounter);
        games.push(...poolPlayGames);
        gameCounter += poolPlayGames.length;
        
        // Add championship final with placeholders
        const championshipGame = this.generateChampionshipGame(bracket, gameCounter);
        games.push(championshipGame);
        break;
        
      case 'pool_play':
        games.push(...this.generatePoolPlayGames(bracket, teams, pools, gameCounter));
        break;
        
      case 'round_robin_knockout':
        // Generate pool play first
        const poolGames = this.generatePoolPlayGames(bracket, teams, pools, gameCounter);
        games.push(...poolGames);
        gameCounter += poolGames.length;
        
        // Generate knockout rounds
        const knockoutGames = this.generateKnockoutGames(bracket, teams, gameCounter);
        games.push(...knockoutGames);
        break;
        
      case 'single_elimination':
        games.push(...this.generateSingleEliminationGames(bracket, teams, gameCounter));
        break;
        
      case 'double_elimination':
        games.push(...this.generateDoubleEliminationGames(bracket, teams, gameCounter));
        break;
        
      default:
        // Handle team-count specific formats - NO GROUP OF 8 FALLBACKS
        if (teams.length === 6) {
          console.log(`🚨 CRITICAL: Unknown format '${bracket.format}' for 6-team bracket - ENFORCING crossplay (ONLY format for 6 teams)`);
          games.push(...this.generate6TeamCrossover(bracket, teams, gameCounter));
        } else if (teams.length === 4) {
          console.log(`🚨 CRITICAL: Unknown format '${bracket.format}' for 4-team bracket - ENFORCING single bracket round-robin`);
          games.push(...this.generateRoundRobinGames(bracket, teams, gameCounter));
        } else {
          console.error(`❌ UNSUPPORTED FORMAT: No fallback for format '${bracket.format}' with ${teams.length} teams. Format must be explicitly configured.`);
          throw new Error(`Unsupported format '${bracket.format}' for ${teams.length} teams. No fallback available.`);
        }
    }
    
    return games;
  }
  
  /**
   * Generate smart bracket games based on team count and configured format
   */
  private static generateSmartBracketGames(
    bracket: any,
    teams: Team[],
    startingGameNumber: number
  ): Game[] {
    const teamCount = teams.length;
    const templateName = bracket.templateName || bracket.format;
    
    console.log(`🎯 Smart bracket generation: ${teamCount} teams, template: ${templateName}`);
    
    // Match template names to specific tournament scenarios (replacing snake_case with proper names)
    switch (templateName) {
      case 'group_of_4':
      case 'single_bracket_4_teams':
      case '4 Team Single Bracket':
        console.log(`📋 Using 4 Team Single Bracket template for ${teamCount} teams - generating 6 pool + 1 championship = 7 games`);
        // Generate 6 pool games (round robin) + 1 championship final
        const games = [];
        let gameCounter = startingGameNumber;
        
        // Generate pool play games (6 games)
        const poolPlayGames = this.generateRoundRobinGames(bracket, teams, gameCounter);
        games.push(...poolPlayGames);
        gameCounter += poolPlayGames.length;
        
        // Add championship final with proper winner descriptions
        const championshipGame = this.generateChampionshipGame(bracket, gameCounter);
        games.push(championshipGame);
        
        console.log(`🏆 4 Team Single Bracket: Generated ${poolPlayGames.length} pool + 1 championship = ${games.length} total games`);
        return games;
      
      case 'group_of_6':
      case 'crossover_bracket_6_teams':
      case '6 Team Crossover':
        console.log(`📋 Using 6 Team Crossover template for ${teamCount} teams`);
        return this.generate6TeamCrossover(bracket, teams, startingGameNumber);
      
      case 'group_of_8':
      case 'group_of_9':
      case 'dual_bracket_8_teams':
      case '8 Team Dual Bracket':
        console.log(`📋 Using 8 Team Dual Bracket template for ${teamCount} teams`);
        return this.generate8TeamDualBracket(bracket, teams, startingGameNumber);
      
      default:
        // NO FALLBACKS - Format must be explicitly configured
        console.error(`❌ UNSUPPORTED TEMPLATE: No handler for template '${templateName}' with ${teamCount} teams. Template must be explicitly configured.`);
        throw new Error(`Unsupported template '${templateName}' for ${teamCount} teams. No fallback available.`);
    }
  }

  /**
   * 4 teams: 6 pool games + 1 final (your first scenario)
   */
  private static generate4TeamBracket(
    bracket: any,
    teams: Team[],
    startingGameNumber: number
  ): Game[] {
    const games: Game[] = [];
    let gameCounter = startingGameNumber;
    
    // Your specified matchups: A1-A2, A3-A4, A1-A3, A2-A4, A1-A4, A2-A3
    const matchups = [
      [0, 1], // A1 vs A2
      [2, 3], // A3 vs A4
      [0, 2], // A1 vs A3
      [1, 3], // A2 vs A4
      [0, 3], // A1 vs A4  
      [1, 2]  // A2 vs A3
    ];
    
    matchups.forEach(([homeIdx, awayIdx]) => {
      games.push({
        id: `${bracket.bracketId}_pool_${gameCounter}`,
        homeTeamId: teams[homeIdx].id,
        homeTeamName: teams[homeIdx].name,
        awayTeamId: teams[awayIdx].id,
        awayTeamName: teams[awayIdx].name,
        bracketId: bracket.bracketId,
        bracketName: bracket.bracketName,
        round: 'Pool Play',
        gameType: 'pool_play',
        gameNumber: gameCounter++,
        duration: 90
      });
    });
    
    // Add final: 1st vs 2nd with proper winner descriptions
    games.push(this.generateChampionshipGame(bracket, gameCounter));
    
    console.log(`🏆 4 Team Single Bracket: 6 pool + 1 final for ${bracket.bracketName}`);
    return games;
  }

  /**
   * CRITICAL CROSSPLAY IMPLEMENTATION: Groups must be Pool A vs Pool B only
   * Supports both 4-team (2v2 pools) and 6-team (3v3 pools) crossplay formats
   */
  private static generateCrossplayGames(
    bracket: any,
    teams: Team[],
    startingGameNumber: number,
    teamCount: number
  ): Game[] {
    const games: Game[] = [];
    let gameCounter = startingGameNumber;
    
    console.log(`🚨 CROSSPLAY ENFORCEMENT: Processing ${teamCount}-team bracket for proper Pool A vs Pool B matchups`);
    
    // ONLY GROUP OF 6 USES CROSSPLAY - Split teams by group_id for Pool A/B assignment
    if (teamCount === 6) {
      // Sort teams by group_id to ensure consistent Pool A/B assignment
      const sortedTeams = [...teams].sort((a, b) => (a.groupId || 0) - (b.groupId || 0));
      
      // Split teams: first 3 teams (by group_id) go to Pool A, remaining 3 to Pool B
      const poolA = sortedTeams.slice(0, 3);
      const poolB = sortedTeams.slice(3, 6);
      
      console.log(`📊 CROSSPLAY POOL ASSIGNMENT - Pool A teams (${poolA.length}):`, poolA.map(t => `${t.name} (groupId: ${t.groupId})`));
      console.log(`📊 CROSSPLAY POOL ASSIGNMENT - Pool B teams (${poolB.length}):`, poolB.map(t => `${t.name} (groupId: ${t.groupId})`));
      
      // 6-team crossplay: Pool A (3 teams) vs Pool B (3 teams) = 9 crossplay games
      if (poolA.length !== 3 || poolB.length !== 3) {
        console.error(`❌ 6-TEAM CROSSPLAY ERROR: Expected 3v3 pools, got ${poolA.length}v${poolB.length}`);
        throw new Error(`6-team crossplay requires 3 teams in each pool, got ${poolA.length}v${poolB.length}`);
      }
      
      // Generate all Pool A vs Pool B matchups ONLY (3x3 = 9 crossplay games)
      poolA.forEach((teamA, idxA) => {
        poolB.forEach((teamB, idxB) => {
          console.log(`🔄 Creating crossplay matchup: Pool A ${teamA.name} vs Pool B ${teamB.name}`);
          games.push({
            id: `${bracket.bracketId}_cross_${gameCounter}`,
            homeTeamId: teamA.id,
            homeTeamName: teamA.name,
            awayTeamId: teamB.id,
            awayTeamName: teamB.name,
            bracketId: bracket.bracketId,
            bracketName: bracket.bracketName,
            round: 'Pool Play',
            gameType: 'pool_play',
            gameNumber: gameCounter++,
            duration: 90
          });
        });
      });
      
      console.log(`✅ Generated 9 crossplay games (Pool A vs Pool B) for 6-team bracket`);
      
      // Add championship TBD final game (1st in Points vs 2nd in Points across both pools)
      const championshipGame = this.generateChampionshipGame(bracket, gameCounter);
      games.push(championshipGame);
      
      console.log(`🏆 6-Team Crossplay Complete: Generated ${games.length - 1} crossplay pool games + 1 TBD championship final (1st vs 2nd in Points) = ${games.length} total games`);
      return games;
    }
    
    // NO OTHER FORMATS USE CROSSPLAY
    console.error(`❌ CROSSPLAY ERROR: Only 6-team brackets use crossplay format, got ${teamCount} teams`);
    throw new Error(`Crossplay format is only for 6-team brackets, got ${teamCount} teams`);
  }

  /**
   * 6 teams crossover: 9 pool games + 1 final (legacy method - replaced by generateCrossplayGames)
   */
  private static generate6TeamCrossover(
    bracket: any,
    teams: Team[],
    startingGameNumber: number
  ): Game[] {
    // Redirect to new crossplay method
    return this.generateCrossplayGames(bracket, teams, startingGameNumber, 6);
  }

  /**
   * 8 teams dual bracket: 12 pool games + 1 final (your third scenario)
   */
  /**
   * CORRECTED Group of 8 Format: Two separate 4-team round-robin brackets
   * NO CROSS-BRACKET PLAY except championship final (Winner A vs Winner B)
   */
  private static generate8TeamDualBracket(
    bracket: any,
    teams: Team[],
    startingGameNumber: number
  ): Game[] {
    const games: Game[] = [];
    let gameCounter = startingGameNumber;
    
    console.log(`🚨 GROUP OF 8 ENFORCEMENT: Two separate 4-team brackets with NO cross-bracket play`);
    console.log(`🎯 FORMAT VERIFICATION: Processing 'group_of_8' format for ${teams.length} teams`);
    console.log(`🎯 BRACKET INFO: bracketId=${bracket.bracketId}, format=${bracket.format}, templateName=${bracket.templateName}`);
    
    if (teams.length !== 8) {
      console.error(`❌ TEAM COUNT ERROR: Group of 8 requires exactly 8 teams, got ${teams.length}`);
      throw new Error(`Group of 8 format requires exactly 8 teams, got ${teams.length}`);
    }
    
    // Split teams into Bracket A and Bracket B based on groupId assignments
    // Sort teams by groupId to ensure consistent bracket assignment
    const sortedTeams = [...teams].sort((a, b) => (a.groupId || 0) - (b.groupId || 0));
    
    // Teams with the lowest groupId go to Bracket A, teams with the highest groupId go to Bracket B
    const uniqueGroupIds = Array.from(new Set(sortedTeams.map(t => t.groupId))).filter(id => id).sort();
    
    let bracketA: Team[], bracketB: Team[];
    
    if (uniqueGroupIds.length >= 2) {
      // Use admin-controlled groupId-based assignment ONLY
      const firstGroupId = uniqueGroupIds[0];
      const secondGroupId = uniqueGroupIds[1];
      bracketA = sortedTeams.filter(t => t.groupId === firstGroupId);
      bracketB = sortedTeams.filter(t => t.groupId === secondGroupId);
      
      console.log(`📊 Group of 8 using admin groupId assignment: Group ${firstGroupId} → Bracket A, Group ${secondGroupId} → Bracket B`);
    } else {
      // NO FALLBACK: Require admin assignment for fairplay control
      console.error(`❌ GROUP OF 8 ERROR: Admin must assign all teams to brackets first. Found teams without groupId assignments.`);
      throw new Error(`Group of 8 format requires admin to assign all 8 teams to brackets first. Teams must be manually placed in Bracket A or B for fairplay control.`);
    }
    
    // Validate bracket sizes for Group of 8 format
    if (bracketA.length !== 4 || bracketB.length !== 4) {
      console.error(`❌ GROUP OF 8 ERROR: Expected 4v4 brackets, got ${bracketA.length}v${bracketB.length}`);
      throw new Error(`Group of 8 format requires 4 teams in each bracket, got ${bracketA.length}v${bracketB.length}`);
    }
    
    console.log(`📊 Bracket A teams (${bracketA.length}):`, bracketA.map(t => t.name));
    console.log(`📊 Bracket B teams (${bracketB.length}):`, bracketB.map(t => t.name));
    
    // CRITICAL: Generate EXACT matchup pattern as specified by user
    // A1 A2, B1 B2, A3 A4, B3 B4, A1 A3, B1 B3, A2 A4, B2 B4, A1 A4, B1 B4
    console.log(`🔄 Generating USER-SPECIFIED matchup pattern for Group of 8`);
    
    // Label teams A1, A2, A3, A4 and B1, B2, B3, B4 for clarity
    const A1 = bracketA[0], A2 = bracketA[1], A3 = bracketA[2], A4 = bracketA[3];
    const B1 = bracketB[0], B2 = bracketB[1], B3 = bracketB[2], B4 = bracketB[3];
    
    // EXACT USER MATCHUP PATTERN:
    const matchups: Array<{ home: Team, away: Team, round: string }> = [
      // Round 1
      { home: A1, away: A2, round: 'Bracket A Pool Play' },
      { home: B1, away: B2, round: 'Bracket B Pool Play' },
      // Round 2  
      { home: A3, away: A4, round: 'Bracket A Pool Play' },
      { home: B3, away: B4, round: 'Bracket B Pool Play' },
      // Round 3
      { home: A1, away: A3, round: 'Bracket A Pool Play' },
      { home: B1, away: B3, round: 'Bracket B Pool Play' },
      // Round 4
      { home: A2, away: A4, round: 'Bracket A Pool Play' },
      { home: B2, away: B4, round: 'Bracket B Pool Play' },
      // Round 5
      { home: A1, away: A4, round: 'Bracket A Pool Play' },
      { home: B1, away: B4, round: 'Bracket B Pool Play' }
    ];
    
    // Generate games based on exact user pattern
    for (const matchup of matchups) {
      const { home, away, round } = matchup;
      const isPoolA = bracketA.includes(home);
      games.push({
        id: `${bracket.bracketId}_${isPoolA ? 'A' : 'B'}_${gameCounter}`,
        homeTeamId: home.id,
        homeTeamName: home.name,
        awayTeamId: away.id,
        awayTeamName: away.name,
        bracketId: bracket.bracketId,
        bracketName: `${bracket.bracketName} - ${isPoolA ? 'Bracket A' : 'Bracket B'}`,
        poolId: isPoolA ? 'bracket_a' : 'bracket_b',
        poolName: isPoolA ? 'Bracket A' : 'Bracket B',
        round: round,
        gameType: 'pool_play',
        gameNumber: gameCounter++,
        duration: 90
      });
    }
    
    // Add ONLY championship final: 1st in Points A vs 1st in Points B
    const championshipGame = {
      id: `${bracket.bracketId}_final_${gameCounter}`,
      homeTeamId: 0, // Placeholder - will be determined from standings
      homeTeamName: '1st in Points A',
      awayTeamId: 0, // Placeholder - will be determined from standings  
      awayTeamName: '1st in Points B',
      bracketId: bracket.bracketId,
      bracketName: bracket.bracketName,
      round: 'Championship Final',
      gameType: 'final' as const,
      gameNumber: gameCounter++,
      duration: 90
    };
    games.push(championshipGame);
    
    console.log(`✅ Generated Group of 8 EXACT USER PATTERN: 10 specific matchup games + 1 Championship Final = ${games.length} total games`);
    console.log(`🚫 USER PATTERN: A1-A2, B1-B2, A3-A4, B3-B4, A1-A3, B1-B3, A2-A4, B2-B4, A1-A4, B1-B4, Championship`);
    
    return games;
  }

  /**
   * Generate championship final game with placeholders
   */
  private static generateChampionshipGame(
    bracket: any,
    gameNumber: number
  ): Game {
    // Generate proper winner format descriptions based on bracket format
    const { homeTeamName, awayTeamName } = this.getWinnerFormats(bracket);
    
    return {
      id: `${bracket.bracketId}_final_${gameNumber}`,
      homeTeamId: 0, // Placeholder for winner
      homeTeamName: homeTeamName,
      awayTeamId: 0, // Placeholder for winner  
      awayTeamName: awayTeamName,
      bracketId: bracket.bracketId,
      bracketName: bracket.bracketName,
      round: 'Championship',
      gameType: 'final' as const,
      gameNumber: gameNumber,
      duration: 90
    };
  }

  /**
   * Generate proper winner format descriptions for championship games
   */
  private static getWinnerFormats(bracket: any): { homeTeamName: string, awayTeamName: string } {
    const format = bracket.tournamentFormat || bracket.format || bracket.templateName;
    
    // Clean up format name by removing snake_case
    const cleanFormat = format.replace(/_/g, ' ');
    
    switch (format) {
      case 'group_of_4':
      case 'single_bracket_4_teams':
        return {
          homeTeamName: '1st in Points',
          awayTeamName: '2nd in Points'
        };
        
      case 'group_of_6':
      case 'crossover_bracket_6_teams':
      case 'crossplay':
      case 'group_of_6_crossplay':
        return {
          homeTeamName: '1st in Points',
          awayTeamName: '2nd in Points'
        };
        
      case 'group_of_8':
      case 'group_of_9':
      case 'dual_bracket_8_teams':
        return {
          homeTeamName: '1st Place Bracket A',
          awayTeamName: '1st Place Bracket B'
        };
        
      case 'round_robin':
        return {
          homeTeamName: '1st in Points',
          awayTeamName: '2nd in Points'
        };
        
      case 'single_elimination':
      case 'double_elimination':
        return {
          homeTeamName: 'Winner Semifinal 1',
          awayTeamName: 'Winner Semifinal 2'
        };
        
      default:
        return {
          homeTeamName: '1st in Points',
          awayTeamName: '2nd in Points'
        };
    }
  }

  /**
   * Generate round-robin games (everyone plays everyone)
   */
  private static generateRoundRobinGames(
    bracket: any,
    teams: Team[],
    startingGameNumber: number
  ): Game[] {
    
    const games: Game[] = [];
    let gameCounter = startingGameNumber;
    
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        games.push({
          id: `${bracket.bracketId}_rr_${gameCounter}`,
          homeTeamId: teams[i].id,
          homeTeamName: teams[i].name,
          awayTeamId: teams[j].id,
          awayTeamName: teams[j].name,
          bracketId: bracket.bracketId,
          bracketName: bracket.bracketName,
          round: 'Pool Play',
          gameType: 'pool_play',
          gameNumber: gameCounter++,
          duration: 90 // Standard 90-minute game
        });
      }
    }
    
    console.log(`🔄 Generated ${games.length} round-robin games`);
    return games;
  }
  
  /**
   * Generate pool play games with multiple pools
   */
  private static generatePoolPlayGames(
    bracket: any,
    teams: Team[],
    pools: any[],
    startingGameNumber: number
  ): Game[] {
    
    const games: Game[] = [];
    let gameCounter = startingGameNumber;
    
    if (pools.length === 0) {
      // Single pool - treat as round robin
      return this.generateRoundRobinGames(bracket, teams, startingGameNumber);
    }
    
    // Generate games for each pool
    for (const pool of pools) {
      const poolTeams = teams.filter(team => team.poolAssignment === pool.name);
      
      if (poolTeams.length < 2) {
        console.log(`⚠️  Pool ${pool.name} has fewer than 2 teams, skipping`);
        continue;
      }
      
      // Round robin within each pool
      for (let i = 0; i < poolTeams.length; i++) {
        for (let j = i + 1; j < poolTeams.length; j++) {
          games.push({
            id: `${bracket.bracketId}_pool_${gameCounter}`,
            homeTeamId: poolTeams[i].id,
            homeTeamName: poolTeams[i].name,
            awayTeamId: poolTeams[j].id,
            awayTeamName: poolTeams[j].name,
            bracketId: bracket.bracketId,
            bracketName: bracket.bracketName,
            poolId: pool.id,
            poolName: pool.name,
            round: 'Pool Play',
            gameType: 'pool_play',
            gameNumber: gameCounter++,
            duration: 90
          });
        }
      }
      
      console.log(`🏊 Generated ${(poolTeams.length * (poolTeams.length - 1)) / 2} games for pool ${pool.name}`);
    }
    
    return games;
  }
  
  /**
   * Generate knockout games (finals, semi-finals, etc.)
   */
  private static generateKnockoutGames(
    bracket: any,
    teams: Team[],
    startingGameNumber: number
  ): Game[] {
    
    const games: Game[] = [];
    let gameCounter = startingGameNumber;
    
    // Simplified knockout - just generate a final game
    // In a real implementation, you'd determine pool winners first
    if (teams.length >= 2) {
      // Take top 2 teams (or pool winners) for final
      const finalist1 = teams[0];
      const finalist2 = teams[1];
      
      games.push({
        id: `${bracket.bracketId}_final`,
        homeTeamId: finalist1.id,
        homeTeamName: finalist1.name,
        awayTeamId: finalist2.id,
        awayTeamName: finalist2.name,
        bracketId: bracket.bracketId,
        bracketName: bracket.bracketName,
        round: 'Final',
        gameType: 'final' as const,
        gameNumber: gameCounter++,
        duration: 90
      });
      
      console.log(`🏆 Generated final game`);
    }
    
    return games;
  }
  
  /**
   * Generate single elimination tournament
   */
  private static generateSingleEliminationGames(
    bracket: any,
    teams: Team[],
    startingGameNumber: number
  ): Game[] {
    
    const games: Game[] = [];
    let gameCounter = startingGameNumber;
    
    // Simple power-of-2 bracket
    const numTeams = teams.length;
    const rounds = Math.ceil(Math.log2(numTeams));
    
    let currentRoundTeams = [...teams];
    
    for (let round = 1; round <= rounds; round++) {
      const roundName = this.getRoundName(round, rounds);
      const roundGames: Game[] = [];
      
      // Pair up teams for this round
      for (let i = 0; i < currentRoundTeams.length; i += 2) {
        if (i + 1 < currentRoundTeams.length) {
          roundGames.push({
            id: `${bracket.bracketId}_r${round}_${gameCounter}`,
            homeTeamId: currentRoundTeams[i].id,
            homeTeamName: currentRoundTeams[i].name,
            awayTeamId: currentRoundTeams[i + 1].id,
            awayTeamName: currentRoundTeams[i + 1].name,
            bracketId: bracket.bracketId,
            bracketName: bracket.bracketName,
            round: roundName,
            gameType: round === rounds ? 'final' : 'knockout',
            gameNumber: gameCounter++,
            duration: 90
          });
        }
      }
      
      games.push(...roundGames);
      
      // Winners advance (for scheduling purposes, assume first team wins)
      currentRoundTeams = roundGames.map(game => ({
        id: game.homeTeamId,
        name: `Winner of ${game.homeTeamName} vs ${game.awayTeamName}`,
        bracketId: bracket.bracketId
      }));
      
      console.log(`⚔️  Generated ${roundGames.length} games for ${roundName}`);
    }
    
    return games;
  }
  
  /**
   * Generate double elimination tournament (placeholder)
   */
  private static generateDoubleEliminationGames(
    bracket: any,
    teams: Team[],
    startingGameNumber: number
  ): Game[] {
    
    // For now, just generate single elimination
    // Double elimination is more complex and requires winner/loser brackets
    console.log('📝 Double elimination not fully implemented, using single elimination');
    return this.generateSingleEliminationGames(bracket, teams, startingGameNumber);
  }
  
  /**
   * Get human-readable round names
   */
  private static getRoundName(round: number, totalRounds: number): string {
    const roundsFromEnd = totalRounds - round;
    
    switch (roundsFromEnd) {
      case 0: return 'Final';
      case 1: return 'Semi-Final';
      case 2: return 'Quarter-Final';
      case 3: return 'Round of 16';
      case 4: return 'Round of 32';
      default: return `Round ${round}`;
    }
  }
  
  /**
   * Get available fields for the event using field availability service
   */
  private static async getAvailableFields(eventId: string): Promise<Field[]> {
    const { FieldAvailabilityService } = await import('./field-availability-service');
    const fieldsInfo = await FieldAvailabilityService.getAvailableFields(eventId);
    
    return fieldsInfo.map(field => ({
      id: field.id,
      name: field.name,
      complexId: field.complexId,
      complexName: field.complexName,
      duration: 90 // Standard game duration
    }));
  }
  
  /**
   * Get available time slots for the event
   */
  private static async getAvailableTimeSlots(eventId: string): Promise<TimeSlot[]> {
    const timeSlotsData = await db
      .select()
      .from(gameTimeSlots)
      .where(eq(gameTimeSlots.eventId, eventId));
    
    return timeSlotsData.map(slot => {
      // Calculate date based on dayIndex (assuming day 0 is tournament start date)
      const tournamentStart = new Date();
      tournamentStart.setDate(tournamentStart.getDate() + slot.dayIndex);
      
      return {
        id: slot.id.toString(),
        startTime: slot.startTime,
        endTime: slot.endTime,
        date: tournamentStart.toISOString().split('T')[0]
      };
    });
  }
  
  /**
   * Assign fields and time slots to games
   */
  private static async assignFieldsAndTimes(
    games: Game[],
    fields: Field[],
    timeSlots: TimeSlot[],
    options: any = {}
  ): Promise<Game[]> {
    
    console.log(`🎯 Assigning fields and times to ${games.length} games using field availability service`);
    
    if (fields.length === 0) {
      console.log('⚠️  No fields available, returning games without field assignments');
      return games;
    }
    
    const { FieldAvailabilityService } = await import('./field-availability-service');
    const { EnhancedConflictDetection } = await import('./enhanced-conflict-detection');
    const scheduledGames: Game[] = [];
    const teamSchedule = new Map<number, Game[]>(); // teamId -> games
    
    // Get event ID from first game (assuming all games are from same event)
    const eventId = games[0]?.bracketId?.split('_')[0] || '1656618593'; // fallback to test event
    
    // Sort games by priority: pool play FIRST, then TBD/knockout games LAST
    const sortedGames = [...games].sort((a, b) => {
      // Priority 1: Pool play games (should be scheduled first)
      if (a.gameType === 'pool_play' && b.gameType !== 'pool_play') return -1;
      if (a.gameType !== 'pool_play' && b.gameType === 'pool_play') return 1;
      
      // Priority 2: Known vs TBD teams (games with real teams before TBD games)
      const aHasTBD = a.homeTeamName?.includes('TBD') || a.awayTeamName?.includes('TBD');
      const bHasTBD = b.homeTeamName?.includes('TBD') || b.awayTeamName?.includes('TBD');
      
      if (!aHasTBD && bHasTBD) return -1; // Real teams before TBD
      if (aHasTBD && !bHasTBD) return 1;  // TBD games after real teams
      
      // Priority 3: Round-based ordering within same game type
      const roundPriority: Record<string, number> = {
        'Pool Play': 1,
        'Group Stage': 1,
        'Round 1': 1,
        'Quarterfinal': 2,
        'Quarterfinals': 2,
        'Semifinal': 3,
        'Semifinals': 3,
        'Final': 4,
        'Championship': 4
      };
      
      const aRoundPriority = roundPriority[a.round || ''] || 99;
      const bRoundPriority = roundPriority[b.round || ''] || 99;
      
      if (aRoundPriority !== bRoundPriority) {
        return aRoundPriority - bRoundPriority;
      }
      
      // Priority 4: Game number as final tiebreaker
      return a.gameNumber - b.gameNumber;
    });
    
    let currentDay = 0;
    const minRestMinutes = options.minRestPeriod || 60;
    
    for (const game of sortedGames) {
      let assigned = false;
      let dayAttempts = 0;
      
      while (!assigned && dayAttempts < 7) { // Try up to 7 days
        // Determine field size needed based on game/bracket info
        const fieldSize = this.determineFieldSize(game);
        
        try {
          // Find available time slots for this field size on current day
          const availableSlots = await FieldAvailabilityService.findAvailableTimeSlots(
            eventId,
            fieldSize,
            currentDay + dayAttempts,
            game.duration,
            15 // 15 minute buffer between games
          );
          
          // Check team rest periods for each available slot
          for (const slot of availableSlots) {
            const homeTeamGames = teamSchedule.get(game.homeTeamId) || [];
            const awayTeamGames = teamSchedule.get(game.awayTeamId) || [];
            
            const hasTeamConflict = [...homeTeamGames, ...awayTeamGames].some(teamGame => {
              if (!teamGame.endTime || teamGame.date !== this.formatDate(currentDay + dayAttempts)) return false;
              
              const teamGameEndMinutes = this.timeToMinutes(teamGame.endTime);
              const proposedStartMinutes = this.timeToMinutes(slot.startTime);
              
              return (proposedStartMinutes - teamGameEndMinutes) < minRestMinutes;
            });
            
            if (!hasTeamConflict) {
              // Enhanced conflict detection before reservation
              const conflicts = await EnhancedConflictDetection.detectTimeOverlaps(
                eventId,
                slot.startTime,
                slot.endTime,
                currentDay + dayAttempts,
                slot.fieldId
              );
              
              if (conflicts.filter(c => c.severity === 'critical').length === 0) {
                // Reserve the time slot
                try {
                  const timeSlotId = await FieldAvailabilityService.reserveTimeSlot(
                    eventId,
                    slot.fieldId,
                    slot.startTime,
                    slot.endTime,
                    currentDay + dayAttempts
                  );
                
                // Create scheduled game
                const scheduledGame: Game = {
                  ...game,
                  fieldId: slot.fieldId,
                  fieldName: slot.field?.name || `Field ${slot.fieldId}`,
                  startTime: slot.startTime,
                  endTime: slot.endTime,
                  date: this.formatDate(currentDay + dayAttempts),
                  timeSlotId: timeSlotId.toString()
                };
                
                scheduledGames.push(scheduledGame);
                
                // Update team schedules
                if (!teamSchedule.has(game.homeTeamId)) {
                  teamSchedule.set(game.homeTeamId, []);
                }
                if (!teamSchedule.has(game.awayTeamId)) {
                  teamSchedule.set(game.awayTeamId, []);
                }
                teamSchedule.get(game.homeTeamId)!.push(scheduledGame);
                teamSchedule.get(game.awayTeamId)!.push(scheduledGame);
                
                assigned = true;
                console.log(`✅ Assigned game ${game.gameNumber} to field ${slot.fieldId} on day ${currentDay + dayAttempts} from ${slot.startTime} to ${slot.endTime}`);
                break;
              } catch (error: any) {
                console.log(`⚠️ Failed to reserve time slot: ${error.message}`);
                continue;
              }
            } else {
              console.log(`⚠️ Critical conflicts detected for game ${game.gameNumber}, trying next slot`);
              continue;
            }
          }
          }
        } catch (error: any) {
          console.log(`⚠️ Error finding available slots: ${error.message}`);
        }
        
        dayAttempts++;
      }
      
      if (!assigned) {
        console.log(`❌ Could not assign field/time for game ${game.gameNumber}: ${game.homeTeamName} vs ${game.awayTeamName}`);
        // Add to scheduled games without field assignment
        scheduledGames.push({
          ...game,
          fieldId: undefined,
          fieldName: 'TBD',
          startTime: 'TBD',
          endTime: 'TBD',
          date: 'TBD'
        });
      }
    }
    
    console.log(`✅ Successfully assigned ${scheduledGames.filter(g => g.fieldId).length}/${games.length} games to fields with real availability checking`);
    
    return scheduledGames;
  }
  
  /**
   * Determine appropriate field size for a game
   */
  private static determineFieldSize(game: Game): string {
    // Extract age from bracket name or use default
    const bracketName = game.bracketName || '';
    
    // Comprehensive field size validation based on age groups
    if (bracketName.includes('U7') || bracketName.includes('U8') || bracketName.includes('U9') || bracketName.includes('U10')) {
      return '7v7'; // Maps to fields B1, B2
    } else if (bracketName.includes('U11') || bracketName.includes('U12') || (bracketName.includes('U13') && bracketName.includes('Boys'))) {
      return '9v9'; // Maps to fields A1, A2
    } else if (bracketName.includes('U13') && bracketName.includes('Girls')) {
      return '11v11'; // U13 Girls MUST use 11v11 fields (f1-f6)
    } else if (bracketName.match(/U1[4-9]/)) { // U14-U19
      return '11v11'; // Maps to fields f1-f6
    } else {
      console.log(`⚠️  Could not determine field size for bracket: ${bracketName}, defaulting to 11v11`);
      return '11v11';
    }
  }
  
  /**
   * Convert time string to minutes since midnight
   */
  private static timeToMinutes(timeString: string): number {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }
  
  /**
   * Format date for day offset
   */
  private static formatDate(dayOffset: number): string {
    const date = new Date();
    date.setDate(date.getDate() + dayOffset);
    return date.toISOString().split('T')[0];
  }

  /**
   * Direct field assignment fallback when no time slots are configured
   */
  private static async assignFieldsDirectly(
    games: Game[],
    fields: Field[],
    options: any = {}
  ): Promise<Game[]> {
    console.log(`🎯 Direct field assignment: ${games.length} games to ${fields.length} fields`);
    
    if (fields.length === 0) {
      console.log('⚠️ No fields available, returning games without field assignments');
      return games;
    }
    
    const scheduledGames: Game[] = [];
    let currentDay = 0;
    let currentTime = '08:00';
    let fieldIndex = 0;
    
    // Simple round-robin field assignment with basic time scheduling
    for (const game of games) {
      const fieldSize = this.determineFieldSize(game);
      
      // Find fields that match the required size
      const matchingFields = fields.filter(f => 
        f.name.includes('11v11') || f.name.includes('Galway Downs')
      );
      
      if (matchingFields.length === 0) {
        console.log(`⚠️ No matching fields for size ${fieldSize}, using first available field`);
        // Use first available field as fallback
        const field = fields[0];
        scheduledGames.push({
          ...game,
          fieldId: field.id,
          fieldName: field.name,
          startTime: currentTime,
          endTime: this.addMinutesToTime(currentTime, game.duration),
          date: this.formatDate(currentDay)
        });
      } else {
        // Assign to next field in rotation
        const field = matchingFields[fieldIndex % matchingFields.length];
        
        scheduledGames.push({
          ...game,
          fieldId: field.id,
          fieldName: field.name,
          startTime: currentTime,
          endTime: this.addMinutesToTime(currentTime, game.duration),
          date: this.formatDate(currentDay)
        });
        
        // Advance to next time slot (90 minutes + 15 min buffer = 105 minutes)
        currentTime = this.addMinutesToTime(currentTime, game.duration + 15);
        
        // If we've reached end of day, move to next day and reset time
        if (this.timeToMinutes(currentTime) > 17 * 60) { // After 5 PM
          currentDay++;
          currentTime = '08:00';
          fieldIndex = 0;
        } else {
          fieldIndex++;
        }
      }
    }
    
    console.log(`✅ Direct assignment: ${scheduledGames.filter(g => g.fieldId).length}/${games.length} games assigned to fields`);
    
    return scheduledGames;
  }
  
  /**
   * Add minutes to a time string (HH:MM format)
   */
  private static addMinutesToTime(timeString: string, minutes: number): string {
    const totalMinutes = this.timeToMinutes(timeString) + minutes;
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  /**
   * Generate schedule summary statistics
   */
  private static generateSummary(games: Game[]) {
    const poolPlayGames = games.filter(g => g.gameType === 'pool_play').length;
    const knockoutGames = games.filter(g => g.gameType === 'knockout' || g.gameType === 'final').length;
    
    const gamesPerBracket: Record<string, number> = {};
    games.forEach(game => {
      gamesPerBracket[game.bracketName] = (gamesPerBracket[game.bracketName] || 0) + 1;
    });
    
    // Estimate total duration using actual game durations from flights
    const avgGameDuration = games.length > 0 ? games[0].duration || 90 : 90;
    const totalMinutes = games.length * avgGameDuration;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const estimatedDuration = `${hours}h ${minutes}m`;
    
    return {
      totalGames: games.length,
      poolPlayGames,
      knockoutGames,
      gamesPerBracket,
      estimatedDuration
    };
  }
}