import Stripe from "stripe";
import { db } from "../../db";
import { teams, paymentTransactions, events, refunds, users } from "../../db/schema";
import { eq } from "drizzle-orm";
import { log } from "../vite";
import { sendRegistrationReceiptEmail, sendTemplatedEmail } from "./emailService";
import { getStripeClient } from "./stripe-client-factory";
import { calculateEventFees, calculateFeeBreakdown, DEFAULT_PLATFORM_FEE_RATE, STRIPE_FIXED_FEE } from "./fee-calculator";

// In production, we can add a version check to ensure our API version stays current
const STRIPE_API_VERSION = "2023-10-16" as any;

// Check Stripe API version on startup (only in production)
if (process.env.NODE_ENV === "production") {
  checkStripeApiVersion();
}

/**
 * Helper function to check if our Stripe API version is current
 * This helps ensure we don't fall too far behind Stripe's recommended versions
 */
async function checkStripeApiVersion() {
  try {
    // Current API version might be outdated if a new version is available
    console.log(`Using Stripe API version: ${STRIPE_API_VERSION}`);
  } catch (error) {
    console.warn("Could not verify Stripe API version:", error);
  }
}

/**
 * Creates a payment intent for a team registration
 */
export async function createPaymentIntent(
  amount: number,
  teamId: number | string,
  metadata?: Record<string, string>,
) {
  const stripe = await getStripeClient();
  if (!stripe) throw new Error('Stripe not configured');

  try {
    // Fetch team details to create meaningful description
    let description = "Team Registration Payment";
    let enhancedMetadata = {
      teamId: teamId.toString(),
      ...metadata,
    };

    // Only query team details if it's a real team ID (not temp)
    if (
      typeof teamId === "number" ||
      (!teamId.toString().startsWith("temp-") && !isNaN(Number(teamId)))
    ) {
      try {
        const numericTeamId =
          typeof teamId === "number" ? teamId : parseInt(teamId.toString());
        const teamResult = await db
          .select({
            teamName: teams.name,
            eventName: events.name,
            ageGroupName: ageGroups.name,
            submitterEmail: teams.submitterEmail,
            managerEmail: teams.managerEmail,
          })
          .from(teams)
          .leftJoin(events, eq(teams.eventId, events.id))
          .leftJoin(ageGroups, eq(teams.ageGroupId, ageGroups.id))
          .where(eq(teams.id, numericTeamId))
          .limit(1);

        if (teamResult.length > 0) {
          const team = teamResult[0];
          description = `${team.eventName || "Tournament"} - ${team.teamName || "Team Registration"}`;
          if (team.ageGroupName) {
            description += ` (${team.ageGroupName})`;
          }

          // Enhanced metadata for better tracking
          enhancedMetadata = {
            ...enhancedMetadata,
            teamName: team.teamName || "",
            eventName: team.eventName || "",
            ageGroup: team.ageGroupName || "",
            contactEmail: team.managerEmail || team.submitterEmail || "",
          };
        }
      } catch (dbError) {
        console.warn(
          `Could not fetch team details for description: ${dbError.message}`,
        );
        // Continue with default description
      }
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: "usd",
      description: description,
      metadata: enhancedMetadata,
    });

    // Only update the team in the database if it's a numeric ID (not a temp ID)
    if (typeof teamId === "number" || !teamId.toString().startsWith("temp-")) {
      try {
        const numericTeamId =
          typeof teamId === "number" ? teamId : parseInt(teamId.toString());
        // Update the team with the payment intent ID
        await db
          .update(teams)
          .set({
            paymentIntentId: paymentIntent.id,
          })
          .where(eq(teams.id, numericTeamId));
      } catch (dbError) {
        // Log the db error but don't fail the payment intent creation
        console.warn(
          `Could not update team record with payment intent ID, likely a temporary team: ${dbError.message}`,
        );
      }
    }

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    };
  } catch (error: any) {
    console.error("Error creating payment intent:", error);
    throw new Error(`Error creating payment intent: ${error.message}`);
  }
}

/**
 * Handles a successful payment intent webhook event
 */
export async function handlePaymentSuccess(
  paymentIntent: Stripe.PaymentIntent,
) {
  const stripe = await getStripeClient();
  if (!stripe) throw new Error('Stripe not configured');

  try {
    const teamId = paymentIntent.metadata.teamId;
    if (!teamId) {
      console.error("No teamId found in payment intent metadata");
      return;
    }

    // Check if this is a temporary team ID (for new registrations)
    if (teamId.toString().startsWith("temp-")) {
      console.log(
        `Payment received for temporary team ID: ${teamId}. This will be handled by the frontend registration flow.`,
      );
      return;
    }

    // Find the team
    const teamIdNumber = parseInt(teamId);
    const existingTeam = await db.query.teams.findFirst({
      where: eq(teams.id, teamIdNumber),
    });

    if (!existingTeam) {
      console.error(`Team with ID ${teamId} not found`);
      return;
    }

    // Get payment details
    const charges = await stripe.charges.list({
      payment_intent: paymentIntent.id,
    });

    const charge = charges.data[0];
    const cardDetails = charge?.payment_method_details?.card;

    // Record payment transaction
    await db.insert(paymentTransactions).values({
      teamId: teamIdNumber,
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      status: "paid",
      paymentDate: new Date(),
      cardBrand: cardDetails?.brand || null,
      cardLast4: cardDetails?.last4 || null,
    });

    // Update team payment status and card details
    await db
      .update(teams)
      .set({
        paymentStatus: "paid",
        paymentDate: new Date().toISOString(),
        cardBrand: cardDetails?.brand || null,
        cardLast4: cardDetails?.last4 || null,
      })
      .where(eq(teams.id, teamIdNumber));

    console.log(`Payment recorded successfully for team ${teamId}`);

    // Send receipt email with payment details if submitter email is available
    try {
      if (existingTeam.submitterEmail) {
        // Get the event name for the email
        const [eventInfo] = await db
          .select({ name: events.name, adminEmail: events.adminEmail })
          .from(events)
          .where(eq(events.id, existingTeam.eventId));

        // Create payment data object for receipt email
        const paymentData = {
          status: "paid",
          amount: paymentIntent.amount,
          paymentIntentId: paymentIntent.id,
          paymentDate: new Date().toISOString(),
          cardBrand: cardDetails?.brand || null,
          cardLastFour: cardDetails?.last4 || null,
          paymentMethodType: "card",
        };

        console.log(
          `Sending payment receipt email to ${existingTeam.submitterEmail}`,
        );

        // Send the receipt email asynchronously (don't await to avoid delaying the response)
        sendRegistrationReceiptEmail(
          existingTeam.submitterEmail,
          existingTeam,
          paymentData,
          eventInfo?.name || "Tournament Registration",
          eventInfo?.adminEmail || undefined,
        ).catch((emailError) => {
          // Log email errors but don't fail the payment processing
          console.error("Error sending payment receipt email:", emailError);
        });
      }
    } catch (emailError) {
      // Log email errors but don't fail the payment processing
      console.error("Error preparing payment receipt email:", emailError);
    }

    return true;
  } catch (error: any) {
    console.error("Error handling payment success:", error);
    throw new Error(`Error handling payment success: ${error.message}`);
  }
}

/**
 * Handles a payment intent failure webhook event
 */
export async function handlePaymentFailure(
  paymentIntent: Stripe.PaymentIntent,
) {
  try {
    const teamId = paymentIntent.metadata.teamId;
    if (!teamId) {
      console.error("No teamId found in payment intent metadata");
      return;
    }

    // Check if this is a temporary team ID (for new registrations)
    if (teamId.toString().startsWith("temp-")) {
      console.log(
        `Payment failure for temporary team ID: ${teamId}. This will be handled by the frontend registration flow.`,
      );
      return;
    }

    // Find the team
    const teamIdNumber = parseInt(teamId);

    // Record payment transaction
    await db.insert(paymentTransactions).values({
      teamId: teamIdNumber,
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      status: "failed",
      paymentDate: new Date(),
      errorCode: paymentIntent.last_payment_error?.code || null,
      errorMessage: paymentIntent.last_payment_error?.message || null,
    });

    // Update team payment status
    await db
      .update(teams)
      .set({
        paymentStatus: "failed",
        errorCode: paymentIntent.last_payment_error?.code || null,
        errorMessage: paymentIntent.last_payment_error?.message || null,
      })
      .where(eq(teams.id, teamIdNumber));

    console.log(`Payment failure recorded for team ${teamId}`);
    return true;
  } catch (error: any) {
    console.error("Error handling payment failure:", error);
    throw new Error(`Error handling payment failure: ${error.message}`);
  }
}

/**
 * Creates a test payment intent for development/testing purposes
 */
export async function createTestPaymentIntent(
  amount: number,
  teamId: number,
  metadata?: Record<string, string>,
) {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Test payment intents are not allowed in production");
  }

  log("Creating test payment intent");
  return createPaymentIntent(amount, teamId, metadata);
}

/**
 * Creates a refund for a payment
 */
// export async function createRefund(paymentIntentId: string, amount?: number) {
//   try {
//     log(`Creating refund for payment intent ${paymentIntentId}`);

//     // Find the payment intent
//     const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

//     if (!paymentIntent) {
//       throw new Error(`Payment intent ${paymentIntentId} not found`);
//     }

//     // Find the charge associated with this payment intent
//     const charges = await stripe.charges.list({
//       payment_intent: paymentIntentId
//     });

//     if (charges.data.length === 0) {
//       throw new Error(`No charges found for payment intent ${paymentIntentId}`);
//     }

//     const chargeId = charges.data[0].id;

//     // Create the refund
//     const refund = await stripe.refunds.create({
//       charge: chargeId,
//       amount: amount, // If not specified, refund the full amount
//     });

//     // Get the team from the payment intent metadata
//     const teamId = paymentIntent.metadata.teamId;
//     if (teamId) {
//       const teamIdNumber = parseInt(teamId);

//       // Update the team status
//       await db.update(teams)
//         .set({
//           paymentStatus: 'refunded',
//           refundDate: new Date().toISOString(),
//         })
//         .where(eq(teams.id, teamIdNumber));

//       // Record the refund transaction
//       await db.insert(paymentTransactions).values({
//         teamId: teamIdNumber,
//         paymentIntentId: paymentIntentId,
//         amount: -(amount || paymentIntent.amount), // Negative amount for refund
//         status: 'refunded',
//         transactionType: 'refund',
//         refundedAt: new Date(),
//       });
//     }

//     return refund;
//   } catch (error: any) {
//     console.error("Error creating refund:", error);
//     throw new Error(`Error creating refund: ${error.message}`);
//   }
// }
export async function createRefund(paymentIntentId: string, amount?: number) {
  const stripe = await getStripeClient();
  if (!stripe) throw new Error('Stripe not configured');

  try {
    log(`Creating refund for payment intent ${paymentIntentId}`);

    // Find the payment intent
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (!paymentIntent) {
      throw new Error(`Payment intent ${paymentIntentId} not found`);
    }

    const connectAccountId = paymentIntent.metadata?.connectAccountId;
    const teamId = paymentIntent.metadata.teamId || '0';
    const hasConnectAccount = connectAccountId && connectAccountId.trim() !== '';

    // Determine refund amount:
    // - If explicit amount passed (partial refund), use that
    // - Otherwise refund the tournament cost (registration fee only, NOT platform fee)
    //   KickDeck keeps its platform fee on refunds
    let refundAmount: number;
    if (amount) {
      refundAmount = amount;
    } else {
      // Get tournament cost from metadata or team record
      const tournamentCost = paymentIntent.metadata?.tournamentAmount
        ? parseInt(paymentIntent.metadata.tournamentAmount)
        : null;

      if (tournamentCost && tournamentCost > 0) {
        refundAmount = tournamentCost;
      } else if (teamId && teamId !== '0') {
        // Fallback: get from team record
        const teamRecord = await db.query.teams.findFirst({
          where: eq(teams.id, parseInt(teamId)),
        });
        refundAmount = teamRecord?.totalAmount || paymentIntent.amount;
      } else {
        refundAmount = paymentIntent.amount;
      }
    }

    log(`Refund amount: $${(refundAmount / 100).toFixed(2)} | Connect: ${connectAccountId || 'none'} | Has transfer: ${hasConnectAccount ? 'yes' : 'no'}`);

    // Create refund with reverse_transfer to pull funds from Connect account
    // - reverse_transfer: true → reverses the transfer to the Connect account
    // - refund_application_fee: false → KickDeck keeps its platform fee
    // This ensures tournament (Connect account) bears the refund cost, not KickDeck
    const refundParams: any = {
      payment_intent: paymentIntentId,
      amount: refundAmount,
    };

    if (hasConnectAccount) {
      refundParams.reverse_transfer = true;
      refundParams.refund_application_fee = false;
      log(`Using reverse_transfer to pull $${(refundAmount / 100).toFixed(2)} from Connect account ${connectAccountId}`);
    }

    const refund = await stripe.refunds.create(refundParams);
    log(`✅ Refund ${refund.id} processed: $${(refundAmount / 100).toFixed(2)} | reverse_transfer: ${hasConnectAccount}`);

    // Update team status
    if (teamId && teamId !== '0') {
      const teamIdNumber = parseInt(teamId);

      const isFullRefund = refundAmount >= (parseInt(paymentIntent.metadata?.tournamentAmount || '0') || paymentIntent.amount);

      await db
        .update(teams)
        .set({
          paymentStatus: isFullRefund ? "refunded" : "partially_refunded",
          refundDate: new Date().toISOString(),
          refundAmount: refundAmount,
        })
        .where(eq(teams.id, teamIdNumber));

      // Record the refund transaction
      await db.insert(paymentTransactions).values({
        teamId: teamIdNumber,
        paymentIntentId: paymentIntentId,
        amount: -refundAmount,
        status: "refunded",
        transactionType: "refund",
        metadata: {
          refundId: refund.id,
          connectAccountId: connectAccountId || "none",
          reverseTransfer: hasConnectAccount ? "true" : "false",
          applicationFeeRefunded: "false",
          originalPaymentIntent: paymentIntentId,
          refundAmount: refundAmount.toString(),
          refundTimestamp: new Date().toISOString(),
        },
      });

      log(`Refund recorded for team ${teamIdNumber} — ${hasConnectAccount ? 'funds pulled from Connect account' : 'no Connect account'}`);
    }

    return refund;
  } catch (error: any) {
    console.error("Error creating refund:", error);
    throw new Error(`Error creating refund: ${error.message}`);
  }
}
/**
 * Creates a Setup Intent for collecting payment details without charging
 * UPDATED: Now creates customers and setup intents directly on tournament Connect accounts
 * Following Stripe's recommendations for Connect account customer creation
 */
export async function createSetupIntent(
  teamId: number | string,
  metadata?: Record<string, string>,
) {
  const stripe = await getStripeClient();
  if (!stripe) throw new Error('Stripe not configured');

  try {
    log(`Creating setup intent for team: ${teamId}`);

    // STEP 1: Get tournament Connect account information
    let connectAccountId: string | undefined;
    let customerId: string | undefined;

    // For real teams (not temp), get Connect account from event info
    if (typeof teamId === "number" || !teamId.toString().startsWith("temp-")) {
      try {
        const numericTeamId =
          typeof teamId === "number" ? teamId : parseInt(teamId.toString());
        
        // Get team with event and Connect account info
        const teamWithEvent = await db
          .select({
            team: {
              stripeCustomerId: teams.stripeCustomerId,
              submitterEmail: teams.submitterEmail,
              submitterName: teams.submitterName,
              name: teams.name,
              eventId: teams.eventId,
            },
            event: {
              stripeConnectAccountId: events.stripeConnectAccountId,
              name: events.name,
            },
          })
          .from(teams)
          .leftJoin(events, eq(teams.eventId, events.id))
          .where(eq(teams.id, numericTeamId))
          .limit(1);

        if (!teamWithEvent[0]) {
          throw new Error(`Team ${teamId} not found`);
        }

        const { team, event } = teamWithEvent[0];
        connectAccountId = event?.stripeConnectAccountId || undefined;

        if (!connectAccountId) {
          log(`⚠️ No Connect account for event — using platform account for team ${teamId}`);
        } else {
          log(`Using Connect account: ${connectAccountId} for team ${teamId}`);
        }

        // STEP 2: Create or get customer on PLATFORM account
        // Destination charges require customers/payment methods on the platform account
        if (team.stripeCustomerId) {
          customerId = team.stripeCustomerId;
          log(`Using existing customer ID: ${customerId} for team ${teamId}`);
        } else if (team.submitterEmail) {
          const customer = await stripe.customers.create({
            email: team.submitterEmail,
            name: `${team.name} - ${team.submitterName || "Team Manager"}`,
            description: `Team: ${team.name} | Event: ${event?.name} | TeamID: ${teamId}`,
            metadata: {
              teamId: teamId.toString(),
              teamName: team.name || "Unknown Team",
              eventId: team.eventId?.toString() || "",
              eventName: event?.name || "",
              managerEmail: team.submitterEmail,
              managerName: team.submitterName || "Team Manager",
              registrationDate: new Date().toISOString(),
              internalReference: `TEAM-${teamId}-${team.eventId}`,
              systemSource: "KickDeck",
              connectAccountId: connectAccountId || "",
            },
          });
          customerId = customer.id;

          // Store customer ID in database for future use
          await db
            .update(teams)
            .set({ stripeCustomerId: customerId })
            .where(eq(teams.id, numericTeamId));

          log(`Created new customer: ${customerId} on platform account for team ${teamId}`);
        }
      } catch (customerError: any) {
        log(
          `Could not create/retrieve customer for team ${teamId}: ${customerError.message}`,
        );
        throw customerError; // Don't continue without proper Connect account setup
      }
    } else {
      // For temp team IDs during registration, we need to handle differently
      // Since we don't have event info yet, we'll need to get it from metadata or skip Connect account
      if (metadata?.eventId) {
        try {
          // Get Connect account from event ID in metadata
          const eventInfo = await db
            .select({ stripeConnectAccountId: events.stripeConnectAccountId })
            .from(events)
            .where(eq(events.id, parseInt(metadata.eventId)))
            .limit(1);

          if (eventInfo[0]?.stripeConnectAccountId) {
            connectAccountId = eventInfo[0].stripeConnectAccountId;
            log(`Found Connect account ${connectAccountId} for temp team ${teamId} via event ${metadata.eventId}`);
          } else {
            log(`⚠️ No Connect account for event ${metadata.eventId} — using platform account for temp team ${teamId}`);
          }

          // Create customer on PLATFORM account (destination charges require platform customers)
          if (metadata?.userEmail) {
            const customer = await stripe.customers.create({
              email: metadata.userEmail,
              name: metadata.userName || "Team Manager",
              metadata: {
                teamId: teamId.toString(),
                teamName: metadata.teamName || "Unknown Team",
                createdFor: "temp_team_registration",
                eventId: metadata.eventId,
                connectAccountId: connectAccountId || "",
              },
            });
            customerId = customer.id;
            log(`Created customer ${customerId} on platform account for temp team ${teamId}`);
          }
        } catch (tempError: any) {
          log(`Error setting up Connect account for temp team: ${tempError.message}`);
          throw tempError;
        }
      } else {
        log(`⚠️ Temp team ${teamId} has no eventId in metadata — using platform account`);
        // Still create a customer on the platform account so payment can be charged later
        if (metadata?.userEmail) {
          const customer = await stripe.customers.create({
            email: metadata.userEmail,
            name: metadata.userName || "Team Manager",
            metadata: {
              teamId: teamId.toString(),
              teamName: metadata.teamName || "Unknown Team",
              createdFor: "temp_team_registration_no_event",
            },
          });
          customerId = customer.id;
          log(`Created customer ${customerId} on platform account for temp team ${teamId}`);
        }
      }
    }

    // STEP 3: Create Setup Intent on Connect account with enhanced metadata
    const setupIntentData: any = {
      payment_method_types: ["card"],
      usage: "off_session", // Allows for future charging without customer present
      metadata: {
        teamId: teamId.toString(),
        teamName: (typeof teamId === "number" || !teamId.toString().startsWith("temp-")) 
          ? team?.name || "Unknown Team" 
          : metadata?.teamName || "Temp Team",
        eventId: (typeof teamId === "number" || !teamId.toString().startsWith("temp-"))
          ? team?.eventId?.toString() || ""
          : metadata?.eventId || "",
        eventName: (typeof teamId === "number" || !teamId.toString().startsWith("temp-"))
          ? event?.name || ""
          : metadata?.eventName || "",
        managerEmail: (typeof teamId === "number" || !teamId.toString().startsWith("temp-"))
          ? team?.submitterEmail || ""
          : metadata?.userEmail || "",
        internalReference: `TEAM-${teamId}-${(typeof teamId === "number" || !teamId.toString().startsWith("temp-")) ? team?.eventId : metadata?.eventId}`,
        connectAccountId: connectAccountId,
        systemSource: "KickDeck",
        operationType: "SetupIntent",
        ...metadata,
      },
    };

    // Add customer if we have one (critical for charging later)
    if (customerId) {
      setupIntentData.customer = customerId;
      log(`Setup Intent will be created with customer: ${customerId} for team ${teamId}`);
    } else {
      log(`WARNING: Setup Intent created without customer - charging will be limited`);
    }

    // Create Setup Intent on PLATFORM account
    // Destination charges require the payment method to live on the platform account
    const setupIntent = await stripe.setupIntents.create(setupIntentData);

    log(`✅ Created Setup Intent ${setupIntent.id} on platform account for team ${teamId} (Connect: ${connectAccountId || 'none'})`);

    // STEP 4: Update database records
    if (typeof teamId === "number" || !teamId.toString().startsWith("temp-")) {
      try {
        const numericTeamId =
          typeof teamId === "number" ? teamId : parseInt(teamId.toString());

        // Update team with Setup Intent info
        await db
          .update(teams)
          .set({
            setupIntentId: setupIntent.id,
            paymentStatus: "setup_intent_created",
          })
          .where(eq(teams.id, numericTeamId));

        log(`Updated team ${numericTeamId} with Setup Intent ${setupIntent.id}`);
      } catch (dbError: any) {
        log(`Error updating team database: ${dbError.message}`);
        // Continue - Setup Intent was created successfully
      }
    }

    return {
      setupIntentId: setupIntent.id,
      clientSecret: setupIntent.client_secret!,
      customerId: customerId,
      connectAccountId: connectAccountId,
    };

  } catch (error: any) {
    console.error("Error creating setup intent:", error);
    throw new Error(`Error creating setup intent: ${error.message}`);
  }
}

/**
 * Processes a payment for a team using a saved payment method
 * This is used when an admin approves a team that provided payment information during registration
 */
export async function processPaymentForApprovedTeam(
  teamId: number,
  amount: number,
) {
  const stripe = await getStripeClient();
  if (!stripe) throw new Error('Stripe not configured');

  try {
    log(`Processing payment for approved team: ${teamId}`);

    // Find the team
    const team = await db.query.teams.findFirst({
      where: eq(teams.id, teamId),
    });

    if (!team) {
      throw new Error(`Team with ID ${teamId} not found`);
    }

    if (!team.paymentMethodId) {
      throw new Error(`Team ${teamId} has no saved payment method`);
    }

    // Check if this is a Link payment method first
    const paymentMethod = await stripe.paymentMethods.retrieve(
      team.paymentMethodId,
    );

    // Handle Link payment methods differently - they cannot be attached to customers
    let customerId = team.stripeCustomerId;

    if (paymentMethod.type === "link") {
      log(
        `Processing Link payment method for team: ${teamId} - skipping customer attachment`,
      );
      // For Link payments, we cannot attach to customers and must process differently
      customerId = null;
    } else {
      // For regular payment methods, ensure PM is attached to a platform customer
      const existingPmCustomer = paymentMethod.customer as string | null;

      if (customerId && existingPmCustomer === customerId) {
        // PM already attached to the correct platform customer — nothing to do
        log(`Payment method already attached to correct customer ${customerId}`);
      } else if (existingPmCustomer) {
        // PM is attached to a different customer (likely a Connect-account customer from old flow)
        // Verify if that customer exists on the platform account
        let existingCustomerOnPlatform = false;
        try {
          await stripe.customers.retrieve(existingPmCustomer);
          existingCustomerOnPlatform = true;
        } catch (e: any) {
          if (e.code === 'resource_missing') {
            existingCustomerOnPlatform = false;
          }
        }

        if (existingCustomerOnPlatform) {
          // Customer exists on platform — use it directly
          log(`Payment method attached to platform customer ${existingPmCustomer} — using it`);
          customerId = existingPmCustomer;
          await db
            .update(teams)
            .set({ stripeCustomerId: customerId })
            .where(eq(teams.id, teamId));
        } else {
          // Customer is on Connect account (old flow) — detach PM and re-attach to new platform customer
          log(`Payment method attached to non-platform customer ${existingPmCustomer} — detaching and re-attaching`);
          try {
            await stripe.paymentMethods.detach(team.paymentMethodId);
          } catch (detachError) {
            log(`Failed to detach payment method: ${detachError}`);
          }

          // Create new platform customer
          const customer = await stripe.customers.create({
            name: team.name || `Team ${teamId}`,
            email: team.submitterEmail || `team-${teamId}@example.com`,
            metadata: {
              teamId: teamId.toString(),
              eventId: team.eventId?.toString() || "",
              teamName: team.name || "Unknown Team",
              systemSource: "KickDeck",
              createdFor: "payment_approved",
              migratedFrom: existingPmCustomer,
            },
          });
          customerId = customer.id;

          await db
            .update(teams)
            .set({ stripeCustomerId: customerId })
            .where(eq(teams.id, teamId));

          await stripe.paymentMethods.attach(team.paymentMethodId, {
            customer: customerId,
          });
          log(`Attached payment method to new platform customer ${customerId}`);
        }
      } else {
        // PM not attached to any customer — create platform customer and attach
        if (!customerId) {
          log(`Creating Stripe customer for team: ${teamId} on platform account`);
          const customer = await stripe.customers.create({
            name: team.name || `Team ${teamId}`,
            email: team.submitterEmail || `team-${teamId}@example.com`,
            metadata: {
              teamId: teamId.toString(),
              eventId: team.eventId?.toString() || "",
              teamName: team.name || "Unknown Team",
              systemSource: "KickDeck",
              createdFor: "payment_approved"
            },
          });
          customerId = customer.id;

          await db
            .update(teams)
            .set({ stripeCustomerId: customerId })
            .where(eq(teams.id, teamId));
        }

        await stripe.paymentMethods.attach(team.paymentMethodId, {
          customer: customerId,
        });
        log(`Attached payment method to customer ${customerId}`);
      }
    }

    // STEP: Calculate platform fee (4% + $0.30) on top of the tournament cost
    // teams.totalAmount stores the tournament subtotal (base fee + required fees - coupons) in cents
    const tournamentCost = Math.round(amount); // Already in cents
    const platformFeeAmount = Math.round(tournamentCost * DEFAULT_PLATFORM_FEE_RATE + STRIPE_FIXED_FEE); // 4% + $0.30
    const totalChargeAmount = tournamentCost + platformFeeAmount;

    // STEP: Get Connect account for this team's event (for destination charges)
    let connectAccountId: string | undefined;
    if (team.eventId) {
      try {
        const eventInfo = await db
          .select({ stripeConnectAccountId: events.stripeConnectAccountId, name: events.name })
          .from(events)
          .where(eq(events.id, team.eventId))
          .limit(1);
        connectAccountId = eventInfo[0]?.stripeConnectAccountId || undefined;
      } catch (e) {
        log(`⚠️ Could not look up Connect account for event ${team.eventId}: ${e}`);
      }
    }

    log(
      `💰 APPROVE CHARGE: Tournament cost $${(tournamentCost / 100).toFixed(2)} + platform fee $${(platformFeeAmount / 100).toFixed(2)} = total $${(totalChargeAmount / 100).toFixed(2)} | Connect: ${connectAccountId || "platform only"}`,
    );

    // Create a payment intent with the saved payment method
    const paymentIntentParams: any = {
      amount: totalChargeAmount, // Tournament cost + platform fee (4% + $0.30)
      currency: "usd",
      payment_method: team.paymentMethodId,
      confirm: true, // Immediately attempt to confirm the payment
      off_session: true, // Since the customer is not present
      receipt_email: team.submitterEmail, // Enable Stripe's automatic receipt email
      metadata: {
        teamId: teamId.toString(),
        eventId: team.eventId?.toString() || "",
        teamName: team.name || "Unknown Team",
        description: `Team registration payment for ${team.name}`,
        tournamentAmount: tournamentCost.toString(),
        platformFee: platformFeeAmount.toString(),
        connectAccountId: connectAccountId || "",
      },
      // Route payment to Connect account if available (destination charge)
      // KickDeck keeps the application_fee_amount (platform fee)
      // The tournament organizer receives the rest via their Connect account
      ...(connectAccountId && {
        application_fee_amount: platformFeeAmount,
        transfer_data: {
          destination: connectAccountId,
        },
      }),
    };

    // Only add customer for non-Link payment methods
    if (customerId) {
      paymentIntentParams.customer = customerId;
    }

    log(
      `Creating payment intent for team ${teamId}, amount: $${(totalChargeAmount / 100).toFixed(2)}, payment method type: ${paymentMethod.type}, customer: ${customerId || "none"}, connect: ${connectAccountId || "none"}`,
    );
    const paymentIntent =
      await stripe.paymentIntents.create(paymentIntentParams);

    log(
      `✅ Payment intent ${paymentIntent.id} created with status ${paymentIntent.status} for team ${teamId}`,
    );
    log(
      `DESTINATION CHARGE VERIFY: application_fee_amount=${paymentIntent.application_fee_amount}, transfer_data=${JSON.stringify(paymentIntent.transfer_data)}`,
    );

    // Update the team with the payment intent ID
    // Map Stripe status to app status: "succeeded" → "paid" for UI consistency
    const mappedStatus = paymentIntent.status === 'succeeded' ? 'paid' : paymentIntent.status;
    await db
      .update(teams)
      .set({
        paymentIntentId: paymentIntent.id,
        paymentStatus: mappedStatus,
        paymentDate: new Date(), // Use Date object directly for timestamp fields
      })
      .where(eq(teams.id, teamId));

    // Create a payment transaction record
    await db.insert(paymentTransactions).values({
      status: paymentIntent.status,
      transactionType: "registration_payment",
      amount: totalChargeAmount,
      paymentIntentId: paymentIntent.id,
      setupIntentId: team.setupIntentId,
      eventId: team.eventId,
      teamId: teamId,
      cardBrand: team.cardBrand,
      cardLastFour: team.cardLast4,
    });

    return {
      success: true,
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.status,
      totalCharged: totalChargeAmount,
      tournamentCost: tournamentCost,
      platformFee: platformFeeAmount,
    };
  } catch (error: any) {
    // Handle specific Stripe errors
    console.error("Error processing payment for approved team:", error);

    // Update the team with the error information
    await db
      .update(teams)
      .set({
        paymentStatus: "failed",
        paymentErrorCode: error.code || null,
        paymentErrorMessage: error.message || "Payment processing failed",
      })
      .where(eq(teams.id, teamId));

    throw new Error(`Error processing payment: ${error.message}`);
  }
}

/**
 * Updates a payment intent status (for testing purpose only)
 * This function should ONLY be used in development to simulate status changes
 */
export async function updatePaymentIntentStatus(
  paymentIntentId: string,
  status: string,
) {
  const stripe = await getStripeClient();
  if (!stripe) throw new Error('Stripe not configured');

  // This function is only for development and testing
  if (process.env.NODE_ENV === "production") {
    throw new Error("This function is only available in development mode");
  }

  try {
    // Note: In a real environment, we can't directly modify a payment intent's status.
    // This is just to update our database to simulate a status change
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    // Find the team associated with this payment intent
    const team = await db.query.teams.findFirst({
      where: eq(teams.paymentIntentId, paymentIntentId),
    });

    if (!team) {
      throw new Error(
        `No team found with payment intent ID ${paymentIntentId}`,
      );
    }

    // Update the team payment status
    await db
      .update(teams)
      .set({
        paymentStatus: status,
        paymentDate: new Date(), // Use Date object directly for timestamp fields
      })
      .where(eq(teams.id, team.id));

    return {
      success: true,
      message: `Updated payment intent ${paymentIntentId} status to ${status} in database`,
    };
  } catch (error: any) {
    console.error("Error updating payment intent status:", error);
    throw new Error(`Error updating payment intent status: ${error.message}`);
  }
}

/**
 * Create a test payment method and attach it to a setup intent (testing only)
 * This simulates a customer entering their card details
 */
export async function attachTestPaymentMethodToSetupIntent(
  setupIntentId: string,
) {
  const stripe = await getStripeClient();
  if (!stripe) throw new Error('Stripe not configured');

  if (process.env.NODE_ENV === "production") {
    throw new Error("This function is only available in development mode");
  }

  try {
    log(`Attaching test payment method to setup intent: ${setupIntentId}`);

    // Use a test token instead of raw card data for testing
    // This avoids the direct card API access restriction in Stripe
    const paymentMethod = await stripe.paymentMethods.create({
      type: "card",
      card: {
        token: "tok_visa", // Standard test token for a Visa card
      },
    });

    log(`Created test payment method: ${paymentMethod.id}`);

    // Attach the payment method to the setup intent
    const setupIntent = await stripe.setupIntents.update(setupIntentId, {
      payment_method: paymentMethod.id,
    });

    // Confirm the setup intent to complete it
    const confirmedIntent = await stripe.setupIntents.confirm(setupIntentId, {
      payment_method: paymentMethod.id,
      return_url: "https://example.com/setup-complete", // Dummy URL for testing purposes
    });

    log(
      `Confirmed setup intent: ${confirmedIntent.id} with status: ${confirmedIntent.status}`,
    );

    // Process the successful setup intent
    await handleSetupIntentSuccess(confirmedIntent);

    return {
      success: true,
      setupIntentId: setupIntentId,
      paymentMethodId: paymentMethod.id,
      status: confirmedIntent.status,
    };
  } catch (error: any) {
    console.error(
      "Error attaching test payment method to setup intent:",
      error,
    );
    throw new Error(`Error attaching payment method: ${error.message}`);
  }
}

/**
 * Handle a successful setup intent completion (when payment method is attached)
 */
export async function handleSetupIntentSuccess(
  setupIntent: Stripe.SetupIntent,
) {
  const stripe = await getStripeClient();
  if (!stripe) throw new Error('Stripe not configured');

  try {
    const teamId = setupIntent.metadata.teamId;
    if (!teamId) {
      console.error("No teamId found in setup intent metadata");
      return;
    }

    // Check if this is a temporary team ID (for new registrations)
    if (teamId.toString().startsWith("temp-")) {
      console.log(
        `Setup intent completed for temporary team ID: ${teamId}. This will be handled by the frontend registration flow.`,
      );
      return;
    }

    const paymentMethodId = setupIntent.payment_method as string;
    if (!paymentMethodId) {
      console.error("No payment method attached to setup intent");
      return;
    }

    // Find the team
    const teamIdNumber = parseInt(teamId);
    const existingTeam = await db.query.teams.findFirst({
      where: eq(teams.id, teamIdNumber),
    });

    if (!existingTeam) {
      console.error(`Team with ID ${teamId} not found`);
      return;
    }

    // Get payment method details
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
    const cardDetails = paymentMethod.card;

    // Create a Stripe customer and attach the payment method
    let customerId = existingTeam.stripeCustomerId;

    if (!customerId) {
      // Create customer on PLATFORM account (destination charges require platform customers)
      const customer = await stripe.customers.create({
        name: existingTeam.name || `Team ${teamId}`,
        email: existingTeam.submitterEmail || `team-${teamId}@example.com`,
        metadata: {
          teamId: teamId.toString(),
          eventId: existingTeam.eventId?.toString() || "",
          teamName: existingTeam.name || "Unknown Team",
          systemSource: "KickDeck",
          createdFor: "setup_intent_success"
        },
      });
      customerId = customer.id;

      // Attach the payment method to the customer
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      });

      // Set this payment method as the default
      await stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });
    }

    // Update team with payment method details
    await db
      .update(teams)
      .set({
        paymentMethodId: paymentMethodId,
        paymentStatus: "payment_info_provided",
        cardBrand: cardDetails?.brand || null,
        cardLast4: cardDetails?.last4 || null,
        stripeCustomerId: customerId,
      })
      .where(eq(teams.id, teamIdNumber));

    console.log(`Payment method saved successfully for team ${teamId}`);
    return true;
  } catch (error: any) {
    console.error("Error handling setup intent success:", error);
    throw new Error(`Error handling setup intent success: ${error.message}`);
  }
}

export async function handleRefund(
  charge: Stripe.Charge,
  refund: Stripe.Refund,
) {
  try {
    const paymentIntentId = charge.payment_intent as string;
    if (!paymentIntentId) {
      console.error("No payment intent ID found in charge");
      return;
    }

    // Find the team with this payment intent
    const team = await db.query.teams.findFirst({
      where: eq(teams.paymentIntentId, paymentIntentId),
    });

    if (!team) {
      console.error(`No team found with payment intent ID ${paymentIntentId}`);
      return;
    }

    // Record payment transaction for the refund
    await db.insert(paymentTransactions).values({
      teamId: team.id,
      paymentIntentId: paymentIntentId,
      amount: -refund.amount, // negative amount for refund
      status: "refunded",
      transactionType: "refund",
      cardBrand: team.cardBrand,
      cardLast4: team.cardLast4,
    });

    // Update team payment status
    await db
      .update(teams)
      .set({
        paymentStatus: "refunded",
        refundDate: new Date(), // Use Date object directly for timestamp fields
      })
      .where(eq(teams.id, team.id));

    console.log(`Refund recorded for team ${team.id}`);
    return true;
  } catch (error: any) {
    console.error("Error handling refund:", error);
    throw new Error(`Error handling refund: ${error.message}`);
  }
}

/**
 * Intelligent Payment Recovery System
 * Automatically recovers burned payment methods by creating direct payments
 * without customer association requirements
 */
export async function intelligentPaymentRecovery(
  team: any,
  teamId: number,
): Promise<{
  success: boolean;
  paymentIntentId?: string;
  error?: string;
  amount?: number;
}> {
  const stripe = await getStripeClient();
  if (!stripe) throw new Error('Stripe not configured');

  try {
    log(
      `🔧 INTELLIGENT RECOVERY: Starting recovery for team ${teamId} (${team.name})`,
      "admin",
    );

    // 1. Verify team has Setup Intent with payment method
    if (!team.setupIntentId) {
      return {
        success: false,
        error: "No Setup Intent found for team",
      };
    }

    log(`🔍 RECOVERY: Analyzing Setup Intent ${team.setupIntentId}`, "admin");

    // 2. Retrieve Setup Intent to extract payment method
    const setupIntent = await stripe.setupIntents.retrieve(team.setupIntentId);

    if (!setupIntent.payment_method) {
      return {
        success: false,
        error: "No payment method found in Setup Intent",
      };
    }

    const paymentMethodId = setupIntent.payment_method as string;
    log(`💳 RECOVERY: Found payment method ${paymentMethodId}`, "admin");

    // 3. Get team event and calculate amount
    const [eventData] = await db
      .select()
      .from(events)
      .where(eq(events.id, team.eventId))
      .limit(1);

    if (!eventData) {
      return {
        success: false,
        error: "Event not found for team",
      };
    }

    const totalAmount = team.totalAmount || eventData.registrationFee;
    const platformFeeAmount = Math.round(totalAmount * 0.04 + 30); // 4% + $0.30
    const totalWithFees = totalAmount + platformFeeAmount;

    log(
      `💰 RECOVERY: Amount to charge $${(totalWithFees / 100).toFixed(2)} (tournament: $${(totalAmount / 100).toFixed(2)} + fees: $${(platformFeeAmount / 100).toFixed(2)})`,
      "admin",
    );

    // 4. Create direct payment intent without customer association
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalWithFees,
      currency: "usd",
      payment_method: paymentMethodId,
      confirm: true, // Automatically confirm the payment
      payment_method_types: ["card"],
      description: `${eventData.name} - ${team.name} (Intelligent Recovery)`,
      metadata: {
        teamId: teamId.toString(),
        teamName: team.name,
        eventName: eventData.name,
        recoveryType: "burned_payment_method",
        originalSetupIntent: team.setupIntentId,
        tournamentAmount: totalAmount.toString(),
        platformFee: platformFeeAmount.toString(),
      },
      // Handle Connect account destination if available
      ...(eventData.stripeConnectAccountId && {
        application_fee_amount: platformFeeAmount,
        transfer_data: {
          destination: eventData.stripeConnectAccountId,
        },
      }),
    });

    log(
      `✅ RECOVERY SUCCESS: Payment Intent created ${paymentIntent.id} with status ${paymentIntent.status}`,
      "admin",
    );

    // 5. Record transaction in database
    await db.insert(paymentTransactions).values({
      teamId: teamId,
      paymentIntentId: paymentIntent.id,
      amount: totalWithFees,
      status: paymentIntent.status as any,
      transactionType: "team_approval_recovery",
      platformFee: platformFeeAmount,
      tournamentAmount: totalAmount,
      cardBrand: "recovered", // Mark as recovered payment
      cardLast4: "recovery",
      metadata: JSON.stringify({
        recoveryType: "intelligent_burned_method",
        originalSetupIntent: team.setupIntentId,
        recoveredPaymentMethod: paymentMethodId,
      }),
    });

    // 6. Update team status
    await db
      .update(teams)
      .set({
        status: "approved",
        paymentStatus: "paid",
        paymentIntentId: paymentIntent.id,
        paymentMethodId: paymentMethodId,
        approvedAt: new Date(),
        notes: `Payment recovered via intelligent recovery system from Setup Intent ${team.setupIntentId}`,
      })
      .where(eq(teams.id, teamId));

    log(
      `📊 RECOVERY: Team ${teamId} updated to approved status with payment ${paymentIntent.id}`,
      "admin",
    );

    // 7. Send approval email
    try {
      await sendApprovalEmailWithPaymentDetails(team, paymentIntent, eventData);
      log(`📧 RECOVERY: Approval email sent to team ${teamId}`, "admin");
    } catch (emailError) {
      log(
        `⚠️  RECOVERY: Email failed but payment succeeded for team ${teamId}: ${emailError}`,
        "admin",
      );
    }

    return {
      success: true,
      paymentIntentId: paymentIntent.id,
      amount: totalWithFees,
    };
  } catch (error: any) {
    log(`❌ RECOVERY ERROR for team ${teamId}: ${error.message}`, "admin");

    // Check if this is a different type of payment error
    if (error.message.includes("Your card was declined")) {
      return {
        success: false,
        error:
          "Card declined - customer needs to contact bank or use different payment method",
      };
    }

    if (error.message.includes("insufficient funds")) {
      return {
        success: false,
        error: "Insufficient funds - customer needs to add funds to account",
      };
    }

    return {
      success: false,
      error: `Recovery failed: ${error.message}`,
    };
  }
}

/**
 * Send approval email with payment details after successful recovery
 */
async function sendApprovalEmailWithPaymentDetails(
  team: any,
  paymentIntent: Stripe.PaymentIntent,
  eventData: any,
) {
  const stripe = await getStripeClient();
  if (!stripe) throw new Error('Stripe not configured');

  try {
    // Get payment method details for receipt
    const paymentMethod = await stripe.paymentMethods.retrieve(
      paymentIntent.payment_method as string,
    );

    const emailData = {
      firstName: team.submitterName || team.managerName || "Team Manager",
      teamName: team.name,
      eventName: eventData.name,
      clubName: team.clubName || '',
      managerName: team.managerName || team.submitterName || "Team Manager",
      registrationDate: team.createdAt ? new Date(team.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      submittedDate: team.createdAt ? new Date(team.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      approvalDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      paymentAmount: (paymentIntent.amount / 100).toFixed(2),
      tournamentCost: (
        (paymentIntent.amount - (paymentIntent.application_fee_amount || 0)) /
        100
      ).toFixed(2),
      platformFee: ((paymentIntent.application_fee_amount || 0) / 100).toFixed(
        2,
      ),
      transactionId: paymentIntent.id,
      cardBrand: paymentMethod.card?.brand || "Card",
      cardLast4: paymentMethod.card?.last4 || "****",
      receiptNumber: `REC-${paymentIntent.id.slice(-8).toUpperCase()}`,
      recoveryNote:
        "Payment was automatically recovered using intelligent payment recovery system",
      EVENT_ADMIN_EMAIL: eventData?.adminEmail || 'support@kickdeck.xyz',
    };

    // Send to both submitter and manager
    const emailRecipients = [team.submitterEmail, team.managerEmail].filter(
      Boolean,
    );

    for (const email of emailRecipients) {
      await sendTemplatedEmail(email, "team_approved_with_payment", emailData);
    }

    log(
      `Approval email sent to ${emailRecipients.join(", ")} for recovered payment`,
      "admin",
    );
  } catch (error) {
    log(`Error sending approval email: ${error}`, "admin");
    throw error;
  }
}

/**
 * Process a refund through the tournament's Stripe Connect account
 */
export async function processConnectRefund({
  teamId,
  refundAmount,
  refundReason,
  adminNotes,
  processedByUserId,
  postRefundStatus
}: {
  teamId: number;
  refundAmount: number;
  refundReason: string;
  adminNotes?: string;
  processedByUserId: number;
  postRefundStatus?: string;
}) {
  const stripe = await getStripeClient();
  if (!stripe) throw new Error('Stripe not configured');

  try {
    console.log(`🔄 REFUND: Starting refund process for Team ${teamId}`);

    // Get team and original payment details
    const team = await db
      .select({
        id: teams.id,
        name: teams.name,
        eventId: teams.eventId,
        paymentIntentId: teams.paymentIntentId,
        totalAmount: teams.totalAmount,
        managerEmail: teams.managerEmail,
      })
      .from(teams)
      .where(eq(teams.id, teamId))
      .limit(1);

    if (!team[0]) {
      throw new Error(`Team ${teamId} not found`);
    }

    const teamData = team[0];

    if (!teamData.paymentIntentId) {
      throw new Error(`No payment found for Team ${teamId}`);
    }

    // Get event and Connect account details
    const event = await db
      .select({
        id: events.id,
        name: events.name,
        stripeConnectAccountId: events.stripeConnectAccountId,
      })
      .from(events)
      .where(eq(events.id, teamData.eventId))
      .limit(1);

    if (!event[0] || !event[0].stripeConnectAccountId) {
      throw new Error(`Event Stripe Connect account not configured`);
    }

    const eventData = event[0];

    console.log(`🔄 REFUND: Processing $${refundAmount/100} refund for ${teamData.name}`);

    // Calculate platform fee refund (4% + $0.30)
    const platformFeeRefund = Math.round(refundAmount * 0.04) + 30;

    // Create refund on PLATFORM account with reverse_transfer to pull funds from Connect account
    // Destination charges live on the platform, so refund must be issued here
    // reverse_transfer: true → reverses the transfer, debiting the Connect account
    // refund_application_fee: false → KickDeck keeps its platform fee
    const refund = await stripe.refunds.create({
      payment_intent: teamData.paymentIntentId,
      amount: refundAmount,
      reverse_transfer: true,
      refund_application_fee: false,
      reason: 'requested_by_customer',
      metadata: {
        teamId: teamId.toString(),
        teamName: teamData.name,
        refundReason: refundReason,
        processedByUserId: processedByUserId.toString(),
        connectAccountId: eventData.stripeConnectAccountId,
        refundType: "destination_charge_reversal",
      }
    });

    console.log(`✅ REFUND: Stripe refund created: ${refund.id}`);

    // Record refund in database
    const refundRecord = await db
      .insert(refunds)
      .values({
        teamId: teamId,
        eventId: teamData.eventId,
        originalPaymentIntentId: teamData.paymentIntentId,
        refundId: refund.id,
        refundAmount: refundAmount,
        platformFeeRefund: platformFeeRefund,
        refundReason: refundReason,
        adminNotes: adminNotes,
        status: refund.status === 'succeeded' ? 'completed' : 'pending',
        processedByUserId: processedByUserId,
        stripeConnectAccountId: eventData.stripeConnectAccountId,
        metadata: {
          stripeRefundObject: refund,
          originalAmount: teamData.totalAmount,
        }
      })
      .returning();

    // Update team status
    const teamUpdate: any = {
      paymentStatus: 'refunded',
      refundDate: new Date(),
      notes: adminNotes ? `REFUND: ${refundReason}. ${adminNotes}` : `REFUND: ${refundReason}`
    };
    // Allow caller to specify what team status to set after refund
    if (postRefundStatus) {
      teamUpdate.status = postRefundStatus;
    }
    await db
      .update(teams)
      .set(teamUpdate)
      .where(eq(teams.id, teamId));

    // Create refund transaction record
    await db
      .insert(paymentTransactions)
      .values({
        teamId: teamId,
        eventId: parseInt(teamData.eventId),
        userId: processedByUserId,
        paymentIntentId: teamData.paymentIntentId,
        transactionType: 'refund',
        amount: -refundAmount, // Negative for refund
        status: refund.status,
        platformFeeAmount: -platformFeeRefund, // Platform fee gets refunded
        metadata: {
          refundId: refund.id,
          refundReason: refundReason,
          originalPaymentIntent: teamData.paymentIntentId
        },
        notes: `Refund processed: ${refundReason}`
      });

    console.log(`✅ REFUND: Database records updated for Team ${teamId}`);

    return {
      success: true,
      refundId: refund.id,
      refundAmount: refundAmount,
      platformFeeRefund: platformFeeRefund,
      status: refund.status,
      teamName: teamData.name,
      refundRecord: refundRecord[0]
    };

  } catch (error) {
    console.error('🚨 REFUND ERROR:', error);
    
    // Try to log failed refund attempt if we have team data
    try {
      const failedTeamData = await db
        .select({ eventId: teams.eventId, paymentIntentId: teams.paymentIntentId })
        .from(teams)
        .where(eq(teams.id, teamId))
        .limit(1);

      if (failedTeamData[0]) {
        await db
          .insert(refunds)
          .values({
            teamId: teamId,
            eventId: failedTeamData[0].eventId,
            originalPaymentIntentId: failedTeamData[0].paymentIntentId || `FAILED_${Date.now()}`,
            refundId: `FAILED_${Date.now()}`,
            refundAmount: refundAmount,
            platformFeeRefund: 0,
            refundReason: refundReason,
            adminNotes: `FAILED: ${error.message}`,
            status: 'failed',
            processedByUserId: processedByUserId,
            stripeConnectAccountId: '',
            metadata: { error: error.message }
          });
      }
    } catch (dbError) {
      console.error('Could not log failed refund attempt:', dbError);
    }

    throw error;
  }
}
