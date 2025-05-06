/**
 * Test SendGrid Registration Receipt Email
 * 
 * This script tests sending a registration receipt email using SendGrid's dynamic templates
 * and verifies the dynamic variable replacements are working correctly.
 * 
 * Usage:
 *   node test-sendgrid-registration-receipt.js test@example.com
 */

const { sendRegistrationReceiptEmail } = require('./server/services/emailService');

async function testRegistrationReceiptEmail() {
  try {
    // Get recipient email from command line args or use default
    const recipientEmail = process.argv[2] || 'test@example.com';
    
    // Mock team data
    const mockTeam = {
      id: 1234,
      name: "Test Soccer Team",
      eventId: 5678,
      ageGroupId: 10,
      status: "registered",
      submitterName: "John Doe",
      submitterEmail: recipientEmail,
      registrationFee: 25000, // $250 in cents
      totalAmount: 30000, // $300 in cents (with extra fees)
      selectedFeeIds: "1,2",
      coach: JSON.stringify({
        headCoachName: "Mike Johnson",
        headCoachEmail: "coach@example.com",
        headCoachPhone: "555-123-4567"
      }),
      managerName: "Sarah Smith",
      managerEmail: "manager@example.com",
      managerPhone: "555-987-6543",
      termsAcknowledged: true,
      termsAcknowledgedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };
    
    // Mock payment data
    const mockPayment = {
      status: "paid",
      amount: 30000, // $300 in cents
      paymentIntentId: "pi_" + Math.random().toString(36).substring(2, 15),
      paymentDate: new Date().toISOString(),
      cardBrand: "visa",
      cardLastFour: "4242",
      paymentMethodType: "card"
    };
    
    console.log(`Sending test registration receipt email to ${recipientEmail}...`);
    
    // Send the email
    await sendRegistrationReceiptEmail(
      recipientEmail,
      mockTeam,
      mockPayment,
      "Spring Soccer Tournament 2025"
    );
    
    console.log('✅ Registration receipt email sent successfully!');
    console.log('Check your inbox to verify the email content.');
    
  } catch (error) {
    console.error('❌ Error sending registration receipt email:', error);
  }
}

// Run the test
testRegistrationReceiptEmail();