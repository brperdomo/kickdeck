import { db } from './db/index.ts';
import { sql } from 'drizzle-orm';

async function fixMissingCoupons() {
  try {
    console.log('Scanning for teams with missing coupon data...\n');
    
    // Get available coupons
    const coupons = await db.execute(sql`
      SELECT * FROM coupons 
      WHERE is_active = true
      ORDER BY code
    `);
    
    console.log('Available active coupons:');
    coupons.rows.forEach(coupon => {
      const discountDisplay = coupon.discount_type === 'fixed' 
        ? `$${coupon.amount}` 
        : `${coupon.amount}%`;
      console.log(`- ${coupon.code}: ${discountDisplay}`);
    });
    console.log('');
    
    // Find teams with potential missing coupon data in Rise Cup and Empire Super Cup
    const teamsWithDiscounts = await db.execute(sql`
      SELECT 
        t.id,
        t.name,
        t.applied_coupon,
        t.total_amount,
        t.selected_fee_ids,
        e.name as event_name
      FROM teams t
      JOIN events e ON t.event_id = e.id
      WHERE t.applied_coupon IS NULL
      AND (e.name ILIKE '%Rise Cup%' OR e.name ILIKE '%Empire Super Cup%')
      AND t.selected_fee_ids IS NOT NULL
      ORDER BY e.name, t.name
    `);
    
    console.log(`Found ${teamsWithDiscounts.rows.length} teams without coupon data\n`);
    
    let fixedTeams = 0;
    let totalCouponUpdates = {};
    
    for (const team of teamsWithDiscounts.rows) {
      console.log(`Analyzing: ${team.name} (ID: ${team.id})`);
      console.log(`  Event: ${team.event_name}`);
      console.log(`  Total paid: $${(team.total_amount / 100).toFixed(2)}`);
      
      // Parse selected fee IDs from JSON object format
      let feeIds = [];
      try {
        if (team.selected_fee_ids) {
          const parsed = JSON.parse(team.selected_fee_ids);
          if (typeof parsed === 'object') {
            feeIds = Object.values(parsed).map(id => parseInt(id));
          }
        }
      } catch (e) {
        console.log(`  Warning: Could not parse fee IDs`);
        continue;
      }
      
      if (feeIds.length === 0) {
        console.log(`  No valid fee IDs found`);
        continue;
      }
      
      // Get total original fee amount
      let totalOriginalFee = 0;
      for (const feeId of feeIds) {
        const feeResult = await db.execute(sql`
          SELECT amount FROM event_fees WHERE id = ${feeId}
        `);
        if (feeResult.rows.length > 0) {
          totalOriginalFee += feeResult.rows[0].amount;
        }
      }
      
      const discountAmount = totalOriginalFee - team.total_amount;
      
      console.log(`  Original fee: $${(totalOriginalFee / 100).toFixed(2)}`);
      console.log(`  Discount: $${(discountAmount / 100).toFixed(2)}`);
      
      if (discountAmount > 0) {
        // Find matching coupon
        let matchedCoupon = null;
        
        for (const coupon of coupons.rows) {
          if (coupon.discount_type === 'fixed') {
            // Fixed amount: convert coupon amount to cents for comparison
            if (discountAmount === coupon.amount * 100) {
              matchedCoupon = coupon;
              break;
            }
          } else if (coupon.discount_type === 'percentage') {
            // Percentage: calculate expected discount
            const expectedDiscount = Math.round((totalOriginalFee * coupon.amount) / 100);
            if (Math.abs(discountAmount - expectedDiscount) <= 100) { // Allow $1 variance
              matchedCoupon = coupon;
              break;
            }
          }
        }
        
        if (matchedCoupon) {
          console.log(`  -> Matched: ${matchedCoupon.code}`);
          
          const couponData = {
            id: matchedCoupon.id,
            code: matchedCoupon.code,
            discountType: matchedCoupon.discount_type,
            amount: matchedCoupon.amount,
            description: matchedCoupon.description
          };
          
          // Update team with coupon data
          await db.execute(sql`
            UPDATE teams 
            SET applied_coupon = ${JSON.stringify(couponData)}
            WHERE id = ${team.id}
          `);
          
          // Track for usage count update
          if (!totalCouponUpdates[matchedCoupon.code]) {
            totalCouponUpdates[matchedCoupon.code] = {
              couponId: matchedCoupon.id,
              count: 0
            };
          }
          totalCouponUpdates[matchedCoupon.code].count++;
          
          fixedTeams++;
          console.log(`  -> Updated with ${matchedCoupon.code}`);
        } else {
          console.log(`  -> No matching coupon found`);
        }
      } else {
        console.log(`  -> No discount applied`);
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
    
    // Show updated usage counts
    if (Object.keys(totalCouponUpdates).length > 0) {
      const allUpdatedCoupons = await db.execute(sql`
        SELECT code, usage_count 
        FROM coupons 
        WHERE code = ANY(ARRAY[${Object.keys(totalCouponUpdates).map(code => `'${code}'`).join(',')}])
        ORDER BY code
      `);
      
      console.log('\nUpdated coupon usage counts:');
      allUpdatedCoupons.rows.forEach(coupon => {
        console.log(`  ${coupon.code}: ${coupon.usage_count} total uses`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

fixMissingCoupons().then(() => process.exit(0)).catch(console.error);