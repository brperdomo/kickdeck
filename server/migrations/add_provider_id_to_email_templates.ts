import { db } from "@db";
import { sql } from "drizzle-orm";

/**
 * Migration to add providerId column to email_templates table
 * This allows templates to be associated with specific email providers
 */
export async function addProviderIdToEmailTemplates() {
  try {
    // Check if providerId column already exists
    const result = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='email_templates' AND column_name='provider_id';
    `);
    
    // If providerId column doesn't exist, add it
    if (result.rows.length === 0) {
      console.log('Adding provider_id column to email_templates table...');
      
      await db.execute(sql`
        ALTER TABLE email_templates 
        ADD COLUMN provider_id INTEGER REFERENCES email_provider_settings(id) ON DELETE SET NULL;
      `);

      console.log('Successfully added provider_id column to email_templates table');
    } else {
      console.log('provider_id column already exists in email_templates table');
    }
    
    return true;
  } catch (error) {
    console.error('Error adding provider_id to email_templates:', error);
    return false;
  }
}

// Only run migration directly if this file is being executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  addProviderIdToEmailTemplates().then(success => {
    if (success) {
      console.log('Migration completed successfully');
      process.exit(0);
    } else {
      console.error('Migration failed');
      process.exit(1);
    }
  });
}