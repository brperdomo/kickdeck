/**
 * Registration Analytics API
 * 
 * Provides comprehensive registration insights including all statuses,
 * revenue projections, and payment method analysis for tournament directors.
 */

import { Application } from 'express';
import { db } from '@db';
import { teams, eventFees } from '@db/schema';
import { eq, and, sql } from 'drizzle-orm';
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
      const allTeams = allTeamsResult.rows;

      // Get event fees for calculation using raw SQL
      const feesResult = await db.execute(sql`
        SELECT * FROM event_fees WHERE event_id = ${parseInt(eventId)}
      `);
      const fees = feesResult.rows;

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
        const teamFee = parseFloat(String(team.totalAmount || team.registrationFee || '0'));
        return total + (teamFee * 100); // Convert to cents
      }, 0);

      allTeams.forEach((team) => {
        const teamFee = parseFloat(String(team.totalAmount || team.registrationFee || '0'));
        const teamFeeInCents = Math.round(teamFee * 100);
        
        if (teamFeeInCents > 0) {
          // Use proper fee calculation with volume-based rates
          const feeCalculation = calculateFeeBreakdown(teamFeeInCents, totalEventVolume);
          
          totalExpectedRevenue += teamFee;
          totalRegistrationFees += teamFee;
          totalPlatformFees += (feeCalculation.platformFeeAmount / 100);
          totalStripeFees += (feeCalculation.stripeFeeAmount / 100);

          // Categorize by status for revenue projections
          switch (team.status) {
            case 'approved':
              if (team.paymentIntentId) {
                alreadyCollected += teamFee;
              } else {
                pendingCollection += teamFee;
              }
              break;
            case 'pending':
              if (team.setupIntentId || team.paymentIntentId) {
                pendingCollection += teamFee; // Cards saved, ready to charge
              } else {
                potentialRevenue += teamFee; // Pay later option
              }
              break;
            case 'waitlisted':
              potentialRevenue += teamFee;
              break;
            // Rejected teams don't contribute to revenue projections
          }
        }
      });

      const netRevenue = totalRegistrationFees - totalPlatformFees - totalStripeFees;
      const averageRegistrationValue = allTeams.length > 0 ? totalExpectedRevenue / allTeams.length : 0;

      // Payment method analysis
      const paymentMethodStats = {
        cardsSaved: allTeams.filter(t => t.setupIntentId && !t.paymentIntentId).length,
        payLaterSelected: allTeams.filter(t => !t.setupIntentId && !t.paymentIntentId && t.status !== 'rejected').length,
        readyToCharge: allTeams.filter(t => t.status === 'approved' && t.setupIntentId && !t.paymentIntentId).length
      };

      // Simplified daily trend calculation from teams data - removing problematic SQL query

      // Simplified daily trend calculation from teams data
      const dailyRegistrationTrend = allTeams
        .filter(team => team.createdAt)
        .reduce((acc: any[], team) => {
          const date = new Date(team.createdAt).toISOString().split('T')[0];
          const existing = acc.find(d => d.date === date);
          const value = parseFloat(String(team.totalAmount || team.registrationFee || '0'));
          
          if (existing) {
            existing.registrations += 1;
            existing.expectedValue += value;
          } else {
            acc.push({
              date,
              registrations: 1,
              expectedValue: value,
              status: team.status
            });
          }
          return acc;
        }, [])
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 30);

      const analytics = {
        totalRegistrations: allTeams.length,
        statusBreakdown,
        revenueProjections: {
          totalExpectedRevenue,
          alreadyCollected,
          pendingCollection,
          potentialRevenue,
          averageRegistrationValue
        },
        feeBreakdown: {
          totalRegistrationFees,
          totalPlatformFees,
          totalStripeFees,
          netRevenue
        },
        paymentMethodStats,
        dailyRegistrationTrend,
        generatedAt: new Date().toISOString()
      };

      console.log(`Registration analytics generated for event ${eventId}:`, {
        totalRegistrations: analytics.totalRegistrations,
        expectedRevenue: analytics.revenueProjections.totalExpectedRevenue,
        statusBreakdown: analytics.statusBreakdown
      });

      res.json(analytics);

    } catch (error) {
      console.error('Error generating registration analytics:', error);
      res.status(500).json({ 
        error: 'Failed to generate registration analytics',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Export registration analytics data
  app.get("/api/events/:eventId/registration-analytics/export", isAdmin, async (req, res) => {
    try {
      const { eventId } = req.params;
      const format = req.query.format || 'csv';

      // Get all teams with comprehensive data
      const allTeams = await db.select().from(teams).where(eq(teams.eventId, eventId));

      if (format === 'csv') {
        const csvHeaders = [
          'Registration Date',
          'Team Name',
          'Club Name',
          'Age Group',
          'Contact Email',
          'Manager Name',
          'Status',
          'Registration Fee',
          'Platform Fee',
          'Expected Total',
          'Payment Method',
          'Payment Status',
          'Setup Intent ID',
          'Payment Intent ID'
        ].join(',');

        // Calculate total volume for proper fee rates
        const totalVolume = allTeams.reduce((total, team) => {
          const fee = parseFloat(String(team.totalAmount || team.registrationFee || '0'));
          return total + (fee * 100);
        }, 0);

        const csvRows = allTeams.map(team => {
          const fee = parseFloat(String(team.totalAmount || team.registrationFee || '0'));
          const feeInCents = Math.round(fee * 100);
          
          // Use proper fee calculation with volume-based rates
          const feeCalculation = feeInCents > 0 ? calculateFeeBreakdown(feeInCents, totalVolume) : null;
          const platformFee = feeCalculation ? feeCalculation.platformFeeAmount / 100 : 0;
          const expectedTotal = fee + platformFee;

          const paymentMethod = team.setupIntentId ? 'Card Saved' : 
                              team.paymentIntentId ? 'Card Charged' : 'Pay Later';
          
          const paymentStatus = team.paymentIntentId ? 'Completed' :
                              team.setupIntentId ? 'Ready to Charge' : 'Pending';

          return [
            String(team.createdAt || ''),
            `"${team.name || ''}"`,
            `"${team.clubName || ''}"`,
            `"Age Group ${team.ageGroupId || ''}"`,
            `"${team.submitterEmail || ''}"`,
            `"${team.managerName || ''}"`,
            team.status || '',
            fee.toFixed(2),
            platformFee.toFixed(2),
            expectedTotal.toFixed(2),
            paymentMethod,
            paymentStatus,
            team.setupIntentId || '',
            team.paymentIntentId || ''
          ].join(',');
        });

        const csvContent = [csvHeaders, ...csvRows].join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="registration-analytics-${eventId}-${new Date().toISOString().split('T')[0]}.csv"`);
        res.send(csvContent);
      } else {
        res.status(400).json({ error: 'Unsupported export format' });
      }
    } catch (error) {
      console.error('Error exporting registration analytics:', error);
      res.status(500).json({ error: 'Failed to export registration analytics' });
    }
  });

  // Get detailed registration breakdown by status
  app.get("/api/events/:eventId/registration-analytics/status/:status", isAdmin, async (req, res) => {
    try {
      const { eventId, status } = req.params;
      
      const statusTeams = await db.query.teams.findMany({
        where: and(
          eq(teams.eventId, eventId),
          eq(teams.status, status)
        ),
        orderBy: (teams, { desc }) => [desc(teams.createdAt)]
      });

      // Calculate revenue impact for this status
      const totalValue = statusTeams.reduce((total, team) => {
        const fee = parseFloat(String(team.totalAmount || team.registrationFee || '0'));
        return total + fee;
      }, 0);

      res.json({
        status,
        count: statusTeams.length,
        totalValue,
        teams: statusTeams.map(team => ({
          id: team.id,
          name: team.name,
          clubName: team.clubName,
          registrationFee: team.totalAmount || team.registrationFee,
          submitterEmail: team.submitterEmail,
          managerName: team.managerName,
          createdAt: team.createdAt,
          hasPaymentMethod: !!team.setupIntentId,
          paymentCompleted: !!team.paymentIntentId
        }))
      });

    } catch (error) {
      console.error('Error fetching status breakdown:', error);
      res.status(500).json({ error: 'Failed to fetch status breakdown' });
    }
  });
}