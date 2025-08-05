// Quick test script to verify payment processing works for team 874
const { processTeamApprovalPayment } = require('./server/routes/admin/teams.ts');

// Mock team data based on database record
const testTeam = {
  id: 874,
  name: 'B2009 White',
  eventId: '1825427780',
  totalAmount: 119500, // $1,195.00
  setupIntentId: 'seti_1RstPpP4BpmZARxtS4mlNTqI',
  paymentMethodId: 'pm_1RstWJP4BpmZARxt0rxdGBgv',
  stripeCustomerId: 'cus_SoWSIoAVJ7KC9U',
  paymentStatus: 'payment_failed',
  status: 'registered'
};

async function testPayment() {
  try {
    console.log('Testing payment processing for team 874...');
    console.log('Team data:', testTeam);
    
    const result = await processTeamApprovalPayment(testTeam, '874');
    console.log('Payment processing result:', result);
    
    if (result === 'payment_successful') {
      console.log('✅ Payment processing works correctly!');
    } else {
      console.log('❌ Payment processing failed:', result);
    }
  } catch (error) {
    console.error('❌ Error during payment processing:', error.message);
  }
}

testPayment();