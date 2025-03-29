import { Request, Response } from 'express';
import { db } from '@db';
import { teams, events, users } from '@db/schema';
import { eq, and, or, like, asc, desc } from 'drizzle-orm';
import { createRefund } from '../../services/stripeService';
import { log } from '../../vite';
import { sendTemplatedEmail } from '../../services/emailService';

type TeamStatus = 'registered' | 'approved' | 'rejected' | 'paid' | 'withdrawn' | 'refunded';

/**
 * Get all team registrations with filtering options
 */
export async function getTeams(req: Request, res: Response) {
  try {
    const { eventId, status, search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    // Build query conditions
    let query = db.select({
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
    res.json(result);
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
  // Set JSON content type from the start to ensure HTML isn't returned
  res.setHeader('Content-Type', 'application/json');
  
  try {
    const { teamId } = req.params;
    const { status, notes } = req.body;
    
    log(`Processing team status update. TeamID: ${teamId}, Status: ${status}, Notes: ${notes ? 'provided' : 'none'}`, 'admin');
    
    const validStatuses: TeamStatus[] = ['registered', 'approved', 'rejected', 'paid', 'withdrawn', 'refunded'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
      });
    }
    
    // Get current team details before updating
    const [currentTeam] = await db.select()
      .from(teams)
      .where(eq(teams.id, parseInt(teamId)));
    
    if (!currentTeam) {
      return res.status(404).json({ error: 'Team not found' });
    }
    
    // Don't allow updating if already in the same status
    if (currentTeam.status === status) {
      return res.status(400).json({ error: `Team is already ${status}` });
    }
    
    log(`Team found. Current status: ${currentTeam.status}, Updating to: ${status}`, 'admin');
    
    // Update the team status
    const [updatedTeam] = await db.update(teams)
      .set({ 
        status, 
        notes: notes || null, // Using notes instead of adminNotes to match schema
        updatedAt: new Date().toISOString()
      })
      .where(eq(teams.id, parseInt(teamId)))
      .returning();
    
    log(`Team status updated successfully to ${status}`, 'admin');
    
    // Handle email notifications in a separate try/catch to prevent errors from affecting the response
    let emailStatus = 'not_sent';
    
    // Wrap the entire email process in a try-catch to isolate it completely
    try {
      // Get event details for email
      const [event] = await db.select()
        .from(events)
        .where(eq(events.id, currentTeam.eventId));
        
      // Send to both the submitter and the manager if they're different
      const emailRecipients = [currentTeam.submitterEmail];
      
      // If manager email is different from submitter, add them too
      if (currentTeam.managerEmail && currentTeam.managerEmail !== currentTeam.submitterEmail) {
        emailRecipients.push(currentTeam.managerEmail);
      }
      
      // Determine email template based on status
      let emailTemplate = 'team_status_update';
      if (status === 'approved') emailTemplate = 'team_approved';
      if (status === 'rejected') emailTemplate = 'team_rejected';
      if (status === 'withdrawn') emailTemplate = 'team_withdrawn';
      
      log(`Using email template: ${emailTemplate} for notification`, 'admin');
      
      // Send notification to all recipients
      for (const recipient of emailRecipients) {
        if (recipient) {
          const templateData = {
            teamName: currentTeam.name,
            eventName: event?.name || 'the event',
            notes: notes || '',
            status: status,
            loginLink: `${process.env.PUBLIC_URL || ''}/dashboard`,
            previousStatus: currentTeam.status || 'registered'
          };
          
          await sendTemplatedEmail(
            recipient,
            emailTemplate,
            templateData
          );
          
          log(`Email notification sent to ${recipient}`, 'admin');
        }
      }
      
      emailStatus = 'sent';
    } catch (emailError) {
      // Log email error but don't let it affect the response
      log(`Failed to send status notification email: ${emailError}`, 'admin');
      emailStatus = 'failed';
    } finally {
      // Ensure we return a JSON response with the updated team data
      // regardless of what happened with the email notification
      return res.json({
        status: 'success',
        team: updatedTeam,
        notification: {
          status: emailStatus,
          message: emailStatus === 'sent' 
            ? 'Email notification sent successfully' 
            : emailStatus === 'failed' 
              ? 'Status updated but email notification failed' 
              : 'No email notification attempted'
        }
      });
    }
  } catch (error) {
    // Log the full error for debugging
    log(`Error updating team status: ${error}`, 'admin');
    if (error instanceof Error) {
      log(`Error stack: ${error.stack}`, 'admin');
    }
    
    // Always return a JSON response, even for errors
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
    const { reason } = req.body;
    
    log(`Processing refund for team ID: ${teamId}. Reason: ${reason || 'Not provided'}`, 'admin');
    
    // Get team details
    const [team] = await db.select()
      .from(teams)
      .where(eq(teams.id, parseInt(teamId)));
    
    if (!team) {
      return res.status(404).json({ 
        status: 'error',
        error: 'Team not found' 
      });
    }
    
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
    
    if (team.paymentIntentId) {
      try {
        // Process the refund via Stripe
        const refund = await createRefund(team.paymentIntentId, reason);
        refundId = refund.id;
        stripeRefundStatus = 'success';
        log(`Stripe refund processed successfully. Refund ID: ${refundId}`, 'admin');
      } catch (stripeError) {
        stripeRefundStatus = 'failed';
        log(`Stripe refund failed: ${stripeError}. Proceeding with manual refund tracking.`, 'admin');
      }
    } else if (isDevelopment) {
      try {
        // For testing in development mode, create a test payment intent and immediately refund it
        // This creates proper Stripe records for testing
        log(`Creating test payment intent for refund testing in development mode`, 'admin');
        
        // First, create a test payment intent that's already paid
        const testIntent = await createTestPaymentIntent(refundAmount * 100, {
          teamId: teamId,
          teamName: team.name,
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
            .where(eq(teams.id, parseInt(teamId)));
            
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
    const [updatedTeam] = await db.update(teams)
      .set({ 
        status: 'refunded',
        refundDate: new Date().toISOString(),
        notes: reason ? `${team.notes || ''} \nRefund reason: ${reason}`.trim() : team.notes,
        updatedAt: new Date().toISOString()
      })
      .where(eq(teams.id, parseInt(teamId)))
      .returning();
    
    log(`Team database record updated to refunded status`, 'admin');
    
    // Handle email notifications in a separate try/catch to prevent errors from affecting the response
    let emailStatus = 'not_sent';
    
    try {
      // Get event details for email
      const [event] = await db.select()
        .from(events)
        .where(eq(events.id, team.eventId));
        
      // Send to both the submitter and the manager if they're different
      const emailRecipients = [team.submitterEmail];
      
      // If manager email is different from submitter, add them too
      if (team.managerEmail && team.managerEmail !== team.submitterEmail) {
        emailRecipients.push(team.managerEmail);
      }
      
      // Send notification to all recipients
      for (const recipient of emailRecipients) {
        if (recipient) {
          await sendTemplatedEmail(
            recipient,
            'payment_refunded',
            {
              teamName: team.name,
              eventName: event?.name || 'the event',
              amount: (((team.totalAmount || team.registrationFee || 0) / 100).toFixed(2)),
              reason: reason || 'Team registration was refunded',
              refundDate: new Date().toLocaleDateString()
            }
          );
          
          log(`Refund notification email sent to ${recipient}`, 'admin');
        }
      }
      
      emailStatus = 'sent';
    } catch (emailError) {
      // Log email error but don't let it affect the response
      log(`Failed to send refund notification email: ${emailError}`, 'admin');
      emailStatus = 'failed';
    }
    
    // Return a consistent JSON response format with detailed status info
    return res.json({
      status: 'success',
      message: 'Refund processed successfully',
      team: updatedTeam,
      refund: {
        id: refundId,
        stripeStatus: stripeRefundStatus,
        amount: ((team.totalAmount || team.registrationFee || 0) / 100).toFixed(2),
        date: new Date().toISOString()
      },
      notification: {
        status: emailStatus,
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