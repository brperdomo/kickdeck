/**
 * Fix Event Logo Script
 * 
 * This script directly updates the logo URL for a specific event in the database.
 * It bypasses the normal update process to ensure the logo URL is properly set.
 */

import pg from 'pg';
import 'dotenv/config';

const EVENT_ID = 1251362271; // ID of the event with the logo issue
const NEW_LOGO_URL = '/uploads/fantasyleague_1746560042959_2wel9n.png'; // Path to the new logo

async function updateEventLogo() {
  console.log(`Connecting to database...`);
  
  // Create a client using DATABASE_URL from environment variables
  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL,
  });
  
  try {
    await client.connect();
    console.log('Connected to database');
    
    // First check if the branding.logoUrl setting exists
    const checkQuery = `
      SELECT id, setting_key, setting_value 
      FROM event_settings 
      WHERE event_id = $1 AND setting_key = 'branding.logoUrl'
    `;
    
    const result = await client.query(checkQuery, [EVENT_ID]);
    
    if (result.rows.length > 0) {
      console.log(`Found existing logo setting: ${result.rows[0].setting_value}`);
      
      // Update the existing setting
      const updateQuery = `
        UPDATE event_settings 
        SET setting_value = $1, updated_at = NOW() 
        WHERE id = $2
      `;
      
      await client.query(updateQuery, [NEW_LOGO_URL, result.rows[0].id]);
      console.log(`Updated logo URL to: ${NEW_LOGO_URL}`);
      
      // Verify the update
      const verifyResult = await client.query(checkQuery, [EVENT_ID]);
      console.log(`Verified new logo URL: ${verifyResult.rows[0].setting_value}`);
    } else {
      console.log('No existing logo setting found, creating new one');
      
      // Insert a new setting
      const insertQuery = `
        INSERT INTO event_settings (event_id, setting_key, setting_value, created_at, updated_at)
        VALUES ($1, 'branding.logoUrl', $2, NOW(), NOW())
      `;
      
      await client.query(insertQuery, [EVENT_ID, NEW_LOGO_URL]);
      console.log(`Created new logo setting with URL: ${NEW_LOGO_URL}`);
    }
    
    console.log('Operation completed successfully');
  } catch (error) {
    console.error('Error updating event logo:', error);
  } finally {
    await client.end();
    console.log('Database connection closed');
  }
}

updateEventLogo();