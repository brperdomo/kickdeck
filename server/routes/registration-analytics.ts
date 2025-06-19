/**
 * Registration Analytics API
 * 
 * Provides comprehensive registration insights including all statuses,
 * revenue projections, and payment method analysis for tournament directors.
 */

import { Application } from 'express';
import { db } from '@db';
import { sql } from 'drizzle-orm';
import { isAdmin } from '../middleware/auth';
import { calculateFeeBreakdown } from '../services/fee-calculator';

export function registerRegistrationAnalyticsRoutes(app: Application) {
  
  // Get comprehensive registration analytics for an event
  app.get("/api/events/:eventId/registration-analytics", isAdmin, async (req, res) => {
    try {
      const { eventId } = req.params;
      const { period = '30' } = req.query;

      console.log(`Generating registration analytics for event ${eventId}`);

      // Get all teams for the event with detailed information using raw SQL
      const allTeamsResult = await db.execute(sql`
        SELECT * FROM teams WHERE event_id = ${eventId} ORDER BY created_at DESC
      `);
      const allTeams = allTeamsResult.rows as any[];

      // Get event fees for calculation using raw SQL
      const feesResult = await db.execute(sql`
        SELECT * FROM event_fees WHERE event_id = ${parseInt(eventId)}
      `);
      const fees = feesResult.rows as any[];

      // Calculate status breakdown
      const statusBreakdown = {
        pending: allTeams.filter(t => t.status === 'pending').length,
        approved: allTeams.filter(t => t.status === 'approved').length,
        rejected: allTeams.filter(t => t.status === 'rejected').length,
        waitlisted: allTeams.filter(t => t.status === 'waitlisted').length
      };

      // Calculate revenue projections with proper fee structure
      let totalExpectedRevenue = 0;
      let alreadyCollected = 0;
      let pendingCollection = 0;
      let potentialRevenue = 0;
      let totalRegistrationFees = 0;
      let totalPlatformFees = 0;
      let totalStripeFees = 0;

      // Calculate total event volume for proper fee tier calculation
      const totalEventVolume = allTeams.reduce((total, team) => {
        const teamFee = parseFloat(String(team.total_amount || team.registration_fee || '0'));
        return total + teamFee;
      }, 0);

      // Calculate breakdown for each team
      for (const team of allTeams) {
        const teamFee = parseFloat(String(team.total_amount || team.registration_fee || '0'));
        
        if (teamFee > 0) {
          // Use fee calculator for accurate breakdown
          const feeBreakdown = calculateFeeBreakdown(teamFee, totalEventVolume);
          
          totalRegistrationFees += feeBreakdown.tournamentCost;
          totalPlatformFees += feeBreakdown.platformFeeAmount;
          totalStripeFees += feeBreakdown.stripeFeeAmount;

          // Calculate revenue categories
          if (team.status === 'approved' && team.payment_intent_id) {
            alreadyCollected += teamFee;
          } else if (team.status === 'approved' && team.setup_intent_id) {
            pendingCollection += teamFee;
          } else if (team.status === 'pending' || team.status === 'waitlisted') {
            potentialRevenue += teamFee;
          }
          
          totalExpectedRevenue += teamFee;
        }
      }

      // Calculate payment method analysis
      const paymentMethodAnalysis = {
        cardsSaved: allTeams.filter(t => t.setup_intent_id && !t.payment_intent_id && t.status !== 'rejected').length,
        payLaterSelected: allTeams.filter(t => !t.setup_intent_id && !t.payment_intent_id && t.status !== 'rejected').length,
        readyToCharge: allTeams.filter(t => t.status === 'approved' && t.setup_intent_id && !t.payment_intent_id).length
      };

      // Simplified daily trend calculation from teams data
      const dailyRegistrationTrend = allTeams
        .filter((team: any) => team.created_at)
        .map((team: any) => ({
          date: new Date(team.created_at as string).toISOString().split('T')[0],
          team: team
        }))
        .reduce((acc: any, { date, team }) => {
          if (!acc[date]) {
            acc[date] = { date, registrations: 0, expectedValue: 0 };
          }
          acc[date].registrations += 1;
          const teamFee = parseFloat(String(team.total_amount || team.registration_fee || '0'));
          acc[date].expectedValue += teamFee;
          return acc;
        }, {});

      const dailyTrend = Object.values(dailyRegistrationTrend)
        .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, parseInt(period as string));

      // Calculate action items
      const actionItems = {
        pendingApprovals: statusBreakdown.pending,
        waitlistedTeams: statusBreakdown.waitlisted,
        cardsReadyToCharge: paymentMethodAnalysis.readyToCharge,
        totalActionItems: statusBreakdown.pending + statusBreakdown.waitlisted
      };

      res.json({
        summary: {
          totalRegistrations: allTeams.length,
          statusBreakdown,
          totalExpectedRevenue,
          alreadyCollected,
          pendingCollection,
          potentialRevenue
        },
        revenue: {
          totalRegistrationFees,
          totalPlatformFees,
          totalStripeFees,
          breakdown: {
            approved: alreadyCollected + pendingCollection,
            pending: potentialRevenue,
            rejected: 0
          }
        },
        paymentMethods: paymentMethodAnalysis,
        dailyTrend,
        actionItems
      });

    } catch (error) {
      console.error('Error generating registration analytics:', error);
      res.status(500).json({ error: 'Failed to generate registration analytics' });
    }
  });

  // Export registration data
  app.get("/api/events/:eventId/registration-analytics/export", isAdmin, async (req, res) => {
    try {
      const { eventId } = req.params;
      const format = req.query.format || 'csv';

      // Get all teams with comprehensive data using raw SQL
      const allTeamsResult = await db.execute(sql`
        SELECT * FROM teams WHERE event_id = ${eventId} ORDER BY created_at DESC
      `);
      const allTeams = allTeamsResult.rows as any[];

      if (format === 'csv') {
        const csvHeaders = [
          'Registration Date',
          'Team Name', 
          'Status',
          'Registration Fee',
          'Payment Status',
          'Payment Method',
          'Card Last 4',
          'Submitter Email',
          'Club Name'
        ];

        const csvData = allTeams.map((team: any) => [
          team.created_at ? new Date(team.created_at).toLocaleDateString() : '',
          team.name || '',
          team.status || '',
          team.total_amount || team.registration_fee || '0',
          team.payment_intent_id ? 'Paid' : team.setup_intent_id ? 'Card Saved' : 'Pay Later',
          team.setup_intent_id || team.payment_intent_id ? 'Card' : 'Pay Later',
          team.card_last_four || '',
          team.submitter_email || '',
          team.club_name || ''
        ]);

        const csvContent = [csvHeaders, ...csvData]
          .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
          .join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="registration-analytics-${eventId}.csv"`);
        res.send(csvContent);
      } else {
        res.json(allTeams);
      }

    } catch (error) {
      console.error('Error exporting registration analytics:', error);
      res.status(500).json({ error: 'Failed to export registration analytics' });
    }
  });
}