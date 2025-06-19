import { db } from './db/index.ts';
import { sql } from 'drizzle-orm';

async function fixCalEliteCoupon() {
  try {
    console.log('Fixing Cal Elite SC G2009 team coupon data...');
    
    // Get the Cal Elite team data
    const teamResult = await db.execute(sql`
      SELECT id, name, total_amount, selected_fee_ids
      FROM teams 
      WHERE name ILIKE '%Cal Elite SC G2009%'
    `);
    
    if (teamResult.rows.length === 0) {
      console.log('Team not found');
      return;
    }
    
    const team = teamResult.rows[0];
    console.log(`Found team: ${team.name} (ID: ${team.id})`);
    console.log(`Total amount: $${(team.total_amount / 100).toFixed(2)}`);
    
    // Get the CALELITE500 coupon
    const couponResult = await db.execute(sql`
      SELECT * FROM coupons WHERE UPPER(code) = 'CALELITE500'
    `);
    
    if (couponResult.rows.length === 0) {
      console.log('CALELITE500 coupon not found');
      return;
    }
    
    const coupon = couponResult.rows[0];
    console.log(`Found coupon: ${coupon.code} (ID: ${coupon.id})`);
    
    // Create coupon data object
    const couponData = {
      id: coupon.id,
      code: coupon.code,
      discountType: coupon.discount_type,
      amount: coupon.amount,
      description: coupon.description
    };
    
    console.log('Updating team with coupon data...');
    
    // Update the team record
    await db.execute(sql`
      UPDATE teams 
      SET applied_coupon = ${JSON.stringify(couponData)}
      WHERE id = ${team.id}
    `);
    
    console.log('✓ Updated team with coupon data');
    
    // Increment coupon usage count
    await db.execute(sql`
      UPDATE coupons 
      SET usage_count = usage_count + 1,
          updated_at = NOW()
      WHERE id = ${coupon.id}
    `);
    
    console.log('✓ Incremented coupon usage count');
    
    // Verify the changes
    const updatedTeam = await db.execute(sql`
      SELECT applied_coupon FROM teams WHERE id = ${team.id}
    `);
    
    const updatedCoupon = await db.execute(sql`
      SELECT usage_count FROM coupons WHERE id = ${coupon.id}
    `);
    
    console.log('\n--- Results ---');
    console.log('Team coupon data:', updatedTeam.rows[0].applied_coupon);
    console.log('Coupon usage count:', updatedCoupon.rows[0].usage_count);
    
  } catch (error) {
    console.error('Error fixing coupon data:', error);
  }
}

fixCalEliteCoupon().then(() => process.exit(0)).catch(console.error);