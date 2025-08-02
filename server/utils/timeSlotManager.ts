import { db } from '@db';
import { gameTimeSlots, fields, eventScheduleConstraints, events } from '@db/schema';
import { eq, and } from 'drizzle-orm';

export interface TimeSlot {
  id: number;
  eventId: string;
  fieldId: number;
  startTime: string;
  endTime: string;
  dayIndex: number;
  isAvailable: boolean;
}

export interface TimeSlotRequest {
  eventId: string;
  duration: number; // in minutes
  bufferTime: number; // in minutes
  fieldSize?: string;
}

export class TimeSlotManager {
  
  /**
   * Generate time slots for an event based on constraints and field availability
   */
  static async generateTimeSlotsForEvent(eventId: string): Promise<void> {
    console.log(`[TimeSlotManager] Generating time slots for event ${eventId}`);
    
    // Get event details (convert eventId to number since events.id is bigint)
    const event = await db.query.events.findFirst({
      where: eq(events.id, parseInt(eventId))
    });
    
    if (!event) {
      throw new Error(`Event ${eventId} not found`);
    }
    
    // Get schedule constraints
    const constraints = await db.query.eventScheduleConstraints.findFirst({
      where: eq(eventScheduleConstraints.eventId, parseInt(eventId))
    });
    
    // Get available fields
    const availableFields = await db.query.fields.findMany({
      where: eq(fields.isOpen, true)
    });
    
    if (availableFields.length === 0) {
      throw new Error('No available fields found');
    }
    
    // Generate time slots for each day of the event
    const startDate = new Date(event.startDate);
    const endDate = new Date(event.endDate);
    const timeSlotsToCreate = [];
    
    let dayIndex = 0;
    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      const earliestTime = constraints?.earliestGameTime || '08:00';
      const latestTime = constraints?.latestGameTime || '20:00';
      
      // Generate 30-minute time slots for each field
      for (const field of availableFields) {
        const slots = this.generateDayTimeSlots(
          eventId,
          field.id,
          dayIndex,
          earliestTime,
          latestTime,
          30 // 30-minute slots
        );
        timeSlotsToCreate.push(...slots);
      }
      
      dayIndex++;
    }
    
    // Insert time slots in batches
    if (timeSlotsToCreate.length > 0) {
      await db.insert(gameTimeSlots).values(timeSlotsToCreate);
      console.log(`[TimeSlotManager] Created ${timeSlotsToCreate.length} time slots`);
    }
  }
  
  /**
   * Generate time slots for a single day and field
   */
  private static generateDayTimeSlots(
    eventId: string,
    fieldId: number,
    dayIndex: number,
    earliestTime: string,
    latestTime: string,
    slotDuration: number
  ): any[] {
    const slots = [];
    
    const [earliestHour, earliestMin] = earliestTime.split(':').map(Number);
    const [latestHour, latestMin] = latestTime.split(':').map(Number);
    
    const startMinutes = earliestHour * 60 + earliestMin;
    const endMinutes = latestHour * 60 + latestMin;
    
    for (let minutes = startMinutes; minutes < endMinutes; minutes += slotDuration) {
      const startHour = Math.floor(minutes / 60);
      const startMin = minutes % 60;
      const endHour = Math.floor((minutes + slotDuration) / 60);
      const endMin = (minutes + slotDuration) % 60;
      
      const startTime = `${startHour.toString().padStart(2, '0')}:${startMin.toString().padStart(2, '0')}`;
      const endTime = `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`;
      
      slots.push({
        eventId,
        fieldId,
        startTime,
        endTime,
        dayIndex,
        isAvailable: true
      });
    }
    
    return slots;
  }
  
  /**
   * Find available time slot for a game
   */
  static async findAvailableTimeSlot(request: TimeSlotRequest): Promise<TimeSlot | null> {
    const availableSlots = await db.query.gameTimeSlots.findMany({
      where: and(
        eq(gameTimeSlots.eventId, request.eventId),
        eq(gameTimeSlots.isAvailable, true)
      )
    });
    
    // Simple slot selection - find first available slot
    // In a real implementation, this would consider game duration, buffer time, etc.
    return availableSlots[0] || null;
  }
  
  /**
   * Reserve a time slot for a game
   */
  static async reserveTimeSlot(timeSlotId: number): Promise<void> {
    await db
      .update(gameTimeSlots)
      .set({ isAvailable: false })
      .where(eq(gameTimeSlots.id, timeSlotId));
  }
  
  /**
   * Release a time slot (make it available again)
   */
  static async releaseTimeSlot(timeSlotId: number): Promise<void> {
    await db
      .update(gameTimeSlots)
      .set({ isAvailable: true })
      .where(eq(gameTimeSlots.id, timeSlotId));
  }
}