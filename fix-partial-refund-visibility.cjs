/**
 * Fix team visibility issue after partial refunds
 * Teams with partial refunds should remain in 'approved' status
 */

const { db } = require("./db");
const { teams } = require("./db/schema");
const { eq } = require("drizzle-orm");

async function fixPartialRefundVisibility() {
  try {
    console.log('🔍 Finding recently refunded teams...');
    
    // Find teams with refunded status that were likely partial refunds
    const refundedTeams = await db
      .select()
      .from(teams)
      .where(eq(teams.status, 'refunded'));
    
    console.log(`Found ${refundedTeams.length} teams with 'refunded' status:`);
    
    for (const team of refundedTeams) {
      console.log(`\nTeam ${team.id}: ${team.name}`);
      console.log(`  Status: ${team.status}`);
      console.log(`  Refund Date: ${team.refundDate}`);
      console.log(`  Notes: ${team.notes}`);
      
      // Check if this was likely a partial refund (look for "partial" in notes)
      const isLikelyPartialRefund = team.notes && 
        (team.notes.toLowerCase().includes('partial') || 
         team.notes.toLowerCase().includes('$447.50'));
      
      if (isLikelyPartialRefund) {
        console.log(`  ✅ This appears to be a partial refund - updating status to 'approved'`);
        
        await db.update(teams)
          .set({ status: 'approved' })
          .where(eq(teams.id, team.id));
          
        console.log(`  ✅ Team ${team.id} status updated to 'approved'`);
      } else {
        console.log(`  ⚠️  This appears to be a full refund - keeping status as 'refunded'`);
      }
    }
    
    console.log('\n✅ Fix completed. Partially refunded teams should now appear in Approved teams list.');
    
  } catch (error) {
    console.error('❌ Error fixing partial refund visibility:', error);
  }
  
  process.exit();
}

fixPartialRefundVisibility();