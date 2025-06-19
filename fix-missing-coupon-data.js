import { db } from './db/index.ts';
import { sql } from 'drizzle-orm';

async function fixMissingCouponData() {
  try {
    console.log('Checking teams with missing coupon data but clear discount applied...');
    
    // Find teams where registration fee doesn't match total amount (indicating discount was applied)
    const teamsWithDiscounts = await db.execute(sql`
      SELECT 
        t.id,
        t.name,
        t.applied_coupon,
        t.total_amount,
        t.selected_fee_ids,
        t.created_at,
        ef.amount as fee_amount
      FROM teams t
      JOIN event_fees ef ON ef.id = ANY(
        SELECT jsonb_array_elements_text(t.selected_fee_ids::jsonb)::int
      )
      WHERE t.applied_coupon IS NULL
      AND t.total_amount < ef.amount
      ORDER BY t.created_at DESC
    `);
    
    console.log(`Found ${teamsWithDiscounts.rows.length} teams with potential missing coupon data:`);
    
    for (const team of teamsWithDiscounts.rows) {
      const discount = team.fee_amount - team.total_amount;
      console.log(`- Team: ${team.name} (ID: ${team.id})`);
      console.log(`  Fee: $${(team.fee_amount / 100).toFixed(2)}, Total: $${(team.total_amount / 100).toFixed(2)}`);
      console.log(`  Discount: $${(discount / 100).toFixed(2)}`);
      
      // If discount is exactly $500, this is likely CALELITE500
      if (discount === 50000) { // $500 in cents
        console.log(`  → This matches CALELITE500 discount exactly!`);
        
        // Get CALELITE500 coupon data
        const couponResult = await db.execute(sql`
          SELECT * FROM coupons WHERE UPPER(code) = 'CALELITE500'
        `);
        
        if (couponResult.rows.length > 0) {
          const coupon = couponResult.rows[0];
          const couponData = {
            id: coupon.id,
            code: coupon.code,
            discountType: coupon.discount_type,
            amount: coupon.discount_type === 'fixed' ? coupon.amount : coupon.amount,
            description: coupon.description
          };
          
          console.log(`  → Updating team ${team.id} with CALELITE500 coupon data...`);
          
          // Update the team record with the coupon data
          await db.execute(sql`
            UPDATE teams 
            SET applied_coupon = ${JSON.stringify(couponData)}
            WHERE id = ${team.id}
          `);
          
          console.log(`  ✓ Updated team ${team.name} with coupon data`);
          
          // Also increment the coupon usage count
          await db.execute(sql`
            UPDATE coupons 
            SET usage_count = usage_count + 1,
                updated_at = NOW()
            WHERE id = ${coupon.id}
          `);
          
          console.log(`  ✓ Incremented CALELITE500 usage count`);
        }
      }
    }
    
    // Check final coupon usage
    const finalUsage = await db.execute(sql`
      SELECT usage_count FROM coupons WHERE UPPER(code) = 'CALELITE500'
    `);
    
    console.log(`\nFinal CALELITE500 usage count: ${finalUsage.rows[0]?.usage_count || 0}`);
    
  } catch (error) {
    console.error('Error fixing missing coupon data:', error);
  }
}

fixMissingCouponData().then(() => process.exit(0)).catch(console.error);