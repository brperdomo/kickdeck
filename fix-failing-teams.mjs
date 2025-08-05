import postgres from 'postgres';
import 'dotenv/config';

const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });

async function fixFailingTeams() {
  console.log('🔧 Fixing payment status for teams 863 and 865...\n');
  
  try {
    // Update teams 863 and 865 to payment_ready status
    const updatedTeams = await sql`
      UPDATE teams 
      SET payment_status = 'payment_ready'
      WHERE id IN (863, 865)
      AND payment_method_id IS NOT NULL
      AND total_amount > 0
      RETURNING id, name, payment_status, total_amount, payment_method_id
    `;
    
    console.log('✅ Updated team payment statuses:');
    for (const team of updatedTeams) {
      console.log(`   Team ${team.id}: ${team.name}`);
      console.log(`     Status: ${team.payment_status}`);
      console.log(`     Amount: $${(team.total_amount / 100).toFixed(2)}`);
      console.log(`     Payment Method: ${team.payment_method_id}`);
    }
    
    // Verify the fix
    console.log('\n🔍 Verification - checking payment readiness:');
    const verification = await sql`
      SELECT 
        t.id,
        t.name,
        t.payment_status,
        t.total_amount,
        t.payment_method_id,
        CASE 
          WHEN t.payment_method_id IS NOT NULL 
            AND t.total_amount > 0 
            AND e.stripe_connect_account_id IS NOT NULL 
          THEN 'READY'
          ELSE 'NOT_READY'
        END as readiness_status
      FROM teams t
      JOIN events e ON t.event_id = e.id
      WHERE t.id IN (863, 865)
    `;
    
    for (const team of verification) {
      console.log(`   Team ${team.id}: ${team.name}`);
      console.log(`     Payment Status: ${team.payment_status}`);
      console.log(`     Readiness: ${team.readiness_status}`);
      console.log(`     Ready for processing: ${team.readiness_status === 'READY' ? '✅ YES' : '❌ NO'}`);
    }
    
    console.log('\n🎯 Fix Summary:');
    console.log('- Updated payment status from payment_failed to payment_ready');
    console.log('- Teams now have valid payment methods and amounts');
    console.log('- Payment processing should work for team approval');
    
  } catch (error) {
    console.error('❌ Error fixing teams:', error.message);
  } finally {
    await sql.end();
  }
}

fixFailingTeams();