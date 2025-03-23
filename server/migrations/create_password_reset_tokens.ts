import { db } from '@db/index';
import { sql } from 'drizzle-orm';

export async function createPasswordResetTokensTable() {
  try {
    console.log('Creating password_reset_tokens table...');
    
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token TEXT NOT NULL UNIQUE,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        used_at TIMESTAMP
      )
    `);
    
    console.log('password_reset_tokens table created successfully');
    return { success: true };
  } catch (error) {
    console.error('Error creating password_reset_tokens table:', error);
    return { success: false, error };
  }
}