#!/usr/bin/env npx tsx

/**
 * RETROACTIVE METADATA UPDATE SCRIPT
 * 
 * Updates existing Stripe Connect payments with comprehensive metadata
 * for payment identification and customer service resolution.
 * 
 * Usage: npx tsx server/scripts/retroactiveMetadataUpdate.ts
 */

import { db } from "../../db/index.js";
import { teams, events } from "../../db/schema.js";
import { eq, and, isNotNull } from "drizzle-orm";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

interface TeamPaymentData {
  teamId: number;
  teamName: string;
  eventId: string;
  eventName: string;
  managerEmail: string;
  managerName: string;
  paymentIntentId: string;
  setupIntentId: string;
  stripeCustomerId: string;
  connectAccountId: string;
  totalAmount: number;
  createdAt: Date;
}

/**
 * Get all teams with payment data that need metadata updates
 */
async function getTeamsWithPayments(): Promise<TeamPaymentData[]> {
  console.log("🔍 Fetching teams with payment data...");
  
  const teamsWithPayments = await db
    .select({
      teamId: teams.id,
      teamName: teams.name,
      eventId: teams.eventId,
      eventName: events.name,
      managerEmail: teams.managerEmail,
      managerName: teams.submitterName,
      paymentIntentId: teams.paymentIntentId,
      setupIntentId: teams.setupIntentId,
      stripeCustomerId: teams.stripeCustomerId,
      connectAccountId: events.stripeConnectAccountId,
      totalAmount: teams.totalAmount,
      createdAt: teams.createdAt,
    })
    .from(teams)
    .leftJoin(events, eq(teams.eventId, events.id))
    .where(
      and(
        isNotNull(events.stripeConnectAccountId),
        // Has at least one payment identifier
        // OR clause would be: or(isNotNull(teams.paymentIntentId), isNotNull(teams.setupIntentId), isNotNull(teams.stripeCustomerId))
      )
    )
    .orderBy(teams.createdAt);

  console.log(`✅ Found ${teamsWithPayments.length} teams with payment data`);
  return teamsWithPayments;
}

/**
 * Generate comprehensive metadata for a team
 */
function generateTeamMetadata(team: TeamPaymentData): Record<string, string> {
  return {
    teamId: team.teamId.toString(),
    teamName: team.teamName || "Unknown Team",
    eventId: team.eventId?.toString() || "",
    eventName: team.eventName || "",
    managerEmail: team.managerEmail || "",
    managerName: team.managerName || "Team Manager",
    registrationDate: team.createdAt?.toISOString() || "",
    internalReference: `TEAM-${team.teamId}-${team.eventId}`,
    systemSource: "MatchPro",
    updateType: "RetroactiveMetadata",
    updateDate: new Date().toISOString(),
  };
}

/**
 * Update Payment Intent metadata
 */
async function updatePaymentIntentMetadata(
  paymentIntentId: string,
  metadata: Record<string, string>,
  connectAccountId: string
): Promise<boolean> {
  try {
    await stripe.paymentIntents.update(
      paymentIntentId,
      { metadata },
      { stripeAccount: connectAccountId }
    );
    console.log(`✅ Updated Payment Intent: ${paymentIntentId}`);
    return true;
  } catch (error: any) {
    console.error(`❌ Failed to update Payment Intent ${paymentIntentId}:`, error.message);
    return false;
  }
}

/**
 * Update Setup Intent metadata
 */
async function updateSetupIntentMetadata(
  setupIntentId: string,
  metadata: Record<string, string>,
  connectAccountId: string
): Promise<boolean> {
  try {
    await stripe.setupIntents.update(
      setupIntentId,
      { metadata },
      { stripeAccount: connectAccountId }
    );
    console.log(`✅ Updated Setup Intent: ${setupIntentId}`);
    return true;
  } catch (error: any) {
    console.error(`❌ Failed to update Setup Intent ${setupIntentId}:`, error.message);
    return false;
  }
}

/**
 * Update Customer metadata
 */
async function updateCustomerMetadata(
  customerId: string,
  team: TeamPaymentData,
  connectAccountId: string
): Promise<boolean> {
  try {
    await stripe.customers.update(
      customerId,
      {
        name: `${team.teamName} - ${team.managerName || "Team Manager"}`,
        description: `Team: ${team.teamName} | Event: ${team.eventName} | TeamID: ${team.teamId}`,
        metadata: generateTeamMetadata(team),
      },
      { stripeAccount: connectAccountId }
    );
    console.log(`✅ Updated Customer: ${customerId}`);
    return true;
  } catch (error: any) {
    console.error(`❌ Failed to update Customer ${customerId}:`, error.message);
    return false;
  }
}

/**
 * Find and update charges related to Payment Intent
 */
async function updateRelatedCharges(
  paymentIntentId: string,
  metadata: Record<string, string>,
  connectAccountId: string
): Promise<number> {
  try {
    // List charges for this Payment Intent
    const charges = await stripe.charges.list(
      { payment_intent: paymentIntentId },
      { stripeAccount: connectAccountId }
    );

    let updatedCount = 0;
    for (const charge of charges.data) {
      try {
        await stripe.charges.update(
          charge.id,
          { metadata },
          { stripeAccount: connectAccountId }
        );
        console.log(`✅ Updated Charge: ${charge.id}`);
        updatedCount++;
      } catch (error: any) {
        console.error(`❌ Failed to update Charge ${charge.id}:`, error.message);
      }
    }

    return updatedCount;
  } catch (error: any) {
    console.error(`❌ Failed to fetch charges for Payment Intent ${paymentIntentId}:`, error.message);
    return 0;
  }
}

/**
 * Process a single team's payment metadata updates
 */
async function processTeamMetadata(team: TeamPaymentData): Promise<{
  teamId: number;
  success: boolean;
  updatedObjects: string[];
  errors: string[];
}> {
  console.log(`\n🔄 Processing Team ${team.teamId}: ${team.teamName}`);
  
  const metadata = generateTeamMetadata(team);
  const updatedObjects: string[] = [];
  const errors: string[] = [];
  
  // Update Payment Intent if exists
  if (team.paymentIntentId && team.connectAccountId) {
    const success = await updatePaymentIntentMetadata(
      team.paymentIntentId,
      metadata,
      team.connectAccountId
    );
    if (success) {
      updatedObjects.push(`Payment Intent: ${team.paymentIntentId}`);
      
      // Update related charges
      const chargeCount = await updateRelatedCharges(
        team.paymentIntentId,
        metadata,
        team.connectAccountId
      );
      if (chargeCount > 0) {
        updatedObjects.push(`${chargeCount} Charges`);
      }
    } else {
      errors.push(`Payment Intent: ${team.paymentIntentId}`);
    }
  }

  // Update Setup Intent if exists
  if (team.setupIntentId && team.connectAccountId) {
    const success = await updateSetupIntentMetadata(
      team.setupIntentId,
      metadata,
      team.connectAccountId
    );
    if (success) {
      updatedObjects.push(`Setup Intent: ${team.setupIntentId}`);
    } else {
      errors.push(`Setup Intent: ${team.setupIntentId}`);
    }
  }

  // Update Customer if exists
  if (team.stripeCustomerId && team.connectAccountId) {
    const success = await updateCustomerMetadata(
      team.stripeCustomerId,
      team,
      team.connectAccountId
    );
    if (success) {
      updatedObjects.push(`Customer: ${team.stripeCustomerId}`);
    } else {
      errors.push(`Customer: ${team.stripeCustomerId}`);
    }
  }

  const overallSuccess = updatedObjects.length > 0 && errors.length === 0;
  
  console.log(`${overallSuccess ? "✅" : "⚠️"} Team ${team.teamId} complete:`);
  console.log(`   Updated: ${updatedObjects.join(", ") || "None"}`);
  if (errors.length > 0) {
    console.log(`   Errors: ${errors.join(", ")}`);
  }

  return {
    teamId: team.teamId,
    success: overallSuccess,
    updatedObjects,
    errors,
  };
}

/**
 * Main execution function
 */
async function main() {
  console.log("🚀 RETROACTIVE METADATA UPDATE STARTING");
  console.log("========================================");
  
  try {
    // Get all teams with payment data
    const teams = await getTeamsWithPayments();
    
    if (teams.length === 0) {
      console.log("ℹ️ No teams with payment data found.");
      return;
    }

    console.log(`\n📊 PROCESSING ${teams.length} TEAMS`);
    console.log("====================================");

    // Process teams in batches to avoid rate limits
    const batchSize = 10;
    const results: Awaited<ReturnType<typeof processTeamMetadata>>[] = [];
    
    for (let i = 0; i < teams.length; i += batchSize) {
      const batch = teams.slice(i, i + batchSize);
      console.log(`\n📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(teams.length / batchSize)}`);
      
      const batchPromises = batch.map(team => processTeamMetadata(team));
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Rate limiting delay
      if (i + batchSize < teams.length) {
        console.log("⏱️ Waiting 2 seconds to respect rate limits...");
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    // Summary Report
    console.log("\n📈 FINAL SUMMARY");
    console.log("================");
    
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    const totalObjects = results.reduce((sum, r) => sum + r.updatedObjects.length, 0);
    
    console.log(`✅ Successfully processed: ${successful}/${teams.length} teams`);
    console.log(`❌ Failed: ${failed}/${teams.length} teams`);
    console.log(`🎯 Total Stripe objects updated: ${totalObjects}`);
    
    if (failed > 0) {
      console.log("\n❌ FAILED TEAMS:");
      results
        .filter(r => !r.success)
        .forEach(r => {
          console.log(`   Team ${r.teamId}: ${r.errors.join(", ")}`);
        });
    }

    console.log("\n🎉 RETROACTIVE METADATA UPDATE COMPLETE");
    
  } catch (error) {
    console.error("💥 FATAL ERROR:", error);
    process.exit(1);
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}