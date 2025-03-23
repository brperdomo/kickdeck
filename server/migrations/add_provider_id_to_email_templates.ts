import { db } from '@db/index';
import { sql } from 'drizzle-orm';

export async function addProviderIdToEmailTemplates() {
  try {
    console.log('Adding provider_id column to email_templates table...');
    
    // Check if the column already exists
    const checkColumnQuery = sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='email_templates' AND column_name='provider_id';
    `;
    const columnExists = await db.execute(checkColumnQuery);
    
    // Only add the column if it doesn't already exist
    if (columnExists.rows.length === 0) {
      await db.execute(sql`
        ALTER TABLE email_templates
        ADD COLUMN provider_id INTEGER;
      `);
      console.log('provider_id column added successfully to email_templates table');
    } else {
      console.log('provider_id column already exists in email_templates table');
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error adding provider_id column to email_templates table:', error);
    return { success: false, error };
  }
}