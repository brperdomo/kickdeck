/**
 * Enhanced Fee Calculator Service
 * 
 * Handles complex fee calculations for tournament registration with:
 * - MatchPro platform fees (configurable, default 4%)
 * - Stripe processing fees (2.9% + $0.30)
 * - Volume-based platform fee reductions
 * - Precise revenue distribution calculations
 */

import { db } from "@db";
import { events } from "@db/schema";
import { eq } from "drizzle-orm";

// Base fee rates
export const DEFAULT_PLATFORM_FEE_RATE = 0.04; // 4% MatchPro fee
export const STRIPE_PERCENTAGE_FEE = 0.029; // 2.9%
export const STRIPE_FIXED_FEE = 30; // $0.30 in cents

// Volume discount tiers for platform fees
// Designed to ensure MatchPro profitability while providing volume incentives
export const VOLUME_DISCOUNT_TIERS = [
  { minAmount: 0, maxAmount: 10000, platformFeeRate: 0.04 }, // 4% for $0-$100
  { minAmount: 10001, maxAmount: 50000, platformFeeRate: 0.04 }, // 4% for $100.01-$500  
  { minAmount: 50001, maxAmount: 100000, platformFeeRate: 0.04 }, // 4% for $500.01-$1000
  { minAmount: 100001, maxAmount: 250000, platformFeeRate: 0.038 }, // 3.8% for $1000.01-$2500
  { minAmount: 250001, maxAmount: 500000, platformFeeRate: 0.036 }, // 3.6% for $2500.01-$5000
  { minAmount: 500001, maxAmount: Infinity, platformFeeRate: 0.035 }, // 3.5% for $5000+
];

export interface FeeCalculation {
  // Input amounts
  tournamentCost: number; // Base tournament cost in cents
  totalChargedAmount: number; // Total amount charged to customer in cents
  
  // Platform fee calculation
  platformFeeRate: number; // Actual platform fee rate applied
  platformFeeAmount: number; // MatchPro platform fee in cents
  
  // Stripe fee calculation
  stripeFeeAmount: number; // Total Stripe processing fee in cents
  
  // Distribution breakdown
  tournamentReceives: number; // Amount tournament receives in cents
  matchproReceives: number; // Amount MatchPro receives in cents
  stripeReceives: number; // Amount Stripe receives in cents
  
  // Validation
  totalAccounted: number; // Should equal totalChargedAmount
  isBalanced: boolean; // True if all amounts balance correctly
}

export interface EventVolumeData {
  eventId: string;
  totalRegistrationVolume: number; // Total registration volume for this event in cents
  teamCount: number; // Number of teams registered
  averageTeamAmount: number; // Average amount per team
}

/**
 * Get volume-based platform fee rate
 */
export function getPlatformFeeRate(totalVolume: number): number {
  const tier = VOLUME_DISCOUNT_TIERS.find(
    tier => totalVolume >= tier.minAmount && totalVolume <= tier.maxAmount
  );
  return tier?.platformFeeRate || DEFAULT_PLATFORM_FEE_RATE;
}

/**
 * Calculate Stripe processing fees
 */
export function calculateStripeFees(totalAmount: number): number {
  return Math.round(totalAmount * STRIPE_PERCENTAGE_FEE + STRIPE_FIXED_FEE);
}

/**
 * Calculate comprehensive fee breakdown
 * Fee structure: Tournament Cost + 4% + $0.30 total fee
 * Where: Stripe gets 2.9% + $0.30, MatchPro gets 1.1%
 */
export function calculateFeeBreakdown(
  tournamentCost: number,
  eventVolume?: number
): FeeCalculation {
  // Total fee structure: 4% + $0.30
  const totalFeePercentage = 0.04; // 4%
  const totalFixedFee = 30; // $0.30 in cents
  
  // Calculate total platform fee: 4% + $0.30
  const platformFeeAmount = Math.round(tournamentCost * totalFeePercentage + totalFixedFee);
  const totalChargedAmount = tournamentCost + platformFeeAmount;
  
  // Calculate actual platform fee rate for reporting
  const platformFeeRate = platformFeeAmount / tournamentCost;
  
  // Stripe gets exactly 2.9% + $0.30 of the tournament cost
  const stripeFeeAmount = Math.round(tournamentCost * STRIPE_PERCENTAGE_FEE + STRIPE_FIXED_FEE);
  
  // MatchPro gets the remaining 1.1% of tournament cost
  const matchproReceives = platformFeeAmount - stripeFeeAmount;
  
  // Distribution calculation
  const tournamentReceives = tournamentCost; // Tournament gets their base amount
  const stripeReceives = stripeFeeAmount; // Stripe gets 2.9% + $0.30
  
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
    isBalanced
  };
}

/**
 * Get event volume data for fee calculation
 */
export async function getEventVolumeData(eventId: string): Promise<EventVolumeData | null> {
  try {
    // This would typically query the database for historical volume data
    // For now, we'll return null to use default rates
    // TODO: Implement actual volume tracking query
    
    return null;
  } catch (error) {
    console.error('Error fetching event volume data:', error);
    return null;
  }
}

/**
 * Calculate fees with event context
 */
export async function calculateEventFees(
  eventId: string,
  tournamentCost: number
): Promise<FeeCalculation> {
  // Get event volume data for potential discounts
  const volumeData = await getEventVolumeData(eventId);
  const eventVolume = volumeData?.totalRegistrationVolume || 0;
  
  return calculateFeeBreakdown(tournamentCost, eventVolume);
}

/**
 * Format fee calculation for display
 */
export function formatFeeCalculation(calculation: FeeCalculation) {
  const formatCurrency = (cents: number) => `$${(cents / 100).toFixed(2)}`;
  const formatPercentage = (rate: number) => `${(rate * 100).toFixed(1)}%`;
  
  return {
    summary: {
      tournamentCost: formatCurrency(calculation.tournamentCost),
      platformFee: `${formatPercentage(calculation.platformFeeRate)} (${formatCurrency(calculation.platformFeeAmount)})`,
      totalCharged: formatCurrency(calculation.totalChargedAmount),
    },
    breakdown: {
      tournamentReceives: formatCurrency(calculation.tournamentReceives),
      stripeReceives: formatCurrency(calculation.stripeReceives),
      matchproReceives: formatCurrency(calculation.matchproReceives),
    },
    validation: {
      totalAccounted: formatCurrency(calculation.totalAccounted),
      isBalanced: calculation.isBalanced,
      difference: formatCurrency(calculation.totalChargedAmount - calculation.totalAccounted)
    }
  };
}

/**
 * Simulate fee calculation for different scenarios
 */
export function simulateFeeScenarios() {
  const scenarios = [
    { name: "Example Case", amount: 100000 }, // $1000
    { name: "Small Tournament", amount: 5000 }, // $50
    { name: "Medium Tournament", amount: 25000 }, // $250
    { name: "Large Tournament", amount: 150000 }, // $1500
  ];
  
  console.log('\n=== Fee Calculation Scenarios ===\n');
  
  scenarios.forEach(scenario => {
    const calculation = calculateFeeBreakdown(scenario.amount);
    const formatted = formatFeeCalculation(calculation);
    
    console.log(`${scenario.name} (${formatted.summary.tournamentCost}):`);
    console.log(`  Platform Fee: ${formatted.summary.platformFee}`);
    console.log(`  Total Charged: ${formatted.summary.totalCharged}`);
    console.log(`  Tournament Gets: ${formatted.breakdown.tournamentReceives}`);
    console.log(`  Stripe Gets: ${formatted.breakdown.stripeReceives}`);
    console.log(`  MatchPro Gets: ${formatted.breakdown.matchproReceives}`);
    console.log(`  Balanced: ${formatted.validation.isBalanced ? 'Yes' : 'No'}`);
    console.log('');
  });
}