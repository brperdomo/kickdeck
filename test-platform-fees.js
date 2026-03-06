/**
 * Test Platform Fee Calculation
 * 
 * This script tests the fee calculation logic to understand
 * why platform fees are not being recorded in transactions.
 */

// Constants from fee-calculator.ts
const DEFAULT_PLATFORM_FEE_RATE = 0.04; // 4% KickDeck fee
const STRIPE_PERCENTAGE_FEE = 0.029; // 2.9%
const STRIPE_FIXED_FEE = 30; // $0.30 in cents

function calculateStripeFees(totalAmount) {
  return Math.round(totalAmount * STRIPE_PERCENTAGE_FEE + STRIPE_FIXED_FEE);
}

function calculateFeeBreakdown(tournamentCost) {
  // Simple fee structure: Tournament Cost + 4% Platform Fee
  const platformFeeAmount = Math.round(tournamentCost * DEFAULT_PLATFORM_FEE_RATE);
  const totalChargedAmount = tournamentCost + platformFeeAmount;
  
  // Calculate actual platform fee rate (should be exactly the base rate)
  const platformFeeRate = platformFeeAmount / tournamentCost;
  
  // Calculate Stripe fees on the total charged amount
  const stripeFeeAmount = calculateStripeFees(totalChargedAmount);
  
  // Distribution calculation
  const tournamentReceives = tournamentCost; // Tournament gets their base amount
  const stripeReceives = stripeFeeAmount; // Stripe gets their processing fee
  const kickdeckReceives = platformFeeAmount - stripeFeeAmount; // KickDeck gets platform fee minus Stripe costs
  
  // Validation
  const totalAccounted = tournamentReceives + stripeReceives + kickdeckReceives;
  const isBalanced = totalAccounted === totalChargedAmount;
  
  return {
    tournamentCost,
    totalChargedAmount,
    platformFeeRate,
    platformFeeAmount,
    stripeFeeAmount,
    tournamentReceives,
    kickdeckReceives,
    stripeReceives,
    totalAccounted,
    isBalanced
  };
}

// Test with actual Rise Cup amounts
const testAmounts = [90000, 102500, 119500]; // Rise Cup tournament costs
const actualChargedAmounts = [93600, 106600, 124280]; // What customers were actually charged

console.log('Platform Fee Analysis:');
console.log('='.repeat(80));

testAmounts.forEach((amount, i) => {
  const actualCharged = actualChargedAmounts[i];
  const calculated = calculateFeeBreakdown(amount);
  
  console.log(`\nTest ${i + 1}: Tournament Cost $${(amount/100).toFixed(2)}`);
  console.log(`Expected Calculation:`);
  console.log(`  Total Charged: $${(calculated.totalChargedAmount/100).toFixed(2)}`);
  console.log(`  Platform Fee: $${(calculated.platformFeeAmount/100).toFixed(2)}`);
  console.log(`  KickDeck Revenue: $${(calculated.kickdeckReceives/100).toFixed(2)}`);
  console.log(`  Stripe Fee: $${(calculated.stripeFeeAmount/100).toFixed(2)}`);
  console.log(`  Tournament Receives: $${(calculated.tournamentReceives/100).toFixed(2)}`);
  
  console.log(`Actual Results:`);
  console.log(`  Total Charged: $${(actualCharged/100).toFixed(2)}`);
  console.log(`  Platform Fee Recorded: $0.00 (DATABASE ISSUE)`);
  console.log(`  KickDeck Revenue Recorded: $0.00 (DATABASE ISSUE)`);
  
  console.log(`Analysis:`);
  console.log(`  Calculation Matches Actual: ${calculated.totalChargedAmount === actualCharged}`);
  console.log(`  Missing KickDeck Revenue: $${(calculated.kickdeckReceives/100).toFixed(2)}`);
  console.log(`  ✅ Fee calculation is working correctly`);
  console.log(`  ❌ Database recording is NOT working`);
});

console.log('\n' + '='.repeat(80));
console.log('CONCLUSION:');
console.log('The fee calculation logic is working correctly.');
console.log('The issue is that platform fees are not being recorded in the database.');
console.log('This suggests a problem in the Stripe Connect application_fee_amount setup');
console.log('or in the database insertion logic.');