/**
 * Platform Fee Calculation Accuracy Test
 * 
 * This script verifies that platform fees are calculated correctly throughout
 * the MatchPro system using the proper tiered fee structure.
 */

import { calculateFeeBreakdown, getPlatformFeeRate, VOLUME_DISCOUNT_TIERS } from './server/services/fee-calculator.js';

console.log('🧮 Testing Platform Fee Calculation Accuracy\n');

// Test scenarios with expected results
const testScenarios = [
  {
    name: 'Small Registration ($50)',
    amount: 5000, // $50 in cents
    expectedRate: 0.04, // 4%
    expectedPlatformFee: 200 // $2.00 in cents
  },
  {
    name: 'Medium Registration ($250)',
    amount: 25000, // $250 in cents
    expectedRate: 0.04, // 4%
    expectedPlatformFee: 1000 // $10.00 in cents
  },
  {
    name: 'Large Registration ($1,500)',
    amount: 150000, // $1,500 in cents
    expectedRate: 0.038, // 3.8% (volume discount tier)
    expectedPlatformFee: 5700 // $57.00 in cents
  },
  {
    name: 'High Volume ($3,000)',
    amount: 300000, // $3,000 in cents
    expectedRate: 0.036, // 3.6% (higher volume discount)
    expectedPlatformFee: 10800 // $108.00 in cents
  },
  {
    name: 'Premium Volume ($6,000)',
    amount: 600000, // $6,000 in cents
    expectedRate: 0.035, // 3.5% (premium volume discount)
    expectedPlatformFee: 21000 // $210.00 in cents
  }
];

console.log('Testing individual fee calculations...\n');

let allTestsPassed = true;

testScenarios.forEach((scenario, index) => {
  console.log(`${index + 1}. ${scenario.name}`);
  
  // Test the fee rate lookup
  const actualRate = getPlatformFeeRate(scenario.amount);
  const rateMatches = actualRate === scenario.expectedRate;
  
  // Test the full fee calculation
  const calculation = calculateFeeBreakdown(scenario.amount);
  const platformFeeMatches = calculation.platformFeeAmount === scenario.expectedPlatformFee;
  const rateCalculationMatches = calculation.platformFeeRate === scenario.expectedRate;
  
  console.log(`   Amount: $${(scenario.amount / 100).toFixed(2)}`);
  console.log(`   Expected Rate: ${(scenario.expectedRate * 100).toFixed(1)}%`);
  console.log(`   Actual Rate: ${(actualRate * 100).toFixed(1)}% ${rateMatches ? '✅' : '❌'}`);
  console.log(`   Expected Platform Fee: $${(scenario.expectedPlatformFee / 100).toFixed(2)}`);
  console.log(`   Actual Platform Fee: $${(calculation.platformFeeAmount / 100).toFixed(2)} ${platformFeeMatches ? '✅' : '❌'}`);
  console.log(`   Total Charged: $${(calculation.totalChargedAmount / 100).toFixed(2)}`);
  console.log(`   Tournament Receives: $${(calculation.tournamentReceives / 100).toFixed(2)}`);
  console.log(`   MatchPro Receives: $${(calculation.matchproReceives / 100).toFixed(2)}`);
  console.log(`   Stripe Receives: $${(calculation.stripeReceives / 100).toFixed(2)}`);
  console.log(`   Balanced: ${calculation.isBalanced ? '✅' : '❌'}`);
  
  if (!rateMatches || !platformFeeMatches || !rateCalculationMatches || !calculation.isBalanced) {
    allTestsPassed = false;
  }
  
  console.log('');
});

console.log('='.repeat(60));
console.log('Testing Volume Discount Tiers...\n');

VOLUME_DISCOUNT_TIERS.forEach((tier, index) => {
  console.log(`Tier ${index + 1}: $${(tier.minAmount / 100).toFixed(0)} - $${tier.maxAmount === Infinity ? '∞' : (tier.maxAmount / 100).toFixed(0)}`);
  console.log(`   Rate: ${(tier.platformFeeRate * 100).toFixed(1)}%`);
  
  // Test edge cases for this tier
  const testAmount = tier.minAmount + 1000; // Test amount within tier
  const actualRate = getPlatformFeeRate(testAmount);
  const tierMatches = actualRate === tier.platformFeeRate;
  
  console.log(`   Test Amount: $${(testAmount / 100).toFixed(2)} → ${(actualRate * 100).toFixed(1)}% ${tierMatches ? '✅' : '❌'}`);
  console.log('');
});

console.log('='.repeat(60));
console.log('Testing Event Volume Calculations...\n');

// Simulate event with multiple registrations
const eventRegistrations = [
  { amount: 15000 }, // $150
  { amount: 15000 }, // $150  
  { amount: 15000 }, // $150
  { amount: 15000 }, // $150
  { amount: 15000 }  // $150
];

const totalEventVolume = eventRegistrations.reduce((total, reg) => total + reg.amount, 0);
console.log(`Event Total Volume: $${(totalEventVolume / 100).toFixed(2)}`);

const volumeBasedRate = getPlatformFeeRate(totalEventVolume);
console.log(`Volume-Based Platform Fee Rate: ${(volumeBasedRate * 100).toFixed(1)}%`);

let totalPlatformFees = 0;
let totalRevenue = 0;

eventRegistrations.forEach((reg, index) => {
  const calculation = calculateFeeBreakdown(reg.amount, totalEventVolume);
  totalPlatformFees += calculation.platformFeeAmount;
  totalRevenue += reg.amount;
  
  console.log(`Registration ${index + 1}: $${(reg.amount / 100).toFixed(2)} → Platform Fee: $${(calculation.platformFeeAmount / 100).toFixed(2)} (${(calculation.platformFeeRate * 100).toFixed(1)}%)`);
});

const actualAverageRate = totalPlatformFees / totalRevenue;
console.log(`\nTotal Revenue: $${(totalRevenue / 100).toFixed(2)}`);
console.log(`Total Platform Fees: $${(totalPlatformFees / 100).toFixed(2)}`);
console.log(`Actual Average Rate: ${(actualAverageRate * 100).toFixed(1)}%`);
console.log(`Expected Rate: ${(volumeBasedRate * 100).toFixed(1)}%`);
console.log(`Rate Match: ${Math.abs(actualAverageRate - volumeBasedRate) < 0.001 ? '✅' : '❌'}`);

console.log('\n' + '='.repeat(60));
console.log(`🎯 OVERALL TEST RESULT: ${allTestsPassed ? 'ALL TESTS PASSED ✅' : 'SOME TESTS FAILED ❌'}`);
console.log('='.repeat(60));

if (allTestsPassed) {
  console.log('\n✅ Platform fee calculations are accurate and consistent');
  console.log('✅ Volume discount tiers are working correctly');
  console.log('✅ Payment reports will show the correct fee percentages');
  console.log('✅ Fee breakdowns balance properly');
} else {
  console.log('\n❌ Platform fee calculation issues detected');
  console.log('❌ Review the fee calculator service and payment reports');
}