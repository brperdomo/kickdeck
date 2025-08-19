/**
 * Event Field Configuration Service
 * 
 * Automatically creates field configurations for events to ensure
 * each tournament can customize field sizes based on their flight requirements
 */

import { db } from '@db';
import { eventFieldConfigurations, fields } from '@db/schema';
import { eq, sql } from 'drizzle-orm';

export class EventFieldConfigService {
  /**
   * Create field configurations for a new event
   * This ensures every event has its own field size customization
   */
  static async createFieldConfigurationsForEvent(eventId: number): Promise<void> {
    try {
      console.log(`🏟️ [FIELD CONFIG] Creating field configurations for event ${eventId}`);
      
      // Check if field configurations already exist for this event
      const existingConfigs = await db
        .select({ count: sql`COUNT(*)` })
        .from(eventFieldConfigurations)
        .where(eq(eventFieldConfigurations.eventId, eventId));
      
      const existingCount = Number(existingConfigs[0]?.count || 0);
      
      if (existingCount > 0) {
        console.log(`🏟️ [FIELD CONFIG] Event ${eventId} already has ${existingCount} field configurations`);
        return;
      }
      
      // Fetch all available fields
      const allFields = await db
        .select({
          id: fields.id,
          name: fields.name,
          fieldSize: fields.fieldSize,
          hasLights: fields.hasLights,
          isOpen: fields.isOpen
        })
        .from(fields)
        .orderBy(fields.id);
      
      if (allFields.length === 0) {
        console.log(`⚠️ [FIELD CONFIG] No fields found in system - cannot create configurations`);
        return;
      }
      
      // Create field configurations for all fields
      const fieldConfigurations = allFields.map((field, index) => ({
        eventId: eventId,
        fieldId: field.id,
        fieldSize: field.fieldSize || '11v11', // Default to 11v11 if not specified
        sortOrder: index,
        isActive: true,
        firstGameTime: null,
        lastGameTime: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));
      
      // Insert all field configurations
      await db
        .insert(eventFieldConfigurations)
        .values(fieldConfigurations);
      
      console.log(`✅ [FIELD CONFIG] Created ${fieldConfigurations.length} field configurations for event ${eventId}`);
      console.log(`🎯 [FIELD CONFIG] Field sizes can now be customized per event for optimal game scheduling`);
      
    } catch (error: any) {
      console.error(`❌ [FIELD CONFIG] Failed to create field configurations for event ${eventId}:`, error);
      throw new Error(`Failed to create field configurations: ${error.message}`);
    }
  }
  
  /**
   * Ensure all existing events have field configurations
   * Useful for migrating existing events to the new system
   */
  static async ensureAllEventsHaveFieldConfigurations(): Promise<void> {
    try {
      console.log(`🔄 [FIELD CONFIG] Ensuring all events have field configurations...`);
      
      // Get all events that have field configurations
      const eventsWithConfigs = await db
        .selectDistinct({ eventId: eventFieldConfigurations.eventId })
        .from(eventFieldConfigurations);
      
      const existingEventIds = eventsWithConfigs.map(e => e.eventId);
      
      // Get all events that don't have field configurations
      let allEvents;
      if (existingEventIds.length > 0) {
        const { notInArray } = await import('drizzle-orm');
        allEvents = await db.query.events.findMany({
          where: (events) => notInArray(events.id, existingEventIds),
          columns: { id: true, name: true }
        });
      } else {
        allEvents = await db.query.events.findMany({
          columns: { id: true, name: true }
        });
      }
      
      console.log(`🏟️ [FIELD CONFIG] Found ${allEvents.length} events without field configurations`);
      
      // Create field configurations for each event
      for (const event of allEvents) {
        await this.createFieldConfigurationsForEvent(event.id);
      }
      
      console.log(`✅ [FIELD CONFIG] Migration complete - all events now have field configurations`);
      
    } catch (error: any) {
      console.error(`❌ [FIELD CONFIG] Migration failed:`, error);
      throw error;
    }
  }
  
  /**
   * Get field configurations for an event with scheduling metadata
   */
  static async getEventFieldConfigurations(eventId: number) {
    try {
      const configurations = await db
        .select({
          id: eventFieldConfigurations.id,
          fieldId: eventFieldConfigurations.fieldId,
          fieldSize: eventFieldConfigurations.fieldSize,
          sortOrder: eventFieldConfigurations.sortOrder,
          isActive: eventFieldConfigurations.isActive,
          firstGameTime: eventFieldConfigurations.firstGameTime,
          lastGameTime: eventFieldConfigurations.lastGameTime,
          // Field details
          fieldName: fields.name,
          hasLights: fields.hasLights,
          isOpen: fields.isOpen
        })
        .from(eventFieldConfigurations)
        .leftJoin(fields, eq(eventFieldConfigurations.fieldId, fields.id))
        .where(eq(eventFieldConfigurations.eventId, eventId))
        .orderBy(eventFieldConfigurations.sortOrder);
      
      return configurations;
      
    } catch (error: any) {
      console.error(`❌ [FIELD CONFIG] Failed to get configurations for event ${eventId}:`, error);
      throw error;
    }
  }
  
  /**
   * Update field size for specific field in an event
   */
  static async updateFieldSize(eventId: number, fieldId: number, newFieldSize: string) {
    try {
      console.log(`🎯 [FIELD CONFIG] Updating field ${fieldId} size to ${newFieldSize} for event ${eventId}`);
      
      const [updatedConfig] = await db
        .update(eventFieldConfigurations)
        .set({
          fieldSize: newFieldSize,
          updatedAt: new Date().toISOString()
        })
        .where(
          eq(eventFieldConfigurations.eventId, eventId) &&
          eq(eventFieldConfigurations.fieldId, fieldId)
        )
        .returning();
      
      if (!updatedConfig) {
        throw new Error(`Field configuration not found for event ${eventId}, field ${fieldId}`);
      }
      
      console.log(`✅ [FIELD CONFIG] Updated field ${fieldId} size to ${newFieldSize}`);
      return updatedConfig;
      
    } catch (error: any) {
      console.error(`❌ [FIELD CONFIG] Failed to update field size:`, error);
      throw error;
    }
  }
}