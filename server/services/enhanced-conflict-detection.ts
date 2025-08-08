/**
 * Enhanced Conflict Detection Service
 * 
 * Advanced time slot overlap algorithms, field booking logic,
 * and time-based capacity management for tournament scheduling.
 */

import { db } from "../../db";
import { eq, and, or, gte, lte, inArray } from "drizzle-orm";
import { gameTimeSlots, games, fields, complexes, eventBrackets } from "../../db/schema";
import { FieldAvailabilityService } from "./field-availability-service";

export interface TimeConflict {
  type: 'overlap' | 'back_to_back' | 'insufficient_rest' | 'overtime_violation';
  severity: 'critical' | 'warning' | 'minor';
  message: string;
  conflictingItems: Array<{
    id: number;
    type: 'game' | 'time_slot' | 'maintenance';
    startTime: string;
    endTime: string;
    details?: any;
  }>;
  suggestedResolution?: string;
}

export interface CapacityConstraint {
  constraintType: 'field_capacity' | 'complex_hours' | 'daily_limit' | 'rest_period';
  isViolated: boolean;
  currentLoad: number;
  maxCapacity: number;
  timeWindow: string;
  affectedResources: string[];
}

export interface SchedulingFeasibility {
  isFeasible: boolean;
  conflictCount: number;
  capacityViolations: number;
  confidence: number; // 0-100%
  recommendations: string[];
  bottlenecks: Array<{
    resource: string;
    type: 'field' | 'time' | 'capacity';
    impact: 'high' | 'medium' | 'low';
    description: string;
  }>;
}

export class EnhancedConflictDetection {

  /**
   * Comprehensive time overlap detection with advanced algorithms
   */
  static async detectTimeOverlaps(
    eventId: string,
    proposedStartTime: string,
    proposedEndTime: string,
    dayIndex: number,
    fieldId?: number,
    excludeGameIds: number[] = []
  ): Promise<TimeConflict[]> {
    console.log(`🔍 Enhanced overlap detection for ${proposedStartTime}-${proposedEndTime} on day ${dayIndex}`);
    
    const conflicts: TimeConflict[] = [];
    
    // Check against existing games
    const existingGames = await db
      .select({
        id: games.id,
        startTime: games.startTime,
        endTime: games.endTime,
        fieldId: games.fieldId,
        homeTeamName: games.homeTeamName,
        awayTeamName: games.awayTeamName
      })
      .from(games)
      .where(
        and(
          eq(games.eventId, eventId),
          eq(games.dayIndex, dayIndex),
          fieldId ? eq(games.fieldId, fieldId) : undefined,
          excludeGameIds.length > 0 ? inArray(games.id, excludeGameIds) : undefined
        )
      );

    // Check against time slot reservations
    const existingSlots = await db
      .select()
      .from(gameTimeSlots)
      .where(
        and(
          eq(gameTimeSlots.eventId, eventId),
          eq(gameTimeSlots.dayIndex, dayIndex),
          eq(gameTimeSlots.isAvailable, false),
          fieldId ? eq(gameTimeSlots.fieldId, fieldId) : undefined
        )
      );

    // Advanced overlap detection algorithms
    const proposedStart = this.timeToMinutes(proposedStartTime);
    const proposedEnd = this.timeToMinutes(proposedEndTime);

    // Check game conflicts
    for (const game of existingGames) {
      const gameStart = this.timeToMinutes(game.startTime);
      const gameEnd = this.timeToMinutes(game.endTime);
      
      const overlapType = this.determineOverlapType(
        proposedStart, proposedEnd, gameStart, gameEnd
      );
      
      if (overlapType) {
        conflicts.push({
          type: overlapType.type,
          severity: overlapType.severity,
          message: `${overlapType.description} with game ${game.homeTeamName} vs ${game.awayTeamName}`,
          conflictingItems: [{
            id: game.id,
            type: 'game',
            startTime: game.startTime,
            endTime: game.endTime,
            details: { homeTeam: game.homeTeamName, awayTeam: game.awayTeamName }
          }],
          suggestedResolution: overlapType.resolution
        });
      }
    }

    // Check time slot conflicts
    for (const slot of existingSlots) {
      const slotStart = this.timeToMinutes(slot.startTime);
      const slotEnd = this.timeToMinutes(slot.endTime);
      
      const overlapType = this.determineOverlapType(
        proposedStart, proposedEnd, slotStart, slotEnd
      );
      
      if (overlapType) {
        conflicts.push({
          type: overlapType.type,
          severity: overlapType.severity,
          message: `${overlapType.description} with reserved time slot`,
          conflictingItems: [{
            id: slot.id,
            type: 'time_slot',
            startTime: slot.startTime,
            endTime: slot.endTime
          }],
          suggestedResolution: overlapType.resolution
        });
      }
    }

    console.log(`🔍 Found ${conflicts.length} time conflicts`);
    return conflicts;
  }

  /**
   * Analyze capacity constraints across multiple dimensions
   */
  static async analyzeCapacityConstraints(
    eventId: string,
    dayIndex: number,
    targetTimeWindow: { start: string; end: string }
  ): Promise<CapacityConstraint[]> {
    console.log(`📊 Analyzing capacity constraints for day ${dayIndex} window ${targetTimeWindow.start}-${targetTimeWindow.end}`);
    
    const constraints: CapacityConstraint[] = [];
    
    // Get all fields for the event
    const eventFields = await FieldAvailabilityService.getAvailableFields(eventId);
    
    // Analyze field capacity constraints
    for (const field of eventFields) {
      const fieldUtilization = await this.calculateFieldUtilization(
        eventId, field.id, dayIndex, targetTimeWindow
      );
      
      constraints.push({
        constraintType: 'field_capacity',
        isViolated: fieldUtilization.utilizationRate > 0.9, // 90% threshold
        currentLoad: fieldUtilization.scheduledSlots,
        maxCapacity: fieldUtilization.maxPossibleSlots,
        timeWindow: `${targetTimeWindow.start}-${targetTimeWindow.end}`,
        affectedResources: [field.name]
      });
    }

    // Analyze complex operating hours constraints
    const complexConstraints = await this.analyzeComplexHoursConstraints(
      eventId, dayIndex, targetTimeWindow
    );
    constraints.push(...complexConstraints);

    // Analyze daily scheduling limits
    const dailyLimitConstraints = await this.analyzeDailyLimits(
      eventId, dayIndex
    );
    constraints.push(...dailyLimitConstraints);

    console.log(`📊 Identified ${constraints.length} capacity constraints`);
    return constraints;
  }

  /**
   * Perform comprehensive scheduling feasibility analysis
   */
  static async assessSchedulingFeasibility(
    eventId: string,
    proposedGames: Array<{
      homeTeamId: number;
      awayTeamId: number;
      duration: number;
      fieldSize: string;
      priority: number;
    }>,
    constraints: {
      maxDaysToSpread: number;
      minRestPeriod: number;
      complexOperatingHours: { start: string; end: string };
    }
  ): Promise<SchedulingFeasibility> {
    console.log(`🧠 Assessing feasibility for ${proposedGames.length} games over ${constraints.maxDaysToSpread} days`);
    
    let totalConflicts = 0;
    let totalCapacityViolations = 0;
    const recommendations: string[] = [];
    const bottlenecks: any[] = [];

    // Simulate scheduling across available days
    for (let day = 0; day < constraints.maxDaysToSpread; day++) {
      // Analyze capacity for this day
      const dayCapacity = await this.analyzeCapacityConstraints(
        eventId, day, constraints.complexOperatingHours
      );
      
      const capacityViolations = dayCapacity.filter(c => c.isViolated).length;
      totalCapacityViolations += capacityViolations;

      if (capacityViolations > 0) {
        bottlenecks.push({
          resource: `Day ${day}`,
          type: 'capacity',
          impact: capacityViolations > 3 ? 'high' : 'medium',
          description: `${capacityViolations} capacity violations detected`
        });
      }
    }

    // Analyze field size distribution requirements
    const fieldSizeRequirements = this.analyzeFieldSizeRequirements(proposedGames);
    const availableFieldSizes = await this.getAvailableFieldSizeCapacity(eventId);
    
    for (const [fieldSize, requiredCount] of Object.entries(fieldSizeRequirements)) {
      const availableCount = availableFieldSizes[fieldSize] || 0;
      if (requiredCount > availableCount) {
        bottlenecks.push({
          resource: `${fieldSize} fields`,
          type: 'field',
          impact: 'high',
          description: `Need ${requiredCount} ${fieldSize} fields but only ${availableCount} available`
        });
        
        recommendations.push(`Consider adjusting age group field requirements or adding more ${fieldSize} fields`);
      }
    }

    // Calculate confidence based on constraints
    const constraintScore = Math.max(0, 100 - (totalCapacityViolations * 10));
    const bottleneckScore = Math.max(0, 100 - (bottlenecks.length * 15));
    const confidence = Math.round((constraintScore + bottleneckScore) / 2);

    const isFeasible = confidence > 60 && bottlenecks.filter(b => b.impact === 'high').length === 0;

    // Generate recommendations
    if (confidence < 80) {
      recommendations.push('Consider spreading tournament across additional days');
    }
    if (totalCapacityViolations > 5) {
      recommendations.push('Reduce game duration or increase rest periods');
    }
    if (bottlenecks.length > 3) {
      recommendations.push('Consider using additional venue complexes');
    }

    console.log(`🧠 Feasibility assessment: ${confidence}% confidence, ${isFeasible ? 'FEASIBLE' : 'CHALLENGING'}`);
    
    return {
      isFeasible,
      conflictCount: totalConflicts,
      capacityViolations: totalCapacityViolations,
      confidence,
      recommendations,
      bottlenecks
    };
  }

  /**
   * Intelligent conflict resolution suggestions
   */
  static async suggestConflictResolution(
    conflicts: TimeConflict[],
    constraints: CapacityConstraint[]
  ): Promise<Array<{
    strategy: string;
    impact: 'high' | 'medium' | 'low';
    description: string;
    estimatedResolution: number; // percentage of conflicts resolved
  }>> {
    const resolutionStrategies = [];

    // Analyze conflict patterns
    const overlapConflicts = conflicts.filter(c => c.type === 'overlap').length;
    const restConflicts = conflicts.filter(c => c.type === 'insufficient_rest').length;
    const capacityViolations = constraints.filter(c => c.isViolated).length;

    if (overlapConflicts > 3) {
      resolutionStrategies.push({
        strategy: 'Temporal Redistribution',
        impact: 'high',
        description: 'Spread games across additional time slots or days',
        estimatedResolution: 80
      });
    }

    if (restConflicts > 2) {
      resolutionStrategies.push({
        strategy: 'Rest Period Optimization',
        impact: 'medium',
        description: 'Adjust game sequences to ensure proper team rest',
        estimatedResolution: 70
      });
    }

    if (capacityViolations > 2) {
      resolutionStrategies.push({
        strategy: 'Venue Expansion',
        impact: 'high',
        description: 'Consider additional field allocations or venue partnerships',
        estimatedResolution: 90
      });
    }

    return resolutionStrategies;
  }

  /**
   * Advanced overlap type determination
   */
  private static determineOverlapType(
    proposedStart: number,
    proposedEnd: number,
    existingStart: number,
    existingEnd: number
  ): { type: 'overlap' | 'back_to_back' | 'insufficient_rest'; severity: 'critical' | 'warning' | 'minor'; description: string; resolution: string } | null {
    
    // Direct overlap (critical)
    if ((proposedStart < existingEnd && proposedEnd > existingStart)) {
      return {
        type: 'overlap',
        severity: 'critical',
        description: 'Direct time overlap detected',
        resolution: 'Reschedule to non-overlapping time slot'
      };
    }

    // Back-to-back (warning)
    if (proposedStart === existingEnd || proposedEnd === existingStart) {
      return {
        type: 'back_to_back',
        severity: 'warning',
        description: 'Back-to-back scheduling detected',
        resolution: 'Add buffer time between activities'
      };
    }

    // Insufficient rest period (minor)
    const minRestPeriod = 15; // 15 minutes
    if ((proposedStart - existingEnd) > 0 && (proposedStart - existingEnd) < minRestPeriod) {
      return {
        type: 'insufficient_rest',
        severity: 'minor',
        description: 'Insufficient rest period between activities',
        resolution: 'Increase buffer time to minimum 15 minutes'
      };
    }

    return null;
  }

  /**
   * Calculate field utilization for specific time window
   */
  private static async calculateFieldUtilization(
    eventId: string,
    fieldId: number,
    dayIndex: number,
    timeWindow: { start: string; end: string }
  ) {
    const windowStart = this.timeToMinutes(timeWindow.start);
    const windowEnd = this.timeToMinutes(timeWindow.end);
    const windowDuration = windowEnd - windowStart;

    // Get scheduled games in this window
    const scheduledGames = await db
      .select()
      .from(games)
      .where(
        and(
          eq(games.eventId, eventId),
          eq(games.fieldId, fieldId),
          eq(games.dayIndex, dayIndex)
        )
      );

    let scheduledMinutes = 0;
    scheduledGames.forEach(game => {
      const gameStart = Math.max(windowStart, this.timeToMinutes(game.startTime));
      const gameEnd = Math.min(windowEnd, this.timeToMinutes(game.endTime));
      if (gameEnd > gameStart) {
        scheduledMinutes += gameEnd - gameStart;
      }
    });

    const utilizationRate = windowDuration > 0 ? scheduledMinutes / windowDuration : 0;
    
    // Get actual game duration from flight configuration instead of hardcoded 105 minutes
    const avgGameDuration = await this.getFlightConfiguredDuration(eventId) || 90; // Use flight configuration or fallback to 90
    const maxPossibleSlots = Math.floor(windowDuration / avgGameDuration);

    return {
      utilizationRate,
      scheduledMinutes,
      availableMinutes: windowDuration - scheduledMinutes,
      scheduledSlots: scheduledGames.length,
      maxPossibleSlots
    };
  }

  /**
   * Get configured game duration from flight configuration
   */
  private static async getFlightConfiguredDuration(eventId: string): Promise<number> {
    try {
      // Get flight configuration from event_brackets to get actual configured durations
      const flightConfig = await db
        .select({ 
          gameDuration: eventBrackets.gameDuration,
          bufferTime: eventBrackets.bufferTime 
        })
        .from(eventBrackets)
        .where(eq(eventBrackets.eventId, eventId))
        .limit(1);

      if (flightConfig.length > 0 && flightConfig[0].gameDuration) {
        // Use actual configured duration (game + buffer)
        const gameTime = flightConfig[0].gameDuration || 90;
        const bufferTime = flightConfig[0].bufferTime || 15;
        return gameTime + bufferTime;
      }
    } catch (error) {
      console.error('Error fetching flight configuration duration:', error);
    }
    
    return 90; // Fallback to 90 minutes if no configuration found
  }

  /**
   * Analyze complex operating hours constraints
   */
  private static async analyzeComplexHoursConstraints(
    eventId: string,
    dayIndex: number,
    timeWindow: { start: string; end: string }
  ): Promise<CapacityConstraint[]> {
    const constraints: CapacityConstraint[] = [];
    
    const complexData = await db
      .select({
        complexId: complexes.id,
        complexName: complexes.name,
        openTime: complexes.openTime,
        closeTime: complexes.closeTime
      })
      .from(complexes)
      .innerJoin(fields, eq(fields.complexId, complexes.id));

    for (const complex of complexData) {
      const complexOpen = this.timeToMinutes(complex.openTime);
      const complexClose = this.timeToMinutes(complex.closeTime);
      const windowStart = this.timeToMinutes(timeWindow.start);
      const windowEnd = this.timeToMinutes(timeWindow.end);

      const isViolated = windowStart < complexOpen || windowEnd > complexClose;

      if (isViolated) {
        constraints.push({
          constraintType: 'complex_hours',
          isViolated: true,
          currentLoad: windowEnd - windowStart,
          maxCapacity: complexClose - complexOpen,
          timeWindow: `${timeWindow.start}-${timeWindow.end}`,
          affectedResources: [complex.complexName]
        });
      }
    }

    return constraints;
  }

  /**
   * Analyze daily scheduling limits
   */
  private static async analyzeDailyLimits(
    eventId: string,
    dayIndex: number
  ): Promise<CapacityConstraint[]> {
    const constraints: CapacityConstraint[] = [];
    
    // Count total games scheduled for this day
    const dailyGames = await db
      .select()
      .from(games)
      .where(
        and(
          eq(games.eventId, eventId),
          eq(games.dayIndex, dayIndex)
        )
      );

    // Reasonable daily limit (configurable)
    const maxDailyGames = 50;
    const currentDailyGames = dailyGames.length;

    if (currentDailyGames > maxDailyGames * 0.9) { // 90% threshold
      constraints.push({
        constraintType: 'daily_limit',
        isViolated: currentDailyGames > maxDailyGames,
        currentLoad: currentDailyGames,
        maxCapacity: maxDailyGames,
        timeWindow: `Day ${dayIndex}`,
        affectedResources: ['Tournament Day Capacity']
      });
    }

    return constraints;
  }

  /**
   * Analyze field size requirements
   */
  private static analyzeFieldSizeRequirements(
    games: Array<{ fieldSize: string }>
  ): Record<string, number> {
    const requirements: Record<string, number> = {};
    
    games.forEach(game => {
      requirements[game.fieldSize] = (requirements[game.fieldSize] || 0) + 1;
    });

    return requirements;
  }

  /**
   * Get available field size capacity
   */
  private static async getAvailableFieldSizeCapacity(eventId: string): Promise<Record<string, number>> {
    const fields = await FieldAvailabilityService.getAvailableFields(eventId);
    const capacity: Record<string, number> = {};
    
    fields.forEach(field => {
      capacity[field.fieldSize] = (capacity[field.fieldSize] || 0) + 1;
    });

    return capacity;
  }

  /**
   * Convert time string to minutes since midnight
   */
  private static timeToMinutes(timeString: string): number {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }
}