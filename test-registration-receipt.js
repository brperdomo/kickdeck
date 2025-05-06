/**
 * Registration Receipt Email Test
 * 
 * This script tests sending a registration receipt email
 * using the new template and email service function.
 * 
 * Usage:
 *   node test-registration-receipt.js recipient@example.com
 */

import { db } from './server/db/index.js';
import { createRegistrationReceiptTemplate } from './create-registration-receipt-template.js';
import { sendRegistrationReceiptEmail } from './server/services/emailService.js';

async function testRegistrationReceipt() {
  try {
    if (process.argv.length < 3) {
      console.error('Please provide a recipient email address');
      console.error('Usage: node test-registration-receipt.js recipient@example.com');
      process.exit(1);
    }
    
    const recipientEmail = process.argv[2];
    console.log(`Testing registration receipt email with recipient: ${recipientEmail}`);
    
    // First ensure the template exists by running the creation script
    console.log('Ensuring registration receipt template exists...');
    const templateResult = await createRegistrationReceiptTemplate();
    console.log(templateResult.message);
    
    // Create sample team and payment data for testing
    const sampleTeamData = {
      id: 12345,
      name: 'Test Team',
      eventId: 'event123',
      submitterName: 'John Doe',
      submitterEmail: recipientEmail,
      managerName: 'Jane Smith',
      managerEmail: 'jane@example.com',
      createdAt: new Date().toISOString(),
      totalAmount: 15000, // $150.00
      paymentStatus: 'paid',
      paymentDate: new Date().toISOString(),
      paymentIntentId: 'pi_' + Math.random().toString(36).substring(2, 15),
      cardBrand: 'visa',
      cardLastFour: '4242',
      clubName: 'Westside Soccer Club',
      selectedFeeIds: '1,2,3'
    };
    
    const samplePaymentData = {
      id: 98765,
      teamId: 12345,
      status: 'paid',
      amount: 15000,
      paymentIntentId: sampleTeamData.paymentIntentId,
      paymentDate: sampleTeamData.paymentDate,
      cardBrand: 'visa',
      cardLastFour: '4242',
      paymentMethodType: 'card'
    };
    
    const sampleEventName = 'Fall 2023 Soccer Tournament';
    
    // Send the registration receipt email
    console.log('Sending registration receipt email...');
    await sendRegistrationReceiptEmail(
      recipientEmail,
      sampleTeamData,
      samplePaymentData,
      sampleEventName
    );
    
    console.log(`Registration receipt email sent to ${recipientEmail}`);
    console.log('Check your inbox to verify the email was received correctly');
    
    return { success: true };
  } catch (error) {
    console.error('Error testing registration receipt email:', error);
    return { success: false, error };
  } finally {
    // Close the database connection
    await db.end();
  }
}

// Run the test if this file is executed directly
if (process.argv[1].endsWith('test-registration-receipt.js')) {
  testRegistrationReceipt()
    .then(result => {
      if (result.success) {
        console.log('Test completed successfully');
        process.exit(0);
      } else {
        console.error('Test failed:', result.error);
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Unexpected error during test:', error);
      process.exit(1);
    });
}