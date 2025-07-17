const { neon } = require('@neondatabase/serverless');

async function fixAllPaymentFailedTeams() {
  try {
    const sql = neon(process.env.DATABASE_URL);
    
    console.log('=== FIXING ALL PAYMENT_FAILED TEAMS WITH COMPLETE SETUP ===\n');
    
    // Get all teams with payment_failed status but complete payment setup
    const teams = await sql`
      SELECT id, name, payment_status, setup_intent_id, payment_method_id, stripe_customer_id, total_amount
      FROM teams 
      WHERE payment_status = 'payment_failed' 
        AND setup_intent_id IS NOT NULL 
        AND payment_method_id IS NOT NULL 
        AND stripe_customer_id IS NOT NULL
        AND total_amount > 0
      ORDER BY id
    `;
    
    if (!teams || teams.length === 0) {
      console.log('✅ No teams found needing payment status fixes');
      return;
    }
    
    console.log(`📋 FOUND ${teams.length} TEAMS TO FIX:\n`);
    
    teams.forEach((team, index) => {
      console.log(`${index + 1}. Team ${team.id}: ${team.name.trim()}`);
      console.log(`   Amount: $${team.total_amount / 100}`);
      console.log(`   Setup Intent: ${team.setup_intent_id}`);
      console.log('');
    });
    
    console.log('🔧 UPDATING ALL TEAMS TO setup_intent_completed...\n');
    
    // Update all teams at once
    const teamIds = teams.map(t => t.id);
    const result = await sql`
      UPDATE teams 
      SET payment_status = 'setup_intent_completed'
      WHERE id = ANY(${teamIds})
    `;
    
    console.log('✅ BULK UPDATE COMPLETE!');
    console.log(`✅ Fixed ${teams.length} teams with complete payment setups`);
    console.log('✅ All teams now ready for approval');
    
    // List the fixed teams
    console.log('\n📝 TEAMS FIXED:');
    teams.forEach((team, index) => {
      console.log(`${index + 1}. Team ${team.id}: ${team.name.trim()} - $${team.total_amount / 100}`);
    });
    
  } catch (error) {
    console.error('❌ Error fixing payment failed teams:', error.message);
  }
}

fixAllPaymentFailedTeams().then(() => process.exit(0));