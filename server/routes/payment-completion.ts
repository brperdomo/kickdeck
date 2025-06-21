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
          amount: (team.totalAmount / 100).toFixed(2),
          paymentLink: completionUrl,
        };

        // Email template
        const subject = 'Complete Your Team Registration Payment - Action Required';
        const htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="margin: 0; font-size: 28px;">Complete Your Registration</h1>
              <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Secure your team's spot in the tournament</p>
            </div>
            
            <div style="background: white; border: 1px solid #e0e0e0; border-top: none; padding: 30px; border-radius: 0 0 10px 10px;">
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
                <h2 style="color: #333; margin: 0 0 15px 0; font-size: 20px;">Team: ${emailData.teamName}</h2>
                <p style="margin: 5px 0; color: #666;"><strong>Event:</strong> ${emailData.eventName}</p>
                <p style="margin: 5px 0; color: #666;"><strong>Division:</strong> ${emailData.ageGroup}</p>
                <p style="margin: 5px 0; color: #666;"><strong>Registration Fee:</strong> <span style="font-size: 18px; color: #2e7d32; font-weight: bold;">$${emailData.amount}</span></p>
              </div>
              
              <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
                <h3 style="color: #856404; margin: 0 0 10px 0;">Payment Setup Required</h3>
                <p style="color: #856404; margin: 0; line-height: 1.5;">
                  Your team registration is incomplete. To secure your spot and avoid losing your registration, 
                  please complete your payment setup using the secure link below.
                </p>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${emailData.paymentLink}" 
                   style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                          color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; 
                          font-weight: bold; font-size: 16px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);">
                  🔒 Complete Payment Setup
                </a>
              </div>
              
              <div style="background: #e8f5e8; border: 1px solid #c8e6c9; padding: 20px; border-radius: 8px; margin: 25px 0;">
                <h4 style="color: #2e7d32; margin: 0 0 10px 0;">What happens next?</h4>
                <ul style="color: #2e7d32; margin: 0; padding-left: 20px; line-height: 1.6;">
                  <li>Click the secure link above to add your payment method</li>
                  <li>Your card will be saved securely with Stripe (industry-standard security)</li>
                  <li>Payment will be processed automatically once your team is approved</li>
                  <li>You'll receive a confirmation email with your receipt</li>
                </ul>
              </div>
              
              <div style="border-top: 1px solid #e0e0e0; padding-top: 20px; margin-top: 30px;">
                <p style="color: #666; font-size: 14px; margin: 0 0 10px 0;">
                  <strong>Important:</strong> This payment link is secure and unique to your team. 
                  Please complete your payment setup within 7 days to avoid registration cancellation.
                </p>
                <p style="color: #666; font-size: 14px; margin: 0;">
                  Questions? Contact us at <a href="mailto:support@matchpro.ai" style="color: #667eea;">support@matchpro.ai</a>
                </p>
              </div>
            </div>
          </div>
        `;

        if (!testMode) {
          await sendTemplatedEmail({
            to: contactEmail,
            subject,
            html: htmlContent,
            templateType: 'payment_completion_notification'
          });
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