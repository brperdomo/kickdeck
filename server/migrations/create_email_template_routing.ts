import { db } from '@db/index';
import { sql } from 'drizzle-orm';

export async function createEmailTemplateRoutingTable() {
  try {
    console.log('Creating email_template_routing table...');
    
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS email_template_routing (
        id SERIAL PRIMARY KEY,
        template_type TEXT NOT NULL,
        provider_id INTEGER NOT NULL REFERENCES email_provider_settings(id),
        from_email TEXT NOT NULL,
        from_name TEXT NOT NULL,
        is_active BOOLEAN DEFAULT true NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(template_type)
      )
    `);
    
    console.log('email_template_routing table created successfully');
    return { success: true };
  } catch (error) {
    console.error('Error creating email_template_routing table:', error);
    return { success: false, error };
  }
}
