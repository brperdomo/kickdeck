/**
 * Fix Misplaced Logo Settings
 * 
 * This script fixes an issue where logo URLs are stored in two different settings:
 * 1. The proper 'branding.logoUrl' setting
 * 2. A misplaced setting where the URL itself is used as the key
 * 
 * The script will delete the misplaced settings to avoid confusion in the system.
 */

import pg from 'pg';
import 'dotenv/config';

const EVENT_ID = 1251362271; // ID of the event with the logo issue

async function fixMisplacedLogoSettings() {
  console.log(`Connecting to database...`);
  
  // Create a client using DATABASE_URL from environment variables
  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL,
  });
  
  try {
    await client.connect();
    console.log('Connected to database');
    
    // 1. Get the canonical branding.logoUrl setting
    const canonicalQuery = `
      SELECT id, setting_key, setting_value 
      FROM event_settings 
      WHERE event_id = $1 AND setting_key = 'branding.logoUrl'
    `;
    
    const canonicalResult = await client.query(canonicalQuery, [EVENT_ID]);
    
    if (canonicalResult.rows.length === 0) {
      console.log('No canonical branding.logoUrl setting found, nothing to do.');
      return;
    }
    
    const canonicalSetting = canonicalResult.rows[0];
    console.log(`Found canonical setting: ID=${canonicalSetting.id}, Value="${canonicalSetting.setting_value}"`);
    
    // 2. Find any misplaced settings with URL as key
    const misplacedQuery = `
      SELECT id, setting_key, setting_value 
      FROM event_settings 
      WHERE event_id = $1 AND setting_key LIKE '/uploads/%'
    `;
    
    const misplacedResult = await client.query(misplacedQuery, [EVENT_ID]);
    
    if (misplacedResult.rows.length === 0) {
      console.log('No misplaced settings found, nothing to delete.');
      return;
    }
    
    console.log(`Found ${misplacedResult.rows.length} misplaced settings to fix:`);
    for (const row of misplacedResult.rows) {
      console.log(`- ID=${row.id}, Key="${row.setting_key}", Value="${row.setting_value}"`);
    }
    
    // 3. Delete the misplaced settings
    for (const row of misplacedResult.rows) {
      const deleteQuery = `
        DELETE FROM event_settings 
        WHERE id = $1
      `;
      
      await client.query(deleteQuery, [row.id]);
      console.log(`Deleted misplaced setting: ID=${row.id}, Key="${row.setting_key}"`);
    }
    
    console.log('\nVerifying the fix:');
    
    // 4. Verify the canonical setting is still there
    const verifyCanonicalResult = await client.query(canonicalQuery, [EVENT_ID]);
    if (verifyCanonicalResult.rows.length > 0) {
      console.log(`Canonical setting still exists: ID=${verifyCanonicalResult.rows[0].id}, Value="${verifyCanonicalResult.rows[0].setting_value}"`);
    }
    
    // 5. Verify no misplaced settings remain
    const verifyMisplacedResult = await client.query(misplacedQuery, [EVENT_ID]);
    if (verifyMisplacedResult.rows.length === 0) {
      console.log('No misplaced settings remain - fix successful!');
    } else {
      console.log(`WARNING: ${verifyMisplacedResult.rows.length} misplaced settings still exist!`);
    }
    
    console.log('\nOperation completed successfully');
  } catch (error) {
    console.error('Error fixing misplaced logo settings:', error);
  } finally {
    await client.end();
    console.log('Database connection closed');
  }
}

fixMisplacedLogoSettings();