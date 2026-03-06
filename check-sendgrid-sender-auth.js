/**
 * Check SendGrid Sender Authentication Status
 * 
 * This script checks your SendGrid account's sender authentication
 * configuration to identify why emails return success but aren't delivered.
 */

import { MailService } from '@sendgrid/mail';
import fetch from 'node-fetch';

const apiKey = process.env.SENDGRID_API_KEY;

if (!apiKey) {
  console.error('SENDGRID_API_KEY environment variable is required');
  process.exit(1);
}

/**
 * Check verified senders in SendGrid
 */
async function checkVerifiedSenders() {
  try {
    console.log('\n=== Checking Verified Senders ===');
    
    const response = await fetch('https://api.sendgrid.com/v3/verified_senders', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      console.log('✅ Verified Senders Found:');
      data.results.forEach((sender, index) => {
        console.log(`${index + 1}. ${sender.from_email} (${sender.from_name})`);
        console.log(`   Status: ${sender.verified ? '✅ Verified' : '❌ Not Verified'}`);
        console.log(`   Created: ${new Date(sender.created_at * 1000).toLocaleDateString()}`);
      });
    } else {
      console.log('❌ No verified senders found!');
      console.log('This is likely why emails aren\'t being delivered.');
    }

    return data.results || [];
  } catch (error) {
    console.error('Error checking verified senders:', error);
    return [];
  }
}

/**
 * Check domain authentication status
 */
async function checkDomainAuthentication() {
  try {
    console.log('\n=== Checking Domain Authentication ===');
    
    const response = await fetch('https://api.sendgrid.com/v3/whitelabel/domains', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const domains = await response.json();
    
    if (domains && domains.length > 0) {
      console.log('✅ Authenticated Domains Found:');
      domains.forEach((domain, index) => {
        console.log(`${index + 1}. ${domain.domain}`);
        console.log(`   Status: ${domain.valid ? '✅ Valid' : '❌ Invalid'}`);
        console.log(`   Default: ${domain.default ? 'Yes' : 'No'}`);
      });
    } else {
      console.log('❌ No authenticated domains found!');
    }

    return domains || [];
  } catch (error) {
    console.error('Error checking domain authentication:', error);
    return [];
  }
}

/**
 * Test sending an email with current configuration
 */
async function testEmailDelivery() {
  try {
    console.log('\n=== Testing Email Delivery ===');
    
    const mailService = new MailService();
    mailService.setApiKey(apiKey);
    
    // Try different sender configurations
    const testRecipient = 'bperdomo@zoho.com'; // Using the admin email as test recipient
    
    const testConfigs = [
      { from: 'support@kickdeck.io', label: 'Current Default' },
      { from: 'noreply@kickdeck.io', label: 'No Reply' },
      { from: 'admin@kickdeck.io', label: 'Admin' }
    ];
    
    for (const config of testConfigs) {
      try {
        console.log(`\nTesting sender: ${config.from} (${config.label})`);
        
        const message = {
          to: testRecipient,
          from: config.from,
          subject: `SendGrid Test - ${config.label} - ${new Date().toISOString()}`,
          text: `This is a test email from ${config.from} to verify SendGrid delivery.`,
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
              <h2>SendGrid Delivery Test</h2>
              <p>This is a test email from <strong>${config.from}</strong> to verify SendGrid delivery.</p>
              <p><strong>Time:</strong> ${new Date().toISOString()}</p>
              <p><strong>Configuration:</strong> ${config.label}</p>
            </div>
          `
        };
        
        const response = await mailService.send(message);
        console.log(`✅ API Success: Status ${response[0].statusCode}`);
        console.log(`   Message ID: ${response[0].headers['x-message-id']}`);
        
      } catch (error) {
        console.log(`❌ Failed to send from ${config.from}:`);
        if (error.response && error.response.body) {
          console.log(`   Error: ${JSON.stringify(error.response.body, null, 2)}`);
        } else {
          console.log(`   Error: ${error.message}`);
        }
      }
    }
    
  } catch (error) {
    console.error('Error testing email delivery:', error);
  }
}

/**
 * Check account reputation and sending limits
 */
async function checkAccountStatus() {
  try {
    console.log('\n=== Checking Account Status ===');
    
    const response = await fetch('https://api.sendgrid.com/v3/user/account', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const account = await response.json();
    
    console.log(`Account Type: ${account.type}`);
    console.log(`Reputation: ${account.reputation || 'N/A'}`);
    
    // Check sending statistics
    const statsResponse = await fetch('https://api.sendgrid.com/v3/stats?start_date=2025-01-01', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (statsResponse.ok) {
      const stats = await statsResponse.json();
      console.log('\nRecent Sending Statistics:');
      if (stats.length > 0) {
        const latest = stats[stats.length - 1];
        console.log(`Requests: ${latest.stats[0].metrics.requests}`);
        console.log(`Delivered: ${latest.stats[0].metrics.delivered}`);
        console.log(`Bounces: ${latest.stats[0].metrics.bounces}`);
        console.log(`Blocks: ${latest.stats[0].metrics.blocks}`);
      } else {
        console.log('No recent sending activity found');
      }
    }
    
  } catch (error) {
    console.error('Error checking account status:', error);
  }
}

/**
 * Main diagnostic function
 */
async function main() {
  console.log('🔍 SendGrid Sender Authentication Diagnostic');
  console.log('='.repeat(50));
  
  try {
    const verifiedSenders = await checkVerifiedSenders();
    const domains = await checkDomainAuthentication();
    await checkAccountStatus();
    await testEmailDelivery();
    
    console.log('\n=== DIAGNOSIS SUMMARY ===');
    
    if (verifiedSenders.length === 0 && domains.length === 0) {
      console.log('❌ CRITICAL: No sender authentication configured!');
      console.log('');
      console.log('SOLUTION:');
      console.log('1. Go to SendGrid Dashboard → Settings → Sender Authentication');
      console.log('2. Either:');
      console.log('   a) Verify a single sender email (support@kickdeck.io), OR');
      console.log('   b) Authenticate your entire domain (kickdeck.io)');
      console.log('3. Domain authentication is recommended for production');
      console.log('');
      console.log('Until sender authentication is configured, emails will');
      console.log('return success but won\'t be delivered to recipients.');
    } else if (verifiedSenders.length > 0) {
      console.log('✅ Sender authentication is configured');
      console.log('Check if you\'re using the correct verified sender address');
    } else if (domains.length > 0) {
      console.log('✅ Domain authentication is configured');
      console.log('Emails should be delivering normally');
    }
    
  } catch (error) {
    console.error('Diagnostic failed:', error);
  }
}

main().catch(console.error);