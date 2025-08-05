#!/usr/bin/env node

/**
 * Debug Payment Processing - Identify Undefined Values
 * Testing teams 851 and 859 payment processing to find source of UNDEFINED_VALUE errors
 */

import { db } from "./db/index.js";
import { teams, events } from "./db/schema.js";
import { eq } from "drizzle-orm";
import { calculateEventFees } from "./server/services/fee-calculator.js";

console.log('🔍 Debug Payment Processing - Teams 851 & 859\n');

async function debugTeamPayment(teamId) {
  console.log(`\n=== Debugging Team ${teamId} ===`);
  
  try {
    // Get team and event data
    const [teamInfo] = await db
      .select({
        team: teams,
        event: events
      })
      .from(teams)
      .innerJoin(events, eq(teams.eventId, events.id))
      .where(eq(teams.id, teamId));

    if (!teamInfo) {
      console.log(`❌ Team ${teamId} not found`);
      return;
    }

    const { team, event } = teamInfo;
    
    console.log('Team Data:', {
      id: team.id,
      name: team.name,
      totalAmount: team.totalAmount,
      eventId: team.eventId,
      paymentMethodId: team.paymentMethodId,
      stripeCustomerId: team.stripeCustomerId,
      setupIntentId: team.setupIntentId,
      paymentStatus: team.paymentStatus,
      status: team.status
    });
    
    console.log('Event Data:', {
      id: event.id,
      name: event.name,
      stripeConnectAccountId: event.stripeConnectAccountId
    });

    // Test fee calculation
    console.log('\n🧮 Testing Fee Calculation...');
    if (!team.totalAmount) {
      console.log('❌ team.totalAmount is undefined/null:', team.totalAmount);
      return;
    }
    
    if (!event.id) {
      console.log('❌ event.id is undefined/null:', event.id);
      return;
    }

    const feeCalculation = await calculateEventFees(event.id, team.totalAmount);
    console.log('✅ Fee calculation successful:', {
      tournamentCost: `$${(feeCalculation.tournamentCost / 100).toFixed(2)}`,
      totalChargedAmount: `$${(feeCalculation.totalChargedAmount / 100).toFixed(2)}`,
      platformFeeAmount: `$${(feeCalculation.platformFeeAmount / 100).toFixed(2)}`,
      tournamentReceives: `$${(feeCalculation.tournamentReceives / 100).toFixed(2)}`,
      matchproReceives: `$${(feeCalculation.matchproReceives / 100).toFixed(2)}`,
      isBalanced: feeCalculation.isBalanced
    });

    // Check for any undefined values in the fee calculation
    const undefinedFields = [];
    Object.entries(feeCalculation).forEach(([key, value]) => {
      if (value === undefined || value === null) {
        undefinedFields.push(`${key}: ${value}`);
      }
    });
    
    if (undefinedFields.length > 0) {
      console.log('❌ Undefined fields in fee calculation:', undefinedFields);
    } else {
      console.log('✅ No undefined fields in fee calculation');
    }

    // Test Connect account validation
    console.log('\n🔗 Testing Connect Account...');
    if (!event.stripeConnectAccountId) {
      console.log('❌ Connect account ID is missing');
      return;
    }
    console.log('✅ Connect account ID present:', event.stripeConnectAccountId);

    // Test payment method validation
    console.log('\n💳 Testing Payment Method...');
    if (!team.paymentMethodId) {
      console.log('❌ Payment method ID is missing');
      return;
    }
    console.log('✅ Payment method ID present:', team.paymentMethodId);

  } catch (error) {
    console.error(`❌ Error debugging team ${teamId}:`, error.message);
    console.error('Stack trace:', error.stack);
  }
}

async function main() {
  try {
    await debugTeamPayment(851);
    await debugTeamPayment(859);
    console.log('\n🎯 Debug Summary: Look for any undefined values or missing fields above');
  } catch (error) {
    console.error('❌ Debug script failed:', error.message);
  } finally {
    process.exit(0);
  }
}

main();