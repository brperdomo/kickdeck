import { Application } from 'express';
import { db } from '@db';
import { events, teams, paymentTransactions } from '@db/schema';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import { isAdmin } from '../middleware/auth';

export function registerPaymentReportRoutes(app: Application) {
  
  // Get payment transactions summary for an event
  app.get("/api/events/:eventId/payment-reports/summary", isAdmin, async (req, res) => {
    try {
      const { eventId } = req.params;

      // Get all transactions for the event
      const transactions = await db.query.paymentTransactions.findMany({
        where: eq(paymentTransactions.eventId, parseInt(eventId)),
        with: {
          team: {
            columns: {
              id: true,
              teamName: true,
              clubName: true,
              submitterName: true,
              submitterEmail: true,
              ageGroupName: true
            }
          }
        },
        orderBy: [desc(paymentTransactions.createdAt)]
      });

      // Calculate summary metrics
      const summary = {
        totalTransactions: transactions.length,
        totalRevenue: 0,
        totalPlatformFees: 0,
        totalStripeFees: 0,
        totalNetAmount: 0,
        successfulPayments: 0,
        failedPayments: 0,
        pendingPayments: 0,
        refundedPayments: 0,
        dailyBreakdown: [] as any[]
      };

      // Process transactions for summary
      const dailyMap = new Map();
      
      transactions.forEach((transaction: any) => {
        const amount = transaction.amount || 0;
        const platformFee = transaction.applicationFeeAmount || 0;
        const processingFee = transaction.processingFees || 0;
        const netAmount = transaction.netAmount || 0;

        summary.totalRevenue += amount;
        summary.totalPlatformFees += platformFee;
        summary.totalStripeFees += processingFee;
        summary.totalNetAmount += netAmount;

        // Count payment statuses
        switch (transaction.status) {
          case 'succeeded':
            summary.successfulPayments++;
            break;
          case 'failed':
            summary.failedPayments++;
            break;
          case 'pending':
            summary.pendingPayments++;
            break;
          case 'refunded':
            summary.refundedPayments++;
            break;
        }

        // Daily breakdown
        const date = transaction.createdAt.toISOString().split('T')[0];
        if (!dailyMap.has(date)) {
          dailyMap.set(date, {
            date,
            transactions: 0,
            revenue: 0,
            platformFees: 0,
            stripeFees: 0,
            netAmount: 0
          });
        }

        const dailyData = dailyMap.get(date);
        dailyData.transactions++;
        dailyData.revenue += amount;
        dailyData.platformFees += platformFee;
        dailyData.stripeFees += processingFee;
        dailyData.netAmount += netAmount;
      });

      // Convert daily map to sorted array
      summary.dailyBreakdown = Array.from(dailyMap.values())
        .sort((a, b) => b.date.localeCompare(a.date));

      // Convert cents to dollars for frontend display
      summary.totalRevenue = Math.round(summary.totalRevenue) / 100;
      summary.totalPlatformFees = Math.round(summary.totalPlatformFees) / 100;
      summary.totalStripeFees = Math.round(summary.totalStripeFees) / 100;
      summary.totalNetAmount = Math.round(summary.totalNetAmount) / 100;

      summary.dailyBreakdown = summary.dailyBreakdown.map(day => ({
        ...day,
        revenue: Math.round(day.revenue) / 100,
        platformFees: Math.round(day.platformFees) / 100,
        stripeFees: Math.round(day.stripeFees) / 100,
        netAmount: Math.round(day.netAmount) / 100
      }));

      res.json(summary);

    } catch (error: any) {
      console.error("Error fetching payment summary:", error);
      res.status(500).json({ 
        error: "Failed to fetch payment summary",
        details: error.message 
      });
    }
  });

  // Get detailed transaction list for an event
  app.get("/api/events/:eventId/payment-reports/transactions", isAdmin, async (req, res) => {
    try {
      const { eventId } = req.params;
      const { startDate, endDate, status, page = 1, limit = 50 } = req.query;

      // Build filters
      let whereCondition = eq(paymentTransactions.eventId, parseInt(eventId));
      
      if (startDate) {
        whereCondition = and(whereCondition, gte(paymentTransactions.createdAt, new Date(startDate as string)));
      }
      if (endDate) {
        whereCondition = and(whereCondition, lte(paymentTransactions.createdAt, new Date(endDate as string)));
      }
      if (status && status !== 'all') {
        whereCondition = and(whereCondition, eq(paymentTransactions.status, status as string));
      }

      // Get transactions with pagination
      const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
      
      const transactions = await db.query.paymentTransactions.findMany({
        where: whereCondition,
        with: {
          team: {
            columns: {
              id: true,
              teamName: true,
              clubName: true,
              submitterName: true,
              submitterEmail: true,
              ageGroupName: true,
              cardLast4: true,
              cardBrand: true
            }
          }
        },
        orderBy: [desc(paymentTransactions.createdAt)],
        limit: parseInt(limit as string),
        offset: offset
      });

      // Format transactions for frontend
      const formattedTransactions = transactions.map(transaction => ({
        id: transaction.id,
        date: transaction.createdAt.toISOString(),
        team: {
          id: transaction.team?.id,
          name: transaction.team?.teamName,
          club: transaction.team?.clubName,
          ageGroup: transaction.team?.ageGroupName,
          submitter: {
            name: transaction.team?.submitterName,
            email: transaction.team?.submitterEmail
          }
        },
        payment: {
          stripePaymentIntentId: transaction.stripePaymentIntentId,
          amount: Math.round(transaction.amount || 0) / 100,
          currency: transaction.currency,
          status: transaction.status,
          cardInfo: {
            last4: transaction.team?.cardLast4,
            brand: transaction.team?.cardBrand
          }
        },
        fees: {
          platformFee: Math.round(transaction.applicationFeeAmount || 0) / 100,
          stripeFee: Math.round(transaction.processingFees || 0) / 100,
          netAmount: Math.round(transaction.netAmount || 0) / 100
        },
        stripe: {
          connectAccountId: transaction.connectAccountId,
          transferId: transaction.transferId
        }
      }));

      res.json({
        transactions: formattedTransactions,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total: transactions.length,
          hasMore: transactions.length === parseInt(limit as string)
        }
      });

    } catch (error: any) {
      console.error("Error fetching transaction details:", error);
      res.status(500).json({ 
        error: "Failed to fetch transaction details",
        details: error.message 
      });
    }
  });

  // Export payment report as CSV
  app.get("/api/events/:eventId/payment-reports/export", isAdmin, async (req, res) => {
    try {
      const { eventId } = req.params;
      const { startDate, endDate, format = 'csv' } = req.query;

      // Build date filter
      let dateFilter = eq(paymentTransactions.eventId, parseInt(eventId));
      if (startDate) {
        dateFilter = and(dateFilter, gte(paymentTransactions.createdAt, new Date(startDate as string)));
      }
      if (endDate) {
        dateFilter = and(dateFilter, lte(paymentTransactions.createdAt, new Date(endDate as string)));
      }

      // Get all transactions
      const transactions = await db.query.paymentTransactions.findMany({
        where: dateFilter,
        with: {
          team: {
            columns: {
              teamName: true,
              clubName: true,
              submitterName: true,
              submitterEmail: true,
              ageGroupName: true,
              cardLast4: true,
              cardBrand: true
            }
          }
        },
        orderBy: [desc(paymentTransactions.createdAt)]
      });

      if (format === 'csv') {
        // Generate CSV
        const csvHeaders = [
          'Date',
          'Team Name',
          'Club Name',
          'Age Group',
          'Submitter Name',
          'Submitter Email',
          'Payment Amount',
          'Platform Fee',
          'Stripe Fee',
          'Net Amount',
          'Payment Status',
          'Card Last 4',
          'Card Brand',
          'Stripe Payment ID',
          'Transfer ID'
        ];

        const csvRows = transactions.map(transaction => [
          transaction.createdAt.toISOString().split('T')[0],
          transaction.team?.teamName || '',
          transaction.team?.clubName || '',
          transaction.team?.ageGroupName || '',
          transaction.team?.submitterName || '',
          transaction.team?.submitterEmail || '',
          `$${((transaction.amount || 0) / 100).toFixed(2)}`,
          `$${((transaction.applicationFeeAmount || 0) / 100).toFixed(2)}`,
          `$${((transaction.processingFees || 0) / 100).toFixed(2)}`,
          `$${((transaction.netAmount || 0) / 100).toFixed(2)}`,
          transaction.status,
          transaction.team?.cardLast4 || '',
          transaction.team?.cardBrand || '',
          transaction.stripePaymentIntentId || '',
          transaction.transferId || ''
        ]);

        const csvContent = [csvHeaders, ...csvRows]
          .map(row => row.map(field => `"${field}"`).join(','))
          .join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="payment-report-${eventId}-${new Date().toISOString().split('T')[0]}.csv"`);
        res.send(csvContent);
      } else {
        res.status(400).json({ error: 'Unsupported export format' });
      }

    } catch (error: any) {
      console.error("Error exporting payment report:", error);
      res.status(500).json({ 
        error: "Failed to export payment report",
        details: error.message 
      });
    }
  });

  // Get payout schedule and next payout information
  app.get("/api/events/:eventId/payment-reports/payouts", isAdmin, async (req, res) => {
    try {
      const { eventId } = req.params;

      // Get event with Connect account info
      const event = await db.query.events.findFirst({
        where: eq(events.id, parseInt(eventId))
      });

      if (!event || !event.stripeConnectAccountId) {
        return res.status(404).json({ error: "Connect account not found" });
      }

      // Get payout information from Stripe
      const stripe = (await import('stripe')).default;
      const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: '2025-02-24.acacia',
      });

      const account = await stripeInstance.accounts.retrieve(event.stripeConnectAccountId);
      const payouts = await stripeInstance.payouts.list(
        { limit: 10 },
        { stripeAccount: event.stripeConnectAccountId }
      );

      const payoutInfo = {
        schedule: account.settings?.payouts?.schedule || { interval: 'weekly' },
        recentPayouts: payouts.data.map(payout => ({
          id: payout.id,
          amount: payout.amount / 100,
          currency: payout.currency,
          status: payout.status,
          arrivalDate: new Date(payout.arrival_date * 1000).toISOString(),
          description: payout.description,
          failureCode: payout.failure_code,
          failureMessage: payout.failure_message
        })),
        nextPayoutEstimate: getNextPayoutEstimate(account.settings?.payouts?.schedule)
      };

      res.json(payoutInfo);

    } catch (error: any) {
      console.error("Error fetching payout information:", error);
      res.status(500).json({ 
        error: "Failed to fetch payout information",
        details: error.message 
      });
    }
  });
}

function getNextPayoutEstimate(schedule: any) {
  if (!schedule) return null;

  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  switch (schedule.interval) {
    case 'daily':
      return tomorrow.toISOString().split('T')[0];
    case 'weekly':
      const nextWeek = new Date(now);
      nextWeek.setDate(nextWeek.getDate() + (7 - now.getDay()));
      return nextWeek.toISOString().split('T')[0];
    case 'monthly':
      const nextMonth = new Date(now);
      nextMonth.setMonth(nextMonth.getMonth() + 1, 1);
      return nextMonth.toISOString().split('T')[0];
    default:
      return null;
  }
}