
import { db } from "@db";
import { events } from "@db/schema";
import { eq } from "drizzle-orm";
import { crypto } from "./crypto";

async function migrateEventIds() {
  try {
    // Get all events
    const allEvents = await db.select().from(events);
    
    // Update each event with a new ID
    for (const event of allEvents) {
      const newId = crypto.generateEventId();
      await db
        .update(events)
        .set({ id: newId })
        .where(eq(events.id, event.id));
      
      console.log(`Updated event ${event.id} to ${newId}`);
    }
    
    console.log('Event ID migration completed successfully');
  } catch (error) {
    console.error('Error migrating event IDs:', error);
  } finally {
    process.exit(0);
  }
}

migrateEventIds();
import { db } from "./db";
import { events } from "./db/schema";
import { crypto } from "./crypto";

async function migrateEventIds() {
  try {
    // Get all events
    const allEvents = await db.select().from(events);
    
    // Update each event with a new ID
    for (const event of allEvents) {
      const newId = crypto.generateEventId();
      await db
        .update(events)
        .set({ id: newId })
        .where(eq(events.id, event.id));
      
      console.log(`Updated event ${event.id} to ${newId}`);
    }
    
    console.log('Event ID migration completed successfully');
  } catch (error) {
    console.error('Error migrating event IDs:', error);
  }
}

migrateEventIds();
