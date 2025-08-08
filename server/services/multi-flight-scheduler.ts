import { db } from "../../db";
import { games, fields, complexes } from "../../db/schema";
import { eq, and, gte, lte } from "drizzle-orm";

export interface ExistingGame {
  id: number;
  homeTeamId: number;
  awayTeamId: number;
  fieldId: number;
  startTime: string;
  endTime: string;
  duration: number;
  flightId: number;
}

export interface NewGame {
  homeTeamId: number;
  awayTeamId: number;
  duration: number;
  flightId: number;
  fieldSize: string;
  restPeriodRequired: number; // minutes
}

export interface FieldWithProximity {
  id: number;
  name: string;
  sortOrder: number;
  fieldSize: string;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
  fieldId: number;
  isAvailable: boolean;
  conflictsWith?: number[]; // existing game IDs
}

export interface SchedulingResult {
  success: boolean;
  scheduledGames: Array<{
    homeTeamId: number;
    awayTeamId: number;
    fieldId: number;
    startTime: string;
    endTime: string;
    proximityScore: number;
  }>;
  conflicts: string[];
  fieldUtilization: Map<number, number>; // fieldId -> utilization percentage
}

export class MultiFlightScheduler {
  
  /**
   * PHASE 1: Gap-Filling Intelligent Scheduler
   * Finds gaps between existing games and fills them with new games while respecting rest periods
   */
  static async scheduleWithGapFilling(
    eventId: number,
    existingGames: ExistingGame[],
    newGames: NewGame[],
    eventDate: string
  ): Promise<SchedulingResult> {
    
    console.log(`🎯 MULTI-FLIGHT SCHEDULER: Processing ${newGames.length} new games around ${existingGames.length} existing games`);
    
    // Step 1: Get available fields ordered by proximity
    const availableFields = await this.getFieldsByProximity(eventId);
    console.log(`🏟️ Available fields: ${availableFields.map(f => f.name + ' (Sort: ' + f.sortOrder + ')').join(', ')}`);
    
    // Step 2: Build field occupancy map from existing games
    const fieldOccupancy = this.buildFieldOccupancyMap(existingGames);
    
    // Step 3: Identify team rest periods from existing games
    const teamRestPeriods = this.calculateTeamRestPeriods(existingGames);
    
    // Step 4: Generate all possible time slots for the day
    const allTimeSlots = this.generateDayTimeSlots(eventDate, availableFields);
    
    // Step 5: Filter available slots (no conflicts with existing games)
    const availableSlots = this.findAvailableTimeSlots(allTimeSlots, fieldOccupancy);
    
    console.log(`⏰ Generated ${allTimeSlots.length} total slots, ${availableSlots.length} available for new games`);
    
    // Step 6: Intelligent gap-filling algorithm
    const scheduledGames = [];
    const conflicts = [];
    const fieldUtilization = new Map<number, number>();
    
    for (let i = 0; i < newGames.length; i++) {
      const newGame = newGames[i];
      console.log(`📋 Scheduling new game ${i + 1}: Teams ${newGame.homeTeamId} vs ${newGame.awayTeamId} (${newGame.duration}min)`);
      
      // Find optimal time slot with gap-filling logic
      const optimalSlot = this.findOptimalGapFillingSlot(
        newGame,
        availableSlots,
        teamRestPeriods,
        availableFields,
        fieldOccupancy
      );
      
      if (optimalSlot) {
        // Schedule the game
        scheduledGames.push({
          homeTeamId: newGame.homeTeamId,
          awayTeamId: newGame.awayTeamId,
          fieldId: optimalSlot.fieldId,
          startTime: optimalSlot.startTime,
          endTime: optimalSlot.endTime,
          proximityScore: this.calculateProximityScore(optimalSlot.fieldId, scheduledGames, availableFields)
        });
        
        // Update occupancy for future games
        this.markSlotOccupied(optimalSlot, fieldOccupancy);
        
        // Update team rest periods
        this.updateTeamRestPeriods(newGame, optimalSlot, teamRestPeriods);
        
        console.log(`✅ Scheduled game ${i + 1} at ${optimalSlot.startTime} on Field ${this.getFieldName(optimalSlot.fieldId, availableFields)}`);
      } else {
        conflicts.push(`Could not schedule game ${i + 1}: Teams ${newGame.homeTeamId} vs ${newGame.awayTeamId} - no suitable gap found`);
        console.log(`❌ Could not schedule game ${i + 1}: no suitable gaps available`);
      }
    }
    
    // Calculate field utilization metrics
    for (const field of availableFields) {
      const utilization = this.calculateFieldUtilization(field.id, fieldOccupancy, eventDate);
      fieldUtilization.set(field.id, utilization);
    }
    
    return {
      success: conflicts.length === 0,
      scheduledGames,
      conflicts,
      fieldUtilization
    };
  }
  
  /**
   * Get fields ordered by proximity (sortOrder determines proximity)
   */
  private static async getFieldsByProximity(eventId: number): Promise<FieldWithProximity[]> {
    const fieldsData = await db
      .select({
        id: fields.id,
        name: fields.name,
        sortOrder: fields.sortOrder,
        fieldSize: fields.fieldSize,
        isOpen: fields.isOpen,
        openTime: fields.openTime,
        closeTime: fields.closeTime,
      })
      .from(fields)
      .where(eq(fields.isOpen, true))
      .orderBy(fields.sortOrder); // Order by proximity (lower sortOrder = closer)
    
    return fieldsData;
  }
  
  /**
   * Build field occupancy map from existing games
   */
  private static buildFieldOccupancyMap(existingGames: ExistingGame[]): Map<number, Array<{start: string, end: string}>> {
    const occupancy = new Map<number, Array<{start: string, end: string}>>();
    
    for (const game of existingGames) {
      if (!occupancy.has(game.fieldId)) {
        occupancy.set(game.fieldId, []);
      }
      occupancy.get(game.fieldId)!.push({
        start: game.startTime,
        end: game.endTime
      });
    }
    
    return occupancy;
  }
  
  /**
   * Calculate when teams will be available again (end of game + rest period)
   */
  private static calculateTeamRestPeriods(existingGames: ExistingGame[]): Map<number, string> {
    const teamAvailability = new Map<number, string>();
    
    for (const game of existingGames) {
      const gameEnd = new Date(game.endTime);
      
      // Update team availability (latest game end time)
      const homeTeamEnd = teamAvailability.get(game.homeTeamId);
      const awayTeamEnd = teamAvailability.get(game.awayTeamId);
      
      if (!homeTeamEnd || gameEnd > new Date(homeTeamEnd)) {
        teamAvailability.set(game.homeTeamId, game.endTime);
      }
      
      if (!awayTeamEnd || gameEnd > new Date(awayTeamEnd)) {
        teamAvailability.set(game.awayTeamId, game.endTime);
      }
    }
    
    return teamAvailability;
  }
  
  /**
   * Generate all possible 15-minute time slots for the day
   */
  private static generateDayTimeSlots(eventDate: string, fields: FieldWithProximity[]): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const startHour = 8; // 8 AM
    const endHour = 20; // 8 PM
    const slotInterval = 15; // 15 minutes
    
    const eventDateObj = new Date(eventDate);
    
    // Generate slots for each field
    for (const field of fields) {
      for (let hour = startHour; hour < endHour; hour++) {
        for (let minute = 0; minute < 60; minute += slotInterval) {
          const slotStart = new Date(eventDateObj);
          slotStart.setHours(hour, minute, 0, 0);
          
          const slotEnd = new Date(slotStart.getTime() + (90 * 60 * 1000)); // 90-minute games
          
          // Skip if slot extends beyond field hours
          if (slotEnd.getHours() > endHour) continue;
          
          slots.push({
            startTime: slotStart.toISOString().slice(0, 19),
            endTime: slotEnd.toISOString().slice(0, 19),
            fieldId: field.id,
            isAvailable: true
          });
        }
      }
    }
    
    return slots;
  }
  
  /**
   * Filter out slots that conflict with existing games
   */
  private static findAvailableTimeSlots(
    allSlots: TimeSlot[],
    fieldOccupancy: Map<number, Array<{start: string, end: string}>>
  ): TimeSlot[] {
    return allSlots.filter(slot => {
      const occupiedSlots = fieldOccupancy.get(slot.fieldId) || [];
      
      for (const occupied of occupiedSlots) {
        // Check for overlap
        if (this.slotsOverlap(slot.startTime, slot.endTime, occupied.start, occupied.end)) {
          slot.isAvailable = false;
          return false;
        }
      }
      
      return true;
    });
  }
  
  /**
   * CORE ALGORITHM: Find optimal gap-filling slot
   * Prioritizes: 1) Team rest periods, 2) Field proximity, 3) Field utilization
   */
  private static findOptimalGapFillingSlot(
    newGame: NewGame,
    availableSlots: TimeSlot[],
    teamRestPeriods: Map<number, string>,
    fields: FieldWithProximity[],
    fieldOccupancy: Map<number, Array<{start: string, end: string}>>
  ): TimeSlot | null {
    
    // Filter slots where both teams can play (respect rest periods)
    const validSlots = availableSlots.filter(slot => {
      return this.canTeamsPlay(newGame, slot, teamRestPeriods) &&
             this.isFieldSizeCompatible(newGame.fieldSize, slot.fieldId, fields);
    });
    
    if (validSlots.length === 0) {
      console.log(`❌ No valid slots found for game ${newGame.homeTeamId} vs ${newGame.awayTeamId}`);
      return null;
    }
    
    // Score each slot based on multiple criteria
    const scoredSlots = validSlots.map(slot => ({
      slot,
      score: this.calculateSlotScore(slot, newGame, fields, fieldOccupancy)
    }));
    
    // Sort by score (higher is better) and return best slot
    scoredSlots.sort((a, b) => b.score - a.score);
    
    console.log(`🎯 Found ${validSlots.length} valid slots, selected slot with score ${scoredSlots[0].score}`);
    
    return scoredSlots[0].slot;
  }
  
  /**
   * Check if teams can play at this time (respect rest periods)
   */
  private static canTeamsPlay(
    newGame: NewGame,
    slot: TimeSlot,
    teamRestPeriods: Map<number, string>
  ): boolean {
    const slotStart = new Date(slot.startTime);
    
    // Check home team availability
    const homeTeamLastEnd = teamRestPeriods.get(newGame.homeTeamId);
    if (homeTeamLastEnd) {
      const homeTeamAvailable = new Date(homeTeamLastEnd).getTime() + (newGame.restPeriodRequired * 60 * 1000);
      if (slotStart.getTime() < homeTeamAvailable) {
        return false;
      }
    }
    
    // Check away team availability
    const awayTeamLastEnd = teamRestPeriods.get(newGame.awayTeamId);
    if (awayTeamLastEnd) {
      const awayTeamAvailable = new Date(awayTeamLastEnd).getTime() + (newGame.restPeriodRequired * 60 * 1000);
      if (slotStart.getTime() < awayTeamAvailable) {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Check if field size is compatible with game requirements
   */
  private static isFieldSizeCompatible(requiredSize: string, fieldId: number, fields: FieldWithProximity[]): boolean {
    const field = fields.find(f => f.id === fieldId);
    if (!field) return false;
    
    // Field size compatibility logic
    const sizeHierarchy = { '7v7': 1, '9v9': 2, '11v11': 3 };
    const requiredLevel = sizeHierarchy[requiredSize as keyof typeof sizeHierarchy] || 3;
    const fieldLevel = sizeHierarchy[field.fieldSize as keyof typeof sizeHierarchy] || 3;
    
    return fieldLevel >= requiredLevel; // Field must be equal or larger
  }
  
  /**
   * Calculate slot score based on multiple optimization criteria
   */
  private static calculateSlotScore(
    slot: TimeSlot,
    newGame: NewGame,
    fields: FieldWithProximity[],
    fieldOccupancy: Map<number, Array<{start: string, end: string}>>
  ): number {
    let score = 1000; // Base score
    
    const field = fields.find(f => f.id === slot.fieldId);
    if (!field) return 0;
    
    // 1. Proximity score (lower sortOrder = higher score)
    const proximityScore = Math.max(0, 100 - field.sortOrder * 10);
    score += proximityScore;
    
    // 2. Field utilization score (prefer filling up fields before using new ones)
    const currentUtilization = this.calculateFieldUtilization(slot.fieldId, fieldOccupancy, slot.startTime.slice(0, 10));
    const utilizationScore = currentUtilization * 2; // Higher utilization = higher score
    score += utilizationScore;
    
    // 3. Time preference (prefer earlier slots)
    const slotHour = new Date(slot.startTime).getHours();
    const timeScore = Math.max(0, 50 - (slotHour - 8) * 5); // Earlier is better
    score += timeScore;
    
    console.log(`🔢 Slot score for Field ${field.name} at ${slot.startTime}: Proximity(${proximityScore}) + Utilization(${utilizationScore}) + Time(${timeScore}) = ${score}`);
    
    return score;
  }
  
  /**
   * Helper methods
   */
  private static slotsOverlap(start1: string, end1: string, start2: string, end2: string): boolean {
    const s1 = new Date(start1).getTime();
    const e1 = new Date(end1).getTime();
    const s2 = new Date(start2).getTime();
    const e2 = new Date(end2).getTime();
    
    return s1 < e2 && s2 < e1;
  }
  
  private static markSlotOccupied(
    slot: TimeSlot,
    fieldOccupancy: Map<number, Array<{start: string, end: string}>>
  ): void {
    if (!fieldOccupancy.has(slot.fieldId)) {
      fieldOccupancy.set(slot.fieldId, []);
    }
    fieldOccupancy.get(slot.fieldId)!.push({
      start: slot.startTime,
      end: slot.endTime
    });
  }
  
  private static updateTeamRestPeriods(
    newGame: NewGame,
    slot: TimeSlot,
    teamRestPeriods: Map<number, string>
  ): void {
    teamRestPeriods.set(newGame.homeTeamId, slot.endTime);
    teamRestPeriods.set(newGame.awayTeamId, slot.endTime);
  }
  
  private static calculateFieldUtilization(fieldId: number, fieldOccupancy: Map<number, Array<{start: string, end: string}>>, date: string): number {
    const occupiedSlots = fieldOccupancy.get(fieldId) || [];
    const totalMinutesInDay = 12 * 60; // 8 AM to 8 PM
    
    let occupiedMinutes = 0;
    for (const slot of occupiedSlots) {
      const start = new Date(slot.start);
      const end = new Date(slot.end);
      occupiedMinutes += (end.getTime() - start.getTime()) / (1000 * 60);
    }
    
    return Math.round((occupiedMinutes / totalMinutesInDay) * 100);
  }
  
  private static calculateProximityScore(fieldId: number, scheduledGames: any[], fields: FieldWithProximity[]): number {
    const field = fields.find(f => f.id === fieldId);
    return field ? Math.max(0, 100 - field.sortOrder * 10) : 0;
  }
  
  private static getFieldName(fieldId: number, fields: FieldWithProximity[]): string {
    const field = fields.find(f => f.id === fieldId);
    return field ? field.name : `Field ${fieldId}`;
  }
}