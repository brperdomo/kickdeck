/**
 * Test Production Dynamic Template Email
 * 
 * This script tests your actual email service to verify it's using
 * SendGrid dynamic templates instead of plain HTML.
 */

import { MailService } from '@sendgrid/mail';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.SENDGRID_API_KEY;

console.log('Testing Production Dynamic Template Email');
console.log('========================================');

async function testDynamicTemplates() {
  if (!apiKey) {
    console.log('Missing SENDGRID_API_KEY');
    return;
  }

  const sgMail = new MailService();
  sgMail.setApiKey(apiKey);

  // Test each of your configured templates
  const templateTests = [
    {
      name: 'Password Reset',
      templateId: 'd-7eb7ea1c19ca4090a0cefa3a2be75088',
      data: {
        userName: 'Test User',
        resetLink: 'https://app.matchpro.ai/reset-password?token=test123',
        supportEmail: 'support@matchpro.ai'
      }
    },
    {
      name: 'Registration Submitted',
      templateId: 'd-4eca2752ddd247158dd1d5433407cd5e',
      data: {
        userName: 'Test User',
        teamName: 'Test Team FC',
        eventName: 'Test Tournament',
        supportEmail: 'support@matchpro.ai'
      }
    },
    {
      name: 'Team Approved',
      templateId: 'd-1bca14d4dc8e41e5a7ed2131124d470e',
      data: {
        userName: 'Test User',
        teamName: 'Test Team FC',
        eventName: 'Test Tournament',
        paymentAmount: '$150.00',
        supportEmail: 'support@matchpro.ai'
      }
    }
  ];

  for (const test of templateTests) {
    console.log(`\nTesting: ${test.name}`);
    
    try {
      const message = {
        to: 'bperdomo@zoho.com',
        from: 'support@matchpro.ai',
        templateId: test.templateId,
        dynamicTemplateData: test.data
      };

      const result = await sgMail.send(message);
      console.log(`✅ ${test.name} sent successfully`);
      console.log(`   Template ID: ${test.templateId}`);
      console.log(`   Message ID: ${result[0].headers['x-message-id']}`);
      
    } catch (error) {
      console.log(`❌ ${test.name} failed`);
      console.log(`   Error: ${error.message}`);
      
      if (error.response && error.response.body) {
        console.log(`   Details: ${JSON.stringify(error.response.body, null, 2)}`);
      }
    }
  }

  console.log('\n=== Production Dynamic Template Test Complete ===');
  console.log('Check your email inbox for branded template messages');
  console.log('These should look professional with your MatchPro branding');
}

testDynamicTemplates();