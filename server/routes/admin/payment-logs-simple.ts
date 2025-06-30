import { Request, Response } from 'express';
import { db } from '@db';
import { sql } from 'drizzle-orm';

/**
 * Get comprehensive payment logs with filtering and search capabilities
 * Provides detailed transaction history including error information
 */
export async function getPaymentLogs(req: Request, res: Response) {
  try {
    const { status, type, search, format, limit = '100', offset = '0' } = req.query;
    
    // Build the WHERE clause conditions
    const conditions = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (status && status !== 'all') {
      conditions.push(`pt.status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    if (type && type !== 'all') {
      conditions.push(`pt.transaction_type = $${paramIndex}`);
      params.push(type);
      paramIndex++;
    }

    if (search) {
      const searchTerm = `%${search}%`;
      const searchParams = [];
      for (let i = 0; i < 8; i++) {
        searchParams.push(`$${paramIndex + i}`);
        params.push(searchTerm);
      }
      conditions.push(`(
        t.name ILIKE ${searchParams[0]} OR 
        t.manager_name ILIKE ${searchParams[1]} OR 
        t.manager_email ILIKE ${searchParams[2]} OR 
        e.name ILIKE ${searchParams[3]} OR 
        pt.payment_intent_id ILIKE ${searchParams[4]} OR 
        pt.setup_intent_id ILIKE ${searchParams[5]} OR 
        pt.error_code ILIKE ${searchParams[6]} OR 
        pt.error_message ILIKE ${searchParams[7]}
      )`);
      paramIndex += 8;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Handle CSV export
    if (format === 'csv') {
      const csvQuery = sql.raw(`
        SELECT 
          pt.id,
          pt.created_at,
          t.name as team_name,
          e.name as event_name,
          eag.age_group,
          t.manager_name,
          t.manager_email,
          t.manager_phone,
          t.club_name,
          pt.transaction_type,
          pt.amount,
          pt.stripe_fee,
          COALESCE(pt.net_amount, pt.amount) as net_amount,
          pt.status,
          pt.payment_method_type,
          pt.card_brand,
          pt.card_last_four,
          pt.payment_intent_id,
          pt.setup_intent_id,
          pt.error_code,
          pt.error_message,
          pt.settlement_date,
          pt.payout_id
        FROM payment_transactions pt
        LEFT JOIN teams t ON pt.team_id = t.id
        LEFT JOIN events e ON pt.event_id = e.id
        LEFT JOIN event_age_groups eag ON t.age_group_id = eag.id
        ${whereClause}
        ORDER BY pt.created_at DESC
        LIMIT 10000
      `, params);

      const result = await db.execute(csvQuery);
      const transactions = result.rows;

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

      const csvRows = transactions.map((t: any) => [
        t.id,
        t.created_at?.toISOString ? t.created_at.toISOString() : t.created_at,
        `"${t.team_name || ''}"`,
        `"${t.event_name || ''}"`,
        `"${t.age_group || ''}"`,
        `"${t.manager_name || ''}"`,
        `"${t.manager_email || ''}"`,
        `"${t.manager_phone || ''}"`,
        `"${t.club_name || ''}"`,
        t.transaction_type,
        t.amount,
        t.stripe_fee || 0,
        t.net_amount || t.amount,
        t.status,
        t.payment_method_type || '',
        t.card_brand || '',
        t.card_last_four || '',
        t.payment_intent_id || '',
        t.setup_intent_id || '',
        t.error_code || '',
        `"${(t.error_message || '').replace(/"/g, '""')}"`,
        t.settlement_date?.toISOString ? t.settlement_date.toISOString() : t.settlement_date || '',
        t.payout_id || ''
      ].join(','));

      const csvContent = [csvHeaders, ...csvRows].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="payment-logs-${new Date().toISOString().split('T')[0]}.csv"`);
      return res.send(csvContent);
    }

    // Get summary statistics
    const summaryQuery = sql.raw(`
      SELECT 
        COUNT(*) as total_transactions,
        COALESCE(SUM(pt.amount), 0) as total_amount,
        COALESCE(SUM(CASE WHEN pt.status = 'succeeded' THEN 1 ELSE 0 END), 0) as successful_transactions,
        COALESCE(SUM(CASE WHEN pt.status = 'failed' THEN 1 ELSE 0 END), 0) as failed_transactions,
        COALESCE(SUM(CASE WHEN pt.status = 'pending' THEN 1 ELSE 0 END), 0) as pending_transactions,
        COALESCE(SUM(CASE WHEN pt.status = 'refunded' THEN 1 ELSE 0 END), 0) as refunded_transactions
      FROM payment_transactions pt
      LEFT JOIN teams t ON pt.team_id = t.id
      LEFT JOIN events e ON pt.event_id = e.id
      ${whereClause}
    `, params);

    const summaryResult = await db.execute(summaryQuery);
    const summary = summaryResult.rows[0];

    // Get paginated transactions
    const limitValue = parseInt(limit as string);
    const offsetValue = parseInt(offset as string);
    
    const transactionsQuery = sql.raw(`
      SELECT 
        pt.id,
        pt.team_id,
        pt.event_id,
        pt.user_id,
        pt.payment_intent_id,
        pt.setup_intent_id,
        pt.transaction_type,
        pt.amount,
        pt.stripe_fee,
        COALESCE(pt.net_amount, pt.amount) as net_amount,
        pt.status,
        pt.card_brand,
        pt.card_last_four,
        pt.payment_method_type,
        pt.error_code,
        pt.error_message,
        pt.settlement_date,
        pt.payout_id,
        pt.created_at,
        pt.updated_at,
        t.name as team_name,
        t.manager_name,
        t.manager_email,
        t.manager_phone,
        t.club_name,
        e.name as event_name,
        eag.age_group
      FROM payment_transactions pt
      LEFT JOIN teams t ON pt.team_id = t.id
      LEFT JOIN events e ON pt.event_id = e.id
      LEFT JOIN event_age_groups eag ON t.age_group_id = eag.id
      ${whereClause}
      ORDER BY pt.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `, [...params, limitValue, offsetValue]);

    const transactionsResult = await db.execute(transactionsQuery);
    const transactions = transactionsResult.rows;

    return res.json({
      success: true,
      transactions,
      summary: {
        totalTransactions: Number(summary.total_transactions),
        totalAmount: Number(summary.total_amount),
        successfulTransactions: Number(summary.successful_transactions),
        failedTransactions: Number(summary.failed_transactions),
        pendingTransactions: Number(summary.pending_transactions),
        refundedTransactions: Number(summary.refunded_transactions),
      },
      pagination: {
        limit: limitValue,
        offset: offsetValue,
        hasMore: transactions.length === limitValue,
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

    const query = sql.raw(`
      SELECT 
        pt.*,
        t.name as team_name,
        t.manager_name,
        t.manager_email,
        t.manager_phone,
        t.club_name,
        t.submitter_email,
        e.name as event_name,
        eag.age_group
      FROM payment_transactions pt
      LEFT JOIN teams t ON pt.team_id = t.id
      LEFT JOIN events e ON pt.event_id = e.id
      LEFT JOIN event_age_groups eag ON t.age_group_id = eag.id
      WHERE pt.id = $1
      LIMIT 1
    `, [parseInt(transactionId)]);

    const result = await db.execute(query);
    const transaction = result.rows[0];

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

    const query = sql.raw(`
      SELECT 
        pt.id,
        t.name as team_name,
        e.name as event_name,
        pt.amount,
        pt.error_code,
        pt.error_message,
        pt.created_at,
        t.manager_email
      FROM payment_transactions pt
      LEFT JOIN teams t ON pt.team_id = t.id
      LEFT JOIN events e ON pt.event_id = e.id
      WHERE pt.status = 'failed' AND pt.created_at >= $1
      ORDER BY pt.created_at DESC
      LIMIT 10
    `, [hoursAgo]);

    const result = await db.execute(query);
    const failures = result.rows;

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