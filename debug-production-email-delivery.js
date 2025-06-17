/**
 * Debug Production Email Delivery Issue
 * 
 * This script tests various aspects of email delivery to identify
 * why production emails return success but aren't delivered.
 */

import { MailService } from '@sendgrid/mail';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.SENDGRID_API_KEY;

if (!apiKey) {
  console.error('❌ SENDGRID_API_KEY not found in environment variables');
  process.exit(1);
}

const mailService = new MailService();
mailService.setApiKey(apiKey);

async function checkEmailDelivery() {
  console.log('🔍 Production Email Delivery Diagnostic');
  console.log('==========================================\n');

  // Test 1: Check API key validity
  console.log('=== Test 1: API Key Validation ===');
  try {
    const response = await fetch('https://api.sendgrid.com/v3/user/account', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const account = await response.json();
      console.log('✅ API Key Valid');
      console.log(`Account Type: ${account.type}`);
      console.log(`Reputation: ${account.reputation}`);
    } else {
      console.log('❌ API Key Invalid');
      return;
    }
  } catch (error) {
    console.error('❌ API Key Check Failed:', error.message);
    return;
  }

  // Test 2: Check sender verification
  console.log('\n=== Test 2: Sender Verification ===');
  try {
    const response = await fetch('https://api.sendgrid.com/v3/verified_senders', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Verified Senders:');
      data.results.forEach(sender => {
        console.log(`  - ${sender.from_email} (${sender.from_name}) - ${sender.verified ? '✅ Verified' : '❌ Unverified'}`);
      });
    }
  } catch (error) {
    console.error('❌ Sender Check Failed:', error.message);
  }

  // Test 3: Check recent activity
  console.log('\n=== Test 3: Recent Activity ===');
  try {
    const today = new Date().toISOString().split('T')[0];
    const response = await fetch(`https://api.sendgrid.com/v3/stats?start_date=${today}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const stats = await response.json();
      console.log('✅ Today\'s Stats:');
      if (stats.length > 0) {
        const todayStats = stats[0].stats[0].metrics;
        console.log(`  Requests: ${todayStats.requests}`);
        console.log(`  Delivered: ${todayStats.delivered}`);
        console.log(`  Bounces: ${todayStats.bounces}`);
        console.log(`  Blocks: ${todayStats.blocks}`);
        console.log(`  Spam Reports: ${todayStats.spam_reports}`);
      } else {
        console.log('  No activity today');
      }
    }
  } catch (error) {
    console.error('❌ Stats Check Failed:', error.message);
  }

  // Test 4: Send test email with detailed tracking
  console.log('\n=== Test 4: Detailed Test Email ===');
  try {
    const testEmail = {
      to: 'bperdomo@zoho.com',
      from: 'support@matchpro.ai',
      subject: `Production Email Test - ${new Date().toISOString()}`,
      text: 'This is a test email to debug production delivery issues.',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd;">
          <h2 style="color: #333;">Production Email Delivery Test</h2>
          <p>This email was sent from production to test delivery.</p>
          <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
          <p><strong>Environment:</strong> Production</p>
          <p><strong>API Key Last 4:</strong> ...${apiKey.slice(-4)}</p>
          <div style="background: #f5f5f5; padding: 10px; margin: 10px 0; border-radius: 4px;">
            <p><strong>If you receive this email:</strong></p>
            <ul>
              <li>Production email delivery is working</li>
              <li>The issue may be with specific templates or timing</li>
            </ul>
          </div>
          <div style="background: #fff3cd; padding: 10px; margin: 10px 0; border-radius: 4px;">
            <p><strong>If you don't receive this email:</strong></p>
            <ul>
              <li>Check spam/junk folders</li>
              <li>Verify email provider settings</li>
              <li>Check SendGrid reputation</li>
            </ul>
          </div>
        </div>
      `,
      tracking_settings: {
        click_tracking: { enable: true },
        open_tracking: { enable: true },
        subscription_tracking: { enable: false },
        ganalytics: { enable: false }
      },
      mail_settings: {
        spam_check: { enable: true }
      }
    };

    const response = await mailService.send(testEmail);
    console.log('✅ Test Email Sent Successfully');
    console.log(`Status: ${response[0].statusCode}`);
    console.log(`Message ID: ${response[0].headers['x-message-id']}`);
    
    // Wait a moment and check delivery status
    console.log('\nWaiting 5 seconds to check delivery status...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
  } catch (error) {
    console.error('❌ Test Email Failed:', error);
    if (error.response) {
      console.error('Response body:', error.response.body);
    }
  }

  // Test 5: Check for bounces and suppressions
  console.log('\n=== Test 5: Suppression Check ===');
  try {
    const response = await fetch('https://api.sendgrid.com/v3/suppression/bounces/bperdomo@zoho.com', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.status === 404) {
      console.log('✅ Email not in bounce list');
    } else if (response.ok) {
      const bounceData = await response.json();
      console.log('❌ Email found in bounce list:', bounceData);
    }
  } catch (error) {
    console.log('✅ No suppression issues found');
  }

  console.log('\n==========================================');
  console.log('Diagnostic Complete');
  console.log('==========================================');
}

checkEmailDelivery().catch(console.error);