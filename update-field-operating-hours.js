const { db } = require('./db');
const { fields, complexes } = require('./db/schema');
const { eq } = require('drizzle-orm');

// This script adds open_time and close_time fields to existing fields
// If a field doesn't have times set, it will inherit from its complex

async function migrateFieldOperatingHours() {
  console.log('Starting migration to add operating hours to fields...');
  
  try {
    // Get all fields without operating hours set
    const fieldsToUpdate = await db
      .select({
        id: fields.id,
        complexId: fields.complexId
      })
      .from(fields)
      .where(
        // Either openTime is null or closeTime is null
        (fields.openTime === null) || (fields.closeTime === null)
      );
    
    console.log(`Found ${fieldsToUpdate.length} fields that need operating hours set`);
    
    // Process each field
    for (const field of fieldsToUpdate) {
      // Get the complex for this field
      const [complex] = await db
        .select({
          openTime: complexes.openTime,
          closeTime: complexes.closeTime
        })
        .from(complexes)
        .where(eq(complexes.id, field.complexId));
      
      if (!complex) {
        console.log(`Warning: No complex found for field ID ${field.id}`);
        continue;
      }
      
      // Update the field with the complex's operating hours
      await db
        .update(fields)
        .set({
          openTime: complex.openTime || '08:00',
          closeTime: complex.closeTime || '22:00',
          updatedAt: new Date().toISOString()
        })
        .where(eq(fields.id, field.id));
      
      console.log(`Updated field ID ${field.id} with operating hours from its complex`);
    }
    
    console.log('Field operating hours migration completed successfully');
  } catch (error) {
    console.error('Error during field operating hours migration:', error);
  }
}

// Run the migration
migrateFieldOperatingHours().then(() => {
  console.log('Migration complete');
  process.exit(0);
}).catch(error => {
  console.error('Migration failed:', error);
  process.exit(1);
});