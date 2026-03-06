/**
 * TRANSFER METADATA SERVICE
 * 
 * Enhances Stripe Connect transfers with comprehensive metadata
 * for complete payment traceability from registration to payout
 */

import Stripe from "stripe";
import { db } from "../../db/index.js";
import { teams, events, paymentTransactions } from "../../db/schema.js";
import { eq, and } from "drizzle-orm";

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2024-06-20",
    })
  : null;

export interface TransferMetadataResult {
  transferId: string;
  success: boolean;
  metadata: Record<string, string>;
  error?: string;
}

/**
 * Create transfer with comprehensive metadata
 */
export async function createTransferWithMetadata({
  amount,
  connectAccountId,
  sourceTransactionId,
  teamId,
  eventId,
  description,
}: {
  amount: number;
  connectAccountId: string;
  sourceTransactionId: string;
  teamId: number;
  eventId: number;
  description?: string;
}): Promise<TransferMetadataResult> {
  try {
    // Get team and event details for metadata
    const teamData = await db
      .select({
        teamId: teams.id,
        teamName: teams.name,
        managerEmail: teams.managerEmail,
        managerName: teams.submitterName,
        eventId: teams.eventId,
        eventName: events.name,
        paymentIntentId: teams.paymentIntentId,
        totalAmount: teams.totalAmount,
      })
      .from(teams)
      .leftJoin(events, eq(teams.eventId, events.id))
      .where(and(eq(teams.id, teamId), eq(teams.eventId, eventId)))
      .limit(1);

    if (!teamData[0]) {
      throw new Error(`Team ${teamId} not found for event ${eventId}`);
    }

    const team = teamData[0];

    // Generate comprehensive transfer metadata
    const metadata: Record<string, string> = {
      teamId: teamId.toString(),
      teamName: team.teamName || "Unknown Team",
      eventId: eventId.toString(),
      eventName: team.eventName || "Unknown Event",
      managerEmail: team.managerEmail || "",
      managerName: team.managerName || "Team Manager",
      originalPaymentIntent: team.paymentIntentId || "",
      originalAmount: team.totalAmount?.toString() || "",
      transferAmount: amount.toString(),
      internalReference: `TRANSFER-TEAM-${teamId}-${eventId}`,
      systemSource: "KickDeck",
      transferType: "tournament_payout",
      transferDate: new Date().toISOString(),
    };

    // Create transfer with metadata
    const transfer = await stripe.transfers.create({
      amount,
      currency: "usd",
      destination: connectAccountId,
      source_transaction: sourceTransactionId,
      description: description || `${team.eventName} - ${team.teamName} Registration`,
      metadata,
    });

    console.log(`✅ Created transfer ${transfer.id} with comprehensive metadata`);

    return {
      transferId: transfer.id,
      success: true,
      metadata,
    };
  } catch (error: any) {
    console.error("Error creating transfer with metadata:", error);
    return {
      transferId: "",
      success: false,
      metadata: {},
      error: error.message,
    };
  }
}

/**
 * Update existing transfer with metadata retroactively
 */
export async function updateTransferMetadata({
  transferId,
  teamId,
  eventId,
}: {
  transferId: string;
  teamId: number;
  eventId: number;
}): Promise<TransferMetadataResult> {
  try {
    // Get team and event details
    const teamData = await db
      .select({
        teamId: teams.id,
        teamName: teams.name,
        managerEmail: teams.managerEmail,
        managerName: teams.submitterName,
        eventId: teams.eventId,
        eventName: events.name,
        paymentIntentId: teams.paymentIntentId,
        totalAmount: teams.totalAmount,
      })
      .from(teams)
      .leftJoin(events, eq(teams.eventId, events.id))
      .where(and(eq(teams.id, teamId), eq(teams.eventId, eventId)))
      .limit(1);

    if (!teamData[0]) {
      throw new Error(`Team ${teamId} not found for event ${eventId}`);
    }

    const team = teamData[0];

    // Generate comprehensive metadata
    const metadata: Record<string, string> = {
      teamId: teamId.toString(),
      teamName: team.teamName || "Unknown Team",
      eventId: eventId.toString(),
      eventName: team.eventName || "Unknown Event",
      managerEmail: team.managerEmail || "",
      managerName: team.managerName || "Team Manager",
      originalPaymentIntent: team.paymentIntentId || "",
      originalAmount: team.totalAmount?.toString() || "",
      internalReference: `TRANSFER-TEAM-${teamId}-${eventId}`,
      systemSource: "KickDeck",
      transferType: "tournament_payout",
      updateType: "RetroactiveMetadata",
      updateDate: new Date().toISOString(),
    };

    // Update transfer with metadata
    await stripe.transfers.update(transferId, {
      metadata,
    });

    console.log(`✅ Updated transfer ${transferId} with comprehensive metadata`);

    return {
      transferId,
      success: true,
      metadata,
    };
  } catch (error: any) {
    console.error("Error updating transfer metadata:", error);
    return {
      transferId,
      success: false,
      metadata: {},
      error: error.message,
    };
  }
}

/**
 * Bulk update multiple transfers with metadata
 */
export async function bulkUpdateTransferMetadata(
  transferUpdates: Array<{
    transferId: string;
    teamId: number;
    eventId: number;
  }>
): Promise<{
  successful: number;
  failed: number;
  results: TransferMetadataResult[];
}> {
  console.log(`🔄 Starting bulk transfer metadata update for ${transferUpdates.length} transfers`);

  const results: TransferMetadataResult[] = [];
  let successful = 0;
  let failed = 0;

  // Process in batches to respect rate limits
  const batchSize = 5;
  for (let i = 0; i < transferUpdates.length; i += batchSize) {
    const batch = transferUpdates.slice(i, i + batchSize);
    
    const batchPromises = batch.map(update => 
      updateTransferMetadata(update)
    );
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    // Count results
    batchResults.forEach(result => {
      if (result.success) {
        successful++;
      } else {
        failed++;
      }
    });
    
    // Rate limiting delay
    if (i + batchSize < transferUpdates.length) {
      console.log("⏱️ Rate limit delay: 1 second...");
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  console.log(`📈 Bulk transfer update complete: ${successful} successful, ${failed} failed`);
  
  return {
    successful,
    failed,
    results,
  };
}

/**
 * Get transfer details with metadata for verification
 */
export async function getTransferWithMetadata(transferId: string): Promise<{
  transfer?: Stripe.Transfer;
  hasMetadata: boolean;
  metadataKeys: string[];
  error?: string;
}> {
  try {
    const transfer = await stripe.transfers.retrieve(transferId);
    
    const hasMetadata = Object.keys(transfer.metadata || {}).length > 0;
    const metadataKeys = Object.keys(transfer.metadata || {});
    
    return {
      transfer,
      hasMetadata,
      metadataKeys,
    };
  } catch (error: any) {
    return {
      hasMetadata: false,
      metadataKeys: [],
      error: error.message,
    };
  }
}