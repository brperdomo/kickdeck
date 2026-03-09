import { db } from '@db/index';
import { sql } from 'drizzle-orm';

export async function createEmailProviderSettingsTable() {
  try {
    console.log('Creating email_provider_settings table...');
    
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS email_provider_settings (
        id SERIAL PRIMARY KEY,
        provider_type TEXT NOT NULL, -- 'smtp', 'brevo', 'mailgun', etc.
        provider_name TEXT NOT NULL,
        settings JSONB NOT NULL, -- Store provider-specific settings
        is_active BOOLEAN DEFAULT true,
        is_default BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('email_provider_settings table created successfully');
    return { success: true };
  } catch (error) {
    console.error('Error creating email_provider_settings table:', error);
    return { success: false, error };
  }
}
