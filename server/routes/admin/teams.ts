import { Request, Response } from 'express';
import { db } from '@db';
import { teams, events, users, players } from '@db/schema';
import { eq, and, or, like, asc, desc, sql } from 'drizzle-orm';
import { log } from '../../vite';
import { sendTemplatedEmail } from '../../services/emailService';
import { createRefund, createTestPaymentIntent } from '../../services/stripeService';

type TeamStatus = 'registered' | 'approved' | 'rejected' | 'paid' | 'withdrawn' | 'refunded' | 'waitlisted';

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
        notes: teams.notes
      },
      event: {
        id: events.id,
        name: events.name
      },
      user: {
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName
      }
    })
    .from(teams)
    .leftJoin(events, eq(teams.eventId, events.id))
    .leftJoin(users, eq(teams.managerEmail, users.email));
    
    // Add filters if provided
    if (eventId) {
      query = query.where(eq(teams.eventId, eventId as string));
    }
    
    if (status) {
      query = query.where(eq(teams.status, status as string));
    }
    
    if (search) {
      const searchTerm = `%${search}%`;
      query = query.where(
        or(
          like(teams.name, searchTerm as string),
          like(teams.managerEmail, searchTerm as string),
          like(teams.submitterEmail, searchTerm as string)
        )
      );
    }
    
    // Add sorting
    if (sortBy && sortOrder) {
      if (sortBy === 'createdAt') {
        query = query.orderBy(sortOrder === 'asc' ? asc(teams.createdAt) : desc(teams.createdAt));
      } else if (sortBy === 'name') {
        query = query.orderBy(sortOrder === 'asc' ? asc(teams.name) : desc(teams.name));
      }
    }
    
    const result = await query;
    
    // For each team, fetch player count
    const teamsWithPlayerCounts = await Promise.all(
      result.map(async ({ team, event, user }) => {
        // Count players for this team
        const playerCountResult = await db
          .select({ count: sql<number>`count(*)`.mapWith(Number) })
          .from(players)
          .where(eq(players.teamId, team.id));
        
        const playerCount = playerCountResult[0]?.count || 0;
        
        // Debug: Log team amounts before sending to frontend
        console.log(`Team ${team.id} (${team.name}): totalAmount=${team.totalAmount}, registrationFee=${team.registrationFee}`);
        
        return {
          team: {
            ...team,
            playerCount: playerCount,
            // Keep amounts in cents - frontend will handle formatting
            totalAmount: team.totalAmount,
            registrationFee: team.registrationFee
          },
          event,
          user
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
      user: {
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName
      }
    })
    .from(teams)
    .leftJoin(events, eq(teams.eventId, events.id))
    .leftJoin(users, eq(teams.managerEmail, users.email))
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
export async function updateTeamStatus(req: Request, res: Response) {
  // Ensure we're always sending a JSON response, no matter what happens
  res.setHeader('Content-Type', 'application/json');
  
  // Wrap everything in a try-catch to ensure we never return HTML
  try {
    // Extract request parameters first to avoid undefined errors
    const teamId = req.params?.teamId;
    const status = req.body?.status;
    const notes = req.body?.notes;
    
    if (!teamId || !status) {
      return res.status(400).json({ 
        status: 'error',
        error: 'Missing required parameters',
        details: !teamId ? 'Team ID is required' : 'Status is required'
      });
    }
    
    log(`Processing team status update. TeamID: ${teamId}, Status: ${status}, Notes: ${notes ? 'provided' : 'none'}`, 'admin');
    
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
      const updateResult = await db.update(teams)
        .set({ 
          status, 
          notes: notes || null, // Using notes instead of adminNotes to match schema
          // Use the drizzle update pattern correctly to avoid TypeScript errors
          updatedAt: sql`${now}`
        })
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
    
    // Handle email notifications in a separate try/catch to prevent errors from affecting the response
    let emailStatus = 'not_sent';
    let emailRecipients: string[] = [];
    
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
export async function processRefund(req: Request, res: Response) {
  // Set JSON content type from the start to ensure HTML isn't returned
  res.setHeader('Content-Type', 'application/json');
  
  try {
    const { teamId } = req.params;
    const { reason, amount } = req.body;
    const isPartialRefund = amount !== undefined && amount !== null;
    
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
    } else if (isDevelopment) {
      try {
        // Use the imported createTestPaymentIntent function from the top of file
        
        // For testing in development mode, create a test payment intent and immediately refund it
        // This creates proper Stripe records for testing
        log(`Creating test payment intent for refund testing in development mode`, 'admin');
        
        // First, create a test payment intent that's already paid
        const testIntent = await createTestPaymentIntent(refundAmount * 100, {
          teamId: teamId,
          teamName: team.name || 'Test Team',
          eventId: team.eventId?.toString() || '',
          test_mode: 'true',
          manual_creation: 'true'
        });
        
        if (testIntent && testIntent.id) {
          // Now process the refund using the test intent
          const refund = await createRefund(testIntent.id, reason);
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
    const now = new Date().toISOString();
    const updatedTeamResult = await db.update(teams)
      .set({ 
        status: 'refunded',
        refundDate: now,
        notes: reason ? `${team.notes || ''} \nRefund reason: ${reason}`.trim() : team.notes,
        // Use SQL template for the timestamp to avoid TypeScript errors
        updatedAt: sql`${now}`
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
    // Log the full error for debugging
    log(`Error processing refund: ${error}`, 'admin');
    if (error instanceof Error) {
      log(`Error stack: ${error.stack}`, 'admin');
    }
    
    // Always return a JSON response, even for errors
    return res.status(500).json({ 
      status: 'error',
      error: 'Failed to process refund',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
}