/**
 * RETROACTIVE METADATA SERVICE
 * 
 * Service for updating existing Stripe Connect payments with comprehensive metadata
 * Solves the payment identification crisis for legacy transactions
 */

import { db } from "../../db/index.js";
import { teams, events } from "../../db/schema.js";
import { eq, and, isNotNull, or } from "drizzle-orm";
import Stripe from "stripe";

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2024-06-20",
    })
  : null;

export interface RetroactiveUpdateResult {
  teamId: number;
  teamName: string;
  paymentObjects: {
    paymentIntent?: string;
    setupIntent?: string;
    customer?: string;
    charges?: string[];
  };
  success: boolean;
  errors: string[];
  metadata: Record<string, string>;
}

/**
 * Update metadata for a specific team's Stripe objects
 */
export async function updateTeamPaymentMetadata(teamId: number): Promise<RetroactiveUpdateResult> {
  console.log(`🔄 RETROACTIVE UPDATE: Starting for Team ${teamId}`);

  // Get team with event details
  const teamData = await db
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
    .where(eq(teams.id, teamId))
    .limit(1);

  if (!teamData[0]) {
    throw new Error(`Team ${teamId} not found`);
  }

  const team = teamData[0];

  if (!team.connectAccountId) {
    throw new Error(`Team ${teamId} event does not have Connect account configured`);
  }

  // Generate comprehensive metadata
  const metadata: Record<string, string> = {
    teamId: team.teamId.toString(),
    teamName: team.teamName || "Unknown Team",
    eventId: team.eventId?.toString() || "",
    eventName: team.eventName || "",
    managerEmail: team.managerEmail || "",
    managerName: team.managerName || "Team Manager",
    registrationDate: team.createdAt?.toISOString() || "",
    internalReference: `TEAM-${team.teamId}-${team.eventId}`,
    systemSource: "KickDeck",
    updateType: "RetroactiveMetadata",
    updateDate: new Date().toISOString(),
  };

  const result: RetroactiveUpdateResult = {
    teamId: team.teamId,
    teamName: team.teamName || "Unknown Team",
    paymentObjects: {},
    success: true,
    errors: [],
    metadata,
  };

  // Update Payment Intent
  if (team.paymentIntentId) {
    try {
      await stripe.paymentIntents.update(
        team.paymentIntentId,
        { metadata },
        { stripeAccount: team.connectAccountId }
      );
      result.paymentObjects.paymentIntent = team.paymentIntentId;
      console.log(`✅ Updated Payment Intent: ${team.paymentIntentId}`);

      // Update related charges
      try {
        const charges = await stripe.charges.list(
          { payment_intent: team.paymentIntentId },
          { stripeAccount: team.connectAccountId }
        );

        const updatedCharges: string[] = [];
        for (const charge of charges.data) {
          try {
            await stripe.charges.update(
              charge.id,
              { metadata },
              { stripeAccount: team.connectAccountId }
            );
            updatedCharges.push(charge.id);
          } catch (chargeError: any) {
            result.errors.push(`Charge ${charge.id}: ${chargeError.message}`);
          }
        }
        result.paymentObjects.charges = updatedCharges;
        console.log(`✅ Updated ${updatedCharges.length} charges for Payment Intent`);
      } catch (chargesError: any) {
        result.errors.push(`Charges lookup: ${chargesError.message}`);
      }
    } catch (piError: any) {
      result.errors.push(`Payment Intent: ${piError.message}`);
      result.success = false;
    }
  }

  // Update Setup Intent
  if (team.setupIntentId) {
    try {
      await stripe.setupIntents.update(
        team.setupIntentId,
        { metadata },
        { stripeAccount: team.connectAccountId }
      );
      result.paymentObjects.setupIntent = team.setupIntentId;
      console.log(`✅ Updated Setup Intent: ${team.setupIntentId}`);
    } catch (siError: any) {
      result.errors.push(`Setup Intent: ${siError.message}`);
      result.success = false;
    }
  }

  // Update Customer
  if (team.stripeCustomerId) {
    try {
      await stripe.customers.update(
        team.stripeCustomerId,
        {
          name: `${team.teamName} - ${team.managerName || "Team Manager"}`,
          description: `Team: ${team.teamName} | Event: ${team.eventName} | TeamID: ${team.teamId}`,
          metadata,
        },
        { stripeAccount: team.connectAccountId }
      );
      result.paymentObjects.customer = team.stripeCustomerId;
      console.log(`✅ Updated Customer: ${team.stripeCustomerId}`);
    } catch (custError: any) {
      result.errors.push(`Customer: ${custError.message}`);
      result.success = false;
    }
  }

  console.log(`${result.success ? "✅" : "❌"} RETROACTIVE UPDATE: Team ${teamId} ${result.success ? "completed" : "failed"}`);
  
  return result;
}

/**
 * Update metadata for multiple teams by eventId
 */
export async function updateEventPaymentMetadata(eventId: number): Promise<RetroactiveUpdateResult[]> {
  console.log(`🔄 RETROACTIVE UPDATE: Starting for Event ${eventId}`);

  // Get all teams for this event with payment data
  const teamsWithPayments = await db
    .select({
      teamId: teams.id,
    })
    .from(teams)
    .leftJoin(events, eq(teams.eventId, events.id))
    .where(
      and(
        eq(teams.eventId, eventId),
        isNotNull(events.stripeConnectAccountId),
        or(
          isNotNull(teams.paymentIntentId),
          isNotNull(teams.setupIntentId),
          isNotNull(teams.stripeCustomerId)
        )
      )
    );

  console.log(`📊 Found ${teamsWithPayments.length} teams with payment data for Event ${eventId}`);

  const results: RetroactiveUpdateResult[] = [];
  
  // Process teams in batches to respect rate limits
  const batchSize = 5;
  for (let i = 0; i < teamsWithPayments.length; i += batchSize) {
    const batch = teamsWithPayments.slice(i, i + batchSize);
    
    const batchPromises = batch.map(team => updateTeamPaymentMetadata(team.teamId));
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    // Rate limiting delay
    if (i + batchSize < teamsWithPayments.length) {
      console.log("⏱️ Rate limit delay: 1 second...");
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`📈 Event ${eventId} Summary: ${successful} successful, ${failed} failed`);
  
  return results;
}

/**
 * Update metadata for all teams with payment data
 */
export async function updateAllPaymentMetadata(): Promise<{
  totalTeams: number;
  successful: number;
  failed: number;
  results: RetroactiveUpdateResult[];
}> {
  console.log("🚀 RETROACTIVE UPDATE: Starting for ALL teams with payment data");

  // Get all teams with any payment data
  const teamsWithPayments = await db
    .select({
      teamId: teams.id,
    })
    .from(teams)
    .leftJoin(events, eq(teams.eventId, events.id))
    .where(
      and(
        isNotNull(events.stripeConnectAccountId),
        or(
          isNotNull(teams.paymentIntentId),
          isNotNull(teams.setupIntentId),
          isNotNull(teams.stripeCustomerId)
        )
      )
    )
    .orderBy(teams.createdAt);

  console.log(`📊 Found ${teamsWithPayments.length} total teams with payment data`);

  const results: RetroactiveUpdateResult[] = [];
  
  // Process teams in smaller batches for global update
  const batchSize = 3;
  for (let i = 0; i < teamsWithPayments.length; i += batchSize) {
    const batch = teamsWithPayments.slice(i, i + batchSize);
    console.log(`📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(teamsWithPayments.length / batchSize)}`);
    
    const batchPromises = batch.map(team => updateTeamPaymentMetadata(team.teamId));
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    // Conservative rate limiting for global update
    if (i + batchSize < teamsWithPayments.length) {
      console.log("⏱️ Rate limit delay: 2 seconds...");
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log("🎉 GLOBAL RETROACTIVE UPDATE COMPLETE");
  console.log(`📈 Final Summary: ${successful}/${teamsWithPayments.length} teams successful`);
  
  return {
    totalTeams: teamsWithPayments.length,
    successful,
    failed,
    results,
  };
}

/**
 * Check if a team has payment objects that need metadata updates
 */
export async function checkTeamMetadataStatus(teamId: number): Promise<{
  hasPaymentData: boolean;
  paymentObjects: {
    paymentIntent?: string;
    setupIntent?: string;
    customer?: string;
  };
  connectAccountId?: string;
  needsUpdate: boolean;
}> {
  const teamData = await db
    .select({
      paymentIntentId: teams.paymentIntentId,
      setupIntentId: teams.setupIntentId,
      stripeCustomerId: teams.stripeCustomerId,
      connectAccountId: events.stripeConnectAccountId,
    })
    .from(teams)
    .leftJoin(events, eq(teams.eventId, events.id))
    .where(eq(teams.id, teamId))
    .limit(1);

  if (!teamData[0]) {
    return {
      hasPaymentData: false,
      paymentObjects: {},
      needsUpdate: false,
    };
  }

  const team = teamData[0];
  const paymentObjects: any = {};
  
  if (team.paymentIntentId) paymentObjects.paymentIntent = team.paymentIntentId;
  if (team.setupIntentId) paymentObjects.setupIntent = team.setupIntentId;
  if (team.stripeCustomerId) paymentObjects.customer = team.stripeCustomerId;

  const hasPaymentData = Object.keys(paymentObjects).length > 0;
  const needsUpdate = hasPaymentData && !!team.connectAccountId;

  return {
    hasPaymentData,
    paymentObjects,
    connectAccountId: team.connectAccountId || undefined,
    needsUpdate,
  };
}