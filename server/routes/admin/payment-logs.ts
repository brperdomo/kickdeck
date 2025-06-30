import { Request, Response } from 'express';
import { db } from '@db';
import { paymentTransactions, teams, events, eventAgeGroups } from '@db/schema';
import { eq, and, or, like, desc, sql, count } from 'drizzle-orm';
// Auth middleware will be handled by the main routes file

/**
 * Get comprehensive payment logs with filtering and search capabilities
 * Provides detailed transaction history including error information
 */
export async function getPaymentLogs(req: Request, res: Response) {
  try {
    const { status, type, search, format, limit = '100', offset = '0' } = req.query;
    
    // Build the base query with joins
    let query = db
      .select({
        // Transaction details
        id: paymentTransactions.id,
        teamId: paymentTransactions.teamId,
        eventId: paymentTransactions.eventId,
        userId: paymentTransactions.userId,
        paymentIntentId: paymentTransactions.paymentIntentId,
        setupIntentId: paymentTransactions.setupIntentId,
        transactionType: paymentTransactions.transactionType,
        amount: paymentTransactions.amount,
        stripeFee: paymentTransactions.stripeFee,
        netAmount: paymentTransactions.netAmount,
        status: paymentTransactions.status,
        cardBrand: paymentTransactions.cardBrand,
        cardLastFour: paymentTransactions.cardLastFour,
        paymentMethodType: paymentTransactions.paymentMethodType,
        errorCode: paymentTransactions.errorCode,
        errorMessage: paymentTransactions.errorMessage,
        settlementDate: paymentTransactions.settlementDate,
        payoutId: paymentTransactions.payoutId,
        createdAt: paymentTransactions.createdAt,
        updatedAt: paymentTransactions.updatedAt,
        // Team details
        teamName: teams.name,
        managerName: teams.managerName,
        managerEmail: teams.managerEmail,
        managerPhone: teams.managerPhone,
        clubName: teams.clubName,
        // Event details
        eventName: events.name,
        ageGroup: eventAgeGroups.ageGroup,
      })
      .from(paymentTransactions)
      .leftJoin(teams, eq(paymentTransactions.teamId, teams.id))
      .leftJoin(events, eq(paymentTransactions.eventId, events.id))
      .leftJoin(eventAgeGroups, eq(teams.ageGroupId, eventAgeGroups.id));

    // Apply filters
    const filters = [];

    if (status && status !== 'all') {
      filters.push(eq(paymentTransactions.status, status as string));
    }

    if (type && type !== 'all') {
      filters.push(eq(paymentTransactions.transactionType, type as string));
    }

    if (search) {
      const searchTerm = `%${search}%`;
      filters.push(
        or(
          like(teams.name, searchTerm),
          like(teams.managerName, searchTerm),
          like(teams.managerEmail, searchTerm),
          like(events.name, searchTerm),
          like(paymentTransactions.paymentIntentId, searchTerm),
          like(paymentTransactions.setupIntentId, searchTerm),
          like(paymentTransactions.errorCode, searchTerm),
          like(paymentTransactions.errorMessage, searchTerm)
        )
      );
    }

    if (filters.length > 0) {
      query = query.where(and(...filters));
    }

    // Handle CSV export
    if (format === 'csv') {
      const transactions = await query
        .orderBy(desc(paymentTransactions.createdAt))
        .limit(10000); // Cap exports at 10k records

      const csvHeaders = [
        'ID',
        'Date',
        'Team Name',
        'Event Name',
        'Age Group',
        'Manager Name',
        'Manager Email',
        'Manager Phone',
        'Club Name',
        'Transaction Type',
        'Amount',
        'Stripe Fee',
        'Net Amount',
        'Status',
        'Payment Method Type',
        'Card Brand',
        'Card Last Four',
        'Payment Intent ID',
        'Setup Intent ID',
        'Error Code',
        'Error Message',
        'Settlement Date',
        'Payout ID'
      ].join(',');

      const csvRows = transactions.map(t => [
        t.id,
        t.createdAt?.toISOString(),
        `"${t.teamName || ''}"`,
        `"${t.eventName || ''}"`,
        `"${t.ageGroup || ''}"`,
        `"${t.managerName || ''}"`,
        `"${t.managerEmail || ''}"`,
        `"${t.managerPhone || ''}"`,
        `"${t.clubName || ''}"`,
        t.transactionType,
        t.amount,
        t.stripeFee || 0,
        t.netAmount || t.amount,
        t.status,
        t.paymentMethodType || '',
        t.cardBrand || '',
        t.cardLastFour || '',
        t.paymentIntentId || '',
        t.setupIntentId || '',
        t.errorCode || '',
        `"${(t.errorMessage || '').replace(/"/g, '""')}"`,
        t.settlementDate?.toISOString() || '',
        t.payoutId || ''
      ].join(','));

      const csvContent = [csvHeaders, ...csvRows].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="payment-logs-${new Date().toISOString().split('T')[0]}.csv"`);
      return res.send(csvContent);
    }

    // Get summary statistics
    const summaryQuery = db
      .select({
        totalTransactions: count(),
        totalAmount: sql<number>`COALESCE(SUM(${paymentTransactions.amount}), 0)`,
        successfulTransactions: sql<number>`COALESCE(SUM(CASE WHEN ${paymentTransactions.status} = 'succeeded' THEN 1 ELSE 0 END), 0)`,
        failedTransactions: sql<number>`COALESCE(SUM(CASE WHEN ${paymentTransactions.status} = 'failed' THEN 1 ELSE 0 END), 0)`,
        pendingTransactions: sql<number>`COALESCE(SUM(CASE WHEN ${paymentTransactions.status} = 'pending' THEN 1 ELSE 0 END), 0)`,
        refundedTransactions: sql<number>`COALESCE(SUM(CASE WHEN ${paymentTransactions.status} = 'refunded' THEN 1 ELSE 0 END), 0)`,
      })
      .from(paymentTransactions)
      .leftJoin(teams, eq(paymentTransactions.teamId, teams.id))
      .leftJoin(events, eq(paymentTransactions.eventId, events.id));

    let summaryQueryWithFilters = summaryQuery;
    if (filters.length > 0) {
      summaryQueryWithFilters = summaryQuery.where(and(...filters));
    }

    // Execute summary query
    const [summary] = await summaryQuery;

    // Get paginated transactions
    const transactions = await query
      .orderBy(desc(paymentTransactions.createdAt))
      .limit(parseInt(limit as string))
      .offset(parseInt(offset as string));

    return res.json({
      success: true,
      transactions,
      summary: {
        totalTransactions: Number(summary.totalTransactions),
        totalAmount: Number(summary.totalAmount),
        successfulTransactions: Number(summary.successfulTransactions),
        failedTransactions: Number(summary.failedTransactions),
        pendingTransactions: Number(summary.pendingTransactions),
        refundedTransactions: Number(summary.refundedTransactions),
      },
      pagination: {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        hasMore: transactions.length === parseInt(limit as string),
      },
    });

  } catch (error) {
    console.error('Error fetching payment logs:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch payment logs'
    });
  }
}

/**
 * Get detailed information about a specific payment transaction
 */
export async function getPaymentTransactionDetail(req: Request, res: Response) {
  try {
    const { transactionId } = req.params;

    const [transaction] = await db
      .select({
        // Transaction details
        id: paymentTransactions.id,
        teamId: paymentTransactions.teamId,
        eventId: paymentTransactions.eventId,
        userId: paymentTransactions.userId,
        paymentIntentId: paymentTransactions.paymentIntentId,
        setupIntentId: paymentTransactions.setupIntentId,
        transactionType: paymentTransactions.transactionType,
        amount: paymentTransactions.amount,
        stripeFee: paymentTransactions.stripeFee,
        netAmount: paymentTransactions.netAmount,
        status: paymentTransactions.status,
        cardBrand: paymentTransactions.cardBrand,
        cardLastFour: paymentTransactions.cardLastFour,
        paymentMethodType: paymentTransactions.paymentMethodType,
        errorCode: paymentTransactions.errorCode,
        errorMessage: paymentTransactions.errorMessage,
        settlementDate: paymentTransactions.settlementDate,
        payoutId: paymentTransactions.payoutId,
        metadata: paymentTransactions.metadata,
        notes: paymentTransactions.notes,
        createdAt: paymentTransactions.createdAt,
        updatedAt: paymentTransactions.updatedAt,
        // Team details
        teamName: teams.name,
        managerName: teams.managerName,
        managerEmail: teams.managerEmail,
        managerPhone: teams.managerPhone,
        clubName: teams.clubName,
        submitterEmail: teams.submitterEmail,
        // Event details
        eventName: events.name,
        ageGroup: eventAgeGroups.ageGroup,
      })
      .from(paymentTransactions)
      .leftJoin(teams, eq(paymentTransactions.teamId, teams.id))
      .leftJoin(events, eq(paymentTransactions.eventId, events.id))
      .leftJoin(eventAgeGroups, eq(teams.ageGroupId, eventAgeGroups.id))
      .where(eq(paymentTransactions.id, parseInt(transactionId)))
      .limit(1);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Payment transaction not found'
      });
    }

    return res.json({
      success: true,
      transaction
    });

  } catch (error) {
    console.error('Error fetching payment transaction detail:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch transaction details'
    });
  }
}

/**
 * Get recent payment failures for dashboard alerts
 */
export async function getRecentPaymentFailures(req: Request, res: Response) {
  try {
    const { hours = '24' } = req.query;
    const hoursAgo = new Date(Date.now() - parseInt(hours as string) * 60 * 60 * 1000);

    const failures = await db
      .select({
        id: paymentTransactions.id,
        teamName: teams.name,
        eventName: events.name,
        amount: paymentTransactions.amount,
        errorCode: paymentTransactions.errorCode,
        errorMessage: paymentTransactions.errorMessage,
        createdAt: paymentTransactions.createdAt,
        managerEmail: teams.managerEmail,
      })
      .from(paymentTransactions)
      .leftJoin(teams, eq(paymentTransactions.teamId, teams.id))
      .leftJoin(events, eq(paymentTransactions.eventId, events.id))
      .where(
        and(
          eq(paymentTransactions.status, 'failed'),
          sql`${paymentTransactions.createdAt} >= ${hoursAgo}`
        )
      )
      .orderBy(desc(paymentTransactions.createdAt))
      .limit(10);

    return res.json({
      success: true,
      failures
    });

  } catch (error) {
    console.error('Error fetching recent payment failures:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch recent failures'
    });
  }
}