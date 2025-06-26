// Test fee calculation for $1.00 registration
// Based on server/services/fee-calculator.ts logic

const DEFAULT_PLATFORM_FEE_RATE = 0.04; // 4% MatchPro fee
const STRIPE_PERCENTAGE_FEE = 0.029; // 2.9%
const STRIPE_FIXED_FEE = 30; // $0.30 in cents

function calculateStripeFees(totalAmount) {
  return Math.round(totalAmount * STRIPE_PERCENTAGE_FEE + STRIPE_FIXED_FEE);
}

function calculateFeeBreakdown(tournamentCost) {
  // Calculate the total amount needed to cover tournament cost + Stripe fees + MatchPro margin
  // We need to solve: totalAmount = tournamentCost + stripeFees + matchproMargin
  // Where stripeFees = (totalAmount * 0.029) + 30
  // And matchproMargin = tournamentCost * DEFAULT_PLATFORM_FEE_RATE
  
  const matchproTargetMargin = Math.round(tournamentCost * DEFAULT_PLATFORM_FEE_RATE);
  
  // Solve for total amount: totalAmount = (tournamentCost + matchproMargin + 30) / (1 - 0.029)
  const totalChargedAmount = Math.round((tournamentCost + matchproTargetMargin + STRIPE_FIXED_FEE) / (1 - STRIPE_PERCENTAGE_FEE));
  
  // Calculate actual platform fee (what customer pays above tournament cost)
  const platformFeeAmount = totalChargedAmount - tournamentCost;
  
  // Calculate actual platform fee rate
  const platformFeeRate = platformFeeAmount / tournamentCost;
  
  // Calculate Stripe fees on the total charged amount
  const stripeFeeAmount = calculateStripeFees(totalChargedAmount);
  
  // Distribution calculation
  const tournamentReceives = tournamentCost; // Tournament gets their base amount
  const stripeReceives = stripeFeeAmount; // Stripe gets their processing fee
  const matchproReceives = platformFeeAmount - stripeFeeAmount; // MatchPro gets platform fee minus Stripe costs
  
  // Validation
  const totalAccounted = tournamentReceives + stripeReceives + matchproReceives;
  const isBalanced = totalAccounted === totalChargedAmount;
  
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
    isBalanced,
    matchproTargetMargin
  };
}

console.log('=== $1.00 Registration Fee Breakdown ===');
const tournamentCost = 100; // $1.00 in cents
const fees = calculateFeeBreakdown(tournamentCost);

console.log('Input:');
console.log('- Tournament Cost: $' + (fees.tournamentCost / 100).toFixed(2));
console.log('');

console.log('Platform Fee Calculation:');
console.log('- Platform Fee Rate: ' + (fees.platformFeeRate * 100).toFixed(1) + '%');
console.log('- Platform Fee Amount: $' + (fees.platformFeeAmount / 100).toFixed(2));
console.log('- Total Charged to Customer: $' + (fees.totalChargedAmount / 100).toFixed(2));
console.log('');

console.log('Stripe Fee Calculation:');
console.log('- Stripe Percentage (2.9% of $' + (fees.totalChargedAmount / 100).toFixed(2) + '): $' + ((fees.totalChargedAmount * 0.029) / 100).toFixed(3));
console.log('- Stripe Fixed Fee: $0.30');
console.log('- Total Stripe Fee: $' + (fees.stripeFeeAmount / 100).toFixed(2));
console.log('');

console.log('Fund Distribution:');
console.log('- Tournament Receives: $' + (fees.tournamentReceives / 100).toFixed(2));
console.log('- Stripe Receives: $' + (fees.stripeReceives / 100).toFixed(2));
console.log('- MatchPro Receives: $' + (fees.matchproReceives / 100).toFixed(2));
console.log('');

console.log('Verification:');
console.log('- Total Accounted: $' + (fees.totalAccounted / 100).toFixed(2));
console.log('- Is Balanced: ' + fees.isBalanced);
console.log('');

console.log('=== Analysis ===');
console.log('Expected your process:');
console.log('- Tournament should get: $1.00');
console.log('- Stripe should get: 2.9% + $0.30 = $' + ((104 * 0.029 + 30) / 100).toFixed(2));
console.log('- MatchPro should get: Remaining from 4% platform fee');
console.log('');
console.log('Actual calculated:');
console.log('- Tournament gets: $' + (fees.tournamentReceives / 100).toFixed(2));
console.log('- Stripe gets: $' + (fees.stripeReceives / 100).toFixed(2));
console.log('- MatchPro gets: $' + (fees.matchproReceives / 100).toFixed(2));
console.log('');
console.log('MatchPro receives: Platform fee ($' + (fees.platformFeeAmount / 100).toFixed(2) + ') - Stripe costs ($' + (fees.stripeFeeAmount / 100).toFixed(2) + ') = $' + (fees.matchproReceives / 100).toFixed(2));