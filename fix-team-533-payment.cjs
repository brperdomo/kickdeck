const { neon } = require('@neondatabase/serverless');

async function fixTeam533Payment() {
  try {
    const sql = neon(process.env.DATABASE_URL);
    
    console.log('=== FIXING TEAM 533 PAYMENT STATUS ===\n');
    
    // Get current team details
    const teams = await sql`
      SELECT id, name, payment_status, setup_intent_id, payment_method_id, stripe_customer_id, total_amount
      FROM teams 
      WHERE id = 533
    `;
    
    if (!teams || teams.length === 0) {
      console.log('❌ Team 533 not found');
      return;
    }
    
    const team = teams[0];
    console.log('📋 CURRENT STATUS:');
    console.log(`  Team: ${team.name}`);
    console.log(`  Payment Status: ${team.payment_status}`);
    console.log(`  Setup Intent: ${team.setup_intent_id || 'MISSING'}`);
    console.log(`  Payment Method: ${team.payment_method_id || 'MISSING'}`);
    console.log(`  Customer ID: ${team.stripe_customer_id || 'MISSING'}`);
    console.log(`  Amount: $${(team.total_amount || 0) / 100}\n`);
    
    // Check if team has all required payment components
    const hasAllComponents = team.setup_intent_id && team.payment_method_id && team.stripe_customer_id && team.total_amount > 0;
    
    if (!hasAllComponents) {
      console.log('❌ Team missing required payment components. Cannot fix.');
      return;
    }
    
    if (team.payment_status === 'payment_failed') {
      console.log('🔧 FIXING: Updating payment_failed to setup_intent_completed...');
      
      const result = await sql`
        UPDATE teams 
        SET payment_status = 'setup_intent_completed'
        WHERE id = 533
      `;
      
      console.log('✅ Team 533 payment status updated to setup_intent_completed');
      console.log('✅ Team is now ready for approval');
      
    } else {
      console.log('ℹ️  Team payment status is already correct:', team.payment_status);
    }
    
  } catch (error) {
    console.error('❌ Error fixing team 533:', error.message);
  }
}

fixTeam533Payment().then(() => process.exit(0));