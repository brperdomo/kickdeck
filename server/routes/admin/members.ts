import { Request, Response } from 'express';
import { db } from '@db/index';
import { users, teams, events, eventAgeGroups, players } from '@db/schema';
import { eq, like, and, or, desc, asc } from 'drizzle-orm';
import { sendTemplatedEmail } from '../../services/emailService';
import { SQL, sql } from 'drizzle-orm';

/**
 * Get all members in the system with search and pagination
 */
export async function getAllMembers(req: Request, res: Response) {
  try {
    const { search, page = '1', limit = '10', sort = 'lastName', order = 'asc' } = req.query;
    const pageNumber = parseInt(page as string);
    const limitNumber = parseInt(limit as string);
    const offset = (pageNumber - 1) * limitNumber;
    
    // Build search conditions if search parameter is provided
    let whereClause: SQL<unknown> | undefined;
    if (search) {
      const searchTerm = `%${search}%`;
      whereClause = or(
        like(users.firstName, searchTerm),
        like(users.lastName, searchTerm),
        like(users.email, searchTerm),
        like(users.username, searchTerm)
      );
    }
    
    // Get total count for pagination
    const countQuery = whereClause 
      ? db.select({ count: sql<number>`count(*)` }).from(users).where(whereClause)
      : db.select({ count: sql<number>`count(*)` }).from(users);
    
    const [countResult] = await countQuery;
    const totalCount = countResult?.count || 0;
    
    // Build sort order
    const sortColumn = sort === 'firstName' ? users.firstName : 
                       sort === 'email' ? users.email : 
                       sort === 'createdAt' ? users.createdAt : 
                       users.lastName;
                       
    const sortOrder = order === 'desc' ? desc(sortColumn) : asc(sortColumn);
    
    // Get paginated results
    const membersQuery = whereClause
      ? db.select().from(users).where(whereClause).orderBy(sortOrder).limit(limitNumber).offset(offset)
      : db.select().from(users).orderBy(sortOrder).limit(limitNumber).offset(offset);
    
    const members = await membersQuery;
    
    // Return paginated results with metadata
    res.json({
      members,
      pagination: {
        total: totalCount,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(totalCount / limitNumber)
      }
    });
  } catch (error) {
    console.error('Error fetching members:', error);
    res.status(500).json({ error: 'Failed to fetch members' });
  }
}

/**
 * Get member details by ID with their registrations
 */
export async function getMemberById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const memberId = parseInt(id);
    
    // Get member basic information
    const [member] = await db
      .select()
      .from(users)
      .where(eq(users.id, memberId))
      .limit(1);
    
    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }
    
    // Get all team registrations submitted by this member
    const teamRegistrations = await db
      .select({
        team: teams,
        event: events,
        ageGroup: eventAgeGroups
      })
      .from(teams)
      .leftJoin(events, eq(teams.eventId, events.id))
      .leftJoin(eventAgeGroups, eq(teams.ageGroupId, eventAgeGroups.id))
      .where(eq(teams.userId, memberId))
      .orderBy(desc(teams.createdAt));
    
    // Get count of players registered by this member
    const [playerCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(players)
      .leftJoin(teams, eq(players.teamId, teams.id))
      .where(eq(teams.userId, memberId));
    
    // Transform team registrations to match the frontend's expected format
    const formattedRegistrations = teamRegistrations.map(reg => ({
      id: reg.team.id,
      teamName: reg.team.name,
      eventName: reg.event?.name || 'Unknown Event',
      ageGroup: reg.ageGroup?.ageGroup || 'Unknown Age Group',
      registrationDate: reg.team.createdAt,
      status: reg.team.status || 'pending',
      amountPaid: reg.team.registrationFee || 0,
      termsAccepted: reg.team.termsAcknowledged || false,
      termsAcceptedAt: reg.team.termsAcknowledgedAt || reg.team.createdAt
    }));
    
    res.json({
      member,
      registrations: formattedRegistrations,
      playerCount: playerCount?.count || 0
    });
  } catch (error) {
    console.error('Error fetching member details:', error);
    res.status(500).json({ error: 'Failed to fetch member details' });
  }
}

/**
 * Get team registration details
 */
export async function getTeamRegistrationDetails(req: Request, res: Response) {
  try {
    const { teamId } = req.params;
    const teamIdNumber = parseInt(teamId);
    
    // Get team registration details with related information
    const [registration] = await db
      .select({
        team: teams,
        event: events,
        ageGroup: eventAgeGroups
      })
      .from(teams)
      .leftJoin(events, eq(teams.eventId, events.id))
      .leftJoin(eventAgeGroups, eq(teams.ageGroupId, eventAgeGroups.id))
      .where(eq(teams.id, teamIdNumber))
      .limit(1);
    
    if (!registration) {
      return res.status(404).json({ error: 'Team registration not found' });
    }
    
    // Get players registered for this team
    const teamPlayers = await db
      .select()
      .from(players)
      .where(eq(players.teamId, teamIdNumber))
      .orderBy(asc(players.lastName));
    
    // Get submitter information
    let submitter = null;
    if (registration.team.userId) {
      [submitter] = await db
        .select()
        .from(users)
        .where(eq(users.id, registration.team.userId))
        .limit(1);
    }
    
    res.json({
      registration,
      players: teamPlayers,
      submitter
    });
  } catch (error) {
    console.error('Error fetching registration details:', error);
    res.status(500).json({ error: 'Failed to fetch registration details' });
  }
}

/**
 * Resend payment confirmation email
 */
export async function resendPaymentConfirmation(req: Request, res: Response) {
  try {
    const { teamId } = req.params;
    const teamIdNumber = parseInt(teamId);
    
    // Get registration details
    const [registration] = await db
      .select({
        team: teams,
        event: events,
        ageGroup: eventAgeGroups
      })
      .from(teams)
      .leftJoin(events, eq(teams.eventId, events.id))
      .leftJoin(eventAgeGroups, eq(teams.ageGroupId, eventAgeGroups.id))
      .where(eq(teams.id, teamIdNumber))
      .limit(1);
    
    if (!registration) {
      return res.status(404).json({ error: 'Team registration not found' });
    }
    
    // Get submitter email
    let submitterEmail = registration.team.managerEmail; // Default to team manager email
    
    if (registration.team.userId) {
      const [submitter] = await db
        .select()
        .from(users)
        .where(eq(users.id, registration.team.userId))
        .limit(1);
      
      if (submitter) {
        submitterEmail = submitter.email;
      }
    }
    
    // Format fee amount for display
    const feeAmount = registration.team.registrationFee 
      ? `$${(registration.team.registrationFee / 100).toFixed(2)}` 
      : 'N/A';
    
    // Send confirmation email
    await sendTemplatedEmail(
      submitterEmail,
      'payment_confirmation',
      {
        teamName: registration.team.name,
        eventName: registration.event.name,
        registrationDate: new Date(registration.team.createdAt).toLocaleDateString(),
        amount: feeAmount,
        ageGroup: registration.ageGroup.ageGroup,
        paymentId: `TEAM-${registration.team.id}`,
        receiptNumber: `R-${registration.team.id}-${Date.now().toString().substr(-6)}`,
        status: registration.team.status
      }
    );
    
    res.json({ 
      success: true, 
      message: `Payment confirmation email sent to ${submitterEmail}` 
    });
  } catch (error) {
    console.error('Error resending payment confirmation:', error);
    res.status(500).json({ error: 'Failed to resend payment confirmation email' });
  }
}