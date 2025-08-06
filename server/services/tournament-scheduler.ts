/**
 * Traditional Tournament Scheduling Service
 * 
 * Implements standard soccer tournament scheduling algorithms without AI dependency.
 * Supports round-robin, single/double elimination, and hybrid formats.
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
    
    // Assign games to fields and time slots
    const scheduledGames = await this.assignFieldsAndTimes(
      allGames,
      fieldsData,
      timeSlots,
      options
    );
    
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
    
    // Use the bracket's configured tournament format
    const format = bracket.tournamentFormat || bracket.format || 'round_robin';
    
    switch (format) {
      case 'round_robin':
        games.push(...this.generateRoundRobinGames(bracket, teams, gameCounter));
        break;
        
      case 'single_bracket_4_teams':
      case 'crossover_bracket_6_teams': 
      case 'dual_bracket_8_teams':
        // Use smart bracket generation based on team count
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
        console.log(`⚠️  Unknown bracket format: ${bracket.format}, defaulting to round robin`);
        games.push(...this.generateRoundRobinGames(bracket, teams, gameCounter));
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
    
    // Use your three specified tournament scenarios based on team count
    if (teamCount === 4) {
      return this.generate4TeamBracket(bracket, teams, startingGameNumber);
    } else if (teamCount === 6) {
      return this.generate6TeamCrossover(bracket, teams, startingGameNumber);
    } else if (teamCount === 8) {
      return this.generate8TeamDualBracket(bracket, teams, startingGameNumber);
    } else {
      // Fallback to standard round robin
      console.log(`⚠️  No specific format for ${teamCount} teams, using standard round robin`);
      return this.generateRoundRobinGames(bracket, teams, startingGameNumber);
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
    
    // Add final: 1st vs 2nd (TBD vs TBD)
    games.push(this.generateChampionshipGame(bracket, gameCounter));
    
    console.log(`🏆 4-team bracket: 6 pool + 1 final for ${bracket.bracketName}`);
    return games;
  }

  /**
   * 6 teams crossover: 9 pool games + 1 final (your second scenario)
   */
  private static generate6TeamCrossover(
    bracket: any,
    teams: Team[],
    startingGameNumber: number
  ): Game[] {
    const games: Game[] = [];
    let gameCounter = startingGameNumber;
    
    // Split into A1,A2,A3 and B1,B2,B3
    const bracketA = teams.slice(0, 3);
    const bracketB = teams.slice(3, 6);
    
    // Your specified crossover matchups: A1-B1, A2-B2, A3-B3, A1-B2, A2-B3, A3-B1, A1-B3, A2-B1, A3-B2
    const crossoverPairs = [
      [0, 0], // A1 vs B1
      [1, 1], // A2 vs B2
      [2, 2], // A3 vs B3
      [0, 1], // A1 vs B2
      [1, 2], // A2 vs B3
      [2, 0], // A3 vs B1
      [0, 2], // A1 vs B3
      [1, 0], // A2 vs B1
      [2, 1]  // A3 vs B2
    ];
    
    crossoverPairs.forEach(([aIdx, bIdx]) => {
      games.push({
        id: `${bracket.bracketId}_cross_${gameCounter}`,
        homeTeamId: bracketA[aIdx].id,
        homeTeamName: bracketA[aIdx].name,
        awayTeamId: bracketB[bIdx].id,
        awayTeamName: bracketB[bIdx].name,
        bracketId: bracket.bracketId,
        bracketName: bracket.bracketName,
        round: 'Pool Play',
        gameType: 'pool_play',
        gameNumber: gameCounter++,
        duration: 90
      });
    });
    
    // Add final: 1st vs 2nd (TBD vs TBD)
    games.push(this.generateChampionshipGame(bracket, gameCounter));
    
    console.log(`🏆 6-team crossover: 9 pool + 1 final for ${bracket.bracketName}`);
    return games;
  }

  /**
   * 8 teams dual bracket: 12 pool games + 1 final (your third scenario)
   */
  private static generate8TeamDualBracket(
    bracket: any,
    teams: Team[],
    startingGameNumber: number
  ): Game[] {
    const games: Game[] = [];
    let gameCounter = startingGameNumber;
    
    // Split into brackets A (0,1,2,3) and B (4,5,6,7)
    const bracketA = teams.slice(0, 4);
    const bracketB = teams.slice(4, 8);
    
    // Your specified matchups within each bracket: A1-A2, B1-B2, A3-A4, B3-B4, A1-A3, B1-B3, A2-A4, B2-B4, A1-A4, B1-B4, A2-A3, B2-B3
    [bracketA, bracketB].forEach((bracketTeams, bracketIdx) => {
      const bracketLetter = bracketIdx === 0 ? 'A' : 'B';
      
      // Round robin within bracket
      for (let i = 0; i < bracketTeams.length; i++) {
        for (let j = i + 1; j < bracketTeams.length; j++) {
          games.push({
            id: `${bracket.bracketId}_${bracketLetter}_${gameCounter}`,
            homeTeamId: bracketTeams[i].id,
            homeTeamName: bracketTeams[i].name,
            awayTeamId: bracketTeams[j].id,
            awayTeamName: bracketTeams[j].name,
            bracketId: bracket.bracketId,
            bracketName: bracket.bracketName,
            round: 'Pool Play',
            gameType: 'pool_play',
            gameNumber: gameCounter++,
            duration: 90
          });
        }
      }
    });
    
    // Add final: 1st from A vs 1st from B
    games.push({
      id: `${bracket.bracketId}_final_${gameCounter}`,
      homeTeamId: null,
      homeTeamName: '1st Place Bracket A',
      awayTeamId: null,
      awayTeamName: '1st Place Bracket B',
      bracketId: bracket.bracketId,
      bracketName: bracket.bracketName,
      round: 'Championship',
      gameType: 'final',
      gameNumber: gameCounter,
      duration: 90,
      isPlaceholder: true
    });
    
    console.log(`🏆 8-team dual bracket: 12 pool + 1 final for ${bracket.bracketName}`);
    return games;
  }

  /**
   * Generate championship final game with placeholders
   */
  private static generateChampionshipGame(
    bracket: any,
    gameNumber: number
  ): Game {
    return {
      id: `${bracket.bracketId}_final_${gameNumber}`,
      homeTeamId: null, // Placeholder for 1st place team
      homeTeamName: '1st Place',
      awayTeamId: null, // Placeholder for 2nd place team  
      awayTeamName: '2nd Place',
      bracketId: bracket.bracketId,
      bracketName: bracket.bracketName,
      round: 'Championship',
      gameType: 'final',
      gameNumber: gameNumber,
      duration: 90,
      isPlaceholder: true // Mark as placeholder game
    };
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
        gameType: 'final',
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
    
    // Sort games by priority (pool play first, then knockout)
    const sortedGames = [...games].sort((a, b) => {
      if (a.gameType === 'pool_play' && b.gameType !== 'pool_play') return -1;
      if (a.gameType !== 'pool_play' && b.gameType === 'pool_play') return 1;
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
                  timeSlotId
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
    
    if (bracketName.includes('U8') || bracketName.includes('U9') || bracketName.includes('U10')) {
      return '7v7';
    } else if (bracketName.includes('U11') || bracketName.includes('U12')) {
      return '9v9';
    } else {
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
   * Generate schedule summary statistics
   */
  private static generateSummary(games: Game[]) {
    const poolPlayGames = games.filter(g => g.gameType === 'pool_play').length;
    const knockoutGames = games.filter(g => g.gameType === 'knockout' || g.gameType === 'final').length;
    
    const gamesPerBracket: Record<string, number> = {};
    games.forEach(game => {
      gamesPerBracket[game.bracketName] = (gamesPerBracket[game.bracketName] || 0) + 1;
    });
    
    // Estimate total duration (assuming 90min games + 15min breaks)
    const totalMinutes = games.length * 105; // 90 + 15
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