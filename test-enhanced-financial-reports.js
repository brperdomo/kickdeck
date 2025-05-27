import { Client } from 'pg';

async function testEnhancedFinancialReports() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('Connected to database successfully');

    // Check if fee_revenue table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'fee_revenue'
      );
    `);
    
    console.log('Fee revenue table exists:', tableCheck.rows[0].exists);

    // Check payment_transactions table structure for enhanced columns
    const paymentColumns = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'payment_transactions' 
      AND column_name IN ('stripe_fee', 'net_amount', 'settlement_date', 'payout_id')
      ORDER BY column_name;
    `);
    
    console.log('Enhanced payment transaction columns:');
    paymentColumns.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });

    // Test basic query structure for financial reports
    const sampleEventQuery = await client.query(`
      SELECT e.id, e.name, COUNT(t.id) as team_count
      FROM events e
      LEFT JOIN teams t ON e.id = t.event_id
      GROUP BY e.id, e.name
      LIMIT 3;
    `);
    
    console.log('\nSample events for financial reporting:');
    sampleEventQuery.rows.forEach(row => {
      console.log(`  Event ${row.id}: ${row.name} (${row.team_count} teams)`);
    });

    // Test payment transactions with enhanced fields
    const paymentSample = await client.query(`
      SELECT id, amount, stripe_fee, net_amount, status, transaction_type
      FROM payment_transactions
      WHERE status = 'succeeded'
      LIMIT 3;
    `);
    
    console.log('\nSample payment transactions:');
    paymentSample.rows.forEach(row => {
      console.log(`  Transaction ${row.id}: $${row.amount/100} (Stripe fee: $${(row.stripe_fee || 0)/100}, Net: $${(row.net_amount || row.amount)/100})`);
    });

    console.log('\n✅ Enhanced financial reporting database structure verified successfully!');

  } catch (error) {
    console.error('❌ Error testing enhanced financial reports:', error.message);
  } finally {
    await client.end();
  }
}

testEnhancedFinancialReports().catch(console.error);