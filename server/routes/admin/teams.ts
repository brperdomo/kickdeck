import { Request, Response } from 'express';
import { db } from '../../db';
import { teams, events, users } from '../../db/schema';
import { eq, and, or, like, asc, desc } from 'drizzle-orm';
import { createRefund } from '../../services/stripeService';
import { log } from '../../vite';
import { sendTemplatedEmail } from '../../services/emailService';

type TeamStatus = 'REGISTERED' | 'APPROVED' | 'REJECTED';

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
    .leftJoin(users, eq(teams.userId, users.id));
    
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
          like(teams.contactEmail, searchTerm as string)
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
    .leftJoin(users, eq(teams.userId, users.id))
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
 * Update a team's status (approve/reject)
 */
export async function updateTeamStatus(req: Request, res: Response) {
  try {
    const { teamId } = req.params;
    const { status, notes } = req.body;
    
    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be APPROVED or REJECTED' });
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
      return res.status(400).json({ error: `Team is already ${status.toLowerCase()}` });
    }
    
    // Update the team status
    const [updatedTeam] = await db.update(teams)
      .set({ 
        status, 
        adminNotes: notes || null,
        updatedAt: new Date().toISOString()
      })
      .where(eq(teams.id, parseInt(teamId)))
      .returning();
    
    // Get event details for email
    const [event] = await db.select()
      .from(events)
      .where(eq(events.id, currentTeam.eventId));
      
    // Send email notification based on the new status
    try {
      await sendTemplatedEmail(
        currentTeam.contactEmail,
        status === 'APPROVED' ? 'team_approved' : 'team_rejected',
        {
          teamName: currentTeam.name,
          eventName: event?.name || 'the event',
          notes: notes || '',
          loginLink: `${process.env.PUBLIC_URL || ''}/dashboard`
        }
      );
    } catch (emailError) {
      // Log email error but don't fail the request
      log(`Failed to send status notification email: ${emailError}`, 'admin');
    }
    
    res.json(updatedTeam);
  } catch (error) {
    log(`Error updating team status: ${error}`, 'admin');
    res.status(500).json({ error: 'Failed to update team status' });
  }
}

/**
 * Process a refund for a team registration
 */
export async function processRefund(req: Request, res: Response) {
  try {
    const { teamId } = req.params;
    const { reason } = req.body;
    
    // Get team details
    const [team] = await db.select()
      .from(teams)
      .where(eq(teams.id, parseInt(teamId)));
    
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    
    // Check if team has a payment intent to refund
    if (!team.paymentIntentId) {
      return res.status(400).json({ error: 'No payment found for this team' });
    }
    
    // Check if team is already refunded
    if (team.refundStatus === 'REFUNDED') {
      return res.status(400).json({ error: 'This team registration has already been refunded' });
    }
    
    // Process the refund via Stripe
    const refund = await createRefund(team.paymentIntentId, reason);
    
    // Update the team record with refund details
    const [updatedTeam] = await db.update(teams)
      .set({ 
        refundStatus: 'REFUNDED',
        refundDate: new Date().toISOString(),
        adminNotes: reason ? `${team.adminNotes || ''} \nRefund reason: ${reason}`.trim() : team.adminNotes,
        updatedAt: new Date().toISOString()
      })
      .where(eq(teams.id, parseInt(teamId)))
      .returning();
    
    // Get event details for email
    const [event] = await db.select()
      .from(events)
      .where(eq(events.id, team.eventId));
      
    // Send email notification about the refund
    try {
      await sendTemplatedEmail(
        team.contactEmail,
        'payment_refunded',
        {
          teamName: team.name,
          eventName: event?.name || 'the event',
          amount: ((team.amountPaid || 0) / 100).toFixed(2),
          reason: reason || 'Team registration was rejected',
          refundDate: new Date().toLocaleDateString()
        }
      );
    } catch (emailError) {
      // Log email error but don't fail the request
      log(`Failed to send refund notification email: ${emailError}`, 'admin');
    }
    
    res.json({
      success: true,
      message: 'Refund processed successfully',
      team: updatedTeam,
      refundId: refund.id
    });
  } catch (error) {
    log(`Error processing refund: ${error}`, 'admin');
    res.status(500).json({ error: 'Failed to process refund' });
  }
}