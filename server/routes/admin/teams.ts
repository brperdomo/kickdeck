import { Request, Response } from 'express';
import { db } from '@db';
import { teams, events, users, players, eventAgeGroups, paymentTransactions, eventBrackets } from '@db/schema';
import { eq, and, or, like, asc, desc, sql } from 'drizzle-orm';
import { log } from '../../vite';
import { sendTemplatedEmail } from '../../services/emailService';
import { createRefund, createTestPaymentIntent, intelligentPaymentRecovery } from '../../services/stripeService';
import { chargeApprovedTeam } from '../stripe-connect-payments';
// import { parseStripeError, formatErrorForAdmin, type DetailedPaymentError } from '../utils/stripeErrorHandler';
import Stripe from 'stripe';

type TeamStatus = 'registered' | 'approved' | 'rejected' | 'paid' | 'withdrawn' | 'refunded' | 'waitlisted';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

/**
 * Process payment when a team is approved
 */
async function processTeamApprovalPayment(team: any, teamId: string): Promise<string> {
  try {
    log(`Processing approval payment for team ${team.name} (ID: ${teamId}) using Stripe Connect with platform fees`, 'admin');
    
    // Check if team has payment setup
    if (!team.setupIntentId && !team.paymentMethodId) {
      log(`Team ${teamId} has no payment method - cannot process payment`, 'admin');
      return 'no_payment_method';
    }
    
    // Use Stripe Connect platform fee flow
    log(`ADMIN DEBUG: About to call chargeApprovedTeam for team ${teamId}`, 'admin');
    const result = await chargeApprovedTeam(parseInt(teamId, 10));
    log(`ADMIN DEBUG: chargeApprovedTeam returned result: ${JSON.stringify(result)}`, 'admin');
    
    log(`Stripe Connect payment result for team ${teamId}: ${JSON.stringify(result)}`, 'admin');
    
    if (result.success) {
      log(`Payment successful for team ${teamId} with platform fees applied`, 'admin');
      return 'payment_successful';
    } else {
      log(`Payment failed for team ${teamId}: ${result.error}`, 'admin');
      return 'payment_failed';
    }
    
  } catch (error) {
    log(`Payment processing error for team ${teamId}: ${error}`, 'admin');
    log(`ERROR STACK TRACE: ${error instanceof Error ? error.stack : 'No stack trace available'}`, 'admin');
    
    // Check if this is a Connect account issue
    if (error instanceof Error && error.message.includes('Connect account')) {
      log(`Connect account issue for team ${teamId} - falling back to basic payment`, 'admin');
      return await processTeamApprovalPaymentFallback(team, teamId);
    }
    
    // Check if this is a Link payment method issue
    if (error instanceof Error && error.message.includes('The provided PaymentMethod cannot be attached')) {
      log(`ADMIN MAIN: Link payment method issue for team ${teamId} - falling back to basic payment`, 'admin');
      return await processTeamApprovalPaymentFallback(team, teamId);
    }
    
    // Check if this is a burned payment method issue
    if (error instanceof Error && error.message.includes('was previously used and cannot be reused')) {
      log(`ADMIN MAIN: Burned payment method detected for team ${teamId} - attempting intelligent recovery`, 'admin');
      
      try {
        // Attempt intelligent payment recovery
        const recoveryResult = await intelligentPaymentRecovery(team, parseInt(teamId, 10));
        
        if (recoveryResult.success) {
          log(`✅ INTELLIGENT RECOVERY SUCCESS for team ${teamId}: ${recoveryResult.paymentIntentId}`, 'admin');
          return 'payment_successful';
        } else {
          log(`❌ INTELLIGENT RECOVERY FAILED for team ${teamId}: ${recoveryResult.error}`, 'admin');
          
          // Fall back to marking as invalid only if recovery fails
          await db.update(teams)
            .set({
              paymentStatus: 'payment_method_invalid',
              paymentMethodId: null,
              notes: `Payment method recovery failed: ${recoveryResult.error}. Team needs to provide new payment method.`
            })
            .where(eq(teams.id, parseInt(teamId, 10)));
          
          return 'burned_payment_method';
        }
      } catch (recoveryError) {
        log(`❌ RECOVERY SYSTEM ERROR for team ${teamId}: ${recoveryError}`, 'admin');
        
        // Fall back to original behavior if recovery system fails
        await db.update(teams)
          .set({
            paymentStatus: 'payment_method_invalid',
            paymentMethodId: null,
            notes: `Payment method was previously used without customer and cannot be reused. Team needs to provide new payment method.`
          })
          .where(eq(teams.id, parseInt(teamId, 10)));
        
        return 'burned_payment_method';
      }
    }
    
    // Parse detailed Stripe error information for admin context
    let detailedErrorContext = 'Unknown error';
    if (error && typeof error === 'object' && 'detailedContext' in error) {
      const context = (error as any).detailedContext;
      detailedErrorContext = `${context.summary} | Action: ${context.action_required} | Solution: ${context.suggested_solution}`;
    } else {
      detailedErrorContext = error instanceof Error ? error.message : 'Unknown error';
    }
    
    // Update team to indicate payment issue with detailed context
    await db.update(teams)
      .set({
        paymentStatus: 'payment_failed',
        notes: `Payment processing failed: ${detailedErrorContext}`
      })
      .where(eq(teams.id, parseInt(teamId, 10)));
    
    return 'payment_error';
  }
}

/**
 * Fallback payment processing for events without proper Stripe Connect setup
 */
async function processTeamApprovalPaymentFallback(team: any, teamId: string): Promise<string> {
  try {
    log(`Processing fallback payment for team ${team.name} (ID: ${teamId}) - NO PLATFORM FEES`, 'admin');
    
    // If team has a customer ID but incomplete Setup Intent, create a new payment method
    if (team.stripeCustomerId && (!team.setupIntentId || !team.paymentMethodId)) {
      log(`Team ${teamId} has customer ${team.stripeCustomerId} but incomplete payment setup - creating fallback payment method`, 'admin');
      
      // Since we can't create payment methods server-side, mark team as needing payment completion
      // This is actually the correct behavior - teams should complete their payment setup
      log(`Team ${teamId} requires payment method completion - will generate completion URL`, 'admin');
      
      // Update team to indicate payment completion needed
      await db.update(teams)
        .set({
          paymentStatus: 'payment_required',
          notes: `Team approved but requires payment method completion. Customer: ${team.stripeCustomerId}. Generate payment completion URL for team.`
        })
        .where(eq(teams.id, parseInt(teamId, 10)));
      
      return 'payment_completion_required';
    }
    
    // Original Setup Intent logic for teams with completed Setup Intents
    if (!team.setupIntentId) {
      log(`Team ${teamId} has no setup intent or customer - cannot process payment`, 'admin');
      return 'no_payment_method';
    }
    
    // Get setup intent from Stripe
    const setupIntent = await stripe.setupIntents.retrieve(team.setupIntentId);
    
    if (setupIntent.status !== 'succeeded' || !setupIntent.payment_method) {
      log(`Setup intent ${team.setupIntentId} not completed - status: ${setupIntent.status}, payment_method: ${setupIntent.payment_method}`, 'admin');
      
      // If team has a customer, try fallback payment creation
      if (team.stripeCustomerId) {
        log(`Team ${teamId} has customer but incomplete Setup Intent - attempting fallback payment creation`, 'admin');
        return await processTeamApprovalPaymentFallback(team, teamId);
      }
      
      // Update team to indicate payment issue
      await db.update(teams)
        .set({
          paymentStatus: 'payment_required',
          notes: `Payment method incomplete. Setup Intent status: ${setupIntent.status}. Contact team to complete payment setup.`
        })
        .where(eq(teams.id, parseInt(teamId, 10)));
      
      log(`Team ${teamId} marked as requiring payment completion due to incomplete Setup Intent`, 'admin');
      
      return 'payment_method_incomplete';
    }
    
    // Use proper Stripe Connect platform fee structure for fallback payments
    const paymentMethod = await stripe.paymentMethods.retrieve(setupIntent.payment_method as string);
    
    // Handle Link payment method customer attachment before processing
    if (paymentMethod.type === 'link') {
      log(`Fallback payment: Detected Link payment method ${setupIntent.payment_method}`, 'admin');
      
      // Check if the Link payment method is attached to a customer
      const currentPaymentMethod = await stripe.paymentMethods.retrieve(setupIntent.payment_method as string);
      
      if (!currentPaymentMethod.customer) {
        log(`Link payment method ${setupIntent.payment_method} is detached and cannot be reused`, 'admin');
        log(`ERROR: Detached Link payment methods cannot be reattached due to Stripe limitations`, 'admin');
        
        // Update team status to indicate payment method needs to be replaced
        await db.update(teams)
          .set({
            paymentStatus: 'payment_required',
            notes: `Link payment method is detached and cannot be reused. Team needs to provide a new payment method. Contact team to complete payment setup with a new card.`
          })
          .where(eq(teams.id, parseInt(teamId, 10)));
        
        log(`Team ${teamId} requires new payment method due to detached Link payment`, 'admin');
        return 'detached_link_payment_unusable';
      }
      
      log(`Link payment method is properly attached to customer ${currentPaymentMethod.customer}`, 'admin');
      
      // Ensure team database has the correct customer ID
      if (team.stripeCustomerId !== currentPaymentMethod.customer) {
        await db.update(teams)
          .set({ stripeCustomerId: currentPaymentMethod.customer })
          .where(eq(teams.id, parseInt(teamId, 10)));
        log(`Updated team ${teamId} customer ID to ${currentPaymentMethod.customer}`, 'admin');
      }
    }
    
    // Import the Stripe Connect payment processing function
    const { processDestinationCharge } = await import('../stripe-connect-payments.js');
    
    // Get event information for Connect account
    const [eventInfo] = await db
      .select({
        stripeConnectAccountId: events.stripeConnectAccountId,
        connectAccountStatus: events.connectAccountStatus,
        connectChargesEnabled: events.connectChargesEnabled
      })
      .from(events)
      .where(eq(events.id, team.eventId));
    
    if (!eventInfo || !eventInfo.stripeConnectAccountId || 
        eventInfo.connectAccountStatus !== 'active' || 
        !eventInfo.connectChargesEnabled) {
      log(`Event ${team.eventId} does not have proper Connect account - using basic payment`, 'admin');
      
      // Fallback to basic payment if Connect account not available
      const basicPaymentIntent = await stripe.paymentIntents.create({
        amount: team.totalAmount,
        currency: 'usd',
        payment_method: setupIntent.payment_method,
        customer: setupIntent.customer || undefined,
        confirm: true,
        off_session: true,
        metadata: {
          teamId: teamId,
          teamName: team.name,
          eventType: 'team_approval_payment_fallback_basic'
        }
      });
      
      if (basicPaymentIntent.status === 'succeeded') {
        await db.update(teams)
          .set({
            paymentIntentId: basicPaymentIntent.id,
            paymentStatus: 'paid',
            paymentMethodId: setupIntent.payment_method
          })
          .where(eq(teams.id, parseInt(teamId, 10)));
        
        log(`Basic fallback payment successful for team ${teamId}: ${basicPaymentIntent.id} (NO PLATFORM FEES)`, 'admin');
        return 'payment_successful';
      }
      
      log(`Basic fallback payment failed for team ${teamId}: ${basicPaymentIntent.status}`, 'admin');
      return 'payment_failed';
    }
    
    // Use proper Stripe Connect processing with platform fees
    log(`Processing fallback payment with Stripe Connect platform fees for team ${teamId}`, 'admin');
    
    // Determine the correct customer ID - if Link payment, use the one we created/attached
    let customerIdForPayment = setupIntent.customer as string;
    if (paymentMethod.type === 'link') {
      // For Link payments, get the current customer ID from the team record
      const [updatedTeam] = await db
        .select({ stripeCustomerId: teams.stripeCustomerId })
        .from(teams)
        .where(eq(teams.id, parseInt(teamId, 10)));
      
      if (updatedTeam?.stripeCustomerId) {
        customerIdForPayment = updatedTeam.stripeCustomerId;
        log(`Using Link payment customer ID: ${customerIdForPayment}`, 'admin');
      }
    }
    
    log(`FALLBACK DEBUG: About to call processDestinationCharge with:`, 'admin');
    log(`  - teamId: ${teamId}`, 'admin');
    log(`  - eventId: ${team.eventId}`, 'admin');
    log(`  - paymentMethodId: ${setupIntent.payment_method}`, 'admin');
    log(`  - amount: ${team.totalAmount}`, 'admin');
    log(`  - paymentMethod.type: ${paymentMethod.type}`, 'admin');
    log(`  - destinationAccountId: ${eventInfo.stripeConnectAccountId}`, 'admin');
    
    // Calculate the total amount including platform fees
    const { calculateEventFees } = await import('../services/fee-calculator.js');
    const feeCalculation = await calculateEventFees(team.eventId, team.totalAmount);
    
    log(`FALLBACK Fee calculation:`, 'admin');
    log(`  - tournament cost: $${(team.totalAmount / 100).toFixed(2)}`, 'admin');
    log(`  - total to charge: $${(feeCalculation.totalChargedAmount / 100).toFixed(2)}`, 'admin');
    log(`  - platform fee: $${(feeCalculation.platformFeeAmount / 100).toFixed(2)}`, 'admin');
    
    const paymentResult = await processDestinationCharge(
      teamId,
      team.eventId,
      setupIntent.payment_method as string,
      feeCalculation.totalChargedAmount, // Use total amount including platform fees
      eventInfo.stripeConnectAccountId,
      true // Mark as pre-calculated to avoid double fee calculation
    );
    
    if (paymentResult.success) {
      // Update team with payment details
      await db.update(teams)
        .set({
          paymentIntentId: paymentResult.paymentIntent.id,
          paymentStatus: 'paid',
          paymentMethodId: setupIntent.payment_method
        })
        .where(eq(teams.id, parseInt(teamId, 10)));
      
      log(`Fallback Connect payment successful for team ${teamId}: ${paymentResult.paymentIntent.id} with platform fees`, 'admin');
      return 'payment_successful';
    }
    
    log(`Fallback Connect payment failed for team ${teamId}: ${paymentResult.error || 'Unknown error'}`, 'admin');
    return 'payment_failed';
    
  } catch (error) {
    log(`Fallback payment processing error for team ${teamId}: ${error}`, 'admin');
    
    // Parse detailed Stripe error information for admin context
    let detailedErrorContext = 'Unknown error';
    if (error && typeof error === 'object' && 'detailedContext' in error) {
      const context = (error as any).detailedContext;
      detailedErrorContext = `${context.summary} | Action: ${context.action_required} | Solution: ${context.suggested_solution}`;
    } else {
      detailedErrorContext = error instanceof Error ? error.message : 'Unknown error';
    }
    
    // Update team to indicate payment issue with detailed context
    await db.update(teams)
      .set({
        paymentStatus: 'payment_failed',
        notes: `Fallback payment processing failed: ${detailedErrorContext}`
      })
      .where(eq(teams.id, parseInt(teamId, 10)));
    
    return 'payment_error';
  }
}

/**
 * Get all team registrations with filtering options
 */
export async function getTeams(req: Request, res: Response) {
  try {
    const { eventId, status, search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    // Build query conditions
    let query = db.select({
      team: {
        id: teams.id,
        eventId: teams.eventId,
        ageGroupId: teams.ageGroupId,
        groupId: teams.groupId,
        bracketId: teams.bracketId,
        clubId: teams.clubId,
        clubName: teams.clubName,
        name: teams.name,
        coach: teams.coach,
        managerName: teams.managerName,
        managerPhone: teams.managerPhone,
        managerEmail: teams.managerEmail,
        submitterName: teams.submitterName,
        submitterEmail: teams.submitterEmail,
        seedRanking: teams.seedRanking,
        createdAt: teams.createdAt,
        status: teams.status,
        registrationFee: teams.registrationFee,
        selectedFeeIds: teams.selectedFeeIds,
        totalAmount: teams.totalAmount,
        paymentStatus: teams.paymentStatus,
        paymentDate: teams.paymentDate,
        paymentIntentId: teams.paymentIntentId,
        setupIntentId: teams.setupIntentId,
        paymentMethodId: teams.paymentMethodId,
        cardBrand: teams.cardBrand,
        cardLast4: teams.cardLast4,
        paymentMethodType: teams.paymentMethodType,
        paymentErrorCode: teams.paymentErrorCode,
        paymentErrorMessage: teams.paymentErrorMessage,
        refundDate: teams.refundDate,
        stripeCustomerId: teams.stripeCustomerId,
        termsAcknowledged: teams.termsAcknowledged,
        termsAcknowledgedAt: teams.termsAcknowledgedAt,
        termsAcknowledgementRecord: teams.termsAcknowledgementRecord,
        addRosterLater: teams.addRosterLater,
        rosterUploadedAt: teams.rosterUploadedAt,
        rosterUploadMethod: teams.rosterUploadMethod,
        initialRosterComplete: teams.initialRosterComplete,
        appliedCoupon: teams.appliedCoupon,
        notes: teams.notes,
        approvedAt: teams.approvedAt,
        approvedByUserId: teams.approvedByUserId
      },
      event: {
        id: events.id,
        name: events.name
      },
      ageGroup: {
        id: eventAgeGroups.id,
        ageGroup: eventAgeGroups.ageGroup,
        gender: eventAgeGroups.gender,
        fieldSize: eventAgeGroups.fieldSize
      },
      user: {
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName
      },
      bracket: {
        id: eventBrackets.id,
        name: eventBrackets.name,
        description: eventBrackets.description
      }
    })
    .from(teams)
    .leftJoin(events, eq(teams.eventId, events.id))
    .leftJoin(eventAgeGroups, eq(teams.ageGroupId, eventAgeGroups.id))
    .leftJoin(users, eq(teams.managerEmail, users.email))
    .leftJoin(eventBrackets, eq(teams.bracketId, eventBrackets.id));
    
    // Add filters and sorting
    let whereConditions = [];
    if (eventId) {
      whereConditions.push(eq(teams.eventId, eventId as string));
    }
    if (status) {
      whereConditions.push(eq(teams.status, status as string));
    }
    if (search) {
      const searchTerm = `%${search}%`;
      whereConditions.push(
        or(
          like(teams.name, searchTerm as string),
          like(teams.managerEmail, searchTerm as string),
          like(teams.submitterEmail, searchTerm as string)
        )
      );
    }
    
    if (whereConditions.length > 0) {
      query = query.where(whereConditions.length === 1 ? whereConditions[0] : and(...whereConditions));
    }
    
    // Add sorting
    if (sortBy === 'createdAt') {
      query = query.orderBy(sortOrder === 'asc' ? asc(teams.createdAt) : desc(teams.createdAt));
    } else if (sortBy === 'name') {
      query = query.orderBy(sortOrder === 'asc' ? asc(teams.name) : desc(teams.name));
    } else if (sortBy === 'approvedAt') {
      query = query.orderBy(sortOrder === 'asc' ? asc(teams.approvedAt) : desc(teams.approvedAt));
    } else if (status === 'approved') {
      query = query.orderBy(desc(teams.approvedAt));
    }
    
    const result = await query;
    
    // For each team, fetch player count
    const teamsWithPlayerCounts = await Promise.all(
      result.map(async ({ team, event, ageGroup, user, bracket }) => {
        // Count players for this team
        const playerCountResult = await db
          .select({ count: sql<number>`count(*)`.mapWith(Number) })
          .from(players)
          .where(eq(players.teamId, team.id));
        
        const playerCount = playerCountResult[0]?.count || 0;
        
        return {
          team: {
            ...team,
            playerCount: playerCount,
            // Keep amounts in cents - frontend will handle formatting
            totalAmount: team.totalAmount,
            registrationFee: team.registrationFee
          },
          event,
          ageGroup,
          user,
          bracket
        };
      })
    );
    
    res.json(teamsWithPlayerCounts);
  } catch (error) {
    log(`Error getting teams: ${error}`, 'admin');
    res.status(500).json({ error: 'Failed to retrieve teams' });
  }
}

/**
 * Get a specific team by ID
 */
export async function getTeamById(req: Request, res: Response) {
  try {
    const { teamId } = req.params;
    
    const result = await db.select({
      team: teams,
      event: {
        id: events.id,
        name: events.name
      },
      bracket: {
        id: eventBrackets.id,
        name: eventBrackets.name,
        description: eventBrackets.description
      },
      user: {
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName
      }
    })
    .from(teams)
    .leftJoin(events, eq(teams.eventId, events.id))
    .leftJoin(users, eq(teams.managerEmail, users.email))
    .leftJoin(eventBrackets, eq(teams.bracketId, eventBrackets.id))
    .where(eq(teams.id, parseInt(teamId)));
    
    if (result.length === 0) {
      return res.status(404).json({ error: 'Team not found' });
    }
    
    res.json(result[0]);
  } catch (error) {
    log(`Error getting team details: ${error}`, 'admin');
    res.status(500).json({ error: 'Failed to retrieve team details' });
  }
}

/**
 * Update a team's status (approve/reject/withdraw)
 */
async function updateTeamStatus(req: Request, res: Response) {
  // Ensure we're always sending a JSON response, no matter what happens
  res.setHeader('Content-Type', 'application/json');
  
  // Wrap everything in a try-catch to ensure we never return HTML
  try {
    // Extract request parameters first to avoid undefined errors
    const teamId = req.params?.teamId;
    const status = req.body?.status;
    const notes = req.body?.notes;
    const skipPayment = req.body?.skipPayment;
    const skipEmail = req.body?.skipEmail;
    
    if (!teamId || !status) {
      return res.status(400).json({ 
        status: 'error',
        error: 'Missing required parameters',
        details: !teamId ? 'Team ID is required' : 'Status is required'
      });
    }
    
    log(`Processing team status update. TeamID: ${teamId}, Status: ${status}, Notes: ${notes ? 'provided' : 'none'}, Skip Email: ${skipEmail || false}`, 'admin');
    
    const validStatuses: TeamStatus[] = ['registered', 'approved', 'rejected', 'paid', 'withdrawn', 'refunded', 'waitlisted'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        status: 'error',
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
      });
    }
    
    // Get current team details before updating
    let currentTeam;
    try {
      const teamResult = await db
        .select()
        .from(teams)
        .where(eq(teams.id, parseInt(teamId, 10)));
      
      if (teamResult && teamResult.length > 0) {
        currentTeam = teamResult[0];
      }
    } catch (dbError) {
      log(`Database error fetching team: ${dbError}`, 'admin');
      return res.status(500).json({ 
        status: 'error',
        error: 'Database error fetching team',
        message: 'Failed to retrieve team details'
      });
    }
    
    if (!currentTeam) {
      return res.status(404).json({ 
        status: 'error',
        error: 'Team not found' 
      });
    }
    
    // Don't allow updating if already in the same status
    if (currentTeam.status === status) {
      return res.status(400).json({ 
        status: 'error',
        error: `Team is already ${status}` 
      });
    }
    
    log(`Team found. Current status: ${currentTeam.status}, Updating to: ${status}`, 'admin');
    
    // Update the team status with error handling
    let updatedTeam;
    try {
      const now = new Date().toISOString();
      
      // Prepare update data with conditional approver tracking
      const updateData: any = {
        status, 
        notes: notes || null, // Using notes instead of adminNotes to match schema
        // Use the drizzle update pattern correctly to avoid TypeScript errors
        updatedAt: sql`${now}`
      };
      
      // If team is being approved, record who approved it and when
      if (status === 'approved') {
        updateData.approvedByUserId = req.user?.id || null;
        updateData.approvedAt = sql`${now}`;
      }
      
      const updateResult = await db.update(teams)
        .set(updateData)
        .where(eq(teams.id, parseInt(teamId, 10)))
        .returning();
      
      if (updateResult && updateResult.length > 0) {
        updatedTeam = updateResult[0];
      } else {
        throw new Error('No rows updated');
      }
    } catch (updateError) {
      log(`Database error updating team status: ${updateError}`, 'admin');
      return res.status(500).json({ 
        status: 'error',
        error: 'Database error updating team status',
        message: 'Failed to update team status in database'
      });
    }
    
    log(`Team status updated successfully to ${status}`, 'admin');
    
    // Process payment if team is being approved
    let paymentStatus = 'not_applicable';
    if (status === 'approved' && currentTeam.totalAmount && currentTeam.totalAmount > 0) {
      // Check if payment should be skipped (for teams already marked as PAID)
      if (skipPayment) {
        log(`Team ${teamId} approval without payment processing (skipPayment=true). Team payment status: ${currentTeam.paymentStatus}`, 'admin');
        paymentStatus = 'skipped_already_paid';
      }
      // Check if team has already been charged to prevent duplicate payments
      else if (currentTeam.paymentStatus === 'paid' && currentTeam.paymentIntentId) {
        log(`WARNING: Team ${teamId} already has payment status 'paid' with PaymentIntent ${currentTeam.paymentIntentId}. Skipping payment processing.`, 'admin');
        paymentStatus = 'already_paid';
      } else if (currentTeam.status === 'approved' && currentTeam.paymentIntentId) {
        log(`WARNING: Team ${teamId} was already approved with PaymentIntent ${currentTeam.paymentIntentId}. This may be a duplicate approval attempt.`, 'admin');
        paymentStatus = 'already_charged';
      } else {
        try {
          paymentStatus = await processTeamApprovalPayment(currentTeam, teamId);
          log(`Payment processing result for team ${teamId}: ${paymentStatus}`, 'admin');
        } catch (paymentError) {
          log(`Payment processing error for team ${teamId}: ${paymentError}`, 'admin');
          paymentStatus = 'payment_error';
          
          // Log the failed payment attempt to payment_transactions table
          try {
            await db.insert(paymentTransactions).values({
              teamId: parseInt(teamId, 10),
              transactionType: 'payment',
              amount: currentTeam.totalAmount,
              status: 'failed',
              errorMessage: paymentError instanceof Error ? paymentError.message : 'Unknown payment error',
              createdAt: new Date()
            });
            log(`Logged failed payment attempt for team ${teamId} to payment_transactions table`, 'admin');
          } catch (logError) {
            log(`Failed to log payment transaction for team ${teamId}: ${logError}`, 'admin');
          }
          
          // Revert the team status back to its previous state if payment failed
          await db.update(teams)
            .set({ 
              status: currentTeam.status,
              notes: `Approval attempted but payment processing failed: ${paymentError instanceof Error ? paymentError.message : 'Unknown payment error'}. ${notes ? 'Admin notes: ' + notes : ''}`
            })
            .where(eq(teams.id, parseInt(teamId, 10)));
          
          // Use enhanced Stripe error handling for detailed context
          let specificError = 'Payment processing failed';
          let actionRequired = 'Please check team payment details.';
          
          // Check if we have detailed Stripe error context from our enhanced error handler
          if (paymentError && typeof paymentError === 'object' && 'detailedContext' in paymentError) {
            const context = (paymentError as any).detailedContext;
            specificError = context.summary;
            actionRequired = context.suggested_solution;
          } else if (paymentError instanceof Error) {
            const errorMessage = paymentError.message;
            
            if (errorMessage.includes('was previously used and cannot be reused')) {
              // Try intelligent recovery using correct customer from Setup Intent
              log(`Attempting intelligent payment method recovery for team ${teamId}`, 'admin');
              
              try {
                if (currentTeam.setupIntentId) {
                  const setupIntent = await stripe.setupIntents.retrieve(currentTeam.setupIntentId);
                  const correctCustomerId = setupIntent.customer as string;
                  
                  if (correctCustomerId) {
                    log(`Found correct customer ${correctCustomerId} from Setup Intent`, 'admin');
                    
                    // Verify customer exists and has usable payment methods
                    const customer = await stripe.customers.retrieve(correctCustomerId);
                    const paymentMethods = await stripe.paymentMethods.list({
                      customer: correctCustomerId,
                      type: 'card'
                    });
                    
                    // Check if we can use the original burned payment method directly
                    const originalPaymentMethod = setupIntent.payment_method;
                    if (originalPaymentMethod) {
                      log(`Attempting direct payment with burned payment method ${originalPaymentMethod}`, 'admin');
                      
                      // Try to charge the payment method directly without customer association
                      const { calculateEventFees } = await import('../services/fee-calculator.js');
                      const feeCalculation = await calculateEventFees(currentTeam.eventId, currentTeam.totalAmount);
                      
                      // Get event Connect account info
                      const [eventInfo] = await db
                        .select({
                          stripeConnectAccountId: events.stripeConnectAccountId,
                          connectAccountStatus: events.connectAccountStatus,
                          connectChargesEnabled: events.connectChargesEnabled
                        })
                        .from(events)
                        .where(eq(events.id, currentTeam.eventId));
                      
                      if (eventInfo?.stripeConnectAccountId && 
                          eventInfo.connectAccountStatus === 'active' && 
                          eventInfo.connectChargesEnabled) {
                        
                        // Create payment intent with burned payment method (no customer)
                        const directPaymentIntent = await stripe.paymentIntents.create({
                          amount: feeCalculation.totalChargedAmount,
                          currency: 'usd',
                          payment_method: originalPaymentMethod,
                          confirm: true,
                          off_session: true,
                          application_fee_amount: feeCalculation.platformFeeAmount,
                          transfer_data: {
                            destination: eventInfo.stripeConnectAccountId,
                          },
                          metadata: {
                            teamId: teamId,
                            teamName: currentTeam.name,
                            eventType: 'burned_payment_method_recovery',
                            originalSetupIntent: setupIntent.id,
                            recoveryMethod: 'direct_payment_without_customer'
                          }
                        });
                        
                        if (directPaymentIntent.status === 'succeeded') {
                          log(`✅ Direct payment successful for burned payment method: ${directPaymentIntent.id}`, 'admin');
                          
                          // Update team with payment success
                          await db.update(teams)
                            .set({
                              paymentIntentId: directPaymentIntent.id,
                              paymentStatus: 'paid',
                              paymentMethodId: originalPaymentMethod,
                              stripeCustomerId: correctCustomerId
                            })
                            .where(eq(teams.id, parseInt(teamId, 10)));
                          
                          // Record the successful payment transaction
                          await db.insert(paymentTransactions).values({
                            teamId: parseInt(teamId, 10),
                            eventId: parseInt(currentTeam.eventId.toString()),
                            paymentIntentId: directPaymentIntent.id,
                            transactionType: 'payment',
                            amount: feeCalculation.totalChargedAmount,
                            platformFeeAmount: feeCalculation.platformFeeAmount,
                            status: 'succeeded',
                            createdAt: new Date()
                          });
                          
                          log(`✅ Payment recovery successful for team ${teamId} - charged $${(feeCalculation.totalChargedAmount / 100).toFixed(2)}`, 'admin');
                          paymentStatus = 'payment_successful';
                        } else {
                          throw new Error(`Direct payment failed with status: ${directPaymentIntent.status}`);
                        }
                      } else {
                        throw new Error('Event does not have proper Connect account for payment processing');
                      }
                    } else {
                      throw new Error('No payment method found in Setup Intent for recovery');
                    }
                  } else {
                    throw new Error('No customer found in Setup Intent');
                  }
                } else {
                  throw new Error('No Setup Intent available for recovery');
                }
              } catch (recoveryError) {
                log(`Payment method recovery failed for team ${teamId}: ${recoveryError}`, 'admin');
                specificError = 'Payment method unusable (burned)';
                actionRequired = 'Team must provide new payment method through registration';
              }
            } else if (errorMessage.includes('No such customer')) {
              specificError = 'Customer record missing from Stripe';
              actionRequired = 'Team needs to resubmit payment information';
            } else if (errorMessage.includes('payment_method_id IS NOT NULL') || errorMessage.includes('Missing payment method')) {
              specificError = 'No payment method on file';
              actionRequired = 'Team needs to complete payment setup';
            } else if (errorMessage.includes('No such setup_intent')) {
              specificError = 'Setup Intent expired or missing';
              actionRequired = 'Team needs to resubmit payment information';
            } else {
              specificError = errorMessage;
              actionRequired = 'Contact support for payment assistance';
            }
          }
          
          // Only return error if payment was not successfully recovered
          if (paymentStatus !== 'payment_successful') {
            return res.status(400).json({
              status: 'error',
              error: specificError,
              message: `${specificError}. ${actionRequired}`,
              actionRequired: actionRequired,
              paymentStatus: paymentStatus,
              teamStatus: currentTeam.status
            });
          }
        }
      }
      
      // Handle duplicate payment prevention
      if (paymentStatus === 'already_paid') {
        log(`Team ${teamId} approved successfully - payment was already processed`, 'admin');
        return res.json({
          status: 'success',
          message: 'Team approved successfully. Payment was already processed.',
          paymentStatus: 'already_paid',
          warning: 'This team was already charged in a previous approval.'
        });
      }
      
      if (paymentStatus === 'already_charged') {
        log(`Team ${teamId} approval blocked - team was already approved and charged`, 'admin');
        return res.status(400).json({
          status: 'error',
          error: 'Duplicate approval attempt',
          message: 'This team was already approved and charged. To avoid duplicate charges, the approval has been blocked.',
          paymentStatus: 'already_charged',
          suggestion: 'If you need to move to approved status without charging, use "Move to Approved Without Charging" option.'
        });
      }
      
      // If payment failed or requires action, don't approve the team yet
      if (paymentStatus === 'payment_failed' || paymentStatus === 'payment_required' || paymentStatus === 'no_payment_method' || paymentStatus === 'payment_method_incomplete' || paymentStatus === 'payment_error' || paymentStatus === 'payment_completion_required' || paymentStatus === 'burned_payment_method') {
        log(`Cannot approve team ${teamId} due to payment issue: ${paymentStatus}`, 'admin');
        
        // Revert the team status back to its previous state
        await db.update(teams)
          .set({ 
            status: currentTeam.status,
            notes: `Approval attempted but payment failed (${paymentStatus}). ${notes ? 'Admin notes: ' + notes : 'Please ensure team has completed payment setup before approving.'}`
          })
          .where(eq(teams.id, parseInt(teamId, 10)));
        
        return res.status(400).json({
          status: 'error',
          error: 'Payment processing failed',
          message: paymentStatus === 'no_payment_method' 
            ? 'Team has not completed payment setup. Use "Generate Payment Completion URL" to allow them to complete payment first.'
            : paymentStatus === 'payment_required'
              ? 'Team requires manual payment completion. Use "Generate Payment Completion URL" to allow them to finish payment setup.'
              : paymentStatus === 'payment_method_incomplete'
                ? 'Team has incomplete payment method setup. Use "Generate Payment Completion URL" to allow them to complete payment setup.'
                : paymentStatus === 'payment_completion_required'
                  ? 'Team approved but requires payment method completion. Use "Generate Payment Completion URL" to allow them to complete payment setup.'
                  : paymentStatus === 'burned_payment_method'
                    ? 'Team\'s payment method was previously used and cannot be reused. Use "Generate Payment Completion URL" to allow them to provide a new payment method.'
                    : 'Payment processing failed. Please check team payment details.',
          paymentStatus: paymentStatus,
          teamStatus: currentTeam.status
        });
      }
    }
    
    // Handle email notifications in a separate try/catch to prevent errors from affecting the response
    let emailStatus = 'not_sent';
    let emailRecipients: string[] = [];
    
    // Check if email should be skipped
    if (skipEmail) {
      log(`Email notification skipped for team ${teamId} (skipEmail=true)`, 'admin');
      emailStatus = 'skipped';
    } else {
      // Wrap the entire email process in a try-catch to isolate it completely
      try {
      // Get event details for email
      let event = null;
      try {
        // Fix TypeScript error by using string comparison instead of direct column comparison
        const eventId = currentTeam.eventId;
        if (eventId) {
          const eventResult = await db
            .select()
            .from(events)
            .where(eq(events.id, parseInt(eventId.toString(), 10)));
            
          if (eventResult && eventResult.length > 0) {
            event = eventResult[0];
          }
        }
      } catch (eventError) {
        log(`Error fetching event for email notification: ${eventError}`, 'admin');
        // Continue anyway - we'll use fallback values
      }
      
      // Send to both the submitter and the manager if they're different
      if (currentTeam.submitterEmail) {
        emailRecipients = [currentTeam.submitterEmail];
      }
      
      // If manager email is different from submitter, add them too
      if (currentTeam.managerEmail && currentTeam.submitterEmail && 
          currentTeam.managerEmail !== currentTeam.submitterEmail) {
        emailRecipients.push(currentTeam.managerEmail);
      }
      
      // Determine email template based on status
      let emailTemplate = 'team_status_update';
      if (status === 'approved') emailTemplate = 'team_approved';
      if (status === 'rejected') emailTemplate = 'team_rejected';
      if (status === 'withdrawn') emailTemplate = 'team_withdrawn';
      if (status === 'waitlisted') emailTemplate = 'team_waitlisted';
      
      log(`Using email template: ${emailTemplate} for notification`, 'admin');
      
      // Send notification to all recipients
      for (const recipient of emailRecipients) {
        if (recipient) {
          const templateData = {
            teamName: currentTeam.name || 'your team',
            eventName: event?.name || 'the event',
            notes: notes || '',
            status: status,
            loginLink: `${process.env.PUBLIC_URL || ''}/dashboard`,
            previousStatus: currentTeam.status || 'registered'
          };
          
          try {
            await sendTemplatedEmail(
              recipient,
              emailTemplate,
              templateData
            );
            log(`Email notification sent to ${recipient}`, 'admin');
          } catch (singleEmailError) {
            log(`Failed to send email to ${recipient}: ${singleEmailError}`, 'admin');
            // Continue with other recipients
          }
        }
      }
      
        emailStatus = 'sent';
      } catch (emailError) {
        // Log email error but don't let it affect the response
        log(`Failed to send status notification email: ${emailError}`, 'admin');
        emailStatus = 'failed';
      }
    }
    
    // Ensure we return a consistent JSON response
    return res.json({
      status: 'success',
      team: updatedTeam,
      notification: {
        status: emailStatus,
        recipients: emailRecipients,
        message: emailStatus === 'sent' 
          ? 'Email notification sent successfully' 
          : emailStatus === 'failed' 
            ? 'Status updated but email notification failed' 
            : emailStatus === 'skipped'
              ? 'Status updated successfully (email notification skipped)' 
              : 'No email notification attempted'
      }
    });
  } catch (error) {
    // Log the full error for debugging
    log(`Unexpected error updating team status: ${error}`, 'admin');
    if (error instanceof Error) {
      log(`Error stack: ${error.stack}`, 'admin');
    }
    
    // Always return a JSON response, even for unexpected errors
    return res.status(500).json({ 
      status: 'error',
      error: 'Failed to update team status',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
}

/**
 * Process a refund for a team registration
 */
async function processRefund(req: Request, res: Response) {
  // Set JSON content type from the start to ensure HTML isn't returned
  res.setHeader('Content-Type', 'application/json');
  
  console.log(`🔍 REFUND DEBUG: Starting refund process for team ${req.params.teamId}`);
  console.log(`🔍 REFUND DEBUG: Request body:`, req.body);
  
  try {
    const { teamId } = req.params;
    const { reason, amount } = req.body;
    const isPartialRefund = amount !== undefined && amount !== null;
    
    console.log(`🔍 REFUND DEBUG: teamId=${teamId}, reason=${reason}, amount=${amount}, isPartialRefund=${isPartialRefund}`);
    
    log(`Processing ${isPartialRefund ? 'partial' : 'full'} refund for team ID: ${teamId}. ${isPartialRefund ? `Amount: $${amount/100}` : ''} Reason: ${reason || 'Not provided'}`, 'admin');
    
    // Get team details
    const teamResult = await db
      .select()
      .from(teams)
      .where(eq(teams.id, parseInt(teamId, 10)));
    
    if (!teamResult || teamResult.length === 0) {
      return res.status(404).json({ 
        status: 'error',
        error: 'Team not found' 
      });
    }
    
    const team = teamResult[0];
    
    // Check if team has already paid - using totalAmount or registrationFee as an indicator
    const paidAmount = team.totalAmount || team.registrationFee;
    if (!paidAmount || paidAmount <= 0) {
      return res.status(400).json({ 
        status: 'error',
        error: 'No payment found for this team' 
      });
    }
    
    // Check if team is already refunded
    if (team.status === 'refunded') {
      return res.status(400).json({ 
        status: 'error',
        error: 'This team registration has already been refunded' 
      });
    }
    
    // Check if team already has a refund date (indicating previous refund)
    if (team.refundDate) {
      return res.status(400).json({ 
        status: 'error',
        error: 'This team has already been refunded. Multiple refunds are not allowed.' 
      });
    }
    
    log(`Team found. Current status: ${team.status}. Processing refund...`, 'admin');
    
    // If there's a paymentIntentId field, use it for the refund 
    // If not, we still allow for manual refund tracking without calling Stripe
    let refundId = 'manual-refund';
    let stripeRefundStatus = 'not_attempted';
    let refundAmount = team.totalAmount || team.registrationFee || 0;
    
    // In development, handle the case where we have no payment intent but still want to process a refund for testing
    const isDevelopment = process.env.NODE_ENV !== 'production';
    
    // Use the imported stripe service functions from the top of file
    
    if (team.paymentIntentId) {
      try {
        // Process the refund via Stripe
        // If amount is provided, use it for partial refund
        const refund = await createRefund(
          team.paymentIntentId, 
          isPartialRefund ? amount : undefined
        );
        refundId = refund.id;
        stripeRefundStatus = 'success';
        log(`Stripe ${isPartialRefund ? 'partial' : 'full'} refund processed successfully. Refund ID: ${refundId}`, 'admin');
      } catch (stripeError) {
        stripeRefundStatus = 'failed';
        log(`Stripe refund failed: ${stripeError}. Proceeding with manual refund tracking.`, 'admin');
      }
    } else if (isDevelopment && !team.paymentIntentId) {
      try {
        // Use the imported createTestPaymentIntent function from the top of file
        
        // For testing in development mode, create a test payment intent and immediately refund it
        // This creates proper Stripe records for testing
        log(`Creating test payment intent for refund testing in development mode`, 'admin');
        
        // First, create a test payment intent that's already paid
        const testIntent = await createTestPaymentIntent(refundAmount, parseInt(teamId, 10), {
          teamName: team.name || 'Test Team',
          eventId: team.eventId?.toString() || '',
          test_mode: 'true',
          manual_creation: 'true'
        });
        
        if (testIntent && testIntent.id) {
          // Now process the refund using the test intent
          const refund = await createRefund(testIntent.id, isPartialRefund ? amount : undefined);
          refundId = refund.id;
          stripeRefundStatus = 'success';
          
          // Update the team with the payment intent ID for future reference
          await db.update(teams)
            .set({ paymentIntentId: testIntent.id })
            .where(eq(teams.id, parseInt(teamId, 10)));
            
          log(`Test payment intent created and refunded in development mode. Refund ID: ${refundId}`, 'admin');
        } else {
          log(`Failed to create test payment intent. Using manual refund tracking.`, 'admin');
        }
      } catch (testError) {
        log(`Error creating test payment intent for refund: ${testError}. Using manual refund tracking.`, 'admin');
      }
    } else {
      log(`No payment intent ID found. Using manual refund tracking.`, 'admin');
    }
    
    // Update the team record with refund details
    const now = new Date();
    
    // For partial refunds, keep status as 'approved' since team is still participating
    // For full refunds, change status to 'refunded'
    const newStatus = isPartialRefund ? 'approved' : 'refunded';
    const refundNote = isPartialRefund ? 
      `Partial refund of $${(amount / 100).toFixed(2)} processed${reason ? ` - ${reason}` : ''}` :
      `Full refund processed${reason ? ` - ${reason}` : ''}`;
    
    const updatedTeamResult = await db.update(teams)
      .set({ 
        status: newStatus,
        refundDate: now,
        notes: team.notes ? `${team.notes}\n${refundNote}` : refundNote
      })
      .where(eq(teams.id, parseInt(teamId, 10)))
      .returning();
    
    if (!updatedTeamResult || updatedTeamResult.length === 0) {
      throw new Error('Failed to update team record');
    }
    
    const updatedTeam = updatedTeamResult[0];
    log(`Team database record updated to refunded status`, 'admin');
    
    // Handle email notifications in a separate try/catch to prevent errors from affecting the response
    let emailStatus = 'not_sent';
    let emailRecipients: string[] = [];
    
    try {
      // Get event details for email
      let event = null;
      
      if (team.eventId) {
        const eventId = typeof team.eventId === 'string' ? 
          parseInt(team.eventId, 10) : team.eventId;
          
        const eventResult = await db
          .select()
          .from(events)
          .where(eq(events.id, eventId));
          
        if (eventResult && eventResult.length > 0) {
          event = eventResult[0];
        }
      }
      
      // Send to both the submitter and the manager if they're different
      emailRecipients = [];
      if (team.submitterEmail) {
        emailRecipients.push(team.submitterEmail);
      }
      
      // If manager email is different from submitter, add them too
      if (team.managerEmail && team.submitterEmail && 
          team.managerEmail !== team.submitterEmail) {
        emailRecipients.push(team.managerEmail);
      }
      
      // Send notification to all recipients
      for (const recipient of emailRecipients) {
        if (recipient) {
          // Calculate the refund amount - use the provided amount for partial refunds
          const refundAmountValue = isPartialRefund 
            ? (amount / 100).toFixed(2)
            : ((team.totalAmount || team.registrationFee || 0) / 100).toFixed(2);
            
          await sendTemplatedEmail(
            recipient,
            'payment_refunded',
            {
              teamName: team.name || 'your team',
              eventName: event?.name || 'the event',
              amount: refundAmountValue,
              reason: reason || 'Team registration was refunded',
              refundDate: new Date().toLocaleDateString(),
              isPartial: isPartialRefund ? 'true' : 'false',
              originalAmount: ((team.totalAmount || team.registrationFee || 0) / 100).toFixed(2)
            }
          );
          
          log(`${isPartialRefund ? 'Partial' : 'Full'} refund notification email sent to ${recipient}`, 'admin');
        }
      }
      
      emailStatus = 'sent';
    } catch (emailError) {
      // Log email error but don't let it affect the response
      log(`Failed to send refund notification email: ${emailError}`, 'admin');
      emailStatus = 'failed';
    }
    
    // Calculate the refund amount for the response
    const responseRefundAmount = isPartialRefund 
      ? (amount / 100).toFixed(2)
      : ((team.totalAmount || team.registrationFee || 0) / 100).toFixed(2);

    // Return a consistent JSON response format with detailed status info
    return res.json({
      status: 'success',
      message: 'Refund processed successfully',
      team: updatedTeam,
      refund: {
        id: refundId,
        stripeStatus: stripeRefundStatus,
        amount: responseRefundAmount,
        isPartial: isPartialRefund,
        originalAmount: isPartialRefund ? ((team.totalAmount || team.registrationFee || 0) / 100).toFixed(2) : undefined,
        date: new Date().toISOString()
      },
      notification: {
        status: emailStatus,
        recipients: emailRecipients,
        message: emailStatus === 'sent' 
          ? 'Email notification sent successfully' 
          : emailStatus === 'failed' 
            ? 'Refund processed but email notification failed' 
            : 'No email notification attempted'
      }
    });
  } catch (error) {
    // Enhanced error logging for debugging
    console.error(`🚨 REFUND ERROR: Failed to process refund for team ${req.params.teamId}`);
    console.error(`🚨 REFUND ERROR: Error details:`, error);
    console.error(`🚨 REFUND ERROR: Error message:`, error instanceof Error ? error.message : 'Unknown error');
    console.error(`🚨 REFUND ERROR: Error stack:`, error instanceof Error ? error.stack : 'No stack trace');
    
    log(`Error processing refund: ${error}`, 'admin');
    if (error instanceof Error) {
      log(`Error stack: ${error.stack}`, 'admin');
    }
    
    // Always return a JSON response, even for errors
    return res.status(500).json({ 
      status: 'error',
      error: 'Failed to process refund',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      debug: {
        teamId: req.params.teamId,
        requestBody: req.body,
        timestamp: new Date().toISOString()
      }
    });
  }
}

/**
 * Process payment for a team after Setup Intent completion
 */
async function processTeamPaymentAfterSetup(req: Request, res: Response) {
  try {
    const teamId = req.params?.teamId;
    
    if (!teamId) {
      return res.status(400).json({ 
        error: 'Team ID is required' 
      });
    }
    
    log(`Processing payment for team ${teamId} after Setup Intent completion`, 'admin');
    
    // Get team details
    const teamResult = await db
      .select()
      .from(teams)
      .where(eq(teams.id, parseInt(teamId, 10)));
    
    if (!teamResult || teamResult.length === 0) {
      return res.status(404).json({ 
        error: 'Team not found' 
      });
    }
    
    const team = teamResult[0];
    
    if (!team.setupIntentId) {
      return res.status(400).json({ 
        error: 'No Setup Intent found for this team' 
      });
    }
    
    // Get the latest Setup Intent status from Stripe
    const setupIntent = await stripe.setupIntents.retrieve(team.setupIntentId);
    
    if (setupIntent.status !== 'succeeded' || !setupIntent.payment_method) {
      return res.status(400).json({ 
        error: 'Setup Intent is not completed or no payment method attached',
        setupIntentStatus: setupIntent.status
      });
    }
    
    log(`Setup Intent ${team.setupIntentId} is completed. Processing payment...`, 'admin');
    
    // Create and confirm payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: team.totalAmount,
      currency: 'usd',
      customer: setupIntent.customer,
      payment_method: setupIntent.payment_method,
      confirm: true,
      off_session: true,
      metadata: {
        teamId: team.id.toString(),
        teamName: team.name,
        eventType: 'delayed_payment_completion'
      }
    });
    
    if (paymentIntent.status === 'succeeded') {
      // Update team with payment details and approve automatically
      const now = new Date().toISOString();
      await db.update(teams)
        .set({
          paymentIntentId: paymentIntent.id,
          paymentStatus: 'paid',
          status: 'approved',
          paymentMethodId: setupIntent.payment_method,
          approvedAt: sql`${now}`,
          notes: `${team.notes || ''} | Payment completed via completion URL - automatically approved`.trim()
        })
        .where(eq(teams.id, parseInt(teamId, 10)));
      
      log(`Payment successful for team ${teamId}. Payment Intent: ${paymentIntent.id}. Team automatically approved.`, 'admin');
      
      // Send approval notification email
      let emailStatus = 'not_sent';
      let emailRecipients: string[] = [];
      
      try {
        // Get event details for email
        let event = null;
        
        if (team.eventId) {
          const eventId = typeof team.eventId === 'string' ? 
            parseInt(team.eventId, 10) : team.eventId;
            
          const eventResult = await db
            .select()
            .from(events)
            .where(eq(events.id, eventId));
            
          if (eventResult && eventResult.length > 0) {
            event = eventResult[0];
          }
        }
        
        // Send to both the submitter and the manager if they're different
        emailRecipients = [];
        if (team.submitterEmail) {
          emailRecipients.push(team.submitterEmail);
        }
        
        // If manager email is different from submitter, add them too
        if (team.managerEmail && team.submitterEmail && 
            team.managerEmail !== team.submitterEmail) {
          emailRecipients.push(team.managerEmail);
        }
        
        // Send approval notification to all recipients
        for (const recipient of emailRecipients) {
          if (recipient) {
            await sendTemplatedEmail(
              recipient,
              'team_approved',
              {
                teamName: team.name || 'your team',
                eventName: event?.name || 'the event',
                approvalDate: new Date().toLocaleDateString(),
                paymentAmount: ((team.totalAmount || 0) / 100).toFixed(2),
                paymentIntentId: paymentIntent.id,
                cardBrand: 'Card',
                cardLastFour: '****'
              }
            );
            
            log(`Team approval email sent to ${recipient} after payment completion`, 'admin');
          }
        }
        
        emailStatus = 'sent';
      } catch (emailError) {
        log(`Failed to send approval notification email after payment completion: ${emailError}`, 'admin');
        emailStatus = 'failed';
      }
      
      return res.json({
        success: true,
        paymentIntentId: paymentIntent.id,
        amount: team.totalAmount / 100,
        message: 'Payment processed successfully and team approved',
        emailStatus,
        emailRecipients
      });
    } else {
      log(`Payment failed for team ${teamId}. Status: ${paymentIntent.status}`, 'admin');
      
      return res.status(400).json({
        error: 'Payment processing failed',
        status: paymentIntent.status,
        paymentIntentId: paymentIntent.id
      });
    }
    
  } catch (error) {
    log(`Error processing payment for team ${req.params?.teamId}: ${error}`, 'admin');
    
    return res.status(500).json({
      error: 'Failed to process payment',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
}

/**
 * Generate payment completion URL for teams with incomplete Setup Intents
 */
async function generatePaymentCompletionUrl(req: Request, res: Response) {
  try {
    const teamId = req.params?.teamId;
    const { forceGenerate } = req.body; // Add override flag
    
    if (!teamId) {
      return res.status(400).json({ 
        error: 'Team ID is required' 
      });
    }
    
    log(`Generating payment completion URL for team ${teamId}${forceGenerate ? ' (FORCE OVERRIDE)' : ''}`, 'admin');
    
    // Define frontend URL - use app.matchpro.ai for production
    const frontendUrl = process.env.NODE_ENV === 'production' 
      ? 'https://app.matchpro.ai' 
      : (process.env.FRONTEND_URL || 'http://localhost:5000');
    
    // Get team details
    const teamResult = await db
      .select()
      .from(teams)
      .where(eq(teams.id, parseInt(teamId, 10)));
    
    if (!teamResult || teamResult.length === 0) {
      return res.status(404).json({ 
        error: 'Team not found' 
      });
    }
    
    const team = teamResult[0];
    
    // Check if team needs payment setup or has Link payment that needs replacement
    // Allow URL generation for teams with:
    // 1. payment_required status (incomplete setup)
    // 2. approved status but no payment (payment failed during approval)
    // 3. any team with total amount > 0 but no successful payment
    // 4. teams with Link payment methods (no longer supported)
    // 5. FORCE OVERRIDE - admin wants to regenerate regardless of status
    
    let hasLinkPayment = false;
    if (team.paymentMethodId) {
      try {
        const paymentMethod = await stripe.paymentMethods.retrieve(team.paymentMethodId);
        hasLinkPayment = paymentMethod.type === 'link';
        if (hasLinkPayment) {
          log(`Team ${teamId} has Link payment method ${team.paymentMethodId} - allowing URL generation for card replacement`, 'admin');
        }
      } catch (error) {
        log(`Error checking payment method type for team ${teamId}: ${error}`, 'admin');
      }
    }
    
    const needsPayment = forceGenerate || (
      team.paymentStatus === 'payment_required' ||
      team.paymentStatus === 'payment_failed' ||
      team.paymentStatus === 'setup_intent_completed' ||
      (team.status === 'approved' && team.paymentStatus !== 'paid') ||
      (team.totalAmount && team.totalAmount > 0 && team.paymentStatus !== 'paid') ||
      hasLinkPayment  // Allow Link payments to be replaced with card payments
    );
    
    if (!needsPayment && !forceGenerate) {
      // Provide specific helpful messages based on team status
      let message = 'Team does not need payment setup';
      let guidance = '';
      
      if (team.paymentStatus === 'paid') {
        message = 'Team payment is already complete. No completion URL needed.';
      } else if (team.status === 'approved' && team.paymentStatus === 'paid') {
        message = 'Team is approved and payment has been processed successfully.';
      } else if (!team.totalAmount || team.totalAmount === 0) {
        message = 'Team has no payment amount required. No completion URL needed.';
      } else if (team.paymentStatus === 'payment_info_provided' && team.status === 'registered') {
        // Check if this team has Link payment method
        if (hasLinkPayment) {
          message = 'Team used Link payment which is no longer supported.';
          guidance = 'Generate a new payment URL so the team can pay with a regular debit/credit card instead.';
        } else {
          message = 'Team has completed payment setup and is ready for approval.';
          guidance = 'To charge this team, approve them using the "Approve" button. Payment will be automatically processed during approval.';
        }
      }
      
      return res.status(400).json({ 
        error: message,
        guidance: guidance,
        currentStatus: team.paymentStatus,
        teamStatus: team.status,
        totalAmount: team.totalAmount,
        actionNeeded: team.paymentStatus === 'payment_info_provided' && team.status === 'registered' ? 'approval' : 'none'
      });
    }
    
    // Check the current Setup Intent status in Stripe (if exists)
    let setupIntentStatus = 'unknown';
    let existingSetupIntent = null;
    
    if (team.setupIntentId) {
      try {
        existingSetupIntent = await stripe.setupIntents.retrieve(team.setupIntentId);
        setupIntentStatus = existingSetupIntent.status;
        
        if (existingSetupIntent.status === 'succeeded' && existingSetupIntent.payment_method && !forceGenerate) {
          // Check if this is a Link payment method that needs to be replaced
          let isLinkPayment = false;
          try {
            const paymentMethod = await stripe.paymentMethods.retrieve(existingSetupIntent.payment_method.toString());
            isLinkPayment = paymentMethod.type === 'link';
          } catch (error) {
            log(`Error checking payment method type in Setup Intent: ${error}`, 'admin');
          }
          
          if (isLinkPayment) {
            log(`Setup Intent ${existingSetupIntent.id} has Link payment method - creating new Setup Intent for card payment`, 'admin');
            // Don't return early - continue to create new Setup Intent for card payment
          } else {
            // Setup Intent is actually complete with regular card - update team record
            await db
              .update(teams)
              .set({
                paymentMethodId: existingSetupIntent.payment_method.toString(),
                stripeCustomerId: existingSetupIntent.customer?.toString() || null,
                paymentStatus: 'payment_info_provided'
              })
              .where(eq(teams.id, parseInt(teamId, 10)));
            
            return res.json({
              message: 'Team payment setup is already complete',
              guidance: 'This team is ready for approval. Use the "Approve" button to charge their payment method and complete the registration.',
              status: 'complete',
              paymentMethodId: existingSetupIntent.payment_method,
              actionNeeded: 'approval'
            });
          }
        }
        
        // Force override - create new Setup Intent regardless of existing status
        if (forceGenerate) {
          log(`Force override requested - creating new Setup Intent regardless of existing status`, 'admin');
        }
        
        if (existingSetupIntent.status === 'requires_payment_method' && existingSetupIntent.client_secret) {
          // Use the existing Setup Intent that's still pending
          const completionUrl = `${frontendUrl}/complete-payment?setup_intent=${existingSetupIntent.client_secret}&team_id=${teamId}`;
          
          log(`Payment completion URL generated for team ${teamId} using existing Setup Intent: ${completionUrl}`, 'admin');
          
          return res.json({
            success: true,
            completionUrl: completionUrl,
            setupIntentId: existingSetupIntent.id,
            teamId: teamId,
            teamName: team.name,
            managerEmail: team.managerEmail,
            originalSetupIntentStatus: setupIntentStatus,
            message: 'Payment completion URL generated successfully'
          });
        }
      } catch (stripeError) {
        log(`Error checking Setup Intent ${team.setupIntentId}: ${stripeError}`, 'admin');
        // Continue to create a new Setup Intent below
      }
    }
    
    // Create new Setup Intent for completion (card payments only, no Link)
    const eventType = hasLinkPayment ? 'link_payment_replacement' : 'incomplete_registration_recovery';
    const newSetupIntent = await stripe.setupIntents.create({
      payment_method_types: ['card'],
      usage: 'off_session',
      metadata: {
        teamId: teamId,
        teamName: team.name || 'Unknown Team',
        originalSetupIntent: team.setupIntentId,
        eventType: eventType,
        managerEmail: team.managerEmail || 'unknown',
        replacingLinkPayment: hasLinkPayment ? 'true' : 'false'
      }
    });
    
    // Update team with new Setup Intent
    const noteMessage = hasLinkPayment 
      ? `\nNew Setup Intent created to replace Link payment with card: ${newSetupIntent.id} (${new Date().toISOString()})`
      : `\nNew Setup Intent created for incomplete registration: ${newSetupIntent.id} (${new Date().toISOString()})`;
      
    await db
      .update(teams)
      .set({
        setupIntentId: newSetupIntent.id,
        paymentStatus: 'setup_intent_created',
        notes: (team.notes || '') + noteMessage
      })
      .where(eq(teams.id, parseInt(teamId, 10)));
    
    // Frontend URL already defined above
    const completionUrl = `${frontendUrl}/complete-payment?setup_intent=${newSetupIntent.client_secret}&team_id=${teamId}`;
    
    log(`Payment completion URL generated for team ${teamId}: ${completionUrl}`, 'admin');
    
    const successMessage = hasLinkPayment 
      ? 'Payment completion URL generated successfully for Link payment replacement'
      : 'Payment completion URL generated successfully';
    
    return res.json({
      success: true,
      completionUrl: completionUrl,
      setupIntentId: newSetupIntent.id,
      teamId: teamId,
      teamName: team.name,
      managerEmail: team.managerEmail,
      originalSetupIntentStatus: setupIntentStatus,
      replacingLinkPayment: hasLinkPayment,
      message: successMessage
    });
    
  } catch (error) {
    log(`Error generating payment completion URL for team ${req.params?.teamId}: ${error}`, 'admin');
    
    return res.status(500).json({
      error: 'Failed to generate payment completion URL',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
}

/**
 * Bulk approve multiple teams
 */
async function bulkApproveTeams(req: Request, res: Response) {
  try {
    const { teamIds, notes } = req.body;
    
    if (!Array.isArray(teamIds) || teamIds.length === 0) {
      return res.status(400).json({
        status: 'error',
        error: 'Team IDs array is required'
      });
    }

    log(`Processing bulk approval for ${teamIds.length} teams: ${teamIds.join(', ')}`, 'admin');
    
    const results: {
      successful: Array<{ teamId: any; teamName: string; message: string }>;
      failed: Array<{ teamId: any; teamName?: string; error: string }>;
      warnings: Array<{ teamId: any; teamName: string; message: string }>;
    } = {
      successful: [],
      failed: [],
      warnings: []
    };

    // Process each team individually to handle different payment scenarios
    for (const teamId of teamIds) {
      try {
        // Get team details first
        const teamResult = await db
          .select()
          .from(teams)
          .where(eq(teams.id, parseInt(teamId, 10)));
        
        if (!teamResult || teamResult.length === 0) {
          results.failed.push({
            teamId,
            error: 'Team not found'
          });
          continue;
        }

        const team = teamResult[0];
        
        // Check if team is already approved
        if (team.status === 'approved') {
          results.warnings.push({
            teamId,
            teamName: team.name,
            message: 'Team was already approved'
          });
          continue;
        }

        // Check if team can be approved (not rejected, withdrawn, etc.)
        if (!['registered', 'waitlisted'].includes(team.status)) {
          results.failed.push({
            teamId,
            teamName: team.name,
            error: `Cannot approve team with status: ${team.status}`
          });
          continue;
        }

        // For bulk approval, we'll approve teams without payment processing
        // This is ideal for imported teams or when fees aren't required
        const totalAmount = team.totalAmount || 0;
        
        if (totalAmount > 0) {
          // If team has fees, warn but still approve (admin can handle payment separately)
          results.warnings.push({
            teamId,
            teamName: team.name,
            message: `Team approved but has unpaid fees ($${(totalAmount / 100).toFixed(2)}). Consider generating payment completion URL.`
          });
        }

        // Update team status to approved with proper tracking
        const now = new Date().toISOString();
        await db.update(teams)
          .set({ 
            status: 'approved',
            approvedByUserId: req.user?.id || null,
            approvedAt: sql`${now}`,
            notes: notes ? `${team.notes ? team.notes + '\n' : ''}Bulk approval: ${notes}` : team.notes
          })
          .where(eq(teams.id, parseInt(teamId, 10)));

        results.successful.push({
          teamId,
          teamName: team.name,
          message: 'Team approved successfully'
        });

        log(`Team ${teamId} (${team.name}) approved in bulk operation`, 'admin');

      } catch (error) {
        results.failed.push({
          teamId,
          error: error instanceof Error ? error.message : 'Unknown error occurred'
        });
        log(`Error approving team ${teamId} in bulk operation: ${error}`, 'admin');
      }
    }

    // Send email notifications for successful approvals
    try {
      for (const success of results.successful) {
        const teamResult = await db
          .select({
            team: teams,
            event: {
              id: events.id,
              name: events.name
            }
          })
          .from(teams)
          .leftJoin(events, eq(teams.eventId, events.id))
          .where(eq(teams.id, parseInt(success.teamId, 10)));

        if (teamResult && teamResult.length > 0) {
          const { team, event } = teamResult[0];
          
          const recipients = [];
          if (team.submitterEmail) recipients.push(team.submitterEmail);
          if (team.managerEmail && team.managerEmail !== team.submitterEmail) {
            recipients.push(team.managerEmail);
          }

          // Get payment transaction details for the email
          let paymentData = null;
          if (team.paymentIntentId) {
            try {
              // For now, we'll use basic payment data from the team record
              // since paymentTransactions table might not have all records
              paymentData = {
                createdAt: new Date().toISOString(),
                amount: team.totalAmount
              };
            } catch (paymentError) {
              log(`Error fetching payment data for team ${team.id}: ${paymentError}`, 'admin');
            }
          }

          for (const recipient of recipients) {
            if (recipient) {
              await sendTemplatedEmail(
                recipient,
                'team_approved',
                {
                  // Team Information
                  teamName: team.name || 'your team',
                  eventName: event?.name || 'the event',
                  submitterName: team.submitterName || team.managerName || 'Team Manager',
                  submitterEmail: team.submitterEmail || team.managerEmail || '',
                  clubName: team.clubName || '',
                  
                  // Registration Details
                  registrationDate: team.createdAt ? new Date(team.createdAt).toLocaleDateString() : new Date().toLocaleDateString(),
                  approvalDate: new Date().toLocaleDateString(),
                  
                  // Payment Information (matching real template structure)
                  totalAmount: team.totalAmount ? (team.totalAmount / 100) : 0,
                  paymentId: team.paymentIntentId || 'Processing',
                  paymentDate: paymentData?.createdAt ? new Date(paymentData.createdAt).toLocaleDateString() : new Date().toLocaleDateString(),
                  cardBrand: team.cardBrand || 'Card',
                  cardLastFour: team.cardLast4 || '****',
                  transactionId: team.paymentIntentId || 'Processing',
                  
                  // Age group information  
                  ageGroup: 'Age Group', // This would need to be fetched from age groups table
                  
                  // Selected fees array (empty for now - would be populated from actual fee data)
                  selectedFees: [],
                  
                  // Conditional Flags
                  hasPayment: !!team.paymentIntentId,
                  hasClub: !!team.clubName,
                  
                  // Branding placeholders (these would be populated by the email service)
                  loginLink: `${process.env.FRONTEND_URL || 'https://app.matchpro.ai'}/dashboard`,
                  supportEmail: 'support@matchpro.ai',
                  organizationName: 'MatchPro',
                  currentYear: new Date().getFullYear().toString()
                }
              );
            }
          }
        }
      }
    } catch (emailError) {
      log(`Error sending bulk approval notification emails: ${emailError}`, 'admin');
      // Don't fail the whole operation for email issues
    }

    const summary = {
      total: teamIds.length,
      successful: results.successful.length,
      failed: results.failed.length,
      warnings: results.warnings.length
    };

    log(`Bulk approval completed: ${summary.successful} successful, ${summary.failed} failed, ${summary.warnings} warnings`, 'admin');

    return res.json({
      status: 'success',
      message: `Bulk approval completed: ${summary.successful} teams approved`,
      summary,
      results
    });

  } catch (error) {
    log(`Error in bulk team approval: ${error}`, 'admin');
    return res.status(500).json({
      status: 'error',
      error: 'Failed to process bulk approval',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
}

/**
 * Bulk reject multiple teams
 */
async function bulkRejectTeams(req: Request, res: Response) {
  try {
    const { teamIds, notes } = req.body;
    
    if (!Array.isArray(teamIds) || teamIds.length === 0) {
      return res.status(400).json({
        status: 'error',
        error: 'Team IDs array is required'
      });
    }

    log(`Processing bulk rejection for ${teamIds.length} teams: ${teamIds.join(', ')}`, 'admin');
    
    const results: {
      successful: Array<{ teamId: any; teamName: string; message: string }>;
      failed: Array<{ teamId: any; teamName?: string; error: string }>;
      warnings: Array<{ teamId: any; teamName: string; message: string }>;
    } = {
      successful: [],
      failed: [],
      warnings: []
    };

    // Process each team individually
    for (const teamId of teamIds) {
      try {
        // Get team details first
        const teamResult = await db
          .select()
          .from(teams)
          .where(eq(teams.id, parseInt(teamId, 10)));
        
        if (!teamResult || teamResult.length === 0) {
          results.failed.push({
            teamId,
            error: 'Team not found'
          });
          continue;
        }

        const team = teamResult[0];
        
        // Check if team is already rejected
        if (team.status === 'rejected') {
          results.warnings.push({
            teamId,
            teamName: team.name,
            message: 'Team was already rejected'
          });
          continue;
        }

        // Check if team can be rejected (not already approved with payment, etc.)
        if (['approved', 'withdrawn', 'refunded'].includes(team.status)) {
          results.failed.push({
            teamId,
            teamName: team.name,
            error: `Cannot reject team with status: ${team.status}`
          });
          continue;
        }

        // Update team status to rejected
        await db.update(teams)
          .set({ 
            status: 'rejected',
            notes: notes ? `${team.notes ? team.notes + '\n' : ''}Bulk rejection: ${notes}` : team.notes
          })
          .where(eq(teams.id, parseInt(teamId, 10)));

        results.successful.push({
          teamId,
          teamName: team.name,
          message: 'Team rejected successfully'
        });

        log(`Team ${teamId} (${team.name}) rejected in bulk operation`, 'admin');

      } catch (error) {
        results.failed.push({
          teamId,
          error: error instanceof Error ? error.message : 'Unknown error occurred'
        });
        log(`Error rejecting team ${teamId} in bulk operation: ${error}`, 'admin');
      }
    }

    // Send email notifications for successful rejections
    try {
      for (const success of results.successful) {
        const teamResult = await db
          .select({
            team: teams,
            event: {
              id: events.id,
              name: events.name
            }
          })
          .from(teams)
          .leftJoin(events, eq(teams.eventId, events.id))
          .where(eq(teams.id, parseInt(success.teamId, 10)));

        if (teamResult && teamResult.length > 0) {
          const { team, event } = teamResult[0];
          
          const recipients = [];
          if (team.submitterEmail) recipients.push(team.submitterEmail);
          if (team.managerEmail && team.managerEmail !== team.submitterEmail) {
            recipients.push(team.managerEmail);
          }

          for (const recipient of recipients) {
            if (recipient) {
              await sendTemplatedEmail(
                recipient,
                'team_rejected',
                {
                  teamName: team.name || 'your team',
                  eventName: event?.name || 'the event',
                  submitterName: team.submitterName || team.managerName || 'Team Manager',
                  notes: notes || '',
                  
                  // Standard template data
                  loginLink: `${process.env.FRONTEND_URL || 'https://app.matchpro.ai'}/dashboard`,
                  supportEmail: 'support@matchpro.ai',
                  organizationName: 'MatchPro',
                  currentYear: new Date().getFullYear().toString()
                }
              );
            }
          }
        }
      }
    } catch (emailError) {
      log(`Error sending bulk rejection notification emails: ${emailError}`, 'admin');
      // Don't fail the whole operation for email issues
    }

    const summary = {
      total: teamIds.length,
      successful: results.successful.length,
      failed: results.failed.length,
      warnings: results.warnings.length
    };

    log(`Bulk rejection completed: ${summary.successful} successful, ${summary.failed} failed, ${summary.warnings} warnings`, 'admin');

    return res.json({
      status: 'success',
      message: `Bulk rejection completed: ${summary.successful} teams rejected`,
      summary,
      results
    });

  } catch (error) {
    log(`Error in bulk team rejection: ${error}`, 'admin');
    return res.status(500).json({
      status: 'error',
      error: 'Failed to process bulk rejection',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
}

/**
 * Delete a team registration (only allowed for teams in 'registered' status)
 */
async function deleteTeam(req: Request, res: Response) {
  try {
    const { teamId } = req.params;
    
    if (!teamId) {
      return res.status(400).json({ 
        status: 'error',
        error: 'Team ID is required' 
      });
    }
    
    log(`Processing team deletion request. TeamID: ${teamId}`, 'admin');
    
    // Get current team details before deleting
    let currentTeam;
    try {
      const teamResult = await db
        .select()
        .from(teams)
        .where(eq(teams.id, parseInt(teamId, 10)));
      
      if (teamResult && teamResult.length > 0) {
        currentTeam = teamResult[0];
      }
    } catch (dbError) {
      log(`Database error fetching team: ${dbError}`, 'admin');
      return res.status(500).json({ 
        status: 'error',
        error: 'Database error fetching team',
        message: 'Failed to retrieve team details'
      });
    }
    
    if (!currentTeam) {
      return res.status(404).json({ 
        status: 'error',
        error: 'Team not found' 
      });
    }
    
    // Only allow deletion of teams in 'registered' status (pending review)
    if (currentTeam.status !== 'registered') {
      return res.status(400).json({ 
        status: 'error',
        error: `Cannot delete team with status '${currentTeam.status}'`,
        message: 'Only teams in "Pending Review" status (registered) can be deleted. Approved teams should be withdrawn instead.'
      });
    }
    
    // Check if team has been charged - prevent deletion if payment was processed
    if (currentTeam.paymentStatus === 'paid' && currentTeam.paymentIntentId) {
      return res.status(400).json({ 
        status: 'error',
        error: 'Cannot delete team with processed payment',
        message: 'This team has already been charged. Use "Refund" instead of deletion.'
      });
    }
    
    log(`Team found for deletion. Status: ${currentTeam.status}, Payment Status: ${currentTeam.paymentStatus}`, 'admin');
    
    // Clean up Stripe Setup Intent if exists and not completed
    if (currentTeam.setupIntentId && currentTeam.paymentStatus !== 'paid') {
      try {
        const setupIntent = await stripe.setupIntents.retrieve(currentTeam.setupIntentId);
        if (setupIntent.status === 'requires_payment_method' || setupIntent.status === 'requires_confirmation') {
          await stripe.setupIntents.cancel(currentTeam.setupIntentId);
          log(`Cancelled Setup Intent ${currentTeam.setupIntentId} for deleted team`, 'admin');
        }
      } catch (stripeError) {
        log(`Warning: Could not cancel Setup Intent ${currentTeam.setupIntentId}: ${stripeError}`, 'admin');
        // Continue with deletion - this is not critical
      }
    }
    
    // Delete team from database
    try {
      const deletedResult = await db
        .delete(teams)
        .where(eq(teams.id, parseInt(teamId, 10)))
        .returning();
      
      if (!deletedResult || deletedResult.length === 0) {
        throw new Error('No rows deleted');
      }
      
      log(`Team ${teamId} (${currentTeam.name}) successfully deleted from database`, 'admin');
      
    } catch (deleteError) {
      log(`Database error deleting team: ${deleteError}`, 'admin');
      return res.status(500).json({ 
        status: 'error',
        error: 'Database error deleting team',
        message: 'Failed to delete team from database'
      });
    }
    
    // Send notification email to team submitter about deletion
    try {
      if (currentTeam.submitterEmail) {
        // Get event details for email
        let event = null;
        try {
          const eventId = currentTeam.eventId;
          if (eventId) {
            const eventResult = await db
              .select()
              .from(events)
              .where(eq(events.id, parseInt(eventId.toString(), 10)));
              
            if (eventResult && eventResult.length > 0) {
              event = eventResult[0];
            }
          }
        } catch (eventError) {
          log(`Error fetching event for deletion notification: ${eventError}`, 'admin');
        }
        
        const templateData = {
          teamName: currentTeam.name || 'your team',
          eventName: event?.name || 'the event',
          reason: 'The registration has been removed by an administrator.',
          supportEmail: process.env.SUPPORT_EMAIL || 'support@matchpro.ai'
        };
        
        await sendTemplatedEmail(
          currentTeam.submitterEmail,
          'team_registration_deleted',
          templateData
        );
        log(`Deletion notification email sent to ${currentTeam.submitterEmail}`, 'admin');
      }
    } catch (emailError) {
      log(`Failed to send deletion notification email: ${emailError}`, 'admin');
      // Don't fail the deletion if email fails
    }
    
    // Return success response
    return res.json({
      status: 'success',
      message: 'Team registration deleted successfully',
      deletedTeam: {
        id: currentTeam.id,
        name: currentTeam.name,
        status: currentTeam.status,
        submitterEmail: currentTeam.submitterEmail
      }
    });
    
  } catch (error) {
    log(`Error deleting team ${req.params?.teamId}: ${error}`, 'admin');
    
    return res.status(500).json({
      status: 'error',
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
}

/**
 * Generate payment completion URL for incomplete payment intents
 */
async function generatePaymentIntentCompletionUrl(req: Request, res: Response) {
  try {
    const teamId = parseInt(req.params.id);
    const { forceGenerate } = req.body; // Add override flag
    
    log(`Generating payment intent completion URL for team ${teamId}${forceGenerate ? ' (FORCE OVERRIDE)' : ''}`, 'admin');
    
    // Get team with payment details
    const team = await db.query.teams.findFirst({
      where: eq(teams.id, teamId),
      columns: {
        id: true,
        name: true,
        payment_status: true,
        payment_intent_id: true,
        setup_intent_id: true,
        total_amount: true,
        submitter_email: true
      }
    });

    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    if (!team.payment_intent_id) {
      return res.status(400).json({ error: 'No payment intent found for this team' });
    }

    // Check if payment is already complete (unless force override)
    if (team.payment_status === 'paid' && !forceGenerate) {
      return res.status(400).json({ error: 'Payment already completed for this team' });
    }

    // Retrieve the payment intent from Stripe to get client secret
    const paymentIntent = await stripe.paymentIntents.retrieve(team.payment_intent_id);
    
    if (paymentIntent.status === 'succeeded') {
      // Payment actually succeeded, update team status
      await db.update(teams)
        .set({ payment_status: 'paid' })
        .where(eq(teams.id, teamId));
      
      return res.status(400).json({ 
        error: 'Payment has already been completed successfully', 
        shouldRefresh: true 
      });
    }

    if (!paymentIntent.client_secret) {
      return res.status(400).json({ error: 'No client secret available for payment completion' });
    }

    // Generate completion URL
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://app.matchpro.ai' 
      : `${req.protocol}://${req.get('host')}`;
    
    const completionUrl = `${baseUrl}/complete-payment?payment_intent=${team.payment_intent_id}&payment_intent_client_secret=${paymentIntent.client_secret}`;

    log(`Generated payment completion URL for Team ${teamId} (${team.name}):`, 'admin');
    log(`Payment Intent: ${team.payment_intent_id} - Status: ${paymentIntent.status}`, 'admin');
    if (paymentIntent.last_payment_error) {
      log(`Last Payment Error: ${paymentIntent.last_payment_error.message}`, 'admin');
    }

    res.json({
      success: true,
      completionUrl,
      paymentIntentStatus: paymentIntent.status,
      lastPaymentError: paymentIntent.last_payment_error?.message
    });

  } catch (error) {
    log(`Error generating payment completion URL: ${error}`, 'admin');
    res.status(500).json({ 
      error: 'Failed to generate payment completion URL',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}



export { updateTeamStatus, processRefund, processTeamPaymentAfterSetup, generatePaymentCompletionUrl, deleteTeam, bulkApproveTeams, bulkRejectTeams, generatePaymentIntentCompletionUrl };