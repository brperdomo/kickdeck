import { db } from './db/index.ts';
import { sql } from 'drizzle-orm';

async function fixAllMissingCoupons() {
  try {
    console.log('Scanning for teams with missing coupon data...\n');
    
    // Get all events (Rise Cup and Empire Super Cup)
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
    
    // Get available coupons
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
      SELECT 
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
    
    console.log(`Found ${teamsWithDiscounts.rows.length} teams without coupon data in target events\n`);
    
    let fixedTeams = 0;
    let totalCouponUpdates = {};
    
    for (const team of teamsWithDiscounts.rows) {
      console.log(`Analyzing team: ${team.name} (ID: ${team.id})`);
      console.log(`  Event: ${team.event_name}`);
      console.log(`  Total paid: $${(team.total_amount / 100).toFixed(2)}`);
      
      // Parse selected fee IDs safely
      let selectedFeeIds = [];
      try {
        if (team.selected_fee_ids) {
          selectedFeeIds = JSON.parse(team.selected_fee_ids);
          if (!Array.isArray(selectedFeeIds)) {
            selectedFeeIds = Object.values(selectedFeeIds);
          }
          selectedFeeIds = selectedFeeIds.map(id => parseInt(id));
        }
      } catch (e) {
        console.log(`  Warning: Could not parse fee IDs for team ${team.id}`);
        continue;
      }
      
      if (selectedFeeIds.length === 0) {
        console.log(`  No fees found for this team`);
        continue;
      }
      
      // Get the total fee amount for this team
      let totalFeeAmount = 0;
      for (const feeId of selectedFeeIds) {
        const feeResult = await db.execute(sql`
          SELECT amount FROM event_fees WHERE id = ${feeId}
        `);
        if (feeResult.rows.length > 0) {
          totalFeeAmount += feeResult.rows[0].amount;
        }
      }
      
      const discount = totalFeeAmount - team.total_amount;
      
      console.log(`  Original fee: $${(totalFeeAmount / 100).toFixed(2)}`);
      console.log(`  Discount applied: $${(discount / 100).toFixed(2)}`);
      
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
          console.log(`  -> Matched coupon: ${matchedCoupon.code}`);
          
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
          console.log(`  -> Updated team with ${matchedCoupon.code} coupon data`);
        } else {
          console.log(`  -> No matching coupon found for $${(discount / 100).toFixed(2)} discount`);
        }
      } else {
        console.log(`  -> No discount detected`);
      }
      console.log('');
    }
    
    // Update coupon usage counts
    console.log('Updating coupon usage counts:');
    for (const [couponCode, data] of Object.entries(totalCouponUpdates)) {
      await db.execute(sql`
        UPDATE coupons 
        SET usage_count = usage_count + ${data.count},
            updated_at = NOW()
        WHERE id = ${data.couponId}
      `);
      console.log(`  ${couponCode}: +${data.count} uses`);
    }
    
    // Final summary
    console.log('\nSummary:');
    console.log(`  Teams analyzed: ${teamsWithDiscounts.rows.length}`);
    console.log(`  Teams fixed: ${fixedTeams}`);
    console.log(`  Coupons updated: ${Object.keys(totalCouponUpdates).length}`);
    
    // Show final coupon usage counts
    if (Object.keys(totalCouponUpdates).length > 0) {
      const couponIds = Object.values(totalCouponUpdates).map(d => d.couponId);
      const finalCouponCounts = await db.execute(sql`
        SELECT code, usage_count 
        FROM coupons 
        WHERE id = ANY(ARRAY[${couponIds.join(',')}])
        ORDER BY code
      `);
      
      console.log('\nFinal coupon usage counts:');
      finalCouponCounts.rows.forEach(coupon => {
        console.log(`  ${coupon.code}: ${coupon.usage_count} uses`);
      });
    }
    
  } catch (error) {
    console.error('Error fixing missing coupon data:', error);
  }
}

fixAllMissingCoupons().then(() => process.exit(0)).catch(console.error);