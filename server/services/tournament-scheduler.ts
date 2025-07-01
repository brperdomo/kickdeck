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
    const { bracketSeedings, workflowTimeBlocks } = workflowData;
    
    if (!bracketSeedings || bracketSeedings.length === 0) {
      throw new Error('No bracket seedings found in workflow data');
    }
    
    const allGames: Game[] = [];
    let gameCounter = 1;
    
    // Generate games for each bracket
    for (const bracket of bracketSeedings) {
      console.log(`📋 Processing bracket: ${bracket.bracketName} (${bracket.format})`);
      
      const bracketGames = await this.generateBracketGames(
        bracket,
        gameCounter
      );
      
      allGames.push(...bracketGames);
      gameCounter += bracketGames.length;
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
    
    switch (bracket.format) {
      case 'round_robin':
        games.push(...this.generateRoundRobinGames(bracket, teams, gameCounter));
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
          round: 'Round Robin',
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
   * Get available fields for the event
   */
  private static async getAvailableFields(eventId: string): Promise<Field[]> {
    // Get complex IDs assigned to this event
    const eventComplexesData = await db
      .select()
      .from(eventComplexes)
      .where(eq(eventComplexes.eventId, eventId));
      
    const complexIds = eventComplexesData.map(ec => ec.complexId);
    
    let fieldsData = [];
    
    if (complexIds.length > 0) {
      fieldsData = await db
        .select({
          id: fields.id,
          name: fields.name,
          complexId: fields.complexId,
          complexName: complexes.name,
        })
        .from(fields)
        .leftJoin(complexes, eq(fields.complexId, complexes.id))
        .where(and(
          eq(fields.isOpen, true),
          inArray(fields.complexId, complexIds)
        ));
    } else {
      // Fallback to all active fields
      fieldsData = await db
        .select({
          id: fields.id,
          name: fields.name,
          complexId: fields.complexId,
          complexName: complexes.name,
        })
        .from(fields)
        .leftJoin(complexes, eq(fields.complexId, complexes.id))
        .where(eq(fields.isOpen, true));
    }
    
    return fieldsData.map(field => ({
      id: field.id,
      name: field.name,
      complexId: field.complexId,
      complexName: field.complexName || 'Unknown Complex',
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
    
    if (fields.length === 0) {
      console.log('⚠️  No fields available, returning games without field assignments');
      return games;
    }
    
    if (timeSlots.length === 0) {
      console.log('⚠️  No time slots available, returning games without time assignments');
      return games;
    }
    
    const scheduledGames = [...games];
    let currentFieldIndex = 0;
    let currentTimeIndex = 0;
    
    // Simple round-robin field assignment
    for (const game of scheduledGames) {
      // Assign field
      const field = fields[currentFieldIndex];
      game.fieldId = field.id;
      game.fieldName = field.name;
      
      // Assign time slot
      if (currentTimeIndex < timeSlots.length) {
        const timeSlot = timeSlots[currentTimeIndex];
        game.timeSlotId = timeSlot.id;
        game.startTime = timeSlot.startTime;
        game.endTime = timeSlot.endTime;
        game.date = timeSlot.date;
      }
      
      // Rotate to next field
      currentFieldIndex = (currentFieldIndex + 1) % fields.length;
      
      // Move to next time slot when we've cycled through all fields
      if (currentFieldIndex === 0) {
        currentTimeIndex++;
      }
    }
    
    console.log(`📅 Assigned ${scheduledGames.filter(g => g.fieldId).length} games to fields`);
    console.log(`⏰ Assigned ${scheduledGames.filter(g => g.timeSlotId).length} games to time slots`);
    
    return scheduledGames;
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