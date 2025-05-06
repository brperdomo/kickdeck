/**
 * Fix SendGrid Provider Configuration
 * 
 * This script fixes the SendGrid provider configuration in the database.
 * Run this script to ensure the SendGrid provider exists and is configured properly.
 */

import pg from 'pg';
import dotenv from 'dotenv';

const { Pool } = pg;
dotenv.config();

async function fixSendGridProvider() {
  try {
    if (!process.env.SENDGRID_API_KEY) {
      console.error('ERROR: SENDGRID_API_KEY is not set in environment variables');
      console.log('Please set SENDGRID_API_KEY in your .env file and try again');
      process.exit(1);
    }

    // Create database connection
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });

    console.log('Setting up SendGrid as the primary email provider...');

    // Check if SendGrid provider already exists
    const { rows: providers } = await pool.query(
      "SELECT * FROM email_provider_settings WHERE provider_type = 'sendgrid' LIMIT 1"
    );

    const senderEmail = 'noreply@matchpro.ai'; 
    const senderName = 'MatchPro';

    if (providers && providers.length > 0) {
      // Update existing SendGrid provider
      const [provider] = providers;

      await pool.query(
        `UPDATE email_provider_settings
         SET is_active = true,
             is_default = true,
             settings = $1,
             updated_at = $2
         WHERE id = $3`,
        [JSON.stringify({ from: senderEmail }), new Date().toISOString(), provider.id]
      );

      console.log('Updated existing SendGrid provider configuration');
    } else {
      // Create new SendGrid provider
      await pool.query(
        `INSERT INTO email_provider_settings
         (provider_type, provider_name, is_active, is_default, settings, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        ['sendgrid', 'SendGrid Provider', true, true, JSON.stringify({ from: senderEmail }), new Date().toISOString(), new Date().toISOString()]
      );

      console.log('Created new SendGrid provider configuration');
    }

    // Disable all other email providers
    await pool.query(
      `UPDATE email_provider_settings
       SET is_active = false,
           updated_at = $1
       WHERE provider_type != 'sendgrid'`,
      [new Date().toISOString()]
    );

    console.log('SendGrid is now set as the primary email provider');
    console.log(`Sender Email: ${senderEmail}`);
    console.log(`Sender Name: ${senderName}`);
    console.log('\nIMPORTANT: Make sure to verify this sender in your SendGrid account!');

    // Close connection pool
    await pool.end();
    
    process.exit(0);
  } catch (error) {
    console.error('Error setting up SendGrid provider:', error);
    process.exit(1);
  }
}

fixSendGridProvider();