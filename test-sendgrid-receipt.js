/**
 * Test SendGrid Registration Receipt Dynamic Template
 * 
 * This script tests sending a registration receipt email using
 * SendGrid's dynamic template functionality.
 * 
 * Usage:
 *   node test-sendgrid-receipt.js recipient@example.com
 */

const { db } = require('./server/db/index');
const { sendRegistrationReceiptEmail } = require('./server/services/emailService');

async function testSendGridReceiptEmail() {
  try {
    if (process.argv.length < 3) {
      console.error('Please provide a recipient email address');
      console.error('Usage: node test-sendgrid-receipt.js recipient@example.com');
      process.exit(1);
    }
    
    const recipientEmail = process.argv[2];
    console.log(`Testing SendGrid registration receipt email to: ${recipientEmail}`);
    
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
    
    // Send the registration receipt email using the SendGrid dynamic template
    console.log('Sending registration receipt email via SendGrid dynamic template...');
    await sendRegistrationReceiptEmail(
      recipientEmail,
      sampleTeamData,
      samplePaymentData,
      sampleEventName
    );
    
    console.log(`Registration receipt email sent to ${recipientEmail}`);
    console.log('Check your inbox to verify the email was received correctly with proper formatting');
    
    return { success: true };
  } catch (error) {
    console.error('Error testing SendGrid registration receipt email:', error);
    return { success: false, error };
  } finally {
    // Close the database connection
    try {
      await db.end();
    } catch (err) {
      console.error('Error closing database connection:', err);
    }
  }
}

// Run the test if this file is executed directly
testSendGridReceiptEmail()
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