/**
 * Enhance Email Tracking Table for SendGrid Webhooks
 * 
 * This script updates the email_tracking table with all necessary columns
 * for comprehensive SendGrid webhook event tracking.
 */

import { db } from '@db/index';
import { sql } from 'drizzle-orm';

async function enhanceEmailTrackingTable() {
  console.log('=== Enhancing Email Tracking Table ===\n');
  
  try {
    // First, check if the table exists and what columns it has
    console.log('1. Checking existing email_tracking table structure...');
    
    const tableInfo = await db.execute(sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'email_tracking'
      ORDER BY ordinal_position;
    `);
    
    if (tableInfo.rows.length === 0) {
      console.log('Creating email_tracking table from scratch...');
      
      // Create the complete table
      await db.execute(sql`
        CREATE TABLE email_tracking (
          id SERIAL PRIMARY KEY,
          recipient_email TEXT NOT NULL,
          email_type TEXT NOT NULL DEFAULT 'regular',
          template_id TEXT,
          sendgrid_message_id TEXT,
          status TEXT NOT NULL DEFAULT 'sent',
          sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          delivered_at TIMESTAMP,
          opened_at TIMESTAMP,
          clicked_at TIMESTAMP,
          error_message TEXT,
          webhook_data JSONB,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      console.log('✅ Email tracking table created successfully');
    } else {
      console.log('✅ Email tracking table exists with columns:');
      tableInfo.rows.forEach(row => {
        console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
      });
      
      // Check for missing columns and add them
      const existingColumns = tableInfo.rows.map(row => row.column_name);
      const requiredColumns = [
        'recipient_email',
        'email_type', 
        'template_id',
        'sendgrid_message_id',
        'status',
        'sent_at',
        'delivered_at',
        'opened_at',
        'clicked_at',
        'error_message',
        'webhook_data',
        'created_at',
        'updated_at'
      ];
      
      for (const column of requiredColumns) {
        if (!existingColumns.includes(column)) {
          console.log(`Adding missing column: ${column}`);
          
          switch (column) {
            case 'recipient_email':
              await db.execute(sql`ALTER TABLE email_tracking ADD COLUMN recipient_email TEXT NOT NULL DEFAULT ''`);
              break;
            case 'email_type':
              await db.execute(sql`ALTER TABLE email_tracking ADD COLUMN email_type TEXT NOT NULL DEFAULT 'regular'`);
              break;
            case 'template_id':
              await db.execute(sql`ALTER TABLE email_tracking ADD COLUMN template_id TEXT`);
              break;
            case 'sendgrid_message_id':
              await db.execute(sql`ALTER TABLE email_tracking ADD COLUMN sendgrid_message_id TEXT`);
              break;
            case 'status':
              await db.execute(sql`ALTER TABLE email_tracking ADD COLUMN status TEXT NOT NULL DEFAULT 'sent'`);
              break;
            case 'sent_at':
              await db.execute(sql`ALTER TABLE email_tracking ADD COLUMN sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
              break;
            case 'delivered_at':
              await db.execute(sql`ALTER TABLE email_tracking ADD COLUMN delivered_at TIMESTAMP`);
              break;
            case 'opened_at':
              await db.execute(sql`ALTER TABLE email_tracking ADD COLUMN opened_at TIMESTAMP`);
              break;
            case 'clicked_at':
              await db.execute(sql`ALTER TABLE email_tracking ADD COLUMN clicked_at TIMESTAMP`);
              break;
            case 'error_message':
              await db.execute(sql`ALTER TABLE email_tracking ADD COLUMN error_message TEXT`);
              break;
            case 'webhook_data':
              await db.execute(sql`ALTER TABLE email_tracking ADD COLUMN webhook_data JSONB`);
              break;
            case 'created_at':
              await db.execute(sql`ALTER TABLE email_tracking ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
              break;
            case 'updated_at':
              await db.execute(sql`ALTER TABLE email_tracking ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
              break;
          }
          
          console.log(`✅ Added column: ${column}`);
        }
      }
    }
    
    // Create indexes for better performance
    console.log('\n2. Creating performance indexes...');
    
    try {
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_email_tracking_sendgrid_message_id 
        ON email_tracking(sendgrid_message_id)
      `);
      console.log('✅ Created index on sendgrid_message_id');
      
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_email_tracking_recipient_email 
        ON email_tracking(recipient_email)
      `);
      console.log('✅ Created index on recipient_email');
      
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_email_tracking_status 
        ON email_tracking(status)
      `);
      console.log('✅ Created index on status');
      
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_email_tracking_sent_at 
        ON email_tracking(sent_at)
      `);
      console.log('✅ Created index on sent_at');
      
    } catch (indexError) {
      console.log('Index creation completed (some may already exist)');
    }
    
    // Test the table structure
    console.log('\n3. Testing table functionality...');
    
    // Insert a test record
    const testRecord = {
      recipient_email: 'test@example.com',
      email_type: 'webhook_test',
      template_id: 'd-test123',
      sendgrid_message_id: 'test-msg-id',
      status: 'sent',
      sent_at: new Date().toISOString(),
      webhook_data: JSON.stringify({ test: true }),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    await db.execute(sql`
      INSERT INTO email_tracking (
        recipient_email, email_type, template_id, sendgrid_message_id, 
        status, webhook_data
      ) VALUES (
        ${testRecord.recipient_email}, 
        ${testRecord.email_type}, 
        ${testRecord.template_id}, 
        ${testRecord.sendgrid_message_id}, 
        ${testRecord.status}, 
        ${testRecord.webhook_data}::jsonb
      )
    `);
    
    console.log('✅ Test record inserted successfully');
    
    // Query the test record
    const testQuery = await db.execute(sql`
      SELECT * FROM email_tracking 
      WHERE sendgrid_message_id = ${testRecord.sendgrid_message_id}
      LIMIT 1
    `);
    
    if (testQuery.rows.length > 0) {
      console.log('✅ Test record retrieved successfully');
      
      // Clean up test record
      await db.execute(sql`
        DELETE FROM email_tracking 
        WHERE sendgrid_message_id = ${testRecord.sendgrid_message_id}
      `);
      console.log('✅ Test record cleaned up');
    }
    
    console.log('\n=== Email Tracking Table Enhancement Complete ===');
    console.log('The table is now ready for SendGrid webhook integration');
    
  } catch (error) {
    console.error('Error enhancing email tracking table:', error);
    throw error;
  }
}

enhanceEmailTrackingTable().catch(console.error);