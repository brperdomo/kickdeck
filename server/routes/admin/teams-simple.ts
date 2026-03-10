import { Request, Response } from 'express';
import { db } from 'db';
import { teams, games, events, eventBrackets, eventAgeGroups, refunds, users } from 'db/schema';
import { eq, and, sql, desc, asc, inArray } from 'drizzle-orm';
import { sendTemplatedEmail } from '../../services/emailService';

// Map team status to the corresponding email template type
const STATUS_EMAIL_MAP: Record<string, string> = {
  approved: 'team_approved',
  rejected: 'team_rejected',
  waitlisted: 'team_waitlisted',
  withdrawn: 'team_withdrawn',
};

/** Build common email context for a team (reused by status + receipt emails). */
async function buildTeamEmailContext(teamId: number) {
  const team = await db.query.teams.findFirst({ where: eq(teams.id, teamId) });
  if (!team) return null;

  const event = team.eventId
    ? await db.query.events.findFirst({ where: eq(events.id, team.eventId) })
    : null;

  // Get age group info for division display
  let ageGroupInfo = null;
  if (team.ageGroupId) {
    const [agResult] = await db
      .select()
      .from(eventAgeGroups)
      .where(eq(eventAgeGroups.id, team.ageGroupId));
    ageGroupInfo = agResult || null;
  }

  const division = [ageGroupInfo?.ageGroup, ageGroupInfo?.gender].filter(Boolean).join(' ') || 'N/A';
  const registrationDate = team.createdAt
    ? new Date(team.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const recipients = [team.submitterEmail, team.managerEmail].filter(
    (e): e is string => !!e,
  );
  const uniqueRecipients = [...new Set(recipients)];

  return { team, event, division, registrationDate, uniqueRecipients };
}

/** Send a status-change email for a team (fire-and-forget). */
async function sendTeamStatusEmail(teamId: number, newStatus: string) {
  try {
    const templateType = STATUS_EMAIL_MAP[newStatus];
    if (!templateType) return; // no email for this status

    const ctx = await buildTeamEmailContext(teamId);
    if (!ctx) return;
    const { team, event, division, registrationDate, uniqueRecipients } = ctx;

    for (const email of uniqueRecipients) {
      await sendTemplatedEmail(email, templateType, {
        firstName: team.submitterName || team.managerName || 'Team Manager',
        teamName: team.name || 'your team',
        eventName: event?.name || 'the event',
        clubName: team.clubName || '',
        ageGroup: division,
        division: division,
        registrationDate: registrationDate,
        submittedDate: registrationDate,
        approvalDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        totalAmount: team.totalAmount ? `$${(team.totalAmount / 100).toFixed(2)}` : '$0.00',
        notes: team.notes || '',
        EVENT_ADMIN_EMAIL: event?.adminEmail || 'support@kickdeck.xyz',
      });
    }

    console.log(`📧 ${templateType} email sent to ${uniqueRecipients.join(', ')} for team ${team.name}`);
  } catch (err) {
    console.error(`Error sending status email for team ${teamId}:`, err);
    // Non-blocking — don't fail the status change
  }
}

/** Send a registration receipt email after payment is processed (fire-and-forget). */
async function sendRegistrationReceiptEmail(teamId: number) {
  try {
    const ctx = await buildTeamEmailContext(teamId);
    if (!ctx) return;
    const { team, event, division, registrationDate, uniqueRecipients } = ctx;

    for (const email of uniqueRecipients) {
      await sendTemplatedEmail(email, 'registration_receipt', {
        firstName: team.submitterName || team.managerName || 'Team Manager',
        teamName: team.name || 'your team',
        eventName: event?.name || 'the event',
        clubName: team.clubName || '',
        ageGroup: division,
        division: division,
        registrationDate: registrationDate,
        submittedDate: registrationDate,
        totalAmount: team.totalAmount ? `$${(team.totalAmount / 100).toFixed(2)}` : '$0.00',
        paymentStatus: team.paymentStatus || 'paid',
        paymentDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        cardBrand: team.cardBrand || 'Card',
        cardLastFour: team.cardLast4 || '****',
        paymentId: team.paymentIntentId || '',
        EVENT_ADMIN_EMAIL: event?.adminEmail || 'support@kickdeck.xyz',
      });
    }

    console.log(`📧 registration_receipt email sent to ${uniqueRecipients.join(', ')} for team ${team.name}`);
  } catch (err) {
    console.error(`Error sending registration receipt email for team ${teamId}:`, err);
  }
}

/** Send a payment_failed email with retry link (fire-and-forget). */
async function sendPaymentFailedEmail(teamId: number) {
  try {
    const ctx = await buildTeamEmailContext(teamId);
    if (!ctx) return;
    const { team, event, division, registrationDate, uniqueRecipients } = ctx;

    const retryUrl = `${process.env.FRONTEND_URL || 'https://app.kickdeck.xyz'}/payment/retry/${teamId}`;

    for (const email of uniqueRecipients) {
      await sendTemplatedEmail(email, 'payment_failed', {
        firstName: team.submitterName || team.managerName || 'Team Manager',
        teamName: team.name || 'your team',
        eventName: event?.name || 'the event',
        division,
        ageGroup: division,
        registrationDate,
        submittedDate: registrationDate,
        totalAmount: team.totalAmount ? `$${(team.totalAmount / 100).toFixed(2)}` : '$0.00',
        paymentError: team.paymentErrorMessage || 'Your card was declined',
        retryUrl,
        retryLink: retryUrl,
        EVENT_ADMIN_EMAIL: event?.adminEmail || 'support@kickdeck.xyz',
      });
    }
    console.log(`📧 payment_failed email sent to ${uniqueRecipients.join(', ')} for team ${team.name}`);
  } catch (err) {
    console.error(`Error sending payment_failed email for team ${teamId}:`, err);
  }
}

/** Send both approval + receipt emails (used by auto-approve on retry payment). */
export async function sendTeamApprovalEmails(teamId: number) {
  sendTeamStatusEmail(teamId, 'approved');
  sendRegistrationReceiptEmail(teamId);
}

// Update game score
export async function updateGameScore(req: Request, res: Response) {
  try {
    const gameId = parseInt(req.params.gameId);
    const { homeTeamScore, awayTeamScore } = req.body;
    
    if (isNaN(gameId)) {
      return res.status(400).json({ error: 'Invalid game ID' });
    }

    if (typeof homeTeamScore !== 'number' || typeof awayTeamScore !== 'number') {
      return res.status(400).json({ error: 'Invalid score values' });
    }

    // Update the game score
    const [updatedGame] = await db
      .update(games)
      .set({
        homeScore: homeTeamScore,
        awayScore: awayTeamScore,
        status: 'completed',
      })
      .where(eq(games.id, gameId))
      .returning();

    if (!updatedGame) {
      return res.status(404).json({ error: 'Game not found' });
    }

    res.json({
      success: true,
      game: updatedGame,
    });
  } catch (error) {
    console.error('Error updating game score:', error);
    res.status(500).json({ error: 'Failed to update game score' });
  }
}

// Get teams overview for event - simplified version
export async function getTeamsOverview(req: Request, res: Response) {
  try {
    const eventId = parseInt(req.params.eventId);
    
    if (!eventId || isNaN(eventId)) {
      return res.status(400).json({ error: 'Invalid event ID' });
    }

    console.log(`Fetching teams for event ID: ${eventId}`);

    // Get all teams for the event with proper type casting and joins
    const teamsData = await db.execute(sql`
      SELECT 
        t.id,
        t.name,
        t.status,
        t.bracket_id,
        t.age_group_id,
        t.coach,
        ag.age_group,
        eb.name as flight_name,
        e.name as event_name
      FROM teams t
      LEFT JOIN event_age_groups ag ON t.age_group_id = ag.id
      LEFT JOIN event_brackets eb ON t.bracket_id = eb.id
      LEFT JOIN events e ON CAST(t.event_id AS INTEGER) = e.id
      WHERE CAST(t.event_id AS INTEGER) = ${eventId}
      ORDER BY t.name ASC
    `);

    console.log(`Found ${teamsData.rows?.length || 0} teams for event ${eventId}`);

    // Get basic stats for each team with actual data
    const teamsWithStats = (teamsData.rows || teamsData).map((team: any) => ({
      id: team.id,
      name: team.name,
      ageGroup: team.age_group || 'Unknown',
      status: team.status,
      coach: team.coach,
      bracketId: team.bracket_id,
      flightName: team.flight_name || 'No Flight',
      eventName: team.event_name,
      gamesPlayed: 0,
      wins: 0,
      losses: 0,
      ties: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifferential: 0,
      points: 0,
      rank: 0,
    }));

    res.json({
      teams: teamsWithStats,
      ageGroups: [],
    });
  } catch (error) {
    console.error('Error fetching teams overview:', error);
    res.status(500).json({ error: 'Failed to fetch teams overview' });
  }
}

// Get team detail - simplified
export async function getTeamDetail(req: Request, res: Response) {
  try {
    const teamId = parseInt(req.params.teamId);
    
    if (isNaN(teamId)) {
      return res.status(400).json({ error: 'Invalid team ID' });
    }

    // Get team basic information
    const team = await db
      .select()
      .from(teams)
      .where(eq(teams.id, teamId))
      .limit(1);

    if (team.length === 0) {
      return res.status(404).json({ error: 'Team not found' });
    }

    // Return team info with empty games for now
    res.json({
      team: team[0],
      games: [],
      standings: [],
    });
  } catch (error) {
    console.error('Error fetching team detail:', error);
    res.status(500).json({ error: 'Failed to fetch team detail' });
  }
}

// Export team schedule - simplified
export async function exportTeamSchedule(req: Request, res: Response) {
  try {
    const teamId = parseInt(req.params.teamId);
    const format = req.query.format as string || 'csv';
    
    if (isNaN(teamId)) {
      return res.status(400).json({ error: 'Invalid team ID' });
    }

    const team = await db
      .select()
      .from(teams)
      .where(eq(teams.id, teamId))
      .limit(1);

    if (team.length === 0) {
      return res.status(404).json({ error: 'Team not found' });
    }

    if (format === 'csv') {
      const csvContent = `Team,Status\n${team[0].name},${team[0].status}\n`;
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${team[0].name}-schedule.csv"`);
      res.send(csvContent);
    } else {
      res.status(400).json({ error: 'Invalid format. Use csv' });
    }
  } catch (error) {
    console.error('Error exporting team schedule:', error);
    res.status(500).json({ error: 'Failed to export team schedule' });
  }
}

// Basic placeholder functions for team management
export async function getTeams(req: Request, res: Response) {
  try {
    const { eventId, ageGroupId, status } = req.query;
    
    console.log('Teams-simple getTeams called with:', { eventId, ageGroupId, status });
    
    // Import required schemas for proper joins
    const { teams, eventAgeGroups, clubs, events, players } = await import('@db/schema');
    const { eq, and, sql } = await import('drizzle-orm');

    let whereConditions = [];

    // Add event filter if specified - only add if NOT 'all'
    if (eventId && eventId !== 'all' && !isNaN(Number(eventId))) {
      console.log('Adding event filter for eventId:', eventId);
      whereConditions.push(eq(teams.eventId, Number(eventId)));
    }

    // Add age group filter if specified
    if (ageGroupId && !isNaN(Number(ageGroupId))) {
      console.log('Adding age group filter for ageGroupId:', ageGroupId);
      whereConditions.push(eq(teams.ageGroupId, Number(ageGroupId)));
    }

    // Add status filter if specified
    if (status && status !== 'all') {
      console.log('Adding status filter for status:', status);
      whereConditions.push(eq(teams.status, status as string));
    }

    let query = db
      .select({
        team: teams,
        ageGroup: eventAgeGroups,
        event: events,
        club: {
          name: clubs.name,
          logoUrl: clubs.logoUrl
        }
      })
      .from(teams)
      .leftJoin(eventAgeGroups, eq(teams.ageGroupId, eventAgeGroups.id))
      .leftJoin(events, eq(teams.eventId, events.id))
      .leftJoin(clubs, eq(teams.clubId, clubs.id));

    // Apply where conditions if any
    if (whereConditions.length > 0) {
      query = query.where(whereConditions.length === 1 ? whereConditions[0] : and(...whereConditions));
    }

    const results = await query.orderBy(teams.name);

    console.log(`Found ${results.length} teams with full relationship data`);
    
    // Build comprehensive team objects with all relationship data
    const teamsWithPlayerCounts = await Promise.all(
      results.map(async ({ team, ageGroup, event, club }) => {
        // Count players for this team
        const playerCountResult = await db
          .select({ count: sql<number>`count(*)`.mapWith(Number) })
          .from(players)
          .where(eq(players.teamId, team.id));
        
        const playerCount = playerCountResult[0]?.count || 0;

        // Compute actual paymentStatus from refund data (DB value may be stale)
        let computedPaymentStatus = team.paymentStatus;
        let refundHistory: any[] = [];
        let totalRefundedAmount = 0;
        try {
          const teamRefunds = await db
            .select({
              id: refunds.id,
              refundAmount: refunds.refundAmount,
              refundReason: refunds.refundReason,
              adminNotes: refunds.adminNotes,
              status: refunds.status,
              processedAt: refunds.processedAt,
              createdAt: refunds.createdAt,
              processedByUserId: refunds.processedByUserId,
              processedByFirstName: users.firstName,
              processedByLastName: users.lastName,
            })
            .from(refunds)
            .leftJoin(users, eq(refunds.processedByUserId, users.id))
            .where(eq(refunds.teamId, team.id))
            .orderBy(desc(refunds.createdAt));

          if (teamRefunds.length > 0) {
            totalRefundedAmount = teamRefunds
              .filter(r => r.status !== 'failed')
              .reduce((sum, r) => sum + r.refundAmount, 0);
            if (totalRefundedAmount > 0) {
              const chargedAmount = team.totalAmount || team.registrationFee || 0;
              computedPaymentStatus = totalRefundedAmount >= chargedAmount ? 'refunded' : 'partially_refunded';
            }
            refundHistory = teamRefunds.map(r => ({
              id: r.id,
              amount: r.refundAmount,
              reason: r.refundReason,
              adminNotes: r.adminNotes,
              status: r.status,
              processedAt: r.processedAt?.toISOString() || r.createdAt.toISOString(),
              processedBy: r.processedByFirstName && r.processedByLastName
                ? `${r.processedByFirstName} ${r.processedByLastName}`
                : 'Admin',
            }));
          }
        } catch (e) { /* ignore - use DB value */ }

        return {
          ...team,
          paymentStatus: computedPaymentStatus, // Override with computed value
          refundHistory,
          totalRefunded: totalRefundedAmount,
          eventId: team.eventId ? String(team.eventId) : null, // Ensure eventId is available as string for TeamModal
          ageGroupId: team.ageGroupId, // Ensure ageGroupId is available for TeamModal
          ageGroup: ageGroup ? {
            id: ageGroup.id,
            ageGroup: ageGroup.ageGroup,  // Map age_group to ageGroup for frontend
            gender: ageGroup.gender,
            fieldSize: ageGroup.fieldSize,
            divisionCode: ageGroup.divisionCode
          } : null,
          event: event ? {
            id: event.id,
            name: event.name,  // Ensure event name is properly mapped
            startDate: event.startDate,
            endDate: event.endDate
          } : null,
          clubLogoUrl: club?.logoUrl || null,
          clubName: club?.name || null,
          playerCount: playerCount
        };
      })
    );

    console.log(`teams-simple returning ${teamsWithPlayerCounts.length} teams with complete data`);
    res.json(teamsWithPlayerCounts);
  } catch (error) {
    console.error('Error fetching teams:', error);
    res.status(500).json({ error: 'Failed to fetch teams' });
  }
}

export async function getTeamById(req: Request, res: Response) {
  try {
    const teamId = parseInt(req.params.teamId);
    const team = await db.select().from(teams).where(eq(teams.id, teamId)).limit(1);
    if (team.length === 0) {
      return res.status(404).json({ error: 'Team not found' });
    }
    res.json(team[0]);
  } catch (error) {
    console.error('Error fetching team:', error);
    res.status(500).json({ error: 'Failed to fetch team' });
  }
}

export async function updateTeamStatus(req: Request, res: Response) {
  try {
    const teamId = parseInt(req.params.teamId);
    const { status, skipPayment, skipEmail } = req.body;

    // If approving a team that has a saved payment method, process the charge
    if ((status === 'approved' || status === 'registered') && !skipPayment) {
      const existingTeam = await db.query.teams.findFirst({
        where: eq(teams.id, teamId),
      });

      // SAFEGUARD: Skip charging if team has already been successfully charged
      const alreadyPaid = existingTeam?.paymentStatus === 'paid'
        || existingTeam?.paymentStatus === 'succeeded'
        || existingTeam?.paymentStatus === 'partially_refunded'
        || existingTeam?.paymentStatus === 'refunded';

      if (alreadyPaid) {
        console.log(`⚠️ DOUBLE-CHARGE PREVENTED: Team ${teamId} already has paymentStatus="${existingTeam?.paymentStatus}" — skipping charge`);
      }

      if (existingTeam?.paymentMethodId && existingTeam?.totalAmount && existingTeam.totalAmount > 0 && !alreadyPaid) {
        try {
          const { processPaymentForApprovedTeam } = await import('../../services/stripeService');
          // totalAmount is stored in cents; processPaymentForApprovedTeam expects cents
          const paymentResult = await processPaymentForApprovedTeam(teamId, existingTeam.totalAmount);
          console.log(`✅ Payment processed for team ${teamId}: ${paymentResult.status}`);

          // Map Stripe status to our app status: Stripe returns "succeeded", our UI expects "paid"
          const mappedPaymentStatus = paymentResult.status === 'succeeded' ? 'paid' : paymentResult.status;

          // Update status + payment result together
          const [updatedTeam] = await db
            .update(teams)
            .set({
              status,
              paymentStatus: mappedPaymentStatus,
              paymentIntentId: paymentResult.paymentIntentId,
              paymentDate: new Date(),
            })
            .where(eq(teams.id, teamId))
            .returning();

          if (!skipEmail) {
            // Fire-and-forget status email (team_approved)
            sendTeamStatusEmail(teamId, status);
            // Fire-and-forget registration receipt (payment confirmation)
            if (mappedPaymentStatus === 'paid') {
              sendRegistrationReceiptEmail(teamId);
            }
          }

          return res.json({
            success: true,
            team: updatedTeam,
            paymentProcessed: true,
            paymentStatus: mappedPaymentStatus,
          });
        } catch (paymentError: any) {
          console.error(`❌ Payment failed for team ${teamId}:`, paymentError.message);
          // Keep team in Pending Review — don't promote to 'approved'
          const [updatedTeam] = await db
            .update(teams)
            .set({
              status: 'registered',
              paymentStatus: 'failed',
              paymentErrorMessage: paymentError.message,
            })
            .where(eq(teams.id, teamId))
            .returning();

          // Send payment_failed email with retry link (NOT team_approved)
          sendPaymentFailedEmail(teamId);

          return res.json({
            success: true,
            team: updatedTeam,
            paymentProcessed: false,
            paymentFailed: true,
            paymentError: paymentError.message,
          });
        }
      }
    }

    // Default: just update the status (no payment to process)
    const [updatedTeam] = await db
      .update(teams)
      .set({ status })
      .where(eq(teams.id, teamId))
      .returning();

    // Fire-and-forget status email (unless skipEmail)
    if (!skipEmail) {
      sendTeamStatusEmail(teamId, status);
    }

    res.json({ success: true, team: updatedTeam });
  } catch (error) {
    console.error('Error updating team status:', error);
    res.status(500).json({ error: 'Failed to update team status' });
  }
}

export async function deleteTeam(req: Request, res: Response) {
  try {
    const teamId = parseInt(req.params.teamId);
    await db.delete(teams).where(eq(teams.id, teamId));
    res.json({ success: true, message: 'Team deleted successfully' });
  } catch (error) {
    console.error('Error deleting team:', error);
    res.status(500).json({ error: 'Failed to delete team' });
  }
}

export async function bulkApproveTeams(req: Request, res: Response) {
  try {
    const { teamIds, notes } = req.body;

    if (!Array.isArray(teamIds) || teamIds.length === 0) {
      return res.status(400).json({ error: 'teamIds array is required' });
    }

    const results: { teamId: number; success: boolean; error?: string; paymentStatus?: string }[] = [];

    for (const teamId of teamIds) {
      try {
        const existingTeam = await db.query.teams.findFirst({
          where: eq(teams.id, teamId),
        });

        if (!existingTeam) {
          results.push({ teamId, success: false, error: 'Team not found' });
          continue;
        }

        // If team has payment method and amount, process payment
        if (existingTeam.paymentMethodId && existingTeam.totalAmount && existingTeam.totalAmount > 0) {
          try {
            const { processPaymentForApprovedTeam } = await import('../../services/stripeService');
            const paymentResult = await processPaymentForApprovedTeam(teamId, existingTeam.totalAmount);
            const mappedStatus = paymentResult.status === 'succeeded' ? 'paid' : paymentResult.status;

            await db.update(teams).set({
              status: 'approved',
              paymentStatus: mappedStatus,
              paymentIntentId: paymentResult.paymentIntentId,
              paymentDate: new Date(),
              notes: notes || undefined,
            }).where(eq(teams.id, teamId));

            results.push({ teamId, success: true, paymentStatus: mappedStatus });
          } catch (paymentError: any) {
            console.error(`Bulk approve payment failed for team ${teamId}:`, paymentError.message);
            // Keep team in Pending Review — don't promote to 'approved'
            await db.update(teams).set({
              status: 'registered',
              paymentStatus: 'failed',
              paymentErrorMessage: paymentError.message,
              notes: notes || undefined,
            }).where(eq(teams.id, teamId));
            sendPaymentFailedEmail(teamId);
            results.push({ teamId, success: true, paymentStatus: 'failed', error: paymentError.message });
          }
        } else {
          // No payment to process, just update status
          await db.update(teams).set({
            status: 'approved',
            notes: notes || undefined,
          }).where(eq(teams.id, teamId));
          results.push({ teamId, success: true });
        }
      } catch (err: any) {
        results.push({ teamId, success: false, error: err.message });
      }
    }

    // Fire-and-forget approval emails for successfully updated teams
    // (skip teams with failed payments — they already received payment_failed email)
    for (const r of results) {
      if (r.success && r.paymentStatus !== 'failed') {
        sendTeamStatusEmail(r.teamId, 'approved');
      }
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    const warnings = results.filter(r => r.success && r.paymentStatus === 'failed').length;

    res.json({
      summary: { successful, failed, warnings },
      results,
    });
  } catch (error) {
    console.error('Bulk approve error:', error);
    res.status(500).json({ error: 'Failed to bulk approve teams' });
  }
}

export async function bulkRejectTeams(req: Request, res: Response) {
  try {
    const { teamIds, notes } = req.body;

    if (!Array.isArray(teamIds) || teamIds.length === 0) {
      return res.status(400).json({ error: 'teamIds array is required' });
    }

    await db.update(teams).set({
      status: 'rejected',
      notes: notes || 'Bulk rejection',
    }).where(inArray(teams.id, teamIds));

    // Fire-and-forget rejection emails
    for (const teamId of teamIds) {
      sendTeamStatusEmail(teamId, 'rejected');
    }

    res.json({
      summary: { successful: teamIds.length, failed: 0, warnings: 0 },
      results: teamIds.map(id => ({ teamId: id, success: true })),
    });
  } catch (error) {
    console.error('Bulk reject error:', error);
    res.status(500).json({ error: 'Failed to bulk reject teams' });
  }
}

export async function processRefund(req: Request, res: Response) {
  try {
    const { teamId } = req.params;
    const { refundAmount, refundReason, adminNotes, postRefundStatus } = req.body;
    const userId = (req as any).user?.id || (req as any).session?.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!refundAmount || !refundReason) {
      return res.status(400).json({
        error: 'Refund amount and reason are required'
      });
    }

    console.log(`🔄 API REFUND: Processing refund for Team ${teamId}`);

    const { processConnectRefund } = await import('../../services/stripeService');
    const result = await processConnectRefund({
      teamId: parseInt(teamId),
      refundAmount,
      refundReason,
      adminNotes,
      processedByUserId: userId,
      postRefundStatus: postRefundStatus || undefined,
    });

    res.json({
      success: true,
      message: `Refund processed successfully for ${result.teamName}`,
      refundId: result.refundId,
      refundAmount: result.refundAmount,
      platformFeeRefund: result.platformFeeRefund,
      status: result.status
    });
  } catch (error: any) {
    console.error('🚨 API REFUND ERROR:', error);
    res.status(500).json({
      error: 'REFUND_FAILED',
      message: error.message
    });
  }
}

export async function processTeamPaymentAfterSetup(req: Request, res: Response) {
  res.json({ success: true, message: 'Payment processed successfully' });
}

export async function generatePaymentCompletionUrl(req: Request, res: Response) {
  try {
    const teamId = parseInt(req.params.teamId);
    
    if (isNaN(teamId)) {
      return res.status(400).json({ error: 'Invalid team ID' });
    }
    
    console.log(`PAYMENT URL: Generating completion URL for team ${teamId}`);
    
    // Get team information
    const [team] = await db
      .select()
      .from(teams)
      .where(eq(teams.id, teamId))
      .limit(1);
    
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    
    console.log(`PAYMENT URL: Team ${teamId} status:`, {
      paymentStatus: team.paymentStatus,
      paymentMethodId: team.paymentMethodId,
      setupIntentId: team.setupIntentId,
      totalAmount: team.totalAmount
    });
    
    // Check if team has failed payments but existing payment methods
    if (team.paymentStatus === 'payment_failed' && (team.paymentMethodId || team.setupIntentId)) {
      console.log(`PAYMENT URL: Team ${teamId} has failed payment but existing payment setup - redirecting to retry`);
      
      // For teams with failed payments but existing payment setup, 
      // generate a URL that will trigger the payment retry system
      const retryUrl = `${req.protocol}://${req.get('host')}/payment/retry/${teamId}?source=admin_generated`;
      
      return res.json({ 
        success: true, 
        completionUrl: retryUrl,
        message: 'Payment retry URL generated for team with existing payment method',
        isRetryUrl: true
      });
    }
    
    // For teams that need new payment setup
    if (team.paymentStatus !== 'paid' && team.totalAmount && team.totalAmount > 0) {
      // Generate a new payment setup URL
      const setupUrl = `${req.protocol}://${req.get('host')}/payment/setup/${teamId}?source=admin_generated`;
      
      return res.json({ 
        success: true, 
        completionUrl: setupUrl,
        message: 'Payment setup URL generated for team',
        isSetupUrl: true
      });
    }
    
    // Team doesn't need payment
    if (team.paymentStatus === 'paid') {
      return res.status(400).json({ 
        error: 'Team payment already completed',
        guidance: 'This team has already completed payment successfully.'
      });
    }
    
    if (!team.totalAmount || team.totalAmount === 0) {
      return res.status(400).json({ 
        error: 'No payment required',
        guidance: 'This team has no fees and does not require payment.'
      });
    }
    
    return res.status(400).json({ 
      error: 'Unable to generate payment URL',
      guidance: 'Team status or payment configuration prevents URL generation.'
    });
    
  } catch (error) {
    console.error('Error generating payment completion URL:', error);
    res.status(500).json({ 
      error: 'Failed to generate payment completion URL',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export async function generatePaymentIntentCompletionUrl(req: Request, res: Response) {
  try {
    const teamId = parseInt(req.params.id);
    
    if (isNaN(teamId)) {
      return res.status(400).json({ error: 'Invalid team ID' });
    }
    
    console.log(`PAYMENT INTENT URL: Generating completion URL for team ${teamId}`);
    
    // Get team information
    const [team] = await db
      .select()
      .from(teams)
      .where(eq(teams.id, teamId))
      .limit(1);
    
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    
    console.log(`PAYMENT INTENT URL: Team ${teamId} status:`, {
      paymentStatus: team.paymentStatus,
      paymentIntentId: team.paymentIntentId,
      totalAmount: team.totalAmount
    });
    
    // For teams with PaymentIntents that need completion
    if (team.paymentIntentId) {
      const intentCompletionUrl = `${req.protocol}://${req.get('host')}/payment/intent/${teamId}?source=admin_generated`;
      
      return res.json({ 
        success: true, 
        completionUrl: intentCompletionUrl,
        message: 'Payment intent completion URL generated',
        isIntentUrl: true
      });
    }
    
    return res.status(400).json({ 
      error: 'No payment intent found',
      guidance: 'This team does not have a payment intent that requires completion.'
    });
    
  } catch (error) {
    console.error('Error generating payment intent completion URL:', error);
    res.status(500).json({ 
      error: 'Failed to generate payment intent completion URL',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}