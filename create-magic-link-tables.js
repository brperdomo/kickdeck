/**
 * Create Magic Link Tables
 * 
 * This script creates the necessary tables for the magic link authentication system:
 * 1. magic_link_tokens table to store one-time tokens
 * 2. Adds the magic_link template to the email_templates table
 */

import { db, pool } from './db/index.js';
import { sql } from 'drizzle-orm';

async function createMagicLinkTokensTable() {
  console.log("Creating magic_link_tokens table...");
  
  try {
    // Check if the table already exists
    const tableExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'magic_link_tokens'
      );
    `);

    if (tableExists[0].exists) {
      console.log("magic_link_tokens table already exists");
      return;
    }

    // Create the table
    await db.execute(sql`
      CREATE TABLE magic_link_tokens (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token TEXT NOT NULL UNIQUE,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        used BOOLEAN NOT NULL DEFAULT FALSE,
        user_agent TEXT,
        ip_address TEXT,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
      
      -- Index for faster token lookups
      CREATE INDEX idx_magic_link_tokens_token ON magic_link_tokens(token);
      
      -- Index for querying by user ID
      CREATE INDEX idx_magic_link_tokens_user_id ON magic_link_tokens(user_id);
    `);

    console.log("Created magic_link_tokens table successfully");
  } catch (error) {
    console.error("Error creating magic_link_tokens table:", error);
    throw error;
  }
}

async function createMagicLinkEmailTemplate() {
  console.log("Checking for magic_link email template...");
  
  try {
    // Check if the template already exists
    const templateExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM email_templates
        WHERE type = 'magic_link'
      );
    `);

    if (templateExists[0].exists) {
      console.log("magic_link email template already exists");
      return;
    }

    // Create the template
    const now = new Date();
    await db.execute(sql`
      INSERT INTO email_templates (
        name, type, subject, content, "senderName", "senderEmail", 
        description, "createdAt", "updatedAt"
      ) VALUES (
        'Magic Link Login', 'magic_link', 'Your MatchPro Login Link',
        '<html><body><p>Hello,</p><p>Click the link below to log in to your MatchPro account:</p><p><a href="{{magicLinkUrl}}">Log in to MatchPro</a></p><p>This link will expire in 30 minutes.</p><p>If you did not request this link, please ignore this email.</p><p>Best regards,<br>The MatchPro Team</p></body></html>',
        'MatchPro', 'support@matchpro.ai',
        'Email template for magic link authentication', 
        ${now.toISOString()}, ${now.toISOString()}
      )
    `);

    console.log("Created magic_link email template successfully");
  } catch (error) {
    console.error("Error creating magic_link email template:", error);
    throw error;
  }
}

async function main() {
  try {
    await createMagicLinkTokensTable();
    await createMagicLinkEmailTemplate();
    console.log("Magic link setup completed successfully!");
  } catch (error) {
    console.error("Error during magic link setup:", error);
  } finally {
    // Close the database connection
    await pool.end();
  }
}

main();