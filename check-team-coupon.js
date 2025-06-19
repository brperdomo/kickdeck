import { db } from './db/index.ts';
import { sql } from 'drizzle-orm';

async function checkTeamCoupon() {
  const result = await db.execute(sql`
    SELECT id, name, applied_coupon, total_amount, selected_fee_ids, created_at
    FROM teams 
    WHERE name ILIKE '%Cal Elite SC G2009%'
    ORDER BY created_at DESC
    LIMIT 1
  `);

  console.log('Team found:', result.rows[0]);
  if (result.rows[0]?.applied_coupon) {
    console.log('Applied coupon data:', result.rows[0].applied_coupon);
  }
}

checkTeamCoupon().then(() => process.exit(0)).catch(console.error);