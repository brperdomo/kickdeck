/**
 * Platform Fee Reports API
 * 
 * Provides detailed reporting on platform fees, MatchPro revenue,
 * and Stripe fee breakdown with transaction-level visibility.
 */

import type { Express } from "express";
import { db } from "@db";
import { paymentTransactions, teams, events } from "@db/schema";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";

export function registerPlatformFeeReports(app: Express) {
  
  /**
   * Get platform fee summary with breakdown
   */
  app.get("/api/admin/reports/platform-fees/summary", async (req, res) => {
    try {
      const { startDate, endDate, eventId } = req.query;

      let whereConditions = [eq(paymentTransactions.status, 'succeeded')];
      
      if (startDate) {
        whereConditions.push(gte(paymentTransactions.createdAt, new Date(startDate as string)));
      }
      
      if (endDate) {
        whereConditions.push(lte(paymentTransactions.createdAt, new Date(endDate as string)));
      }
      
      if (eventId) {
        whereConditions.push(eq(paymentTransactions.eventId, parseInt(eventId as string)));
      }

      // Get summary data
      const summary = await db
        .select({
          totalTransactions: sql<number>`count(*)`,
          totalAmount: sql<number>`sum(${paymentTransactions.amount})`,
          totalPlatformFees: sql<number>`sum(${paymentTransactions.platformFeeAmount})`,
          totalStripeFees: sql<number>`sum(${paymentTransactions.stripeFee})`,
          totalMatchProRevenue: sql<number>`sum(${paymentTransactions.matchproRevenue})`,
          totalNetAmount: sql<number>`sum(${paymentTransactions.netAmount})`,
        })
        .from(paymentTransactions)
        .where(and(...whereConditions));

      // Get daily breakdown
      const dailyBreakdown = await db
        .select({
          date: sql<string>`date(${paymentTransactions.createdAt})`,
          transactionCount: sql<number>`count(*)`,
          totalAmount: sql<number>`sum(${paymentTransactions.amount})`,
          platformFees: sql<number>`sum(${paymentTransactions.platformFeeAmount})`,
          stripeFees: sql<number>`sum(${paymentTransactions.stripeFee})`,
          matchproRevenue: sql<number>`sum(${paymentTransactions.matchproRevenue})`,
          netAmount: sql<number>`sum(${paymentTransactions.netAmount})`,
        })
        .from(paymentTransactions)
        .where(and(...whereConditions))
        .groupBy(sql`date(${paymentTransactions.createdAt})`)
        .orderBy(sql`date(${paymentTransactions.createdAt}) desc`);

      // Get event breakdown
      const eventBreakdown = await db
        .select({
          eventId: events.id,
          eventName: events.name,
          transactionCount: sql<number>`count(${paymentTransactions.id})`,
          totalAmount: sql<number>`sum(${paymentTransactions.amount})`,
          platformFees: sql<number>`sum(${paymentTransactions.platformFeeAmount})`,
          stripeFees: sql<number>`sum(${paymentTransactions.stripeFee})`,
          matchproRevenue: sql<number>`sum(${paymentTransactions.matchproRevenue})`,
          netAmount: sql<number>`sum(${paymentTransactions.netAmount})`,
        })
        .from(paymentTransactions)
        .leftJoin(events, eq(paymentTransactions.eventId, events.id))
        .where(and(...whereConditions))
        .groupBy(events.id, events.name)
        .orderBy(desc(sql`sum(${paymentTransactions.amount})`));

      res.json({
        summary: {
          ...summary[0],
          // Convert cents to dollars for display
          totalAmount: (summary[0]?.totalAmount || 0) / 100,
          totalPlatformFees: (summary[0]?.totalPlatformFees || 0) / 100,
          totalStripeFees: (summary[0]?.totalStripeFees || 0) / 100,
          totalMatchProRevenue: (summary[0]?.totalMatchProRevenue || 0) / 100,
          totalNetAmount: (summary[0]?.totalNetAmount || 0) / 100,
        },
        dailyBreakdown: dailyBreakdown.map(day => ({
          ...day,
          totalAmount: (day.totalAmount || 0) / 100,
          platformFees: (day.platformFees || 0) / 100,
          stripeFees: (day.stripeFees || 0) / 100,
          matchproRevenue: (day.matchproRevenue || 0) / 100,
          netAmount: (day.netAmount || 0) / 100,
        })),
        eventBreakdown: eventBreakdown.map(event => ({
          ...event,
          totalAmount: (event.totalAmount || 0) / 100,
          platformFees: (event.platformFees || 0) / 100,
          stripeFees: (event.stripeFees || 0) / 100,
          matchproRevenue: (event.matchproRevenue || 0) / 100,
          netAmount: (event.netAmount || 0) / 100,
        }))
      });

    } catch (error) {
      console.error('Error fetching platform fee summary:', error);
      res.status(500).json({ message: 'Failed to fetch platform fee summary' });
    }
  });

  /**
   * Get detailed transaction list with fee breakdown
   */
  app.get("/api/admin/reports/platform-fees/transactions", async (req, res) => {
    try {
      const { startDate, endDate, eventId, limit = 50, offset = 0 } = req.query;

      let whereConditions = [eq(paymentTransactions.status, 'succeeded')];
      
      if (startDate) {
        whereConditions.push(gte(paymentTransactions.createdAt, new Date(startDate as string)));
      }
      
      if (endDate) {
        whereConditions.push(lte(paymentTransactions.createdAt, new Date(endDate as string)));
      }
      
      if (eventId) {
        whereConditions.push(eq(paymentTransactions.eventId, parseInt(eventId as string)));
      }

      // Get detailed transactions with team and event info
      const transactions = await db
        .select({
          id: paymentTransactions.id,
          paymentIntentId: paymentTransactions.paymentIntentId,
          teamId: paymentTransactions.teamId,
          teamName: teams.name,
          clubName: teams.clubName,
          eventId: paymentTransactions.eventId,
          eventName: events.name,
          amount: paymentTransactions.amount,
          platformFeeAmount: paymentTransactions.platformFeeAmount,
          stripeFee: paymentTransactions.stripeFee,
          matchproRevenue: paymentTransactions.matchproRevenue,
          netAmount: paymentTransactions.netAmount,
          applicationFeeAmount: paymentTransactions.applicationFeeAmount,
          cardBrand: paymentTransactions.cardBrand,
          cardLastFour: paymentTransactions.cardLastFour,
          paymentMethodType: paymentTransactions.paymentMethodType,
          status: paymentTransactions.status,
          createdAt: paymentTransactions.createdAt,
          metadata: paymentTransactions.metadata,
        })
        .from(paymentTransactions)
        .leftJoin(teams, eq(paymentTransactions.teamId, teams.id))
        .leftJoin(events, eq(paymentTransactions.eventId, events.id))
        .where(and(...whereConditions))
        .orderBy(desc(paymentTransactions.createdAt))
        .limit(parseInt(limit as string))
        .offset(parseInt(offset as string));

      // Get total count for pagination
      const totalCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(paymentTransactions)
        .where(and(...whereConditions));

      // Convert cents to dollars and add fee breakdown
      const transactionsWithBreakdown = transactions.map(transaction => {
        const amount = (transaction.amount || 0) / 100;
        const platformFee = (transaction.platformFeeAmount || 0) / 100;
        const stripeFee = (transaction.stripeFee || 0) / 100;
        const matchproRevenue = (transaction.matchproRevenue || 0) / 100;
        const netAmount = (transaction.netAmount || 0) / 100;

        return {
          ...transaction,
          amount,
          platformFeeAmount: platformFee,
          stripeFee,
          matchproRevenue,
          netAmount,
          feeBreakdown: {
            totalAmount: amount,
            platformFee: platformFee,
            stripeFee: stripeFee,
            matchproRevenue: matchproRevenue,
            tournamentNet: netAmount,
            platformFeePercentage: amount > 0 ? ((platformFee / (amount - platformFee)) * 100).toFixed(2) : '0.00',
            matchproPercentage: amount > 0 ? ((matchproRevenue / (amount - platformFee)) * 100).toFixed(2) : '0.00'
          }
        };
      });

      res.json({
        transactions: transactionsWithBreakdown,
        pagination: {
          total: totalCount[0]?.count || 0,
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
          hasMore: (parseInt(offset as string) + parseInt(limit as string)) < (totalCount[0]?.count || 0)
        }
      });

    } catch (error) {
      console.error('Error fetching platform fee transactions:', error);
      res.status(500).json({ message: 'Failed to fetch platform fee transactions' });
    }
  });

  /**
   * Get all transactions with comprehensive filtering
   */
  app.get("/api/admin/reports/all-transactions", async (req, res) => {
    try {
      const { 
        startDate, 
        endDate, 
        eventId, 
        status, 
        teamId, 
        paymentMethod,
        cardBrand,
        limit = 100, 
        offset = 0 
      } = req.query;

      let whereConditions = [];
      
      if (startDate) {
        whereConditions.push(gte(paymentTransactions.createdAt, new Date(startDate as string)));
      }
      
      if (endDate) {
        whereConditions.push(lte(paymentTransactions.createdAt, new Date(endDate as string)));
      }
      
      if (eventId) {
        whereConditions.push(eq(paymentTransactions.eventId, parseInt(eventId as string)));
      }

      if (status) {
        whereConditions.push(eq(paymentTransactions.status, status as string));
      }

      if (teamId) {
        whereConditions.push(eq(paymentTransactions.teamId, parseInt(teamId as string)));
      }

      if (paymentMethod) {
        whereConditions.push(eq(paymentTransactions.paymentMethodType, paymentMethod as string));
      }

      if (cardBrand) {
        whereConditions.push(eq(paymentTransactions.cardBrand, cardBrand as string));
      }

      // Get all transactions with comprehensive details
      const transactions = await db
        .select({
          id: paymentTransactions.id,
          paymentIntentId: paymentTransactions.paymentIntentId,
          teamId: paymentTransactions.teamId,
          teamName: teams.name,
          clubName: teams.clubName,
          teamReferenceId: teams.teamReferenceId,
          eventId: paymentTransactions.eventId,
          eventName: events.name,
          transactionType: paymentTransactions.transactionType,
          amount: paymentTransactions.amount,
          platformFeeAmount: paymentTransactions.platformFeeAmount,
          stripeFee: paymentTransactions.stripeFee,
          matchproRevenue: paymentTransactions.matchproRevenue,
          netAmount: paymentTransactions.netAmount,
          applicationFeeAmount: paymentTransactions.applicationFeeAmount,
          cardBrand: paymentTransactions.cardBrand,
          cardLastFour: paymentTransactions.cardLastFour,
          paymentMethodType: paymentTransactions.paymentMethodType,
          status: paymentTransactions.status,
          createdAt: paymentTransactions.createdAt,
          paymentDate: paymentTransactions.paymentDate,
          errorCode: paymentTransactions.errorCode,
          errorMessage: paymentTransactions.errorMessage,
          metadata: paymentTransactions.metadata,
        })
        .from(paymentTransactions)
        .leftJoin(teams, eq(paymentTransactions.teamId, teams.id))
        .leftJoin(events, eq(paymentTransactions.eventId, events.id))
        .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
        .orderBy(desc(paymentTransactions.createdAt))
        .limit(parseInt(limit as string))
        .offset(parseInt(offset as string));

      // Get total count for pagination
      const totalCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(paymentTransactions)
        .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

      // Convert cents to dollars
      const transactionsFormatted = transactions.map(transaction => ({
        ...transaction,
        amount: (transaction.amount || 0) / 100,
        platformFeeAmount: (transaction.platformFeeAmount || 0) / 100,
        stripeFee: (transaction.stripeFee || 0) / 100,
        matchproRevenue: (transaction.matchproRevenue || 0) / 100,
        netAmount: (transaction.netAmount || 0) / 100,
        applicationFeeAmount: (transaction.applicationFeeAmount || 0) / 100,
      }));

      res.json({
        transactions: transactionsFormatted,
        pagination: {
          total: totalCount[0]?.count || 0,
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
          hasMore: (parseInt(offset as string) + parseInt(limit as string)) < (totalCount[0]?.count || 0)
        }
      });

    } catch (error) {
      console.error('Error fetching all transactions:', error);
      res.status(500).json({ message: 'Failed to fetch transactions' });
    }
  });

  /**
   * Export transactions to CSV
   */
  app.get("/api/admin/reports/transactions/export", async (req, res) => {
    try {
      const { startDate, endDate, eventId, status } = req.query;

      let whereConditions = [];
      
      if (startDate) {
        whereConditions.push(gte(paymentTransactions.createdAt, new Date(startDate as string)));
      }
      
      if (endDate) {
        whereConditions.push(lte(paymentTransactions.createdAt, new Date(endDate as string)));
      }
      
      if (eventId) {
        whereConditions.push(eq(paymentTransactions.eventId, parseInt(eventId as string)));
      }

      if (status) {
        whereConditions.push(eq(paymentTransactions.status, status as string));
      }

      // Get all matching transactions for export
      const transactions = await db
        .select({
          paymentIntentId: paymentTransactions.paymentIntentId,
          teamName: teams.name,
          clubName: teams.clubName,
          teamReferenceId: teams.teamReferenceId,
          eventName: events.name,
          amount: paymentTransactions.amount,
          platformFeeAmount: paymentTransactions.platformFeeAmount,
          stripeFee: paymentTransactions.stripeFee,
          matchproRevenue: paymentTransactions.matchproRevenue,
          netAmount: paymentTransactions.netAmount,
          cardBrand: paymentTransactions.cardBrand,
          cardLastFour: paymentTransactions.cardLastFour,
          paymentMethodType: paymentTransactions.paymentMethodType,
          status: paymentTransactions.status,
          createdAt: paymentTransactions.createdAt,
        })
        .from(paymentTransactions)
        .leftJoin(teams, eq(paymentTransactions.teamId, teams.id))
        .leftJoin(events, eq(paymentTransactions.eventId, events.id))
        .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
        .orderBy(desc(paymentTransactions.createdAt));

      // Generate CSV content
      const csvHeaders = [
        'Payment Intent ID',
        'Team Name', 
        'Club Name',
        'Team Reference ID',
        'Event Name',
        'Total Amount',
        'Platform Fee',
        'Stripe Fee',
        'MatchPro Revenue',
        'Tournament Net',
        'Card Brand',
        'Card Last 4',
        'Payment Method',
        'Status',
        'Date'
      ];

      const csvRows = transactions.map(t => [
        t.paymentIntentId || '',
        t.teamName || '',
        t.clubName || '',
        t.teamReferenceId || '',
        t.eventName || '',
        ((t.amount || 0) / 100).toFixed(2),
        ((t.platformFeeAmount || 0) / 100).toFixed(2),
        ((t.stripeFee || 0) / 100).toFixed(2),
        ((t.matchproRevenue || 0) / 100).toFixed(2),
        ((t.netAmount || 0) / 100).toFixed(2),
        t.cardBrand || '',
        t.cardLastFour || '',
        t.paymentMethodType || '',
        t.status || '',
        t.createdAt ? new Date(t.createdAt).toISOString().split('T')[0] : ''
      ]);

      const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');

      const filename = `platform-fee-transactions-${new Date().toISOString().split('T')[0]}.csv`;
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(csvContent);

    } catch (error) {
      console.error('Error exporting transactions:', error);
      res.status(500).json({ message: 'Failed to export transactions' });
    }
  });
}