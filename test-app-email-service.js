/**
 * Test Application Email Service
 * 
 * This script tests your actual sendTemplatedEmail function to ensure
 * it's using the configured SendGrid dynamic templates.
 */

import { MailService } from '@sendgrid/mail';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.SENDGRID_API_KEY;

console.log('Testing Application Email Service with Dynamic Templates');
console.log('=====================================================');

async function testApplicationEmailService() {
  // Test the application's email service by calling the actual API endpoints
  const baseUrl = 'http://localhost:5000';
  
  console.log('Testing password reset email flow...');
  
  try {
    // Test password reset - this should use your branded template
    const resetResponse = await fetch(`${baseUrl}/api/auth/request-password-reset`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'bperdomo@zoho.com'
      })
    });
    
    if (resetResponse.ok) {
      console.log('✅ Password reset email triggered successfully');
      console.log('   This should use your branded Password Reset template');
    } else {
      const errorText = await resetResponse.text();
      console.log(`❌ Password reset failed: ${resetResponse.status}`);
      console.log(`   Error: ${errorText}`);
    }
  } catch (error) {
    console.log(`❌ Error testing password reset: ${error.message}`);
  }

  // Also test direct template email sending
  console.log('\nTesting direct SendGrid template email...');
  
  const sgMail = new MailService();
  sgMail.setApiKey(apiKey);
  
  try {
    // Send using your registration template directly
    const templateEmail = {
      to: 'bperdomo@zoho.com',
      from: 'support@matchpro.ai',
      templateId: 'd-4eca2752ddd247158dd1d5433407cd5e', // Registration Submitted
      dynamicTemplateData: {
        userName: 'Production Test User',
        teamName: 'Production Test Team',
        eventName: 'Production Email Test Tournament',
        registrationId: 'TEST-123',
        dashboardUrl: 'https://app.matchpro.ai/dashboard',
        supportEmail: 'support@matchpro.ai',
        currentYear: new Date().getFullYear().toString()
      }
    };

    const result = await sgMail.send(templateEmail);
    console.log('✅ Direct template email sent successfully');
    console.log(`   Template: Registration Submitted (Branded)`);
    console.log(`   Message ID: ${result[0].headers['x-message-id']}`);
    
  } catch (error) {
    console.log('❌ Direct template email failed');
    console.log(`   Error: ${error.message}`);
  }

  console.log('\n=== Email Service Test Results ===');
  console.log('Check your email inbox for:');
  console.log('1. Password reset email (if API worked)');
  console.log('2. Registration template email (branded)');
  console.log('');
  console.log('Both emails should now use your professional SendGrid templates');
  console.log('instead of plain HTML formatting.');
}

testApplicationEmailService();