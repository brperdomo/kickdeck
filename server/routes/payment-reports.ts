import { Application } from 'express';
import { db } from '@db';
import { teams } from '@db/schema';
import { eq, and, isNotNull } from 'drizzle-orm';
import { isAdmin } from '../middleware/auth';

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
        team.registrationFee
      );

      // Calculate summary metrics from teams
      const summary = {
        totalTransactions: paidTeams.length,
        totalRevenue: 0,
        totalPlatformFees: 0,
        totalNetAmount: 0,
        successfulPayments: paidTeams.length,
        pendingPayments: allTeams.filter(t => t.status === 'pending').length,
        failedPayments: allTeams.filter(t => t.status === 'rejected').length,
        dailyBreakdown: [] as any[]
      };

      const dailyMap = new Map();
      
      paidTeams.forEach((team: any) => {
        const fee = parseFloat(team.registrationFee || '0');
        const platformFee = Math.round(fee * 0.03 * 100) / 100; // 3% platform fee
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
          'Platform Fee (3%)',
          'Net Amount',
          'Payment Status',
          'Payment Intent ID'
        ].join(',');

        const csvRows = paidTeams.map(team => {
          const fee = parseFloat(String(team.registrationFee || '0'));
          const platformFee = Math.round(fee * 0.03 * 100) / 100;
          const netAmount = fee - platformFee;

          return [
            String(team.createdAt || ''),
            `"${team.name || ''}"`,
            `"${team.clubName || ''}"`,
            `"${team.ageGroupName || ''}"`,
            `"${team.submitterEmail || ''}"`,
            fee.toFixed(2),
            platformFee.toFixed(2),
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