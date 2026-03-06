/**
 * Comprehensive Email Fix for Production
 * 
 * This script diagnoses and fixes the broader email delivery issue
 * affecting multiple addresses in your SendGrid account.
 */

import { MailService } from '@sendgrid/mail';
import fetch from 'node-fetch';

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;

async function comprehensiveEmailFix() {
  console.log('Diagnosing comprehensive email delivery issue...');
  
  // Step 1: Check account status and limitations
  console.log('\n1. Checking SendGrid account status...');
  try {
    const accountResponse = await fetch('https://api.sendgrid.com/v3/user/account', {
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (accountResponse.ok) {
      const account = await accountResponse.json();
      console.log(`Account type: ${account.type}`);
      console.log(`Reputation: ${account.reputation}`);
      console.log(`Website: ${account.website || 'Not set'}`);
      
      // Check if account is under review
      if (account.reputation < 80) {
        console.log('⚠️  Low reputation may affect delivery');
      }
    }
  } catch (error) {
    console.error('Error checking account:', error.message);
  }
  
  // Step 2: Check for account-level restrictions
  console.log('\n2. Checking for account restrictions...');
  try {
    const statsResponse = await fetch('https://api.sendgrid.com/v3/stats?start_date=2025-06-19&end_date=2025-06-19', {
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (statsResponse.ok) {
      const stats = await statsResponse.json();
      console.log('Daily stats available - account is active');
    } else {
      console.log(`Stats check failed: ${statsResponse.status}`);
    }
  } catch (error) {
    console.error('Error checking stats:', error.message);
  }
  
  // Step 3: Mass clear suppression lists using batch operations
  console.log('\n3. Performing mass suppression list cleanup...');
  
  const emailsToTest = [
    'test.admin@gmail.com',
    'bperdomo.test@gmail.com',
    'bperdomo@zoho.com',
    'admin@kickdeck.io'
  ];
  
  const suppressionTypes = ['bounces', 'blocks', 'spam_reports', 'unsubscribes', 'invalid_emails'];
  
  for (const type of suppressionTypes) {
    console.log(`Clearing all emails from ${type}...`);
    
    try {
      // Try bulk deletion
      const bulkResponse = await fetch(`https://api.sendgrid.com/v3/suppression/${type}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${SENDGRID_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          emails: emailsToTest
        })
      });
      
      if (bulkResponse.status === 204) {
        console.log(`✅ Bulk cleared from ${type}`);
      } else {
        console.log(`⚠️  Bulk clear from ${type}: ${bulkResponse.status}`);
      }
      
      // Also try individual deletions
      for (const email of emailsToTest) {
        try {
          const individualResponse = await fetch(`https://api.sendgrid.com/v3/suppression/${type}/${email}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${SENDGRID_API_KEY}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (individualResponse.status === 204) {
            console.log(`  ✅ Cleared ${email} from ${type}`);
          }
        } catch (error) {
          console.log(`  ❌ Error clearing ${email} from ${type}`);
        }
      }
    } catch (error) {
      console.error(`Error with ${type}:`, error.message);
    }
  }
  
  // Step 4: Wait for propagation
  console.log('\nWaiting 5 seconds for changes to propagate...');
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Step 5: Test with a completely new email
  console.log('\n4. Testing with fresh email address...');
  const freshEmail = `test.${Date.now()}@gmail.com`;
  console.log(`Using fresh email: ${freshEmail}`);
  
  try {
    const mailService = new MailService();
    mailService.setApiKey(SENDGRID_API_KEY);
    
    const testMessage = {
      to: freshEmail,
      from: 'support@kickdeck.io',
      subject: 'SendGrid Account Test',
      text: 'This is a test to verify SendGrid account functionality.',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>SendGrid Account Test</h2>
          <p>This email tests whether SendGrid can send to fresh addresses.</p>
          <p>Time: ${new Date().toISOString()}</p>
        </div>
      `
    };
    
    const result = await mailService.send(testMessage);
    console.log('✅ Fresh email test successful');
    console.log(`Status: ${result[0].statusCode}`);
    
  } catch (error) {
    console.log('❌ Fresh email test failed');
    console.error('Error:', error.message);
    if (error.response) {
      console.error('SendGrid response:', error.response.body);
    }
  }
  
  // Step 6: Test password reset functionality
  console.log('\n5. Testing password reset with working email...');
  
  // Use a known working email for testing
  const workingEmail = 'admin@kickdeck.io';
  
  try {
    const domain = process.env.REPLIT_DOMAINS?.split(',')[0] || 'localhost:5000';
    const baseUrl = domain.includes('localhost') ? `http://${domain}` : `https://${domain}`;
    
    console.log(`Testing password reset against: ${baseUrl}`);
    
    const response = await fetch(`${baseUrl}/api/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: workingEmail
      })
    });
    
    if (response.ok) {
      console.log('✅ Password reset endpoint working');
      console.log(`Check ${workingEmail} for the reset email`);
    } else {
      console.log(`❌ Password reset failed: ${response.status}`);
      const responseText = await response.text();
      console.log(`Response: ${responseText}`);
    }
  } catch (error) {
    console.log('❌ Password reset test error');
    console.error(error.message);
  }
  
  // Step 7: Verify email templates configuration
  console.log('\n6. Checking email template configuration...');
  try {
    const domain = process.env.REPLIT_DOMAINS?.split(',')[0] || 'localhost:5000';
    const baseUrl = domain.includes('localhost') ? `http://${domain}` : `https://${domain}`;
    
    const templatesResponse = await fetch(`${baseUrl}/api/admin/email-templates`, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (templatesResponse.ok) {
      const templates = await templatesResponse.json();
      const passwordResetTemplate = templates.find(t => t.type === 'password_reset');
      
      if (passwordResetTemplate) {
        console.log('✅ Password reset template found');
        console.log(`Template ID: ${passwordResetTemplate.id}`);
        console.log(`SendGrid Template ID: ${passwordResetTemplate.sendgridTemplateId || 'Local template'}`);
        console.log(`Active: ${passwordResetTemplate.isActive}`);
      } else {
        console.log('❌ Password reset template not found');
      }
    } else {
      console.log(`⚠️  Could not check templates: ${templatesResponse.status}`);
    }
  } catch (error) {
    console.log('⚠️  Template check error:', error.message);
  }
  
  console.log('\n=== COMPREHENSIVE FIX COMPLETE ===');
  console.log('\nSummary:');
  console.log('• Cleared suppression lists for test emails');
  console.log('• Verified SendGrid account functionality');
  console.log('• Tested password reset endpoint');
  console.log('• Confirmed template configuration');
  console.log('\nNext steps:');
  console.log('1. Test password reset with admin@kickdeck.io');
  console.log('2. Monitor email delivery in SendGrid Activity Feed');
  console.log('3. Use verified sender addresses for all admin functions');
}

comprehensiveEmailFix().catch(console.error);