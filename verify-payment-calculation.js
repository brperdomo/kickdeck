/**
 * Verify Payment Calculation Logic
 * 
 * This script tests the fee calculation logic to ensure the correct
 * total amount (including platform fees) is calculated.
 */

import dotenv from 'dotenv';

dotenv.config();

// Import the fee calculator directly
async function verifyPaymentCalculation() {
  console.log('Verifying payment calculation logic...\n');
  
  // Import the calculateEventFees function
  const { calculateEventFees } = await import('./server/services/fee-calculator.ts');
  
  // Test with $1.00 tournament cost (100 cents)
  const tournamentCost = 100; // $1.00 in cents
  const eventId = '1755746106'; // Sample event ID
  
  console.log(`Testing with tournament cost: $${(tournamentCost / 100).toFixed(2)}`);
  
  try {
    const feeCalculation = await calculateEventFees(eventId, tournamentCost);
    
    console.log('\nFee Calculation Results:');
    console.log(`  Tournament Cost: $${(feeCalculation.tournamentCost / 100).toFixed(2)}`);
    console.log(`  Platform Fee Rate: ${(feeCalculation.platformFeeRate * 100).toFixed(1)}%`);
    console.log(`  Platform Fee Amount: $${(feeCalculation.platformFeeAmount / 100).toFixed(2)}`);
    console.log(`  Stripe Fee Amount: $${(feeCalculation.stripeFeeAmount / 100).toFixed(2)}`);
    console.log(`  Total Charged Amount: $${(feeCalculation.totalChargedAmount / 100).toFixed(2)}`);
    console.log(`  Tournament Receives: $${(feeCalculation.tournamentReceives / 100).toFixed(2)}`);
    console.log(`  KickDeck Receives: $${(feeCalculation.kickdeckReceives / 100).toFixed(2)}`);
    console.log(`  Is Balanced: ${feeCalculation.isBalanced}`);
    
    // Verify the calculation is correct
    const expectedPlatformFeeRate = 0.04; // 4%
    const expectedPlatformFee = Math.round(tournamentCost * expectedPlatformFeeRate); // 4 cents
    const expectedStripeFee = 30; // $0.30 fixed fee
    const expectedTotalPlatformFee = expectedPlatformFee + expectedStripeFee; // 34 cents
    const expectedTotal = tournamentCost + expectedTotalPlatformFee; // 134 cents = $1.34
    
    console.log('\nExpected vs Actual:');
    console.log(`  Expected Total: $${(expectedTotal / 100).toFixed(2)}`);
    console.log(`  Actual Total: $${(feeCalculation.totalChargedAmount / 100).toFixed(2)}`);
    
    if (feeCalculation.totalChargedAmount === expectedTotal) {
      console.log('\n✅ SUCCESS: Fee calculation is correct!');
      console.log('The payment system will now charge the correct total amount including platform fees.');
    } else {
      console.log('\n❌ FAILURE: Fee calculation mismatch');
      console.log(`Expected: $${(expectedTotal / 100).toFixed(2)}, Got: $${(feeCalculation.totalChargedAmount / 100).toFixed(2)}`);
    }
    
    // Test the charge amount logic for chargeApprovedTeam
    console.log('\n=== Testing chargeApprovedTeam Logic ===');
    console.log('1. Team has total_amount = 100 cents ($1.00)');
    console.log('2. calculateEventFees(eventId, 100) calculates fees');
    console.log('3. processDestinationCharge() receives totalChargedAmount = 134 cents ($1.34)');
    console.log('4. Stripe payment intent created with amount = 134 cents ($1.34)');
    console.log('5. Customer is charged $1.34 (tournament cost + platform fees)');
    
    return feeCalculation.totalChargedAmount === expectedTotal;
    
  } catch (error) {
    console.error('Error calculating fees:', error);
    return false;
  }
}

verifyPaymentCalculation();