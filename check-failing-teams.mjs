import postgres from 'postgres';
import 'dotenv/config';

const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });

async function checkFailingTeams() {
  console.log('🔍 Checking teams 863 and 865 payment status...\n');
  
  try {
    // Get detailed team data for the failing teams
    const teams = await sql`
      SELECT 
        t.id,
        t.name,
        t.payment_status,
        t.total_amount,
        t.payment_method_id,
        t.stripe_customer_id,
        t.setup_intent_id,
        t.status,
        e.stripe_connect_account_id,
        e.connect_account_status,
        e.name as event_name
      FROM teams t
      JOIN events e ON t.event_id = e.id
      WHERE t.id IN (863, 865)
      ORDER BY t.id
    `;
    
    console.log('📊 Team Payment Analysis:');
    for (const team of teams) {
      console.log(`\n🏆 Team ${team.id}: ${team.name}`);
      console.log(`   Event: ${team.event_name}`);
      console.log(`   Team Status: ${team.status}`);
      console.log(`   Payment Status: ${team.payment_status}`);
      console.log(`   Total Amount: $${team.total_amount ? (team.total_amount / 100).toFixed(2) : 'NULL'}`);
      console.log(`   Payment Method ID: ${team.payment_method_id || 'NULL'}`);
      console.log(`   Customer ID: ${team.stripe_customer_id || 'NULL'}`);
      console.log(`   Setup Intent ID: ${team.setup_intent_id || 'NULL'}`);
      console.log(`   Connect Account: ${team.stripe_connect_account_id || 'NULL'}`);
      console.log(`   Connect Status: ${team.connect_account_status || 'NULL'}`);
      
      // Identify issues
      const issues = [];
      if (!team.total_amount || team.total_amount <= 0) {
        issues.push('❌ No total amount set');
      }
      if (!team.payment_method_id) {
        issues.push('❌ No payment method');
      }
      if (!team.stripe_connect_account_id) {
        issues.push('❌ No connect account');
      }
      if (team.payment_status !== 'payment_ready') {
        issues.push(`❌ Payment status: ${team.payment_status}`);
      }
      
      if (issues.length > 0) {
        console.log(`   Issues found:`);
        issues.forEach(issue => console.log(`     ${issue}`));
      } else {
        console.log(`   ✅ All payment prerequisites met`);
      }
    }
    
    // Check if there are any other teams with similar issues
    const problematicTeams = await sql`
      SELECT 
        t.id,
        t.name,
        t.payment_status,
        t.total_amount,
        t.payment_method_id
      FROM teams t
      WHERE t.event_id = ${teams[0]?.event_id || 0}
      AND (
        t.payment_status = 'payment_error' 
        OR t.total_amount IS NULL 
        OR t.payment_method_id IS NULL
      )
      AND t.id NOT IN (851, 859)
      ORDER BY t.id
    `;
    
    if (problematicTeams.length > 0) {
      console.log(`\n⚠️  Found ${problematicTeams.length} other teams with payment issues:`);
      for (const team of problematicTeams) {
        console.log(`   Team ${team.id}: ${team.name} - Status: ${team.payment_status}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking teams:', error.message);
  } finally {
    await sql.end();
  }
}

checkFailingTeams();