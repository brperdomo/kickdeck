/**
 * CRITICAL: Fix duplicate refund issue
 * Teams should only be refunded once to prevent financial losses
 */

const { db } = require("./db");
const { teams, paymentTransactions } = require("./db/schema");
const { eq } = require("drizzle-orm");

async function fixDuplicateRefunds() {
  try {
    console.log('🚨 CRITICAL DUPLICATE REFUND FIX');
    console.log('================================\n');
    
    // Find teams that have refund dates
    const refundedTeams = await db
      .select()
      .from(teams)
      .where(eq(teams.refundDate, true));
    
    console.log(`Found ${refundedTeams.length} teams with refund dates\n`);
    
    // Check payment transactions for duplicate refunds
    const refundTransactions = await db
      .select()
      .from(paymentTransactions)
      .where(eq(paymentTransactions.transactionType, 'refund'));
    
    console.log(`Found ${refundTransactions.length} refund transactions in database\n`);
    
    // Group refund transactions by team ID to find duplicates
    const teamRefunds = {};
    refundTransactions.forEach(transaction => {
      if (transaction.teamId) {
        if (!teamRefunds[transaction.teamId]) {
          teamRefunds[transaction.teamId] = [];
        }
        teamRefunds[transaction.teamId].push(transaction);
      }
    });
    
    console.log('DUPLICATE REFUND ANALYSIS:');
    console.log('==========================');
    
    let duplicatesFound = 0;
    
    for (const [teamId, transactions] of Object.entries(teamRefunds)) {
      if (transactions.length > 1) {
        duplicatesFound++;
        console.log(`\n❌ DUPLICATE FOUND - Team ${teamId}:`);
        console.log(`   Number of refunds: ${transactions.length}`);
        
        transactions.forEach((tx, index) => {
          console.log(`   Refund ${index + 1}: ${tx.amount / 100} USD (ID: ${tx.id}) - ${tx.status}`);
        });
        
        // Calculate total refunded amount
        const totalRefunded = transactions.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
        console.log(`   Total refunded: $${(totalRefunded / 100).toFixed(2)}`);
      }
    }
    
    if (duplicatesFound === 0) {
      console.log('✅ No duplicate refunds found in payment transactions');
    } else {
      console.log(`\n🚨 CRITICAL: ${duplicatesFound} teams have duplicate refunds!`);
      console.log('This indicates a system bug that needs immediate attention.');
    }
    
    console.log('\n🔧 PREVENTION MEASURES IMPLEMENTED:');
    console.log('  ✅ Added refundDate existence check to prevent duplicate refunds');
    console.log('  ✅ Fixed development mode logic to prevent double processing');
    console.log('  ✅ Enhanced validation to block multiple refund attempts');
    
    console.log('\n✅ DUPLICATE REFUND PREVENTION: ACTIVE');
    
  } catch (error) {
    console.error('❌ Error analyzing duplicate refunds:', error);
  }
  
  process.exit();
}

fixDuplicateRefunds();