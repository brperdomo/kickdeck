/**
 * Comprehensive SendGrid Production Diagnosis
 * 
 * This script analyzes SendGrid configuration differences between dev and production
 * to identify why emails show success but aren't delivered in production.
 */

import { MailService } from '@sendgrid/mail';
import fetch from 'node-fetch';

async function diagnoseSendGridProduction() {
  console.log('=== SendGrid Production Diagnosis ===\n');
  
  const apiKey = process.env.SENDGRID_API_KEY;
  
  if (!apiKey) {
    console.error('❌ SENDGRID_API_KEY not found');
    return;
  }
  
  console.log('✅ SendGrid API Key found');
  console.log('Key prefix:', apiKey.substring(0, 10) + '...');
  console.log('Key length:', apiKey.length);
  
  // Check 1: Verify API key validity
  console.log('\n1. Testing API Key Validity...');
  try {
    const response = await fetch('https://api.sendgrid.com/v3/user/account', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const account = await response.json();
      console.log('✅ API Key valid');
      console.log('Account type:', account.type);
      console.log('Account reputation:', account.reputation || 'N/A');
    } else {
      console.log('❌ API Key invalid or restricted');
      const error = await response.text();
      console.log('Error:', error);
    }
  } catch (error) {
    console.log('❌ API Key test failed:', error.message);
  }
  
  // Check 2: Verify sender authentication
  console.log('\n2. Checking Sender Authentication...');
  try {
    const response = await fetch('https://api.sendgrid.com/v3/verified_senders', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const senders = await response.json();
      console.log('✅ Verified senders found:', senders.results?.length || 0);
      
      senders.results?.forEach(sender => {
        console.log(`  - ${sender.from_email}: ${sender.verified ? '✅ Verified' : '❌ Not verified'}`);
      });
    } else {
      console.log('❌ Could not fetch verified senders');
    }
  } catch (error) {
    console.log('❌ Sender verification check failed:', error.message);
  }
  
  // Check 3: Check domain authentication
  console.log('\n3. Checking Domain Authentication...');
  try {
    const response = await fetch('https://api.sendgrid.com/v3/whitelabel/domains', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const domains = await response.json();
      console.log('✅ Authenticated domains found:', domains.length || 0);
      
      domains.forEach(domain => {
        console.log(`  - ${domain.domain}: ${domain.valid ? '✅ Valid' : '❌ Invalid'}`);
        if (!domain.valid) {
          console.log(`    DNS Records needed:`, domain.dns);
        }
      });
    } else {
      console.log('❌ Could not fetch domain authentication');
    }
  } catch (error) {
    console.log('❌ Domain authentication check failed:', error.message);
  }
  
  // Check 4: Check account limitations
  console.log('\n4. Checking Account Status and Limits...');
  try {
    const response = await fetch('https://api.sendgrid.com/v3/user/credits', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const credits = await response.json();
      console.log('✅ Account credits:', credits);
    } else {
      console.log('❌ Could not fetch account credits');
    }
  } catch (error) {
    console.log('❌ Account status check failed:', error.message);
  }
  
  // Check 5: Check suppression lists
  console.log('\n5. Checking Suppression Lists...');
  const testEmail = 'bperdomo@zoho.com';
  
  const suppressionTypes = ['bounces', 'blocks', 'invalid_emails', 'spam_reports', 'unsubscribes'];
  
  for (const type of suppressionTypes) {
    try {
      const response = await fetch(`https://api.sendgrid.com/v3/suppression/${type}/${testEmail}`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.status === 200) {
        console.log(`❌ Email found in ${type} suppression list`);
        const data = await response.json();
        console.log(`   Reason:`, data);
        
        // Offer to remove from suppression list
        console.log(`   To remove: DELETE https://api.sendgrid.com/v3/suppression/${type}/${testEmail}`);
      } else if (response.status === 404) {
        console.log(`✅ Email not in ${type} suppression list`);
      } else {
        console.log(`❓ Could not check ${type} suppression list (status: ${response.status})`);
      }
    } catch (error) {
      console.log(`❌ Error checking ${type} suppression:`, error.message);
    }
  }
  
  // Check 6: Test template access
  console.log('\n6. Checking Dynamic Template Access...');
  try {
    const response = await fetch('https://api.sendgrid.com/v3/templates?generations=dynamic', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const templates = await response.json();
      console.log('✅ Dynamic templates found:', templates.templates?.length || 0);
      
      // Check for the password reset template
      const passwordResetTemplate = templates.templates?.find(t => 
        t.id === 'd-7eb7ea1c19ca4090a0cefa3a2be75088'
      );
      
      if (passwordResetTemplate) {
        console.log('✅ Password reset template found:', passwordResetTemplate.name);
      } else {
        console.log('❌ Password reset template not found');
      }
    } else {
      console.log('❌ Could not fetch templates');
    }
  } catch (error) {
    console.log('❌ Template check failed:', error.message);
  }
  
  // Check 7: Test actual email send
  console.log('\n7. Testing Actual Email Send...');
  try {
    const mailService = new MailService();
    mailService.setApiKey(apiKey);
    
    const testMessage = {
      personalizations: [
        {
          to: [{ email: testEmail }],
          dynamic_template_data: {
            reset_url: 'https://kickdeck.io/reset-password?token=test123',
            user_name: 'Test User'
          }
        }
      ],
      from: { 
        email: process.env.DEFAULT_FROM_EMAIL || 'support@kickdeck.io',
        name: 'KickDeck Test' 
      },
      template_id: 'd-7eb7ea1c19ca4090a0cefa3a2be75088'
    };
    
    console.log('Sending test email...');
    console.log('From:', testMessage.from.email);
    console.log('To:', testEmail);
    console.log('Template ID:', testMessage.template_id);
    
    const response = await mailService.send(testMessage);
    console.log('✅ Email sent successfully!');
    console.log('Response status:', response[0].statusCode);
    console.log('Message ID:', response[0].headers['x-message-id']);
    
    // Provide tracking information
    console.log('\nTo track this email:');
    console.log(`Check SendGrid Activity Feed: https://app.sendgrid.com/email_activity`);
    console.log(`Message ID: ${response[0].headers['x-message-id']}`);
    
  } catch (error) {
    console.log('❌ Email send failed:', error.message);
    if (error.response?.body) {
      console.log('SendGrid error details:', error.response.body);
    }
  }
  
  console.log('\n=== Diagnosis Complete ===');
  console.log('\nNext Steps:');
  console.log('1. Check SendGrid Activity Feed for delivery status');
  console.log('2. Verify sender authentication is complete');
  console.log('3. Check if emails are going to spam folder');
  console.log('4. Ensure domain authentication is properly configured');
}

diagnoseSendGridProduction().catch(console.error);