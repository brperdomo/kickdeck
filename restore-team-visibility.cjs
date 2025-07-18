/**
 * Restore visibility for partially refunded teams
 * Teams with partial refunds should remain in approved status
 */

const { db } = require("./db");
const { teams } = require("./db/schema");
const { eq } = require("drizzle-orm");

async function restoreTeamVisibility() {
  try {
    console.log('🔍 Finding teams with refunded status that should be approved...');
    
    // Find teams with 'refunded' status
    const refundedTeams = await db
      .select()
      .from(teams)
      .where(eq(teams.status, 'refunded'));
    
    console.log(`Found ${refundedTeams.length} teams with 'refunded' status`);
    
    for (const team of refundedTeams) {
      console.log(`\nTeam ${team.id}: ${team.name}`);
      console.log(`  Status: ${team.status}`);
      console.log(`  Notes: ${team.notes}`);
      
      // Check if this was a partial refund (look for partial refund indicators or check amounts)
      const isPartialRefund = (team.notes && (
        team.notes.toLowerCase().includes('partial') ||
        team.notes.includes('$447.50') ||
        team.notes.includes('447.50')
      )) || (
        // Team 488 was partially refunded - known case
        team.id === 488 && team.refundDate
      );
      
      if (isPartialRefund) {
        console.log(`  ✅ Partial refund detected - restoring to 'approved' status`);
        
        await db.update(teams)
          .set({ status: 'approved' })
          .where(eq(teams.id, team.id));
          
        console.log(`  ✅ Team ${team.id} status restored to 'approved'`);
      } else {
        console.log(`  ⚠️  Full refund - keeping status as 'refunded'`);
      }
    }
    
    console.log('\n✅ Team visibility restoration completed');
    
  } catch (error) {
    console.error('❌ Error restoring team visibility:', error);
  }
  
  process.exit();
}

restoreTeamVisibility();