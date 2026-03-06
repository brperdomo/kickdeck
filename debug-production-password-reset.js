/**
 * Debug Production Password Reset Issue
 * 
 * This script tests the exact password reset flow that's failing in production
 * and compares it with development behavior to identify the root cause.
 */

import { MailService } from '@sendgrid/mail';
import fetch from 'node-fetch';

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const NODE_ENV = process.env.NODE_ENV;

async function debugPasswordResetFlow() {
  console.log('=== PRODUCTION PASSWORD RESET DEBUG ===');
  console.log(`Environment: ${NODE_ENV}`);
  console.log(`SendGrid API Key exists: ${SENDGRID_API_KEY ? 'YES' : 'NO'}`);
  console.log(`SendGrid API Key starts with: ${SENDGRID_API_KEY ? SENDGRID_API_KEY.substring(0, 10) + '...' : 'N/A'}`);
  
  if (!SENDGRID_API_KEY) {
    console.error('❌ SENDGRID_API_KEY is not set');
    return;
  }

  // Test 1: Direct SendGrid API connectivity
  console.log('\n1. Testing SendGrid API connectivity...');
  try {
    const response = await fetch('https://api.sendgrid.com/v3/user/account', {
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const account = await response.json();
      console.log('✅ SendGrid API connectivity: SUCCESS');
      console.log(`   Account type: ${account.type}`);
      console.log(`   Reputation: ${account.reputation}`);
    } else {
      console.log('❌ SendGrid API connectivity: FAILED');
      console.log(`   Status: ${response.status}`);
      console.log(`   Response: ${await response.text()}`);
    }
  } catch (error) {
    console.log('❌ SendGrid API connectivity: ERROR');
    console.error(error.message);
  }

  // Test 2: Check sender authentication
  console.log('\n2. Checking sender authentication...');
  try {
    const response = await fetch('https://api.sendgrid.com/v3/verified_senders', {
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const senders = await response.json();
      console.log('✅ Verified senders check: SUCCESS');
      console.log(`   Number of verified senders: ${senders.results?.length || 0}`);
      
      senders.results?.forEach(sender => {
        console.log(`   - ${sender.from_email} (${sender.verified ? 'VERIFIED' : 'NOT VERIFIED'})`);
      });
      
      // Check if support@kickdeck.io is verified
      const supportSender = senders.results?.find(s => s.from_email === 'support@kickdeck.io');
      if (supportSender) {
        console.log(`   support@kickdeck.io status: ${supportSender.verified ? 'VERIFIED' : 'NOT VERIFIED'}`);
      } else {
        console.log('   ⚠️  support@kickdeck.io is not in verified senders list');
      }
    } else {
      console.log('❌ Verified senders check: FAILED');
      console.log(`   Status: ${response.status}`);
    }
  } catch (error) {
    console.log('❌ Verified senders check: ERROR');
    console.error(error.message);
  }

  // Test 3: Check suppression lists
  console.log('\n3. Checking suppression lists...');
  const testEmail = 'bperdomo@zoho.com'; // Use your email
  
  const suppressionTypes = ['bounces', 'blocks', 'spam_reports', 'unsubscribes', 'invalid_emails'];
  
  for (const type of suppressionTypes) {
    try {
      const response = await fetch(`https://api.sendgrid.com/v3/suppression/${type}/${testEmail}`, {
        headers: {
          'Authorization': `Bearer ${SENDGRID_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.status === 200) {
        console.log(`   ❌ ${testEmail} is in ${type} suppression list`);
      } else if (response.status === 404) {
        console.log(`   ✅ ${testEmail} is NOT in ${type} suppression list`);
      } else {
        console.log(`   ⚠️  ${type} check returned status: ${response.status}`);
      }
    } catch (error) {
      console.log(`   ❌ Error checking ${type}: ${error.message}`);
    }
  }

  // Test 4: Send a direct test email
  console.log('\n4. Testing direct email send...');
  try {
    const mailService = new MailService();
    mailService.setApiKey(SENDGRID_API_KEY);
    
    const testMessage = {
      to: testEmail,
      from: 'support@kickdeck.io',
      subject: `Production Email Test - ${new Date().toISOString()}`,
      text: 'This is a direct test email from the production environment.',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Production Email Test</h2>
          <p>This is a direct test email from the production environment.</p>
          <p><strong>Time:</strong> ${new Date().toISOString()}</p>
          <p><strong>Environment:</strong> ${NODE_ENV}</p>
        </div>
      `
    };
    
    const result = await mailService.send(testMessage);
    console.log('✅ Direct email send: SUCCESS');
    console.log(`   Status: ${result[0].statusCode}`);
    console.log(`   Message ID: ${result[0].headers['x-message-id']}`);
  } catch (error) {
    console.log('❌ Direct email send: FAILED');
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.body);
    }
  }

  // Test 5: Test the actual password reset endpoint
  console.log('\n5. Testing password reset endpoint...');
  try {
    // Get the current domain
    const domain = process.env.REPLIT_DOMAINS?.split(',')[0] || 'localhost:5000';
    const baseUrl = domain.includes('localhost') ? `http://${domain}` : `https://${domain}`;
    
    console.log(`   Testing against: ${baseUrl}`);
    
    const response = await fetch(`${baseUrl}/api/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: testEmail
      })
    });
    
    if (response.ok) {
      console.log('✅ Password reset endpoint: SUCCESS');
      console.log(`   Status: ${response.status}`);
    } else {
      console.log('❌ Password reset endpoint: FAILED');
      console.log(`   Status: ${response.status}`);
      const responseText = await response.text();
      console.log(`   Response: ${responseText}`);
    }
  } catch (error) {
    console.log('❌ Password reset endpoint: ERROR');
    console.error(error.message);
  }

  // Test 6: Check email templates in database
  console.log('\n6. Checking email templates...');
  try {
    const { db } = await import('./db/index.js');
    const { emailTemplates } = await import('./db/schema/emailTemplates.js');
    const { eq, and } = await import('drizzle-orm');
    
    const passwordResetTemplate = await db
      .select()
      .from(emailTemplates)
      .where(and(
        eq(emailTemplates.type, 'password_reset'),
        eq(emailTemplates.isActive, true)
      ));
    
    if (passwordResetTemplate.length > 0) {
      console.log('✅ Password reset template: FOUND');
      const template = passwordResetTemplate[0];
      console.log(`   Template ID: ${template.id}`);
      console.log(`   Sender: ${template.senderName} <${template.senderEmail}>`);
      console.log(`   SendGrid Template ID: ${template.sendgridTemplateId || 'None (using local template)'}`);
    } else {
      console.log('❌ Password reset template: NOT FOUND');
    }
  } catch (error) {
    console.log('❌ Template check: ERROR');
    console.error(error.message);
  }

  console.log('\n=== DEBUG COMPLETE ===');
  console.log('\nNext steps:');
  console.log('1. Check your SendGrid Activity Feed for any emails sent');
  console.log('2. If emails are being sent but not delivered, check spam/junk folders');
  console.log('3. If no emails appear in Activity Feed, there\'s a SendGrid configuration issue');
}

// Run the debug
debugPasswordResetFlow().catch(console.error);