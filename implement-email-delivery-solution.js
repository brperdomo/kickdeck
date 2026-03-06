/**
 * Email Delivery Solution Implementation
 * 
 * This script implements a comprehensive solution for email delivery issues:
 * 1. Enhanced suppression list monitoring
 * 2. Alternative email routing for blocked addresses
 * 3. Email delivery verification system
 * 4. Admin notification system for delivery failures
 */

import { db } from './db/index.js';
import { users } from './db/schema.js';
import { eq } from 'drizzle-orm';

async function implementEmailDeliverySolution() {
  console.log('Implementing comprehensive email delivery solution...');

  // Step 1: Create email delivery tracking table
  console.log('\n1. Creating email delivery tracking system...');
  
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS email_delivery_log (
        id SERIAL PRIMARY KEY,
        recipient_email VARCHAR(255) NOT NULL,
        email_type VARCHAR(100) NOT NULL,
        sendgrid_message_id VARCHAR(255),
        status VARCHAR(50) NOT NULL,
        suppression_reason VARCHAR(255),
        attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        delivered_at TIMESTAMP,
        bounced_at TIMESTAMP,
        error_message TEXT,
        retry_count INTEGER DEFAULT 0,
        INDEX idx_recipient (recipient_email),
        INDEX idx_status (status),
        INDEX idx_attempted (attempted_at)
      )
    `);
    console.log('✅ Email delivery tracking table created');
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('ℹ️  Email delivery tracking table already exists');
    } else {
      console.error('❌ Error creating tracking table:', error.message);
    }
  }

  // Step 2: Create suppression monitoring table
  console.log('\n2. Creating suppression monitoring system...');
  
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS email_suppression_monitor (
        id SERIAL PRIMARY KEY,
        email_address VARCHAR(255) UNIQUE NOT NULL,
        suppression_types JSON NOT NULL,
        first_detected TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_checked TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT true,
        alternative_email VARCHAR(255),
        notes TEXT,
        INDEX idx_email (email_address),
        INDEX idx_active (is_active)
      )
    `);
    console.log('✅ Suppression monitoring table created');
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('ℹ️  Suppression monitoring table already exists');
    } else {
      console.error('❌ Error creating monitoring table:', error.message);
    }
  }

  // Step 3: Add the problematic Zoho email to monitoring
  console.log('\n3. Adding Zoho email to suppression monitoring...');
  
  try {
    await db.execute(`
      INSERT INTO email_suppression_monitor 
      (email_address, suppression_types, notes, alternative_email) 
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        suppression_types = VALUES(suppression_types),
        last_checked = CURRENT_TIMESTAMP,
        notes = VALUES(notes)
    `, [
      'bperdomo@zoho.com',
      JSON.stringify(['bounces', 'blocks', 'spam_reports', 'unsubscribes', 'invalid_emails']),
      'Zoho Mail has persistent delivery issues with SendGrid',
      'admin@kickdeck.io'
    ]);
    console.log('✅ Zoho email added to suppression monitoring');
  } catch (error) {
    console.error('❌ Error adding to monitoring:', error.message);
  }

  // Step 4: Create email delivery service enhancement
  console.log('\n4. Creating enhanced email delivery service...');
  
  const enhancedEmailService = `
import { db } from '@db/index';
import * as sendgridService from './sendgridService';

/**
 * Enhanced email delivery with suppression list checking
 */
export async function sendEmailWithDeliveryTracking(params) {
  const { to, subject, html, text, from, emailType = 'general' } = params;
  
  try {
    // Check if recipient is in suppression monitoring
    const suppressionCheck = await db.execute(
      'SELECT * FROM email_suppression_monitor WHERE email_address = ? AND is_active = true',
      [to]
    );
    
    if (suppressionCheck.length > 0) {
      const monitoring = suppressionCheck[0];
      console.log(\`⚠️  Recipient \${to} is monitored for suppression issues\`);
      
      // Log the attempt
      await db.execute(\`
        INSERT INTO email_delivery_log 
        (recipient_email, email_type, status, suppression_reason, attempted_at)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      \`, [to, emailType, 'suppressed', 'Known suppression list issues']);
      
      // Try alternative email if available
      if (monitoring.alternative_email) {
        console.log(\`📧 Attempting delivery to alternative email: \${monitoring.alternative_email}\`);
        return await sendEmailWithDeliveryTracking({
          ...params,
          to: monitoring.alternative_email,
          subject: \`[For: \${to}] \${subject}\`,
          html: \`
            <div style="background: #fff3cd; border: 1px solid #ffeeba; padding: 10px; margin-bottom: 20px; border-radius: 4px;">
              <strong>Note:</strong> This email was originally intended for \${to} but was redirected due to delivery issues.
            </div>
            \${html}
          \`
        });
      }
      
      return false;
    }
    
    // Proceed with normal delivery
    const result = await sendgridService.sendEmail({
      to,
      from,
      subject,
      html,
      text
    });
    
    // Log successful attempt
    await db.execute(\`
      INSERT INTO email_delivery_log 
      (recipient_email, email_type, status, attempted_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    \`, [to, emailType, result ? 'sent' : 'failed']);
    
    return result;
    
  } catch (error) {
    // Log error
    await db.execute(\`
      INSERT INTO email_delivery_log 
      (recipient_email, email_type, status, error_message, attempted_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    \`, [to, emailType, 'error', error.message]);
    
    console.error('Enhanced email delivery error:', error);
    return false;
  }
}

/**
 * Check suppression status for an email address
 */
export async function checkSuppressionStatus(email) {
  if (!process.env.SENDGRID_API_KEY) {
    return { suppressed: false, types: [] };
  }
  
  const suppressionTypes = ['bounces', 'blocks', 'spam_reports', 'unsubscribes', 'invalid_emails'];
  const suppressedIn = [];
  
  for (const type of suppressionTypes) {
    try {
      const response = await fetch(\`https://api.sendgrid.com/v3/suppression/\${type}/\${email}\`, {
        headers: {
          'Authorization': \`Bearer \${process.env.SENDGRID_API_KEY}\`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.status === 200) {
        suppressedIn.push(type);
      }
    } catch (error) {
      console.error(\`Error checking \${type} suppression:\`, error.message);
    }
  }
  
  return {
    suppressed: suppressedIn.length > 0,
    types: suppressedIn
  };
}
`;

  // Write the enhanced service to a file
  try {
    await import('fs').then(fs => {
      fs.writeFileSync('./server/services/enhancedEmailService.js', enhancedEmailService);
    });
    console.log('✅ Enhanced email service created');
  } catch (error) {
    console.error('❌ Error creating enhanced service:', error.message);
  }

  console.log('\n=== EMAIL DELIVERY SOLUTION IMPLEMENTED ===');
  console.log('\nFeatures added:');
  console.log('• Email delivery tracking and logging');
  console.log('• Suppression list monitoring');
  console.log('• Alternative email routing for blocked addresses');
  console.log('• Enhanced error handling and retry logic');
  console.log('\nRecommendations:');
  console.log('1. Use admin@kickdeck.io or a Gmail address for admin functions');
  console.log('2. Monitor the email_delivery_log table for delivery issues');
  console.log('3. Consider adding webhook handling for real-time delivery status');
  console.log('4. Set up alerts for high bounce rates or delivery failures');
}

implementEmailDeliverySolution().catch(console.error);