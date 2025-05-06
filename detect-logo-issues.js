/**
 * Logo URL Detection and Debugging Tool
 * 
 * This script helps diagnose issues with event logo URLs by:
 * 1. Checking which event setting records exist for a given event
 * 2. Comparing values between branding.logoUrl vs other erroneous URL entries
 * 3. Providing a fix command to consolidate logo URLs to the correct format
 */

import pg from 'pg';
import 'dotenv/config';

const EVENT_ID = 1251362271; // ID of the event with the logo issue

async function detectLogoIssues() {
  console.log(`Connecting to database...`);
  
  // Create a client using DATABASE_URL from environment variables
  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL,
  });
  
  try {
    await client.connect();
    console.log('Connected to database');
    
    // Check for all branding-related settings
    const checkQuery = `
      SELECT id, setting_key, setting_value, created_at, updated_at
      FROM event_settings 
      WHERE event_id = $1 AND (
        setting_key = 'branding.logoUrl' OR 
        setting_key LIKE '%logo%' OR
        setting_value LIKE '/uploads/%' OR
        setting_key LIKE '/uploads/%'
      )
      ORDER BY setting_key
    `;
    
    const result = await client.query(checkQuery, [EVENT_ID]);
    
    console.log(`Found ${result.rows.length} possible logo-related settings:`);
    result.rows.forEach(row => {
      console.log(`ID: ${row.id}, Key: "${row.setting_key}", Value: "${row.setting_value}", Created: ${row.created_at}, Updated: ${row.updated_at}`);
    });
    
    // Look for the canonical branding.logoUrl setting
    const canonicalSetting = result.rows.find(row => row.setting_key === 'branding.logoUrl');
    if (canonicalSetting) {
      console.log(`\nCanonical setting (branding.logoUrl) exists with value: "${canonicalSetting.setting_value}"`);
    } else {
      console.log(`\nWARNING: No canonical setting (branding.logoUrl) found!`);
    }
    
    // Look for misplaced settings (with URL as the key)
    const misplacedSettings = result.rows.filter(row => row.setting_key.startsWith('/uploads/'));
    if (misplacedSettings.length > 0) {
      console.log(`\nFound ${misplacedSettings.length} misplaced settings (URL as key):`);
      misplacedSettings.forEach(row => {
        console.log(`  ID: ${row.id}, Key: "${row.setting_key}", Value: "${row.setting_value}"`);
      });
      
      // If we have both a canonical setting and misplaced settings, suggest a fix
      if (canonicalSetting && misplacedSettings.length > 0) {
        console.log(`\nPROBLEM DETECTED: Setting with URL as key exists alongside canonical setting.`);
        console.log(`This may be confusing the system when retrieving logo URL.`);
        
        console.log(`\nRecommended fix:`);
        console.log(`1. Update the canonical branding.logoUrl with the new value`);
        console.log(`2. Delete the settings with URL as key`);
        
        console.log(`\nRun this SQL to fix:`);
        console.log(`-- Update canonical setting:`);
        console.log(`UPDATE event_settings SET setting_value = '${misplacedSettings[0].setting_key}', updated_at = NOW() WHERE id = ${canonicalSetting.id};`);
        console.log(`-- Delete misplaced settings:`);
        misplacedSettings.forEach(row => {
          console.log(`DELETE FROM event_settings WHERE id = ${row.id};`);
        });
      }
    } else {
      console.log(`\nNo misplaced settings found (good).`);
    }
    
    console.log('\nOperation completed successfully');
  } catch (error) {
    console.error('Error detecting logo issues:', error);
  } finally {
    await client.end();
    console.log('Database connection closed');
  }
}

detectLogoIssues();