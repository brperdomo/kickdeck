/**
 * Migration Script: Ensure All Events Have Field Configurations
 * 
 * This script creates field configurations for any existing events
 * that don't have them, ensuring consistent field size management
 */

import { db } from '@db';
import { events, eventFieldConfigurations, fields } from '@db/schema';
import { eq, sql, notInArray } from 'drizzle-orm';

async function ensureEventFieldConfigurations() {
  try {
    console.log('🏟️ [MIGRATION] Starting field configuration migration...');
    
    // Get all events that have field configurations
    const eventsWithConfigs = await db
      .selectDistinct({ eventId: eventFieldConfigurations.eventId })
      .from(eventFieldConfigurations);
    
    const existingEventIds = eventsWithConfigs.map(e => e.eventId);
    console.log(`📊 [MIGRATION] Found ${existingEventIds.length} events with existing field configurations`);
    
    // Get all events that DON'T have field configurations
    let eventsWithoutConfigs;
    if (existingEventIds.length > 0) {
      eventsWithoutConfigs = await db
        .select({ id: events.id, name: events.name })
        .from(events)
        .where(notInArray(events.id, existingEventIds));
    } else {
      eventsWithoutConfigs = await db
        .select({ id: events.id, name: events.name })
        .from(events);
    }
    
    console.log(`🎯 [MIGRATION] Found ${eventsWithoutConfigs.length} events needing field configurations:`);
    eventsWithoutConfigs.forEach(event => {
      console.log(`   - Event ${event.id}: ${event.name}`);
    });
    
    if (eventsWithoutConfigs.length === 0) {
      console.log('✅ [MIGRATION] All events already have field configurations');
      return;
    }
    
    // Get all available fields
    const allFields = await db
      .select({
        id: fields.id,
        name: fields.name,
        fieldSize: fields.fieldSize
      })
      .from(fields)
      .orderBy(fields.id);
    
    console.log(`🏟️ [MIGRATION] Will create configurations for ${allFields.length} fields per event`);
    
    // Create field configurations for each event
    for (const event of eventsWithoutConfigs) {
      console.log(`🔧 [MIGRATION] Creating field configurations for event ${event.id} (${event.name})`);
      
      const fieldConfigurations = allFields.map((field, index) => ({
        eventId: event.id,
        fieldId: field.id,
        fieldSize: field.fieldSize || '11v11',
        sortOrder: index,
        isActive: true,
        firstGameTime: null,
        lastGameTime: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));
      
      await db
        .insert(eventFieldConfigurations)
        .values(fieldConfigurations);
      
      console.log(`   ✅ Created ${fieldConfigurations.length} field configurations`);
    }
    
    console.log(`🎉 [MIGRATION] Successfully created field configurations for ${eventsWithoutConfigs.length} events`);
    console.log(`📈 [MIGRATION] Each event can now customize field sizes independently for optimal scheduling`);
    
  } catch (error: any) {
    console.error('❌ [MIGRATION] Field configuration migration failed:', error);
    throw error;
  }
}

// Export for use in other modules
export { ensureEventFieldConfigurations };

// Run migration if this script is executed directly
async function main() {
  try {
    await ensureEventFieldConfigurations();
    console.log('✅ Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Check if script is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}