import { Router } from 'express';
import { db } from '@db/index';
import { teams, events, eventAgeGroups } from '@db/schema';
import { eq, and, isNull, gt, inArray } from 'drizzle-orm';
import crypto from 'crypto';
import { sendTemplatedEmail } from '../services/emailService';

const router = Router();

// Generate secure payment completion token
function generatePaymentToken(teamId: number): string {
  const secret = process.env.PAYMENT_COMPLETION_SECRET || 'fallback-secret-key';
  const timestamp = Date.now();
  const data = `${teamId}-${timestamp}`;
  const hash = crypto.createHmac('sha256', secret).update(data).digest('hex');
  return `${teamId}.${timestamp}.${hash}`;
}

// Validate payment completion token
function validatePaymentToken(token: string): { teamId: number; timestamp: number } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const [teamIdStr, timestampStr, providedHash] = parts;
    const teamId = parseInt(teamIdStr);
    const timestamp = parseInt(timestampStr);
    
    if (isNaN(teamId) || isNaN(timestamp)) return null;
    
    const secret = process.env.PAYMENT_COMPLETION_SECRET || 'fallback-secret-key';
    const data = `${teamId}-${timestamp}`;
    const expectedHash = crypto.createHmac('sha256', secret).update(data).digest('hex');
    
    if (providedHash !== expectedHash) return null;
    
    // Token expires after 30 days
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    if (Date.now() - timestamp > thirtyDaysMs) return null;
    
    return { teamId, timestamp };
  } catch (error) {
    return null;
  }
}

// Get teams that need payment completion (excluding $0 amounts)
router.get('/incomplete-teams', async (req, res) => {
  try {
    const incompleteTeams = await db
      .select({
        id: teams.id,
        name: teams.name,
        totalAmount: teams.totalAmount,
        submitterEmail: teams.submitterEmail,
        managerEmail: teams.managerEmail,
        status: teams.status,
        eventName: events.name,
        ageGroup: eventAgeGroups.ageGroup,
        gender: eventAgeGroups.gender,
      })
      .from(teams)
      .leftJoin(events, eq(teams.eventId, events.id))
      .leftJoin(eventAgeGroups, eq(teams.ageGroupId, eventAgeGroups.id))
      .where(
        and(
          gt(teams.totalAmount, 0), // Exclude teams with $0 payment
          isNull(teams.paymentMethodId),
          inArray(teams.status, ['registered', 'pending'])
        )
      );

    const baseUrl = process.env.FRONTEND_URL || req.get('origin') || 'http://localhost:5000';
    
    const teamsWithLinks = incompleteTeams.map(team => {
      const token = generatePaymentToken(team.id);
      const contactEmail = team.submitterEmail || team.managerEmail;
      const ageGroup = team.ageGroup && team.gender 
        ? `${team.ageGroup} ${team.gender}`.trim()
        : team.ageGroup || '';

      return {
        id: team.id,
        name: team.name,
        amount: team.totalAmount ? team.totalAmount / 100 : 0,
        eventName: team.eventName || 'Unknown Event',
        ageGroup,
        contactEmail: contactEmail || 'No email provided',
        status: team.status,
        paymentLink: `${baseUrl}/complete-payment/${token}`,
      };
    }).filter(team => team.amount > 0); // Extra safety filter

    const summary = {
      totalTeams: teamsWithLinks.length,
      totalAmount: teamsWithLinks.reduce((sum, team) => sum + team.amount, 0),
    };

    res.json({
      teams: teamsWithLinks,
      summary,
    });
  } catch (error) {
    console.error('Error fetching incomplete teams:', error);
    res.status(500).json({ error: 'Failed to fetch teams requiring payment completion' });
  }
});

// Validate payment completion token
router.get('/validate-token/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const validation = validatePaymentToken(token);
    
    if (!validation) {
      return res.status(400).json({ error: 'Invalid or expired payment token' });
    }

    const { teamId } = validation;
    
    // Get team details
    const teamData = await db
      .select({
        id: teams.id,
        name: teams.name,
        totalAmount: teams.totalAmount,
        eventName: events.name,
        ageGroup: eventAgeGroups.ageGroup,
        gender: eventAgeGroups.gender,
        paymentMethodId: teams.paymentMethodId,
        status: teams.status,
      })
      .from(teams)
      .leftJoin(events, eq(teams.eventId, events.id))
      .leftJoin(eventAgeGroups, eq(teams.ageGroupId, eventAgeGroups.id))
      .where(eq(teams.id, teamId))
      .limit(1);

    if (teamData.length === 0) {
      return res.status(404).json({ error: 'Team not found' });
    }

    const team = teamData[0];
    
    // Check if team still needs payment completion
    if (team.paymentMethodId) {
      return res.status(400).json({ error: 'Payment method already configured for this team' });
    }

    // Exclude teams with $0 amount
    if (!team.totalAmount || team.totalAmount <= 0) {
      return res.status(400).json({ error: 'No payment required for this team' });
    }

    const ageGroup = team.ageGroup && team.gender 
      ? `${team.ageGroup} ${team.gender}`.trim()
      : team.ageGroup || '';

    const teamInfo = {
      id: team.id,
      name: team.name,
      amount: team.totalAmount / 100,
      eventName: team.eventName || 'Unknown Event',
      ageGroup,
      status: team.status,
    };

    res.json({
      valid: true,
      team: teamInfo,
    });
  } catch (error) {
    console.error('Error validating payment token:', error);
    res.status(500).json({ error: 'Failed to validate payment token' });
  }
});

// Send payment completion notifications
router.post('/send-notifications', async (req, res) => {
  try {
    const { teamIds, testMode = false } = req.body;
    
    if (!Array.isArray(teamIds) || teamIds.length === 0) {
      return res.status(400).json({ error: 'Team IDs are required' });
    }

    // Get team details for notification
    const teamsData = await db
      .select({
        id: teams.id,
        name: teams.name,
        totalAmount: teams.totalAmount,
        submitterEmail: teams.submitterEmail,
        managerEmail: teams.managerEmail,
        eventName: events.name,
        eventAdminEmail: events.adminEmail,
        ageGroup: eventAgeGroups.ageGroup,
        gender: eventAgeGroups.gender,
      })
      .from(teams)
      .leftJoin(events, eq(teams.eventId, events.id))
      .leftJoin(eventAgeGroups, eq(teams.ageGroupId, eventAgeGroups.id))
      .where(
        and(
          inArray(teams.id, teamIds),
          gt(teams.totalAmount, 0), // Only teams with payment amounts > $0
          isNull(teams.paymentMethodId)
        )
      );

    if (teamsData.length === 0) {
      return res.status(400).json({ error: 'No eligible teams found for payment notifications' });
    }

    const baseUrl = process.env.FRONTEND_URL || req.get('origin') || 'http://localhost:5000';
    let sentCount = 0;
    const errors = [];

    for (const team of teamsData) {
      try {
        // Skip teams with $0 amount
        if (!team.totalAmount || team.totalAmount <= 0) {
          continue;
        }

        const token = generatePaymentToken(team.id);
        const completionUrl = `${baseUrl}/complete-payment/${token}`;
        const contactEmail = team.submitterEmail || team.managerEmail;
        
        if (!contactEmail) {
          errors.push(`Team ${team.name}: No contact email available`);
          continue;
        }

        const ageGroup = team.ageGroup && team.gender 
          ? `${team.ageGroup} ${team.gender}`.trim()
          : team.ageGroup || 'N/A';

        const emailData = {
          teamName: team.name,
          eventName: team.eventName || 'Tournament',
          ageGroup,
          division: ageGroup,
          totalAmount: `$${(team.totalAmount / 100).toFixed(2)}`,
          paymentLink: completionUrl,
          EVENT_ADMIN_EMAIL: team.eventAdminEmail || 'support@kickdeck.xyz',
        };

        if (!testMode) {
          await sendTemplatedEmail(contactEmail, 'payment_completion_notification', emailData);
        }

        sentCount++;
      } catch (error) {
        console.error(`Error sending notification to team ${team.name}:`, error);
        errors.push(`Team ${team.name}: ${error.message}`);
      }
    }

    res.json({
      sent: sentCount,
      errors: errors.length,
      errorDetails: errors,
      testMode,
      totalAmount: teamsData.reduce((sum, team) => sum + (team.totalAmount || 0), 0) / 100,
    });
  } catch (error) {
    console.error('Error sending payment notifications:', error);
    res.status(500).json({ error: 'Failed to send payment notifications' });
  }
});

// Export payment completion links as CSV
router.post('/export-links', async (req, res) => {
  try {
    const { teamIds } = req.body;
    
    if (!Array.isArray(teamIds) || teamIds.length === 0) {
      return res.status(400).json({ error: 'Team IDs are required' });
    }

    // Get team details
    const teamsData = await db
      .select({
        id: teams.id,
        name: teams.name,
        totalAmount: teams.totalAmount,
        submitterEmail: teams.submitterEmail,
        managerEmail: teams.managerEmail,
        status: teams.status,
        eventName: events.name,
        ageGroup: eventAgeGroups.ageGroup,
        gender: eventAgeGroups.gender,
      })
      .from(teams)
      .leftJoin(events, eq(teams.eventId, events.id))
      .leftJoin(eventAgeGroups, eq(teams.ageGroupId, eventAgeGroups.id))
      .where(
        and(
          inArray(teams.id, teamIds),
          gt(teams.totalAmount, 0) // Only teams with payment amounts > $0
        )
      );

    const baseUrl = process.env.FRONTEND_URL || req.get('origin') || 'http://localhost:5000';
    
    // Generate CSV content
    const csvHeader = 'Team Name,Event,Age Group,Amount,Contact Email,Status,Payment Link\n';
    const csvRows = teamsData
      .filter(team => team.totalAmount && team.totalAmount > 0) // Extra safety filter
      .map(team => {
        const token = generatePaymentToken(team.id);
        const completionUrl = `${baseUrl}/complete-payment/${token}`;
        const contactEmail = team.submitterEmail || team.managerEmail || '';
        const ageGroup = team.ageGroup && team.gender 
          ? `${team.ageGroup} ${team.gender}`.trim()
          : team.ageGroup || '';
        const amount = (team.totalAmount / 100).toFixed(2);
        
        return `"${team.name}","${team.eventName || ''}","${ageGroup}","$${amount}","${contactEmail}","${team.status}","${completionUrl}"`;
      })
      .join('\n');

    const csvContent = csvHeader + csvRows;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="payment-completion-links-${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csvContent);
  } catch (error) {
    console.error('Error exporting payment links:', error);
    res.status(500).json({ error: 'Failed to export payment links' });
  }
});

export default router;