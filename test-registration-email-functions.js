/**
 * Test Registration Email Functions
 * Tests the specific email functions used during team registration
 */

import sgMail from '@sendgrid/mail';
import dotenv from 'dotenv';

dotenv.config();

// Test using SendGrid dynamic template directly
async function testSendGridDynamicTemplate() {
  console.log('\n=== Testing SendGrid Dynamic Template ===');
  
  if (!process.env.SENDGRID_API_KEY) {
    console.error('SENDGRID_API_KEY not found');
    return false;
  }
  
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  
  // Test the registration confirmation template
  const templateId = 'd-4eca2752ddd247158dd1d5433407cd5e'; // registration_confirmation template
  
  const msg = {
    to: 'bperdomo@zoho.com',
    from: 'support@matchpro.ai',
    templateId: templateId,
    dynamicTemplateData: {
      teamName: 'Test Soccer Team',
      eventName: 'Test Tournament 2024',
      submitterName: 'Test Manager',
      ageGroupName: 'U12 Boys',
      bracketName: 'Division A',
      registrationDate: new Date().toLocaleDateString(),
      loginLink: 'https://matchpro.ai/dashboard',
      supportEmail: 'support@matchpro.ai'
    }
  };
  
  try {
    const result = await sgMail.send(msg);
    console.log('✅ Dynamic template email sent successfully');
    console.log('   Status:', result[0].statusCode);
    console.log('   Message ID:', result[0].headers['x-message-id']);
    return true;
  } catch (error) {
    console.error('❌ Dynamic template email failed:');
    console.error('   Error:', error.message);
    if (error.response && error.response.body) {
      console.error('   SendGrid Response:', JSON.stringify(error.response.body, null, 2));
    }
    return false;
  }
}

// Test team approval template
async function testTeamApprovalTemplate() {
  console.log('\n=== Testing Team Approval Template ===');
  
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  
  const templateId = 'd-1bca14d4dc8e41e5a7ed2131124d470e'; // team_approved template
  
  const msg = {
    to: 'bperdomo@zoho.com',
    from: 'support@matchpro.ai',
    templateId: templateId,
    dynamicTemplateData: {
      teamName: 'Test Soccer Team',
      eventName: 'Test Tournament 2024',
      submitterName: 'Test Manager',
      ageGroupName: 'U12 Boys',
      bracketName: 'Division A',
      approvalDate: new Date().toLocaleDateString(),
      loginLink: 'https://matchpro.ai/dashboard',
      supportEmail: 'support@matchpro.ai'
    }
  };
  
  try {
    const result = await sgMail.send(msg);
    console.log('✅ Team approval email sent successfully');
    console.log('   Status:', result[0].statusCode);
    console.log('   Message ID:', result[0].headers['x-message-id']);
    return true;
  } catch (error) {
    console.error('❌ Team approval email failed:');
    console.error('   Error:', error.message);
    if (error.response && error.response.body) {
      console.error('   SendGrid Response:', JSON.stringify(error.response.body, null, 2));
    }
    return false;
  }
}

async function runTests() {
  console.log('Testing registration email functionality...\n');
  
  const results = {
    dynamicTemplate: await testSendGridDynamicTemplate(),
    teamApproval: await testTeamApprovalTemplate()
  };
  
  console.log('\n=== Test Results Summary ===');
  console.log('Dynamic Template:', results.dynamicTemplate ? '✅ PASS' : '❌ FAIL');
  console.log('Team Approval:', results.teamApproval ? '✅ PASS' : '❌ FAIL');
  
  if (results.dynamicTemplate && results.teamApproval) {
    console.log('\n✅ All email tests passed - SendGrid templates are working correctly');
    console.log('   If registration emails are not being received, the issue may be:');
    console.log('   1. Emails are not being triggered during registration');
    console.log('   2. Error handling is silently catching failures');
    console.log('   3. Email logs are not being shown in the workflow output');
  } else {
    console.log('\n❌ Some email tests failed - check SendGrid template configuration');
  }
}

runTests();