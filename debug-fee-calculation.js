/**
 * Debug Fee Calculation Discrepancy
 * 
 * This script tests fee calculations for $1.00 tournament cost
 * to identify why the display shows $1.34 but charge is $1.38
 */

// Simulate the fee calculation logic
const DEFAULT_PLATFORM_FEE_RATE = 0.04; // 4%
const STRIPE_PERCENTAGE_FEE = 0.029; // 2.9%
const STRIPE_FIXED_FEE = 30; // $0.30 in cents

function calculateStripeFees(totalAmount) {
  return Math.round(totalAmount * STRIPE_PERCENTAGE_FEE) + STRIPE_FIXED_FEE;
}

function calculateFeeBreakdown(tournamentCost) {
  console.log(`\n=== Fee Calculation for $${tournamentCost/100} tournament cost ===`);
  
  // Method 1: Current implementation
  const matchproTargetMargin = Math.round(tournamentCost * DEFAULT_PLATFORM_FEE_RATE);
  console.log(`MatchPro target margin: ${matchproTargetMargin} cents ($${matchproTargetMargin/100})`);
  
  const totalChargedAmount = Math.round((tournamentCost + matchproTargetMargin + STRIPE_FIXED_FEE) / (1 - STRIPE_PERCENTAGE_FEE));
  console.log(`Total charged amount: ${totalChargedAmount} cents ($${totalChargedAmount/100})`);
  
  const platformFeeAmount = totalChargedAmount - tournamentCost;
  console.log(`Platform fee amount: ${platformFeeAmount} cents ($${platformFeeAmount/100})`);
  
  const platformFeeRate = platformFeeAmount / tournamentCost;
  console.log(`Platform fee rate: ${(platformFeeRate * 100).toFixed(2)}%`);
  
  const stripeFeeAmount = calculateStripeFees(totalChargedAmount);
  console.log(`Stripe fee amount: ${stripeFeeAmount} cents ($${stripeFeeAmount/100})`);
  
  const tournamentReceives = tournamentCost;
  const stripeReceives = stripeFeeAmount;
  const matchproReceives = platformFeeAmount - stripeFeeAmount;
  
  console.log(`\nDistribution:`);
  console.log(`Tournament receives: ${tournamentReceives} cents ($${tournamentReceives/100})`);
  console.log(`Stripe receives: ${stripeReceives} cents ($${stripeReceives/100})`);
  console.log(`MatchPro receives: ${matchproReceives} cents ($${matchproReceives/100})`);
  
  const totalAccounted = tournamentReceives + stripeReceives + matchproReceives;
  console.log(`\nTotal accounted: ${totalAccounted} cents ($${totalAccounted/100})`);
  console.log(`Balanced: ${totalAccounted === totalChargedAmount}`);
  
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
    isBalanced: totalAccounted === totalChargedAmount
  };
}

// Test with $1.00 tournament cost
const result = calculateFeeBreakdown(100);

console.log(`\n=== Summary ===`);
console.log(`Customer pays: $${result.totalChargedAmount/100}`);
console.log(`Should be: $1.38 (based on actual charge)`);
console.log(`Difference: $${(138 - result.totalChargedAmount)/100}`);