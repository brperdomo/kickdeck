
import { db } from '@db/index';
import { sql } from 'drizzle-orm';

export async function createEmailTemplatesTable() {
  try {
    console.log('Creating email_templates table...');
    
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS email_templates (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        type TEXT NOT NULL,
        subject TEXT NOT NULL,
        content TEXT NOT NULL,
        sender_name TEXT NOT NULL,
        sender_email TEXT NOT NULL,
        is_active BOOLEAN DEFAULT true,
        variables JSONB DEFAULT '[]',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('email_templates table created successfully');
    return { success: true };
  } catch (error) {
    console.error('Error creating email_templates table:', error);
    return { success: false, error };
  }
}
