/**
 * RETROACTIVE METADATA SERVICE
 *
 * Updates existing Stripe objects with comprehensive metadata for payment
 * identification and Connect account visibility.
 *
 * IMPORTANT: KickDeck uses DESTINATION CHARGES. This means:
 *   - Payment intents, charges, customers live on the PLATFORM account (no stripeAccount header)
 *   - Transfers live on the PLATFORM account but are visible on the connected account
 *   - To give tournament organizers customer visibility, we find-or-create on the connected account
 */

import { db } from "../../db/index.js";
import { teams, events } from "../../db/schema.js";
import { eq, and, isNotNull, or } from "drizzle-orm";
import Stripe from "stripe";
import { getStripeClient } from "./stripe-client-factory";
import { updateConnectVisibility } from "./stripe-connect-visibility";

export interface RetroactiveUpdateResult {
  teamId: number;
  teamName: string;
  updatedObjects: string[];
  success: boolean;
  errors: string[];
  metadata: Record<string, string>;
}

/**
 * Update metadata for a specific team's Stripe objects (destination charge model)
 */
export async function updateTeamPaymentMetadata(teamId: number): Promise<RetroactiveUpdateResult> {
  const stripe = await getStripeClient();
  if (!stripe) throw new Error('Stripe not configured');

  console.log(`🔄 RETROACTIVE UPDATE: Starting for Team ${teamId}`);

  // Get team with event details
  const teamData = await db
    .select({
      teamId: teams.id,
      teamName: teams.name,
      eventId: teams.eventId,
      eventName: events.name,
      managerEmail: teams.managerEmail,
      submitterEmail: teams.submitterEmail,
      managerName: teams.managerName,
      submitterName: teams.submitterName,
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
    managerEmail: team.managerEmail || team.submitterEmail || "",
    managerName: team.submitterName || team.managerName || "Team Manager",
    registrationDate: team.createdAt ? (typeof team.createdAt === 'string' ? team.createdAt : team.createdAt.toISOString()) : "",
    internalReference: `TEAM-${team.teamId}-${team.eventId}`,
    systemSource: "KickDeck",
    updateType: "RetroactiveMetadata",
    updateDate: new Date().toISOString(),
  };

  const result: RetroactiveUpdateResult = {
    teamId: team.teamId,
    teamName: team.teamName || "Unknown Team",
    updatedObjects: [],
    success: true,
    errors: [],
    metadata,
  };

  // ──────────────────────────────────────────────
  // 1. Update Payment Intent on PLATFORM account
  //    (destination charges: PI lives on platform)
  // ──────────────────────────────────────────────
  if (team.paymentIntentId) {
    try {
      await stripe.paymentIntents.update(team.paymentIntentId, { metadata });
      result.updatedObjects.push(`PaymentIntent: ${team.paymentIntentId}`);
      console.log(`  ✅ Updated Payment Intent: ${team.paymentIntentId} (platform)`);

      // Update related charges on PLATFORM account
      try {
        const charges = await stripe.charges.list({ payment_intent: team.paymentIntentId });
        for (const charge of charges.data) {
          try {
            await stripe.charges.update(charge.id, { metadata });
            result.updatedObjects.push(`Charge: ${charge.id}`);
          } catch (chargeError: any) {
            result.errors.push(`Charge ${charge.id}: ${chargeError.message}`);
          }
        }
        if (charges.data.length > 0) {
          console.log(`  ✅ Updated ${charges.data.length} charge(s) (platform)`);
        }
      } catch (chargesError: any) {
        result.errors.push(`Charges lookup: ${chargesError.message}`);
      }

      // ──────────────────────────────────────────────
      // 2. Update TRANSFER + DESTINATION PAYMENT + CONNECTED CUSTOMER
      //    Uses the centralised visibility helper which handles all three
      // ──────────────────────────────────────────────
      try {
        const customerEmail = team.submitterEmail || team.managerEmail;
        const connectResult = await updateConnectVisibility({
          connectAccountId: team.connectAccountId!,
          paymentIntentId: team.paymentIntentId,
          description: `${team.eventName || 'Tournament'} - ${team.teamName || 'Team'} Registration`,
          metadata,
          customerEmail: customerEmail || undefined,
          customerName: team.submitterName || team.managerName || 'Team Manager',
        });

        if (connectResult.transferId) {
          result.updatedObjects.push(`Transfer: ${connectResult.transferId}`);
        }
        if (connectResult.destinationPaymentId) {
          result.updatedObjects.push(`DestinationPayment: ${connectResult.destinationPaymentId}`);
        }
        if (connectResult.connectedCustomerId) {
          result.updatedObjects.push(`ConnectedCustomer: ${connectResult.connectedCustomerId}`);
        }
        result.errors.push(...connectResult.errors);
      } catch (connectError: any) {
        result.errors.push(`Connect visibility: ${connectError.message}`);
      }
    } catch (piError: any) {
      result.errors.push(`Payment Intent: ${piError.message}`);
      result.success = false;
    }
  }

  // ──────────────────────────────────────────────
  // 3. Update Setup Intent on PLATFORM account
  // ──────────────────────────────────────────────
  if (team.setupIntentId) {
    try {
      await stripe.setupIntents.update(team.setupIntentId, { metadata });
      result.updatedObjects.push(`SetupIntent: ${team.setupIntentId}`);
      console.log(`  ✅ Updated Setup Intent: ${team.setupIntentId} (platform)`);
    } catch (siError: any) {
      result.errors.push(`Setup Intent: ${siError.message}`);
      // Non-fatal — setup intent might have expired
    }
  }

  // ──────────────────────────────────────────────
  // 4. Update platform Customer
  // ──────────────────────────────────────────────
  if (team.stripeCustomerId) {
    try {
      await stripe.customers.update(team.stripeCustomerId, {
        name: team.submitterName || team.managerName || 'Team Manager',
        description: `Team: ${team.teamName} | Event: ${team.eventName} | TeamID: ${team.teamId}`,
        metadata,
      });
      result.updatedObjects.push(`PlatformCustomer: ${team.stripeCustomerId}`);
      console.log(`  ✅ Updated Platform Customer: ${team.stripeCustomerId}`);
    } catch (custError: any) {
      result.errors.push(`Platform Customer: ${custError.message}`);
    }
  }

  const hasErrors = result.errors.length > 0;
  // success = true if we updated at least something, even with partial errors
  result.success = result.updatedObjects.length > 0;

  console.log(`${result.success ? "✅" : "❌"} RETROACTIVE UPDATE: Team ${teamId} — ${result.updatedObjects.length} objects updated${hasErrors ? `, ${result.errors.length} errors` : ''}`);

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
  const batchSize = 3;
  for (let i = 0; i < teamsWithPayments.length; i += batchSize) {
    const batch = teamsWithPayments.slice(i, i + batchSize);
    console.log(`📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(teamsWithPayments.length / batchSize)}`);

    const batchPromises = batch.map(team =>
      updateTeamPaymentMetadata(team.teamId).catch(err => ({
        teamId: team.teamId,
        teamName: 'Unknown',
        updatedObjects: [] as string[],
        success: false,
        errors: [err.message],
        metadata: {},
      } as RetroactiveUpdateResult))
    );
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);

    // Rate limiting delay
    if (i + batchSize < teamsWithPayments.length) {
      console.log("⏱️ Rate limit delay: 2 seconds...");
      await new Promise(resolve => setTimeout(resolve, 2000));
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

  // Process teams in smaller batches for global update (more conservative rate limiting)
  const batchSize = 2;
  for (let i = 0; i < teamsWithPayments.length; i += batchSize) {
    const batch = teamsWithPayments.slice(i, i + batchSize);
    console.log(`📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(teamsWithPayments.length / batchSize)}`);

    const batchPromises = batch.map(team =>
      updateTeamPaymentMetadata(team.teamId).catch(err => ({
        teamId: team.teamId,
        teamName: 'Unknown',
        updatedObjects: [] as string[],
        success: false,
        errors: [err.message],
        metadata: {},
      } as RetroactiveUpdateResult))
    );
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);

    // Conservative rate limiting for global update
    if (i + batchSize < teamsWithPayments.length) {
      await new Promise(resolve => setTimeout(resolve, 2500));
    }
  }

  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  console.log("🎉 GLOBAL RETROACTIVE UPDATE COMPLETE");
  console.log(`📈 Final Summary: ${successful}/${teamsWithPayments.length} teams successful, ${failed} failed`);

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
