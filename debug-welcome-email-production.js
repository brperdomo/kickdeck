/**
 * Debug Welcome Email Production Issue
 * 
 * This script tests the welcome email template configuration and registration flow
 * to identify why member welcome emails aren't working in production.
 */

import { MailService } from '@sendgrid/mail';
import fetch from 'node-fetch';

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;

async function debugWelcomeEmailProduction() {
  console.log('Debugging welcome email production issue...');
  
  const domain = process.env.REPLIT_DOMAINS?.split(',')[0] || 'localhost:5000';
  const baseUrl = domain.includes('localhost') ? `http://${domain}` : `https://${domain}`;
  
  console.log(`Testing against: ${baseUrl}`);
  
  // Step 1: Check if welcome email template exists
  console.log('\n1. Checking welcome email template configuration...');
  try {
    const response = await fetch(`${baseUrl}/api/admin/email-templates`, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const templates = await response.json();
      const welcomeTemplate = templates.find(t => t.type === 'welcome');
      
      if (welcomeTemplate) {
        console.log('✅ Welcome template found');
        console.log(`   ID: ${welcomeTemplate.id}`);
        console.log(`   Name: ${welcomeTemplate.name}`);
        console.log(`   Active: ${welcomeTemplate.isActive}`);
        console.log(`   SendGrid Template ID: ${welcomeTemplate.sendgridTemplateId || 'None (local template)'}`);
        console.log(`   Sender: ${welcomeTemplate.senderName} <${welcomeTemplate.senderEmail}>`);
      } else {
        console.log('❌ Welcome template not found');
        console.log('Available templates:');
        templates.forEach(t => console.log(`   - ${t.type}: ${t.name}`));
      }
    } else {
      console.log(`⚠️  Could not check templates: ${response.status}`);
    }
  } catch (error) {
    console.log('⚠️  Template check error:', error.message);
  }
  
  // Step 2: Test direct email sending with welcome template
  console.log('\n2. Testing direct welcome email sending...');
  const testEmail = 'test.welcome@gmail.com';
  
  try {
    const mailService = new MailService();
    mailService.setApiKey(SENDGRID_API_KEY);
    
    // Test with the same data format as registration
    const testMessage = {
      to: testEmail,
      from: 'support@kickdeck.io',
      subject: 'Welcome to KickDeck - Test Email',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 2px solid green;">
          <h2 style="color: green;">Welcome to KickDeck!</h2>
          <p>Hello Test User,</p>
          <p>Thank you for registering with KickDeck. Your account has been created successfully.</p>
          <p><strong>Test Details:</strong></p>
          <ul>
            <li>Email: ${testEmail}</li>
            <li>Time: ${new Date().toISOString()}</li>
            <li>Environment: Production</li>
          </ul>
          <p>This is a test to verify welcome email functionality.</p>
        </div>
      `
    };
    
    const result = await mailService.send(testMessage);
    console.log('✅ Direct welcome email test successful');
    console.log(`   Status: ${result[0].statusCode}`);
    console.log(`   Message ID: ${result[0].headers['x-message-id']}`);
  } catch (error) {
    console.log('❌ Direct welcome email test failed');
    console.error('Error:', error.message);
    if (error.response) {
      console.error('SendGrid response:', error.response.body);
    }
  }
  
  // Step 3: Test the registration endpoint to see console logs
  console.log('\n3. Testing registration endpoint...');
  const testUser = {
    username: `testuser${Date.now()}`,
    email: testEmail,
    password: 'testpass123',
    firstName: 'Test',
    lastName: 'User'
  };
  
  try {
    const response = await fetch(`${baseUrl}/api/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testUser)
    });
    
    const responseText = await response.text();
    
    if (response.ok) {
      console.log('✅ Registration endpoint successful');
      console.log(`   Status: ${response.status}`);
      console.log(`   Check server logs for welcome email trigger`);
    } else {
      console.log('❌ Registration endpoint failed');
      console.log(`   Status: ${response.status}`);
      console.log(`   Response: ${responseText}`);
    }
  } catch (error) {
    console.log('❌ Registration test error');
    console.error(error.message);
  }
  
  // Step 4: Test the email service endpoint directly
  console.log('\n4. Testing email service configuration...');
  try {
    const emailTestData = {
      to: testEmail,
      templateType: 'welcome',
      context: {
        firstName: 'Test',
        lastName: 'User',
        email: testEmail,
        username: 'testuser'
      }
    };
    
    const response = await fetch(`${baseUrl}/api/admin/test-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailTestData)
    });
    
    if (response.ok) {
      console.log('✅ Email service test successful');
      const result = await response.json();
      console.log(`   Result: ${JSON.stringify(result)}`);
    } else {
      console.log(`⚠️  Email service test: ${response.status}`);
    }
  } catch (error) {
    console.log('⚠️  Email service test error:', error.message);
  }
  
  // Step 5: Check environment differences
  console.log('\n5. Checking environment configuration...');
  console.log(`   NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`   SendGrid API Key: ${SENDGRID_API_KEY ? 'Present' : 'Missing'}`);
  console.log(`   Domain: ${domain}`);
  console.log(`   Base URL: ${baseUrl}`);
  
  console.log('\n=== DEBUG COMPLETE ===');
  console.log('\nNext steps to check:');
  console.log('1. Verify welcome email template exists in database');
  console.log('2. Check server console logs during registration');
  console.log('3. Ensure template has correct SendGrid template ID');
  console.log('4. Verify email service is properly configured');
}

debugWelcomeEmailProduction().catch(console.error);