import { db } from '../../db/index.js';
import { games, fields, complexes, gameTimeSlots, eventBrackets, teams, eventAgeGroups } from '../../db/schema.js';
import { eq, and, count, inArray } from 'drizzle-orm';

export interface FieldCapacityCheck {
  hasCapacity: boolean;
  totalFieldsNeeded: number;
  totalFieldsAvailable: number;
  daysRequired: number;
  utilizationPercent: number;
  warnings: string[];
  errors: string[];
}

export interface DuplicateGameCheck {
  hasDuplicates: boolean;
  existingGamesCount: number;
  affectedFlights: string[];
  affectedBrackets: string[];
  errors: string[];
  warnings: string[];
}

/**
 * CRITICAL SAFETY CHECK: Verify field capacity before scheduling
 */
export async function validateFieldCapacity(
  eventId: string,
  totalGamesNeeded: number,
  gameDurationMinutes: number = 90,
  bufferMinutes: number = 15
): Promise<FieldCapacityCheck> {
  const warnings: string[] = [];
  const errors: string[] = [];

  try {
    // Get available fields for this event
    const availableFields = await db
      .select({
        id: fields.id,
        name: fields.name,
        fieldSize: fields.fieldSize,
        complexName: complexes.name
      })
      .from(fields)
      .leftJoin(complexes, eq(fields.complexId, complexes.id));

    console.log(`[Field Capacity Check] Found ${availableFields.length} available fields`);

    if (availableFields.length === 0) {
      errors.push('CRITICAL: No active fields available for scheduling');
      return {
        hasCapacity: false,
        totalFieldsNeeded: 0,
        totalFieldsAvailable: 0,
        daysRequired: 0,
        utilizationPercent: 0,
        warnings,
        errors
      };
    }

    // Calculate time requirements
    const totalTimePerGame = gameDurationMinutes + bufferMinutes; // e.g., 90 + 15 = 105 minutes
    const operatingHoursPerDay = 12; // Tournament day: 7 AM - 7 PM
    const operatingMinutesPerDay = operatingHoursPerDay * 60; // 720 minutes

    // Maximum games per field per day
    const maxGamesPerFieldPerDay = Math.floor(operatingMinutesPerDay / totalTimePerGame);
    console.log(`[Field Capacity] Max games per field per day: ${maxGamesPerFieldPerDay}`);

    // Total field capacity per day
    const totalFieldCapacityPerDay = maxGamesPerFieldPerDay * availableFields.length;
    console.log(`[Field Capacity] Total field capacity per day: ${totalFieldCapacityPerDay} games`);

    // Calculate days required
    const daysRequired = Math.ceil(totalGamesNeeded / totalFieldCapacityPerDay);
    console.log(`[Field Capacity] Days required: ${daysRequired} for ${totalGamesNeeded} games`);

    // Calculate utilization
    const utilizationPercent = Math.min((totalGamesNeeded / totalFieldCapacityPerDay) * 100, 100);

    // Field capacity warnings and errors
    if (totalGamesNeeded > totalFieldCapacityPerDay) {
      if (daysRequired > 4) {
        errors.push(`CRITICAL: Tournament requires ${daysRequired} days - exceeds typical 2-3 day tournament format`);
      } else if (daysRequired > 3) {
        warnings.push(`WARNING: Tournament will require ${daysRequired} days to complete`);
      } else {
        warnings.push(`INFO: Tournament scheduled across ${daysRequired} days`);
      }
    }

    // Utilization warnings
    if (utilizationPercent > 95) {
      errors.push('CRITICAL: Field utilization exceeds 95% - no buffer time for delays or conflicts');
    } else if (utilizationPercent > 85) {
      warnings.push('WARNING: High field utilization (>85%) - limited flexibility for schedule adjustments');
    } else if (utilizationPercent > 70) {
      warnings.push('INFO: Moderate field utilization (>70%) - good field usage with some flexibility');
    }

    // Field availability warnings
    if (availableFields.length < 3) {
      warnings.push('WARNING: Limited field availability may cause scheduling bottlenecks');
    }

    // Additional capacity validations
    const fieldsNeeded = Math.ceil(totalGamesNeeded / maxGamesPerFieldPerDay);
    if (fieldsNeeded > availableFields.length) {
      errors.push(`CRITICAL: Need ${fieldsNeeded} fields but only ${availableFields.length} available`);
    }

    const hasCapacity = errors.length === 0;

    return {
      hasCapacity,
      totalFieldsNeeded: fieldsNeeded,
      totalFieldsAvailable: availableFields.length,
      daysRequired,
      utilizationPercent: Math.round(utilizationPercent * 10) / 10,
      warnings,
      errors
    };

  } catch (error) {
    console.error('[Field Capacity Check] Error:', error);
    errors.push('Failed to validate field capacity');
    return {
      hasCapacity: false,
      totalFieldsNeeded: 0,
      totalFieldsAvailable: 0,
      daysRequired: 0,
      utilizationPercent: 0,
      warnings,
      errors
    };
  }
}

/**
 * CRITICAL SAFETY CHECK: Prevent duplicate game generation
 */
export async function validateNoDuplicateGames(
  eventId: string,
  targetFlightIds?: number[],
  targetBracketIds?: number[]
): Promise<DuplicateGameCheck> {
  const warnings: string[] = [];
  const errors: string[] = [];
  const affectedFlights: string[] = [];
  const affectedBrackets: string[] = [];

  try {
    console.log(`[Duplicate Game Check] Checking event ${eventId} for existing games`);

    // Check for existing games in the event (simplified query)
    const existingGames = await db
      .select()
      .from(games)
      .where(eq(games.eventId, eventId));

    const existingGamesCount = existingGames.length;
    console.log(`[Duplicate Game Check] Found ${existingGamesCount} existing games`);

    if (existingGamesCount > 0) {
      // Simple check for existing games without complex filtering
      affectedFlights.push('Multiple flights');
      affectedBrackets.push('Multiple brackets');

      // Generate appropriate warnings/errors
      errors.push(`CRITICAL: Cannot generate games - ${existingGamesCount} games already exist for this tournament`);
      errors.push(`SOLUTION: Delete all existing games first before generating new schedule`);
      warnings.push(`Use the delete games function to clear existing schedule before generating new games`);
    }

    const hasDuplicates = existingGamesCount > 0;

    return {
      hasDuplicates,
      existingGamesCount,
      affectedFlights,
      affectedBrackets,
      warnings,
      errors
    };

  } catch (error) {
    console.error('[Duplicate Game Check] Error:', error);
    errors.push('Failed to check for duplicate games');
    return {
      hasDuplicates: true, // Err on side of caution
      existingGamesCount: 0,
      affectedFlights: [],
      affectedBrackets: [],
      warnings,
      errors
    };
  }
}

/**
 * Comprehensive pre-scheduling validation
 */
export async function validateSchedulingSafety(
  eventId: string,
  totalGamesNeeded: number,
  targetFlightIds?: number[],
  targetBracketIds?: number[],
  gameDurationMinutes: number = 90,
  bufferMinutes: number = 15
) {
  console.log(`[Scheduling Safety] Running comprehensive validation for event ${eventId}`);
  
  // Run both checks in parallel
  const [fieldCapacityCheck, duplicateGameCheck] = await Promise.all([
    validateFieldCapacity(eventId, totalGamesNeeded, gameDurationMinutes, bufferMinutes),
    validateNoDuplicateGames(eventId, targetFlightIds, targetBracketIds)
  ]);

  const allErrors = [...fieldCapacityCheck.errors, ...duplicateGameCheck.errors];
  const allWarnings = [...fieldCapacityCheck.warnings, ...duplicateGameCheck.warnings];
  
  const canProceed = allErrors.length === 0;

  return {
    canProceed,
    fieldCapacity: fieldCapacityCheck,
    duplicateGames: duplicateGameCheck,
    summary: {
      totalErrors: allErrors.length,
      totalWarnings: allWarnings.length,
      allErrors,
      allWarnings,
      recommendation: canProceed 
        ? 'Safe to proceed with scheduling'
        : 'BLOCKED: Critical issues must be resolved before scheduling'
    }
  };
}