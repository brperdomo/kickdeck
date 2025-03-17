import { db } from '@db/index';
import { sql } from 'drizzle-orm';

export async function createEmailTrackingTable() {
  try {
    console.log('Creating email_tracking table...');
    
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS email_tracking (
        id SERIAL PRIMARY KEY,
        template_id INTEGER REFERENCES email_templates(id),
        status TEXT NOT NULL, -- 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed'
        recipient_email TEXT NOT NULL,
        sender_email TEXT NOT NULL,
        subject TEXT NOT NULL,
        sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        delivered_at TIMESTAMP,
        opened_at TIMESTAMP,
        error_message TEXT,
        metadata JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('email_tracking table created successfully');
    return { success: true };
  } catch (error) {
    console.error('Error creating email_tracking table:', error);
    return { success: false, error };
  }
}
