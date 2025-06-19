/**
 * Debug Production Email Delivery Issue
 * 
 * This script investigates why emails show success but aren't delivered in production.
 * We'll check SendGrid activity, configuration differences, and test direct sending.
 */

import { MailService } from '@sendgrid/mail';
import fetch from 'node-fetch';

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;

async function debugProductionEmailDelivery() {
  console.log('Debugging production email delivery issue...');
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`SendGrid API Key: ${SENDGRID_API_KEY ? SENDGRID_API_KEY.substring(0, 10) + '...' : 'Missing'}`);
  
  // Step 1: Check recent SendGrid activity
  console.log('\n1. Checking SendGrid email activity...');
  try {
    const activityResponse = await fetch('https://api.sendgrid.com/v3/messages?limit=10', {
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (activityResponse.ok) {
      const activity = await activityResponse.json();
      console.log(`Found ${activity.messages?.length || 0} recent messages`);
      
      if (activity.messages && activity.messages.length > 0) {
        console.log('Recent emails:');
        activity.messages.slice(0, 5).forEach(msg => {
          console.log(`  - To: ${msg.to_email} | Status: ${msg.status} | Subject: ${msg.subject?.substring(0, 50)}`);
        });
        
        // Check for our test emails
        const testEmails = activity.messages.filter(msg => 
          msg.to_email.includes('matchproteam.testinator.com')
        );
        
        if (testEmails.length > 0) {
          console.log('\nTest emails found in activity:');
          testEmails.forEach(msg => {
            console.log(`  - ${msg.to_email}: ${msg.status} (${msg.last_event_time})`);
          });
        } else {
          console.log('❌ No test emails found in SendGrid activity');
        }
      }
    } else {
      console.log(`❌ Could not fetch activity: ${activityResponse.status}`);
    }
  } catch (error) {
    console.log(`❌ Activity check error: ${error.message}`);
  }
  
  // Step 2: Test direct SendGrid email sending
  console.log('\n2. Testing direct SendGrid email sending...');
  const testEmail = 'directtest@matchproteam.testinator.com';
  
  try {
    const mailService = new MailService();
    mailService.setApiKey(SENDGRID_API_KEY);
    
    const directMessage = {
      to: testEmail,
      from: 'support@matchpro.ai',
      subject: 'Direct SendGrid Test - Production Debug',
      text: 'This is a direct test to verify SendGrid is actually sending emails.',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 2px solid red;">
          <h2 style="color: red;">Direct SendGrid Test</h2>
          <p>This email was sent directly via SendGrid API to debug production email delivery.</p>
          <p><strong>Time:</strong> ${new Date().toISOString()}</p>
          <p><strong>Environment:</strong> ${process.env.NODE_ENV}</p>
          <p>If you receive this email, SendGrid is working correctly.</p>
        </div>
      `
    };
    
    const result = await mailService.send(directMessage);
    console.log('✅ Direct email sent successfully');
    console.log(`   Status: ${result[0].statusCode}`);
    console.log(`   Message ID: ${result[0].headers['x-message-id']}`);
    
    // Store the message ID to check later
    const messageId = result[0].headers['x-message-id'];
    
    // Wait and check if it appears in activity
    console.log('\nWaiting 10 seconds to check activity...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    try {
      const activityCheck = await fetch('https://api.sendgrid.com/v3/messages', {
        headers: {
          'Authorization': `Bearer ${SENDGRID_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (activityCheck.ok) {
        const recentActivity = await activityCheck.json();
        const ourEmail = recentActivity.messages?.find(msg => 
          msg.msg_id === messageId || msg.to_email === testEmail
        );
        
        if (ourEmail) {
          console.log('✅ Direct email found in SendGrid activity');
          console.log(`   Status: ${ourEmail.status}`);
          console.log(`   Events: ${JSON.stringify(ourEmail.events || [])}`);
        } else {
          console.log('❌ Direct email not found in SendGrid activity');
        }
      }
    } catch (error) {
      console.log(`⚠️  Could not check activity: ${error.message}`);
    }
    
  } catch (error) {
    console.log('❌ Direct email failed');
    console.error('Error:', error.message);
    if (error.response) {
      console.error('SendGrid response:', error.response.body);
    }
  }
  
  // Step 3: Test dynamic template specifically
  console.log('\n3. Testing dynamic template directly...');
  try {
    const templateMessage = {
      to: 'templatetest@matchproteam.testinator.com',
      from: 'support@matchpro.ai',
      templateId: 'd-6064756d74914ec79b3a3586f6713424', // Welcome template ID
      dynamicTemplateData: {
        firstName: 'Template',
        lastName: 'Test',
        email: 'templatetest@matchproteam.testinator.com',
        username: 'templatetest'
      }
    };
    
    const mailService = new MailService();
    mailService.setApiKey(SENDGRID_API_KEY);
    
    const templateResult = await mailService.send(templateMessage);
    console.log('✅ Dynamic template email sent');
    console.log(`   Status: ${templateResult[0].statusCode}`);
    console.log(`   Message ID: ${templateResult[0].headers['x-message-id']}`);
    
  } catch (error) {
    console.log('❌ Dynamic template failed');
    console.error('Error:', error.message);
    if (error.response) {
      console.error('SendGrid response:', error.response.body);
    }
  }
  
  // Step 4: Check suppression lists for test emails
  console.log('\n4. Checking suppression lists for test emails...');
  const testEmails = [
    'hello@matchproteam.testinator.com',
    'goodbye@matchproteam.testinator.com'
  ];
  
  const suppressionTypes = ['bounces', 'blocks', 'spam_reports', 'unsubscribes', 'invalid_emails'];
  
  for (const email of testEmails) {
    console.log(`\nChecking ${email}:`);
    for (const type of suppressionTypes) {
      try {
        const response = await fetch(`https://api.sendgrid.com/v3/suppression/${type}/${email}`, {
          headers: {
            'Authorization': `Bearer ${SENDGRID_API_KEY}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.status === 200) {
          console.log(`  ❌ In ${type} suppression list`);
        } else if (response.status === 404) {
          console.log(`  ✅ Clean from ${type}`);
        }
      } catch (error) {
        console.log(`  ⚠️  Error checking ${type}`);
      }
    }
  }
  
  console.log('\n=== PRODUCTION EMAIL DEBUG COMPLETE ===');
  console.log('Key findings:');
  console.log('1. Check if emails appear in SendGrid Activity Feed');
  console.log('2. Verify direct emails vs dynamic template emails');
  console.log('3. Confirm suppression list status');
  console.log('4. Compare with development environment behavior');
}

debugProductionEmailDelivery().catch(console.error);