import { Application } from 'express';
import { db } from '@db';
import { teams } from '@db/schema';
import { eq, and, isNotNull } from 'drizzle-orm';
import { isAdmin } from '../middleware/auth';
import { calculateFeeBreakdown, getPlatformFeeRate } from '../services/fee-calculator';

export function registerPaymentReportRoutes(app: Application) {
  
  // Get payment summary for an event using teams data
  app.get("/api/events/:eventId/payment-reports/summary", isAdmin, async (req, res) => {
    try {
      const { eventId } = req.params;

      // Get all teams for the event with payment information
      const allTeams = await db.query.teams.findMany({
        where: eq(teams.eventId, eventId),
        orderBy: (teams, { desc }) => [desc(teams.createdAt)]
      });

      // Filter teams that have been paid
      const paidTeams = allTeams.filter(team => 
        team.status === 'approved' && 
        team.paymentIntentId && 
        team.totalAmount && 
        team.totalAmount > 0
      );

      // Calculate summary metrics from teams
      const summary = {
        totalTransactions: paidTeams.length,
        totalRevenue: 0,
        totalPlatformFees: 0,
        totalNetAmount: 0,
        platformFeeRate: 0.04, // Will be calculated based on actual volume
        successfulPayments: paidTeams.length,
        pendingPayments: allTeams.filter(t => t.status === 'pending').length,
        failedPayments: allTeams.filter(t => t.status === 'rejected').length,
        dailyBreakdown: [] as any[]
      };

      // Calculate total event volume for proper fee tier calculation
      const totalEventVolume = paidTeams.reduce((total, team) => {
        return total + (parseInt(String(team.totalAmount || '0')) || 0); // Already in cents
      }, 0);

      const dailyMap = new Map();
      
      paidTeams.forEach((team: any) => {
        const feeInCents = parseInt(String(team.totalAmount || '0')) || 0; // Already in cents
        const fee = feeInCents / 100; // Convert to dollars for display
        
        // Use proper fee calculation with volume-based rates
        const feeCalculation = calculateFeeBreakdown(feeInCents, totalEventVolume);
        const platformFee = feeCalculation.platformFeeAmount / 100; // Convert to dollars
        const netAmount = fee - platformFee;

        summary.totalRevenue += fee;
        summary.totalPlatformFees += platformFee;
        summary.totalNetAmount += netAmount;

        // Group by date for daily breakdown
        const date = team.createdAt ? String(team.createdAt).split('T')[0] : new Date().toISOString().split('T')[0];
        
        if (!dailyMap.has(date)) {
          dailyMap.set(date, {
            date,
            revenue: 0,
            platformFees: 0,
            netAmount: 0,
            transactions: 0
          });
        }

        const dayData = dailyMap.get(date);
        dayData.revenue += fee;
        dayData.platformFees += platformFee;
        dayData.netAmount += netAmount;
        dayData.transactions += 1;
      });

      // Calculate the actual average platform fee rate for display
      if (summary.totalRevenue > 0) {
        summary.platformFeeRate = summary.totalPlatformFees / summary.totalRevenue;
      }

      summary.dailyBreakdown = Array.from(dailyMap.values()).sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      res.json(summary);
    } catch (error) {
      console.error('Error fetching payment summary:', error);
      res.status(500).json({ error: 'Failed to fetch payment summary' });
    }
  });

  // Get payout information 
  app.get("/api/events/:eventId/payment-reports/payouts", isAdmin, async (req, res) => {
    try {
      // Return basic payout schedule information
      res.json({
        schedule: {
          interval: 'daily',
          description: 'Payments are batched daily for faster cash flow'
        },
        nextPayoutEstimate: 'Within 2-7 business days',
        recentPayouts: [],
        dailyBatching: true
      });
    } catch (error) {
      console.error('Error fetching payout info:', error);
      res.status(500).json({ error: 'Failed to fetch payout information' });
    }
  });

  // Export payment data as CSV
  app.get("/api/events/:eventId/payment-reports/export", isAdmin, async (req, res) => {
    try {
      const { eventId } = req.params;
      const format = req.query.format || 'csv';

      // Get all teams with payment data
      const paidTeams = await db.query.teams.findMany({
        where: and(
          eq(teams.eventId, eventId),
          isNotNull(teams.paymentIntentId)
        ),
        orderBy: (teams, { desc }) => [desc(teams.createdAt)]
      });

      if (format === 'csv') {
        const csvHeaders = [
          'Date',
          'Team Name',
          'Club Name',
          'Age Group',
          'Contact Email',
          'Registration Fee',
          'Platform Fee (4%)',
          'Net Amount',
          'Payment Status',
          'Payment Intent ID'
        ].join(',');

        // Calculate total volume for proper fee rates
        const totalVolume = paidTeams.reduce((total, team) => {
          return total + (parseInt(String(team.totalAmount || '0')) || 0);
        }, 0);

        const csvRows = paidTeams.map(team => {
          const feeInCents = parseInt(String(team.totalAmount || '0')) || 0;
          const fee = feeInCents / 100; // Convert to dollars
          
          // Use proper fee calculation with volume-based rates
          const feeCalculation = calculateFeeBreakdown(feeInCents, totalVolume);
          const platformFee = feeCalculation.platformFeeAmount / 100;
          const platformFeeRate = (feeCalculation.platformFeeRate * 100).toFixed(1);
          const netAmount = fee - platformFee;

          return [
            String(team.createdAt || ''),
            `"${team.name || ''}"`,
            `"${team.clubName || ''}"`,
            `"Age Group ${team.ageGroupId || ''}"`,
            `"${team.submitterEmail || ''}"`,
            fee.toFixed(2),
            `${platformFee.toFixed(2)} (${platformFeeRate}%)`,
            netAmount.toFixed(2),
            team.status || '',
            team.paymentIntentId || ''
          ].join(',');
        });

        const csvContent = [csvHeaders, ...csvRows].join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="payment-report-${eventId}-${new Date().toISOString().split('T')[0]}.csv"`);
        res.send(csvContent);
      } else {
        res.status(400).json({ error: 'Unsupported export format' });
      }
    } catch (error) {
      console.error('Error exporting payment data:', error);
      res.status(500).json({ error: 'Failed to export payment data' });
    }
  });
}