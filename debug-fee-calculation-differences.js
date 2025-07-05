/**
 * Debug Fee Calculation Differences Between Events
 * 
 * This script compares the fee calculation logic between Empire Super Cup and Rise Cup
 * to identify why Rise Cup produces rounded dollar amounts while Empire Super Cup doesn't.
 */

import { calculateFees } from './server/services/fee-calculator.js';

// Test the fee calculations for both events using their base tournament costs
async function debugFeeCalculationDifferences() {
  console.log('🔍 DEBUGGING FEE CALCULATION DIFFERENCES\n');
  
  // Empire Super Cup base costs (produce realistic cent amounts)
  const empireCosts = [89500, 99500, 119500]; // $895, $995, $1195
  
  // Rise Cup base costs (produce rounded dollar amounts)  
  const riseCosts = [90000, 102500, 119500]; // $900, $1025, $1195
  
  console.log('=== EMPIRE SUPER CUP FEE CALCULATIONS ===');
  for (const cost of empireCosts) {
    const result = calculateFees(cost);
    console.log(`Tournament Cost: $${(cost/100).toFixed(2)}`);
    console.log(`Total Charged: $${(result.totalChargedAmount/100).toFixed(2)}`);
    console.log(`Platform Fee: $${(result.platformFeeAmount/100).toFixed(2)}`);
    console.log(`Stripe Fee: $${(result.stripeFeeAmount/100).toFixed(2)}`);
    console.log(`MatchPro Revenue: $${(result.matchproReceives/100).toFixed(2)}`);
    console.log(`Is Rounded to Dollar: ${result.totalChargedAmount % 100 === 0 ? 'YES' : 'NO'}`);
    console.log('---');
  }
  
  console.log('\n=== RISE CUP FEE CALCULATIONS ===');
  for (const cost of riseCosts) {
    const result = calculateFees(cost);
    console.log(`Tournament Cost: $${(cost/100).toFixed(2)}`);
    console.log(`Total Charged: $${(result.totalChargedAmount/100).toFixed(2)}`);
    console.log(`Platform Fee: $${(result.platformFeeAmount/100).toFixed(2)}`);
    console.log(`Stripe Fee: $${(result.stripeFeeAmount/100).toFixed(2)}`);
    console.log(`MatchPro Revenue: $${(result.matchproReceives/100).toFixed(2)}`);
    console.log(`Is Rounded to Dollar: ${result.totalChargedAmount % 100 === 0 ? 'YES' : 'NO'}`);
    console.log('---');
  }
  
  console.log('\n🎯 ANALYSIS:');
  console.log('If Rise Cup amounts are rounded to dollars while Empire Super Cup amounts have cents,');
  console.log('the issue is likely in the base tournament costs or a different fee calculation path.');
  
  // Test if there's mathematical rounding happening
  console.log('\n=== MATHEMATICAL ANALYSIS ===');
  riseCosts.forEach(cost => {
    const platformFee = Math.round(cost * 0.04); // 4% platform fee
    const total = cost + platformFee;
    console.log(`Cost: $${cost/100} → Platform Fee: $${platformFee/100} → Total: $${total/100}`);
    console.log(`Total is rounded: ${total % 100 === 0 ? 'YES' : 'NO'}`);
  });
}

// Run the debug analysis
debugFeeCalculationDifferences().catch(console.error);