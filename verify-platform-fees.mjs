import postgres from 'postgres';
import 'dotenv/config';

const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });

// Fee calculation logic (matching server/services/fee-calculator.ts)
const DEFAULT_PLATFORM_FEE_RATE = 0.04; // 4% MatchPro fee
const STRIPE_PERCENTAGE_FEE = 0.029; // 2.9%
const STRIPE_FIXED_FEE = 30; // $0.30 in cents

function calculateFeeBreakdown(tournamentCost, eventVolume = 0) {
  // Apply volume discounts (matching the server logic)
  const volumeDiscountTiers = [
    { minAmount: 0, maxAmount: 10000, platformFeeRate: 0.04 }, // 4% for $0-$100
    { minAmount: 10001, maxAmount: 50000, platformFeeRate: 0.04 }, // 4% for $100.01-$500  
    { minAmount: 50001, maxAmount: 100000, platformFeeRate: 0.04 }, // 4% for $500.01-$1000
    { minAmount: 100001, maxAmount: 250000, platformFeeRate: 0.038 }, // 3.8% for $1000.01-$2500
    { minAmount: 250001, maxAmount: 500000, platformFeeRate: 0.036 }, // 3.6% for $2500.01-$5000
    { minAmount: 500001, maxAmount: Infinity, platformFeeRate: 0.035 }, // 3.5% for $5000+
  ];

  // Find applicable platform fee rate based on volume
  const applicableTier = volumeDiscountTiers.find(tier => 
    eventVolume >= tier.minAmount && eventVolume <= tier.maxAmount
  );
  const platformFeeRate = applicableTier?.platformFeeRate || DEFAULT_PLATFORM_FEE_RATE;

  // Calculate platform fee
  const platformFeeAmount = Math.round(tournamentCost * platformFeeRate);
  
  // Calculate total amount customer pays (tournament cost + platform fee)
  const totalChargedAmount = tournamentCost + platformFeeAmount;
  
  // Calculate Stripe fees on the total charged amount
  const stripeFeeAmount = Math.round(totalChargedAmount * STRIPE_PERCENTAGE_FEE + STRIPE_FIXED_FEE);
  
  // Calculate what each party receives
  const tournamentReceives = tournamentCost; // Tournament gets their base cost
  const matchproReceives = platformFeeAmount - stripeFeeAmount; // MatchPro gets platform fee minus Stripe fees
  const stripeReceives = stripeFeeAmount; // Stripe gets their processing fees
  
  // Validation
  const totalAccounted = tournamentReceives + matchproReceives + stripeReceives;
  const isBalanced = Math.abs(totalAccounted - totalChargedAmount) <= 1; // Allow 1 cent rounding
  
  return {
    tournamentCost,
    totalChargedAmount,
    platformFeeRate,
    platformFeeAmount,
    stripeFeeAmount,
    tournamentReceives,
    matchproReceives,
    stripeReceives,
    totalAccounted,
    isBalanced
  };
}

async function verifyPlatformFees() {
  console.log('💰 Verifying Platform Fee Calculations for Teams 851 & 859\n');
  
  try {
    // Get team data
    const teams = await sql`
      SELECT 
        t.id,
        t.name,
        t.total_amount,
        t.event_id,
        e.name as event_name
      FROM teams t
      JOIN events e ON t.event_id = e.id
      WHERE t.id IN (851, 859)
    `;
    
    // Get event volume for potential discounts
    const eventVolume = await sql`
      SELECT 
        SUM(total_amount) as total_volume
      FROM teams 
      WHERE event_id = ${teams[0].event_id}
      AND total_amount IS NOT NULL
    `;
    
    const totalEventVolume = eventVolume[0]?.total_volume || 0;
    
    console.log(`📊 Event: ${teams[0].event_name}`);
    console.log(`📈 Total Event Volume: $${(totalEventVolume / 100).toFixed(2)}`);
    console.log('');
    
    for (const team of teams) {
      console.log(`🏆 Team ${team.id}: ${team.name}`);
      console.log(`   Tournament Cost: $${(team.total_amount / 100).toFixed(2)}`);
      
      // Calculate fees using the same logic as the server
      const fees = calculateFeeBreakdown(team.total_amount, totalEventVolume);
      
      console.log(`\n💵 Fee Breakdown:`);
      console.log(`   Platform Fee Rate: ${(fees.platformFeeRate * 100).toFixed(1)}%`);
      console.log(`   Platform Fee Amount: $${(fees.platformFeeAmount / 100).toFixed(2)}`);
      console.log(`   Stripe Processing Fee: $${(fees.stripeFeeAmount / 100).toFixed(2)}`);
      console.log(`   Total Customer Pays: $${(fees.totalChargedAmount / 100).toFixed(2)}`);
      
      console.log(`\n💰 Revenue Distribution:`);
      console.log(`   Tournament Receives: $${(fees.tournamentReceives / 100).toFixed(2)}`);
      console.log(`   MatchPro Net Revenue: $${(fees.matchproReceives / 100).toFixed(2)}`);
      console.log(`   Stripe Receives: $${(fees.stripeReceives / 100).toFixed(2)}`);
      
      console.log(`\n✓ Calculation Balanced: ${fees.isBalanced ? 'YES' : 'NO'}`);
      console.log(`   Total Accounted: $${(fees.totalAccounted / 100).toFixed(2)}`);
      console.log(`   Difference: $${((fees.totalChargedAmount - fees.totalAccounted) / 100).toFixed(2)}`);
      console.log('');
    }
    
    // Summary
    const sampleFees = calculateFeeBreakdown(teams[0].total_amount, totalEventVolume);
    console.log('🎯 Platform Fee Summary:');
    console.log(`   Our platform fee rate: ${(sampleFees.platformFeeRate * 100).toFixed(1)}%`);
    console.log(`   Customer pays extra: $${(sampleFees.platformFeeAmount / 100).toFixed(2)} per team`);
    console.log(`   MatchPro net revenue per team: $${(sampleFees.matchproReceives / 100).toFixed(2)}`);
    console.log(`   Total for both teams: $${(sampleFees.matchproReceives * 2 / 100).toFixed(2)}`);
    
  } catch (error) {
    console.error('❌ Error verifying fees:', error.message);
  } finally {
    await sql.end();
  }
}

verifyPlatformFees();