/**
 * Test SendGrid Template Data Mapping
 * 
 * This script tests your SendGrid templates with real MatchPro data fields
 * to verify all placeholders map correctly and no merge fields return empty.
 */

import { MailService } from '@sendgrid/mail';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.SENDGRID_API_KEY;
const testEmail = 'bperdomo@zoho.com';

console.log('Testing SendGrid Template Data Mapping');
console.log('=====================================');

async function testTemplateDataMapping() {
  if (!apiKey) {
    console.log('Missing SENDGRID_API_KEY');
    return;
  }

  const sgMail = new MailService();
  sgMail.setApiKey(apiKey);

  // Test 1: Registration Confirmation with complete MatchPro data
  console.log('\n1. Testing Registration Confirmation Template...');
  
  const registrationData = {
    teamName: 'Thunder FC U12',
    eventName: 'Spring Championship 2025',
    ageGroup: 'U12 Boys',
    bracket: 'Division A',
    clubName: 'Thunder Soccer Club',
    submitterName: 'John Smith',
    submitterEmail: 'john.smith@email.com',
    headCoachName: 'Coach Martinez',
    managerName: 'Sarah Johnson',
    managerEmail: 'sarah.johnson@email.com',
    managerPhone: '(555) 123-4567',
    registrationDate: 'January 19, 2025 at 3:18 PM',
    totalAmount: '175.00',
    selectedFees: [
      { name: 'Registration Fee', amount: '150.00' },
      { name: 'Processing Fee', amount: '25.00' }
    ],
    cardBrand: 'Visa',
    cardLastFour: '4242',
    setupIntentId: 'seti_1234567890abcdef',
    addRosterLater: false,
    loginLink: 'https://app.matchpro.ai/dashboard',
    supportEmail: 'support@matchpro.ai',
    organizationName: 'MatchPro',
    currentYear: 2025
  };

  try {
    const result = await sgMail.send({
      to: testEmail,
      from: 'support@matchpro.ai',
      templateId: 'd-4eca2752ddd247158dd1d5433407cd5e',
      dynamicTemplateData: registrationData
    });
    
    console.log('✓ Registration confirmation sent with real data');
    console.log(`  Message ID: ${result[0].headers['x-message-id']}`);
  } catch (error) {
    console.log('✗ Registration confirmation failed');
    console.log(`  Error: ${error.message}`);
  }

  // Test 2: Payment Confirmation with transaction details
  console.log('\n2. Testing Payment Confirmation Template...');
  
  const paymentData = {
    teamName: 'Thunder FC U12',
    eventName: 'Spring Championship 2025',
    registrationDate: 'January 19, 2025 at 3:18 PM',
    paymentDate: 'January 19, 2025 at 3:25 PM',
    totalAmount: '175.00',
    cardBrand: 'Visa',
    cardLastFour: '4242',
    paymentId: 'pi_3AbCdEfGhIjKlMnO',
    transactionId: 'txn_1234567890',
    receiptNumber: 'RCP-2025-001234',
    selectedFees: [
      { name: 'Registration Fee', amount: '150.00' },
      { name: 'Processing Fee', amount: '25.00' }
    ],
    submitterName: 'John Smith',
    submitterEmail: 'john.smith@email.com',
    loginLink: 'https://app.matchpro.ai/dashboard',
    supportEmail: 'support@matchpro.ai'
  };

  try {
    const result = await sgMail.send({
      to: testEmail,
      from: 'support@matchpro.ai',
      templateId: 'd-3697f286c1e748f298710282e515ee25',
      dynamicTemplateData: paymentData
    });
    
    console.log('✓ Payment confirmation sent with transaction data');
    console.log(`  Message ID: ${result[0].headers['x-message-id']}`);
  } catch (error) {
    console.log('✗ Payment confirmation failed');
    console.log(`  Error: ${error.message}`);
  }

  // Test 3: Team Approved with payment info
  console.log('\n3. Testing Team Approved Template...');
  
  const approvalData = {
    teamName: 'Thunder FC U12',
    eventName: 'Spring Championship 2025',
    userName: 'John Smith',
    paymentAmount: '175.00',
    cardBrand: 'Visa',
    cardLastFour: '4242',
    approvalDate: 'January 19, 2025',
    supportEmail: 'support@matchpro.ai',
    loginLink: 'https://app.matchpro.ai/dashboard',
    currentYear: 2025
  };

  try {
    const result = await sgMail.send({
      to: testEmail,
      from: 'support@matchpro.ai',
      templateId: 'd-1bca14d4dc8e41e5a7ed2131124d470e',
      dynamicTemplateData: approvalData
    });
    
    console.log('✓ Team approved email sent with payment data');
    console.log(`  Message ID: ${result[0].headers['x-message-id']}`);
  } catch (error) {
    console.log('✗ Team approved email failed');
    console.log(`  Error: ${error.message}`);
  }

  // Test 4: Password Reset with user data
  console.log('\n4. Testing Password Reset Template...');
  
  const passwordResetData = {
    username: 'john.smith@email.com',
    resetUrl: 'https://app.matchpro.ai/reset-password?token=abc123def456',
    resetLink: 'https://app.matchpro.ai/reset-password?token=abc123def456',
    token: 'abc123def456',
    expiryHours: 24,
    supportEmail: 'support@matchpro.ai',
    currentYear: 2025
  };

  try {
    const result = await sgMail.send({
      to: testEmail,
      from: 'support@matchpro.ai',
      templateId: 'd-7eb7ea1c19ca4090a0cefa3a2be75088',
      dynamicTemplateData: passwordResetData
    });
    
    console.log('✓ Password reset sent with user data');
    console.log(`  Message ID: ${result[0].headers['x-message-id']}`);
  } catch (error) {
    console.log('✗ Password reset failed');
    console.log(`  Error: ${error.message}`);
  }

  console.log('\n=== Data Mapping Test Results ===');
  console.log('Check your email inbox for 4 test messages.');
  console.log('Verify these elements display correctly:');
  console.log('• Team names and event details');
  console.log('• Card information (Visa ending in 4242)');
  console.log('• Payment amounts ($175.00)');
  console.log('• Contact information and dates');
  console.log('• Links and buttons work correctly');
  console.log('');
  console.log('Any missing data indicates a placeholder mismatch');
  console.log('in your SendGrid template design.');
}

testTemplateDataMapping();