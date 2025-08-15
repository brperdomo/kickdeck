/**
 * Field Availability Service
 * 
 * Manages real field capacity, time slot conflicts, and venue constraints
 * for tournament scheduling. Replaces placeholder/mock field assignments
 * with authentic venue data and conflict detection.
 */

import { db } from "../../db";
import { eq, and, or, between, gte, lte, isNull, inArray, ne, sql } from "drizzle-orm";
import { 
  fields, 
  complexes, 
  gameTimeSlots, 
  games, 
  eventComplexes,
  events,
  eventFieldConfigurations
} from "../../db/schema";

export interface FieldInfo {
  id: number;
  name: string;
  fieldSize: string;
  complexId: number;
  complexName: string;
  openTime: string;
  closeTime: string;
  hasLights: boolean;
  isOpen: boolean;
}

export interface TimeSlot {
  id: number;
  fieldId: number;
  startTime: string;
  endTime: string;
  dayIndex: number;
  isAvailable: boolean;
  field?: FieldInfo;
}

export interface FieldAvailabilityCheck {
  fieldId: number;
  startTime: string;
  endTime: string;
  dayIndex: number;
  isAvailable: boolean;
  conflicts: GameConflict[];
}

export interface GameConflict {
  type: 'time_overlap' | 'field_occupied' | 'capacity_exceeded';
  message: string;
  conflictingGameId?: number;
  suggestedAlternatives?: TimeSlot[];
}

export interface VenueCapacity {
  complexId: number;
  complexName: string;
  totalFields: number;
  availableFields: number;
  fieldsBySize: Record<string, number>;
  operatingHours: {
    openTime: string;
    closeTime: string;
  };
}

export class FieldAvailabilityService {
  
  /**
   * Get all available fields for an event with real venue data
   */
  static async getAvailableFields(eventId: string): Promise<FieldInfo[]> {
    console.log(`🏟️ Getting available fields for event ${eventId}`);
    
    // Get fields with event-specific configurations
    let eventComplexesData = await db
      .select({
        complexId: eventComplexes.complexId,
        complexName: complexes.name,
        complexOpenTime: complexes.openTime,
        complexCloseTime: complexes.closeTime,
        fieldId: fields.id,
        fieldName: fields.name,
        fieldSize: sql`COALESCE(${eventFieldConfigurations.fieldSize}, ${fields.fieldSize})`.as('fieldSize'),
        fieldOpenTime: fields.openTime,
        fieldCloseTime: fields.closeTime,
        hasLights: fields.hasLights,
        isOpen: fields.isOpen,
        isActive: sql`COALESCE(${eventFieldConfigurations.isActive}, true)`.as('isActive'),
        firstGameTime: eventFieldConfigurations.firstGameTime,
        lastGameTime: eventFieldConfigurations.lastGameTime
      })
      .from(eventComplexes)
      .innerJoin(complexes, eq(complexes.id, eventComplexes.complexId))
      .innerJoin(fields, eq(fields.complexId, complexes.id))
      .leftJoin(eventFieldConfigurations, and(
        eq(eventFieldConfigurations.fieldId, fields.id),
        eq(eventFieldConfigurations.eventId, parseInt(eventId))
      ))
      .where(
        and(
          eq(eventComplexes.eventId, eventId),
          eq(complexes.isOpen, true),
          eq(fields.isOpen, true),
          sql`COALESCE(${eventFieldConfigurations.isActive}, true) = true`
        )
      );

    // If no event-complex associations exist, fallback to all available fields with event configurations
    if (eventComplexesData.length === 0) {
      console.log(`⚠️ No event-complex associations found for event ${eventId}, using all available fields with event configurations`);
      eventComplexesData = await db
        .select({
          complexId: complexes.id,
          complexName: complexes.name,
          complexOpenTime: complexes.openTime,
          complexCloseTime: complexes.closeTime,
          fieldId: fields.id,
          fieldName: fields.name,
          fieldSize: sql`COALESCE(${eventFieldConfigurations.fieldSize}, ${fields.fieldSize})`.as('fieldSize'),
          fieldOpenTime: fields.openTime,
          fieldCloseTime: fields.closeTime,
          hasLights: fields.hasLights,
          isOpen: fields.isOpen,
          isActive: sql`COALESCE(${eventFieldConfigurations.isActive}, true)`.as('isActive'),
          firstGameTime: eventFieldConfigurations.firstGameTime,
          lastGameTime: eventFieldConfigurations.lastGameTime
        })
        .from(complexes)
        .innerJoin(fields, eq(fields.complexId, complexes.id))
        .leftJoin(eventFieldConfigurations, and(
          eq(eventFieldConfigurations.fieldId, fields.id),
          eq(eventFieldConfigurations.eventId, parseInt(eventId))
        ))
        .where(
          and(
            eq(complexes.isOpen, true),
            eq(fields.isOpen, true),
            sql`COALESCE(${eventFieldConfigurations.isActive}, true) = true`
          )
        );
    }

    const fieldsInfo: FieldInfo[] = eventComplexesData.map((row: any) => ({
      id: row.fieldId,
      name: row.fieldName,
      fieldSize: row.fieldSize,
      complexId: row.complexId,
      complexName: row.complexName,
      openTime: row.firstGameTime || row.fieldOpenTime || row.complexOpenTime,
      closeTime: row.lastGameTime || row.fieldCloseTime || row.complexCloseTime,
      hasLights: row.hasLights,
      isOpen: row.isActive && row.isOpen
    }));

    console.log(`🏟️ Found ${fieldsInfo.length} available fields across ${new Set(fieldsInfo.map(f => f.complexId)).size} complexes`);
    
    return fieldsInfo;
  }

  /**
   * Get venue capacity analysis for event planning
   */
  static async getVenueCapacity(eventId: string): Promise<VenueCapacity[]> {
    console.log(`📊 Analyzing venue capacity for event ${eventId}`);
    
    const fieldsInfo = await this.getAvailableFields(eventId);
    
    // Group by complex
    const capacityByComplex = fieldsInfo.reduce((acc, field) => {
      if (!acc[field.complexId]) {
        acc[field.complexId] = {
          complexId: field.complexId,
          complexName: field.complexName,
          totalFields: 0,
          availableFields: 0,
          fieldsBySize: {},
          operatingHours: {
            openTime: field.openTime,
            closeTime: field.closeTime
          }
        };
      }
      
      acc[field.complexId].totalFields++;
      if (field.isOpen) {
        acc[field.complexId].availableFields++;
      }
      
      if (!acc[field.complexId].fieldsBySize[field.fieldSize]) {
        acc[field.complexId].fieldsBySize[field.fieldSize] = 0;
      }
      acc[field.complexId].fieldsBySize[field.fieldSize]++;
      
      return acc;
    }, {} as Record<number, VenueCapacity>);

    const capacityArray = Object.values(capacityByComplex);
    console.log(`📊 Analyzed capacity for ${capacityArray.length} complexes`);
    
    return capacityArray;
  }

  /**
   * Check if a specific field is available at a given time
   */
  static async checkFieldAvailability(
    eventId: string,
    fieldId: number,
    startTime: string,
    endTime: string,
    dayIndex: number,
    excludeGameId?: number
  ): Promise<FieldAvailabilityCheck> {
    console.log(`🔍 Checking availability for field ${fieldId} on day ${dayIndex} from ${startTime} to ${endTime}`);
    
    // Check existing time slots
    const conflictingTimeSlots = await db
      .select()
      .from(gameTimeSlots)
      .where(
        and(
          eq(gameTimeSlots.eventId, eventId),
          eq(gameTimeSlots.fieldId, fieldId),
          eq(gameTimeSlots.dayIndex, dayIndex),
          eq(gameTimeSlots.isAvailable, false), // Already booked
          or(
            // Time overlap conditions
            and(
              lte(gameTimeSlots.startTime, startTime),
              gte(gameTimeSlots.endTime, startTime)
            ),
            and(
              lte(gameTimeSlots.startTime, endTime),
              gte(gameTimeSlots.endTime, endTime)
            ),
            and(
              gte(gameTimeSlots.startTime, startTime),
              lte(gameTimeSlots.endTime, endTime)
            )
          )
        )
      );

    // Check existing games
    const conflictingGames = await db
      .select({
        id: games.id,
        startTime: games.startTime,
        endTime: games.endTime,
        homeTeamName: games.homeTeamName,
        awayTeamName: games.awayTeamName
      })
      .from(games)
      .where(
        and(
          eq(games.eventId, eventId),
          eq(games.fieldId, fieldId),
          eq(games.dayIndex, dayIndex),
          ...(excludeGameId ? [ne(games.id, excludeGameId)] : []),
          or(
            // Time overlap conditions for games
            and(
              lte(games.startTime, startTime),
              gte(games.endTime, startTime)
            ),
            and(
              lte(games.startTime, endTime),
              gte(games.endTime, endTime)
            ),
            and(
              gte(games.startTime, startTime),
              lte(games.endTime, endTime)
            )
          )
        )
      );

    const conflicts: GameConflict[] = [];
    
    // Add time slot conflicts
    conflictingTimeSlots.forEach((slot: any) => {
      conflicts.push({
        type: 'time_overlap',
        message: `Field ${fieldId} is already booked from ${slot.startTime} to ${slot.endTime}`
      });
    });

    // Add game conflicts
    conflictingGames.forEach((game: any) => {
      conflicts.push({
        type: 'field_occupied',
        message: `Field ${fieldId} is occupied by game ${game.homeTeamName} vs ${game.awayTeamName} from ${game.startTime} to ${game.endTime}`,
        conflictingGameId: game.id
      });
    });

    const isAvailable = conflicts.length === 0;
    
    console.log(`🔍 Field ${fieldId} availability: ${isAvailable ? 'AVAILABLE' : 'CONFLICTS FOUND'} (${conflicts.length} conflicts)`);
    
    return {
      fieldId,
      startTime,
      endTime,
      dayIndex,
      isAvailable,
      conflicts
    };
  }

  /**
   * Find available time slots for a specific field size
   */
  static async findAvailableTimeSlots(
    eventId: string,
    fieldSize: string,
    dayIndex: number,
    gameDuration: number = 90, // minutes
    bufferTime: number = 15 // minutes between games
  ): Promise<TimeSlot[]> {
    console.log(`🔍 Finding available ${gameDuration}-minute slots for ${fieldSize} fields on day ${dayIndex}`);
    
    // Get fields of the requested size
    const availableFields = await this.getAvailableFields(eventId);
    const sizeMatchingFields = availableFields.filter(f => f.fieldSize === fieldSize);
    
    if (sizeMatchingFields.length === 0) {
      console.log(`⚠️ No fields of size ${fieldSize} available`);
      return [];
    }

    const availableSlots: TimeSlot[] = [];

    // Check each field for available time slots
    for (const field of sizeMatchingFields) {
      // Generate potential time slots based on field operating hours
      const openTime = field.openTime || '08:00';
      const closeTime = field.closeTime || '18:00';
      
      const slots = this.generateTimeSlots(openTime, closeTime, gameDuration, bufferTime);
      
      for (const slot of slots) {
        const availability = await this.checkFieldAvailability(
          eventId,
          field.id,
          slot.startTime,
          slot.endTime,
          dayIndex
        );
        
        if (availability.isAvailable) {
          availableSlots.push({
            id: 0, // Will be assigned when booked
            fieldId: field.id,
            startTime: slot.startTime,
            endTime: slot.endTime,
            dayIndex,
            isAvailable: true,
            field: field
          });
        }
      }
    }

    console.log(`🔍 Found ${availableSlots.length} available time slots for ${fieldSize} fields`);
    return availableSlots;
  }

  /**
   * Reserve a time slot for a game
   */
  static async reserveTimeSlot(
    eventId: string,
    fieldId: number,
    startTime: string,
    endTime: string,
    dayIndex: number
  ): Promise<number> {
    console.log(`🔒 Reserving field ${fieldId} from ${startTime} to ${endTime} on day ${dayIndex}`);
    
    // Check availability first
    const availability = await this.checkFieldAvailability(
      eventId,
      fieldId,
      startTime,
      endTime,
      dayIndex
    );
    
    if (!availability.isAvailable) {
      throw new Error(`Field ${fieldId} is not available at the requested time: ${availability.conflicts.map(c => c.message).join(', ')}`);
    }
    
    // Create the time slot reservation
    const [timeSlot] = await db
      .insert(gameTimeSlots)
      .values({
        eventId,
        fieldId,
        startTime,
        endTime,
        dayIndex,
        isAvailable: false // Mark as booked
      })
      .returning();
    
    console.log(`✅ Reserved time slot ${timeSlot.id} for field ${fieldId}`);
    return timeSlot.id;
  }

  /**
   * Release a time slot reservation
   */
  static async releaseTimeSlot(timeSlotId: number): Promise<void> {
    console.log(`🔓 Releasing time slot reservation ${timeSlotId}`);
    
    await db
      .update(gameTimeSlots)
      .set({ isAvailable: true })
      .where(eq(gameTimeSlots.id, timeSlotId));
    
    console.log(`✅ Time slot ${timeSlotId} released`);
  }

  /**
   * Generate time slots between operating hours
   */
  private static generateTimeSlots(
    openTime: string,
    closeTime: string,
    gameDuration: number,
    bufferTime: number
  ): Array<{ startTime: string; endTime: string }> {
    const slots: Array<{ startTime: string; endTime: string }> = [];
    
    const [openHour, openMin] = openTime.split(':').map(Number);
    const [closeHour, closeMin] = closeTime.split(':').map(Number);
    
    const openMinutes = openHour * 60 + openMin;
    const closeMinutes = closeHour * 60 + closeMin;
    
    let currentMinutes = openMinutes;
    const slotDuration = gameDuration + bufferTime;
    
    while (currentMinutes + gameDuration <= closeMinutes) {
      const startHour = Math.floor(currentMinutes / 60);
      const startMin = currentMinutes % 60;
      const endMinutes = currentMinutes + gameDuration;
      const endHour = Math.floor(endMinutes / 60);
      const endMin = endMinutes % 60;
      
      slots.push({
        startTime: `${startHour.toString().padStart(2, '0')}:${startMin.toString().padStart(2, '0')}`,
        endTime: `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`
      });
      
      currentMinutes += slotDuration;
    }
    
    return slots;
  }

  /**
   * Get field utilization statistics
   */
  static async getFieldUtilization(eventId: string): Promise<Record<number, {
    fieldName: string;
    totalSlots: number;
    bookedSlots: number;
    utilizationPercentage: number;
  }>> {
    console.log(`📈 Calculating field utilization for event ${eventId}`);
    
    const fields = await this.getAvailableFields(eventId);
    const utilization: Record<number, any> = {};
    
    for (const field of fields) {
      const totalSlots = await db
        .select()
        .from(gameTimeSlots)
        .where(
          and(
            eq(gameTimeSlots.eventId, eventId),
            eq(gameTimeSlots.fieldId, field.id)
          )
        );
        
      const bookedSlots = totalSlots.filter((slot: any) => !slot.isAvailable);
      
      utilization[field.id] = {
        fieldName: field.name,
        totalSlots: totalSlots.length,
        bookedSlots: bookedSlots.length,
        utilizationPercentage: totalSlots.length > 0 ? Math.round((bookedSlots.length / totalSlots.length) * 100) : 0
      };
    }
    
    console.log(`📈 Calculated utilization for ${Object.keys(utilization).length} fields`);
    return utilization;
  }
}

