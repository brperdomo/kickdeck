import { Request, Response } from 'express';
import { db } from '@db';
import { sql } from 'drizzle-orm';

/**
 * Get comprehensive payment logs with filtering and search capabilities
 * Provides detailed transaction history including error information
 */
export async function getPaymentLogs(req: Request, res: Response) {
  try {
    const { status, type, search, format, limit = '100', offset = '0', completeOnly } = req.query;
    
    console.log('Payment logs request params:', { status, type, search, format, limit, offset, completeOnly });
    
    // Build WHERE conditions dynamically
    const conditions = [];
    const params: any[] = [];

    if (status && status !== 'all') {
      conditions.push(`pt.status = ?`);
      params.push(status);
    }

    if (type && type !== 'all') {
      conditions.push(`pt.transaction_type = ?`);
      params.push(type);
    }

    if (search) {
      const searchTerm = `%${search}%`;
      conditions.push(`(
        t.name LIKE ? OR 
        t.manager_name LIKE ? OR 
        t.manager_email LIKE ? OR 
        e.name LIKE ? OR 
        pt.payment_intent_id LIKE ? OR 
        pt.setup_intent_id LIKE ? OR 
        pt.error_code LIKE ? OR 
        pt.error_message LIKE ?
      )`);
      params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }

    // Filter for complete data only (transactions with team and event information)
    console.log('Complete only filter check:', completeOnly, typeof completeOnly, completeOnly === 'true');
    // TEMPORARY TEST: Always apply complete data filter to see if logic works
    console.log('APPLYING COMPLETE DATA FILTER FOR TESTING');
    conditions.push(`pt.team_id IS NOT NULL AND pt.event_id IS NOT NULL`);
    if (completeOnly === 'true') {
      console.log('Adding complete data filter condition (was already added for testing)');
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Handle CSV export
    if (format === 'csv') {
      const csvQuery = `
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
      `;

      const csvResult = await db.execute(sql.raw(csvQuery, params));
      const transactions = csvResult.rows;

      // Generate CSV content
      const csvHeaders = [
        'ID', 'Date', 'Team Name', 'Event Name', 'Age Group', 'Manager Name', 'Manager Email', 
        'Manager Phone', 'Club Name', 'Transaction Type', 'Amount', 'Stripe Fee', 'Net Amount', 
        'Status', 'Payment Method', 'Card Brand', 'Card Last Four', 'Payment Intent ID', 
        'Setup Intent ID', 'Error Code', 'Error Message', 'Settlement Date', 'Payout ID'
      ].join(',');

      const csvRows = transactions.map((t: any) => [
        t.id,
        new Date(t.created_at).toISOString(),
        `"${(t.team_name || '').replace(/"/g, '""')}"`,
        `"${(t.event_name || '').replace(/"/g, '""')}"`,
        `"${(t.age_group || '').replace(/"/g, '""')}"`,
        `"${(t.manager_name || '').replace(/"/g, '""')}"`,
        t.manager_email || '',
        t.manager_phone || '',
        `"${(t.club_name || '').replace(/"/g, '""')}"`,
        t.transaction_type || '',
        t.amount || 0,
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
        t.settlement_date || '',
        t.payout_id || ''
      ].join(','));

      const csvContent = [csvHeaders, ...csvRows].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="payment-logs-${new Date().toISOString().split('T')[0]}.csv"`);
      return res.send(csvContent);
    }

    // Get summary statistics
    const summaryQuery = `
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
    `;

    const summaryResult = await db.execute(sql.raw(summaryQuery, params));
    const summary = summaryResult.rows[0];

    // Get paginated transactions
    const limitValue = parseInt(limit as string);
    const offsetValue = parseInt(offset as string);
    
    const transactionsQuery = `
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
        pt.net_amount,
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
      ORDER BY 
        CASE WHEN pt.team_id IS NOT NULL AND pt.event_id IS NOT NULL THEN 0 ELSE 1 END,
        pt.created_at DESC
      LIMIT ${limitValue} OFFSET ${offsetValue}
    `;

    console.log('Final conditions array:', conditions);
    console.log('Final WHERE clause:', whereClause);
    console.log('Final SQL query:', transactionsQuery);
    console.log('Query parameters:', params);
    
    const transactionsResult = await db.execute(sql.raw(transactionsQuery, params));
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

    const query = `
      SELECT 
        pt.*,
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
      WHERE pt.id = ?
    `;

    const result = await db.execute(sql.raw(query, [transactionId]));
    const transaction = result.rows[0];

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found'
      });
    }

    return res.json({
      success: true,
      transaction
    });

  } catch (error) {
    console.error('Error fetching transaction detail:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch transaction detail'
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

    const query = `
      SELECT 
        pt.id,
        pt.error_code,
        pt.error_message,
        pt.amount,
        pt.created_at,
        t.name as team_name,
        t.manager_email,
        e.name as event_name
      FROM payment_transactions pt
      LEFT JOIN teams t ON pt.team_id = t.id
      LEFT JOIN events e ON pt.event_id = e.id
      WHERE pt.status = 'failed' 
        AND pt.created_at >= ?
      ORDER BY pt.created_at DESC
      LIMIT 50
    `;

    const result = await db.execute(sql.raw(query, [hoursAgo.toISOString()]));
    const failures = result.rows;

    return res.json({
      success: true,
      failures,
      count: failures.length
    });

  } catch (error) {
    console.error('Error fetching recent payment failures:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch recent payment failures'
    });
  }
}