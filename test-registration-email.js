/**
 * Test Registration Email Script
 * 
 * This script tests the registration email flow to identify
 * why emails might not be sending during team registrations.
 */

import dotenv from 'dotenv';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Load environment variables
dotenv.config();

// Import using require for TypeScript compiled modules
const { sendRegistrationConfirmationEmail, sendTemplatedEmail } = require('./server/services/emailService.ts');

// Load environment variables
dotenv.config();

async function testRegistrationEmails() {
  console.log('\n=== Testing Registration Email Flow ===\n');
  
  // Test data similar to what would be sent during actual registration
  const mockTeamData = {
    id: 'test-team-123',
    name: 'Test Soccer Team',
    submitterEmail: 'bperdomo@zoho.com',
    submitterName: 'Test Submitter',
    managerName: 'Team Manager',
    managerEmail: 'bperdomo@zoho.com',
    ageGroupId: 1,
    setupIntentId: 'seti_test_123',
    paymentStatus: 'payment_info_provided',
    totalAmount: 15000, // $150.00 in cents
    createdAt: new Date().toISOString()
  };
  
  const mockEventInfo = {
    name: 'Test Tournament 2024'
  };
  
  const mockAgeGroup = {
    id: 1,
    name: 'U12 Boys',
    gender: 'boys',
    minAge: 10,
    maxAge: 12
  };
  
  const mockBracket = {
    id: 1,
    name: 'Division A',
    type: 'competitive'
  };
  
  // Test 1: Registration Confirmation Email (Setup Intent Flow)
  console.log('--- Test 1: Registration Confirmation Email ---');
  try {
    await sendRegistrationConfirmationEmail(
      mockTeamData.submitterEmail,
      mockTeamData,
      mockEventInfo,
      mockAgeGroup,
      mockBracket
    );
    console.log('✅ Registration confirmation email sent successfully');
  } catch (error) {
    console.error('❌ Registration confirmation email failed:');
    console.error('   Error:', error.message);
    if (error.stack) {
      console.error('   Stack:', error.stack.split('\n').slice(0, 3).join('\n'));
    }
  }
  
  // Test 2: Direct templated email test
  console.log('\n--- Test 2: Direct Template Email Test ---');
  try {
    await sendTemplatedEmail(
      'bperdomo@zoho.com',
      'registration_confirmation',
      {
        teamName: mockTeamData.name,
        eventName: mockEventInfo.name,
        submitterName: mockTeamData.submitterName,
        ageGroupName: mockAgeGroup.name,
        bracketName: mockBracket.name,
        registrationDate: new Date().toLocaleDateString(),
        loginLink: 'https://matchpro.ai/dashboard'
      }
    );
    console.log('✅ Direct template email sent successfully');
  } catch (error) {
    console.error('❌ Direct template email failed:');
    console.error('   Error:', error.message);
  }
  
  // Test 3: Check if template exists in database
  console.log('\n--- Test 3: Template Verification ---');
  try {
    const { db } = await import('./db/index.js');
    const { emailTemplates } = await import('./db/schema/emailTemplates.js');
    const { eq, and } = await import('drizzle-orm');
    
    const [template] = await db
      .select()
      .from(emailTemplates)
      .where(and(
        eq(emailTemplates.type, 'registration_confirmation'),
        eq(emailTemplates.isActive, true)
      ));
      
    if (template) {
      console.log('✅ Registration confirmation template found in database');
      console.log(`   Subject: ${template.subject}`);
      console.log(`   Sender: ${template.senderName} <${template.senderEmail}>`);
      console.log(`   SendGrid Template ID: ${template.sendgridTemplateId || 'None (using local template)'}`);
    } else {
      console.error('❌ Registration confirmation template not found in database');
      console.log('   This could be why emails are not being sent');
    }
  } catch (error) {
    console.error('❌ Error checking template in database:', error.message);
  }
  
  console.log('\n=== Registration Email Test Complete ===\n');
}

// Run the test
testRegistrationEmails().catch(console.error);