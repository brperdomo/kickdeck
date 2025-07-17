const { db } = require('./db/index.js');
const { teams } = require('./db/schema.js');
const { eq } = require('drizzle-orm');

async function debugTeam533() {
  try {
    console.log('=== DEBUGGING TEAM 533 PAYMENT SETUP ===\n');
    
    const team = await db.query.teams.findFirst({
      where: eq(teams.id, 533),
      with: { event: true }
    });
    
    if (!team) {
      console.log('❌ Team 533 not found in database');
      return;
    }
    
    console.log('📋 TEAM BASIC INFO:');
    console.log(`  - Team Name: ${team.teamName}`);
    console.log(`  - Age Group: ${team.ageGroup}`);
    console.log(`  - Team Status: ${team.teamStatus}`);
    console.log(`  - Event ID: ${team.eventId}\n`);
    
    console.log('💳 PAYMENT SETUP:');
    console.log(`  - Payment Status: ${team.paymentStatus}`);
    console.log(`  - Total Amount: $${(team.totalAmount || 0) / 100}`);
    console.log(`  - Registration Fee: $${(team.registrationFee || 0) / 100}`);
    console.log(`  - Setup Intent ID: ${team.setupIntentId || 'MISSING'}`);
    console.log(`  - Payment Method ID: ${team.paymentMethodId || 'MISSING'}`);
    console.log(`  - Customer ID: ${team.customerId || 'MISSING'}`);
    console.log(`  - Link Payment: ${team.linkPayment || 'false'}\n`);
    
    // Check validation status
    console.log('🔍 VALIDATION CHECKS:');
    
    // Check if team has required payment fields
    const hasSetupIntent = !!team.setupIntentId;
    const hasPaymentMethod = !!team.paymentMethodId;
    const hasCustomer = !!team.customerId;
    const hasAmount = team.totalAmount > 0;
    
    console.log(`  ✓ Has Setup Intent: ${hasSetupIntent ? '✅' : '❌'}`);
    console.log(`  ✓ Has Payment Method: ${hasPaymentMethod ? '✅' : '❌'}`);
    console.log(`  ✓ Has Customer ID: ${hasCustomer ? '✅' : '❌'}`);
    console.log(`  ✓ Has Amount > 0: ${hasAmount ? '✅' : '❌'}\n`);
    
    // Determine what's blocking approval
    const issues = [];
    if (!hasSetupIntent) issues.push('Missing Setup Intent');
    if (!hasPaymentMethod) issues.push('Missing Payment Method');
    if (!hasCustomer) issues.push('Missing Customer ID');
    if (!hasAmount) issues.push('Missing or zero amount');
    
    if (issues.length === 0) {
      console.log('✅ TEAM 533 APPEARS READY FOR APPROVAL');
      console.log('   Payment setup looks complete. Issue may be in payment processing logic.');
    } else {
      console.log('❌ PAYMENT SETUP ISSUES FOUND:');
      issues.forEach(issue => console.log(`   - ${issue}`));
    }
    
    console.log('\n=== NEXT STEPS ===');
    if (issues.length > 0) {
      console.log('Need to run payment integrity fix for team 533');
    } else {
      console.log('Check server payment processing logs for specific error details');
    }
    
  } catch (error) {
    console.error('❌ Error checking team 533:', error.message);
  }
}

debugTeam533().then(() => process.exit(0));