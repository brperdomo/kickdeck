import { db } from './db/index.ts';
import { sql } from 'drizzle-orm';

async function fixAllMissingCoupons() {
  try {
    console.log('🔍 Scanning for teams with missing coupon data...\n');
    
    // First, get all events (Rise Cup and Empire Super Cup)
    const events = await db.execute(sql`
      SELECT id, name FROM events 
      WHERE name ILIKE '%Rise Cup%' OR name ILIKE '%Empire Super Cup%'
      ORDER BY name
    `);
    
    console.log(`Found ${events.rows.length} tournament events:`);
    events.rows.forEach(event => {
      console.log(`- ${event.name} (ID: ${event.id})`);
    });
    console.log('');
    
    // Get available coupons that could match discount amounts
    const coupons = await db.execute(sql`
      SELECT * FROM coupons 
      WHERE is_active = true
      ORDER BY code
    `);
    
    console.log(`Available active coupons:`);
    coupons.rows.forEach(coupon => {
      const discountDisplay = coupon.discount_type === 'fixed' 
        ? `$${coupon.amount}` 
        : `${coupon.amount}%`;
      console.log(`- ${coupon.code}: ${discountDisplay} (ID: ${coupon.id})`);
    });
    console.log('');
    
    // Find teams with potential missing coupon data
    const teamsWithDiscounts = await db.execute(sql`
      SELECT DISTINCT
        t.id,
        t.name,
        t.applied_coupon,
        t.total_amount,
        t.selected_fee_ids,
        t.created_at,
        e.name as event_name,
        e.id as event_id
      FROM teams t
      JOIN events e ON t.event_id = e.id
      WHERE t.applied_coupon IS NULL
      AND (e.name ILIKE '%Rise Cup%' OR e.name ILIKE '%Empire Super Cup%')
      ORDER BY e.name, t.created_at DESC
    `);
    
    console.log(`📊 Found ${teamsWithDiscounts.rows.length} teams without coupon data in target events\n`);
    
    let fixedTeams = 0;
    let totalCouponUpdates = {};
    
    for (const team of teamsWithDiscounts.rows) {
      console.log(`🔍 Analyzing team: ${team.name} (ID: ${team.id})`);
      console.log(`   Event: ${team.event_name}`);
      console.log(`   Total paid: $${(team.total_amount / 100).toFixed(2)}`);
      
      // Get the fee amount for this team's selected fees
      const feeAmounts = await db.execute(sql`
        SELECT SUM(ef.amount) as total_fee_amount
        FROM event_fees ef
        WHERE ef.id = ANY(
          SELECT jsonb_array_elements_text(${team.selected_fee_ids}::jsonb)::int
        )
      `);
      
      if (feeAmounts.rows.length > 0 && feeAmounts.rows[0].total_fee_amount) {
        const totalFeeAmount = feeAmounts.rows[0].total_fee_amount;
        const discount = totalFeeAmount - team.total_amount;
        
        console.log(`   Original fee: $${(totalFeeAmount / 100).toFixed(2)}`);
        console.log(`   Discount applied: $${(discount / 100).toFixed(2)}`);
        
        if (discount > 0) {
          // Try to match the discount to a coupon
          let matchedCoupon = null;
          
          for (const coupon of coupons.rows) {
            if (coupon.discount_type === 'fixed' && discount === coupon.amount * 100) {
              // Fixed amount match (convert coupon amount to cents)
              matchedCoupon = coupon;
              break;
            } else if (coupon.discount_type === 'percentage') {
              // Percentage match
              const expectedDiscount = Math.round((totalFeeAmount * coupon.amount) / 100);
              if (Math.abs(discount - expectedDiscount) <= 100) { // Allow $1 variance for rounding
                matchedCoupon = coupon;
                break;
              }
            }
          }
          
          if (matchedCoupon) {
            console.log(`   ✅ Matched coupon: ${matchedCoupon.code}`);
            
            const couponData = {
              id: matchedCoupon.id,
              code: matchedCoupon.code,
              discountType: matchedCoupon.discount_type,
              amount: matchedCoupon.amount,
              description: matchedCoupon.description
            };
            
            // Update the team record
            await db.execute(sql`
              UPDATE teams 
              SET applied_coupon = ${JSON.stringify(couponData)}
              WHERE id = ${team.id}
            `);
            
            // Track coupon usage updates
            if (!totalCouponUpdates[matchedCoupon.code]) {
              totalCouponUpdates[matchedCoupon.code] = {
                couponId: matchedCoupon.id,
                count: 0
              };
            }
            totalCouponUpdates[matchedCoupon.code].count++;
            
            fixedTeams++;
            console.log(`   ✅ Updated team with ${matchedCoupon.code} coupon data`);
          } else {
            console.log(`   ⚠️  No matching coupon found for $${(discount / 100).toFixed(2)} discount`);
          }
        } else {
          console.log(`   ℹ️  No discount detected`);
        }
      }
      console.log('');
    }
    
    // Update coupon usage counts
    console.log('📈 Updating coupon usage counts:');
    for (const [couponCode, data] of Object.entries(totalCouponUpdates)) {
      await db.execute(sql`
        UPDATE coupons 
        SET usage_count = usage_count + ${data.count},
            updated_at = NOW()
        WHERE id = ${data.couponId}
      `);
      console.log(`   ✅ ${couponCode}: +${data.count} uses`);
    }
    
    // Final summary
    console.log('\n🎉 Summary:');
    console.log(`   - Teams analyzed: ${teamsWithDiscounts.rows.length}`);
    console.log(`   - Teams fixed: ${fixedTeams}`);
    console.log(`   - Coupons updated: ${Object.keys(totalCouponUpdates).length}`);
    
    // Show final coupon usage counts
    const finalCouponCounts = await db.execute(sql`
      SELECT code, usage_count 
      FROM coupons 
      WHERE id = ANY(${Object.values(totalCouponUpdates).map(d => d.couponId)})
      ORDER BY code
    `);
    
    console.log('\n📊 Final coupon usage counts:');
    finalCouponCounts.rows.forEach(coupon => {
      console.log(`   - ${coupon.code}: ${coupon.usage_count} uses`);
    });
    
  } catch (error) {
    console.error('❌ Error fixing missing coupon data:', error);
  }
}

fixAllMissingCoupons().then(() => process.exit(0)).catch(console.error);