import { Request, Response } from 'express';
import { db } from '@db';
import { 
  teams, 
  paymentTransactions, 
  events,
  users
} from '@db/schema';
import { desc, eq, and, sql, isNotNull } from 'drizzle-orm';

/**
 * Get registration orders report data
 */
export async function getRegistrationOrdersReport(req: Request, res: Response) {
  try {
    // Check if user is authenticated and has finance admin permissions
    if (!req.user || !req.isAuthenticated()) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Check for admin status (permissions will be checked in more detail later)
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: 'You do not have permission to access this report' });
    }
    
    // Allow optional filtering by date range, event, or status
    const { startDate, endDate, eventId, status } = req.query;
    
    // Build query conditions
    const conditions = [];
    
    if (startDate) {
      conditions.push(sql`pt.created_at >= ${startDate}`);
    }
    
    if (endDate) {
      conditions.push(sql`pt.created_at <= ${endDate}`);
    }
    
    if (eventId) {
      conditions.push(sql`pt.event_id = ${eventId}`);
    }
    
    if (status) {
      conditions.push(sql`pt.status = ${status}`);
    }
    
    // Include only payment transactions (not refunds, etc.) by default
    conditions.push(sql`pt.transaction_type = 'payment'`);
    
    const whereClause = conditions.length > 0 
      ? sql`WHERE ${sql.join(conditions, sql` AND `)}` 
      : sql``;
    
    // Execute the query with joins to get all the required data
    const results = await db.execute(sql`
      SELECT 
        pt.id,
        pt.transaction_type,
        pt.amount,
        pt.status,
        pt.card_brand,
        pt.card_last_four,
        pt.payment_method_type,
        pt.payment_intent_id,
        pt.created_at AS date_paid,
        pt.updated_at AS date_settled,
        t.id AS team_id,
        t.name AS team_name,
        t.submitter_name AS order_submitter,
        e.id AS event_id,
        e.name AS event_name,
        e.start_date AS event_start_date,
        u.id AS user_id,
        u.name AS user_name,
        u.email AS user_email
      FROM payment_transactions pt
      LEFT JOIN teams t ON pt.team_id = t.id
      LEFT JOIN events e ON pt.event_id = e.id
      LEFT JOIN users u ON pt.user_id = u.id
      ${whereClause}
      ORDER BY pt.created_at DESC
    `);
    
    // Format the data for the frontend
    const formattedData = results.rows.map((row: any) => ({
      id: row.id,
      transactionType: row.transaction_type,
      amount: row.amount,
      formattedAmount: `$${(row.amount / 100).toFixed(2)}`,
      status: row.status,
      cardBrand: row.card_brand,
      cardLastFour: row.card_last_four,
      paymentMethodType: row.payment_method_type,
      paymentIntentId: row.payment_intent_id,
      datePaid: row.date_paid ? new Date(row.date_paid).toLocaleString() : null,
      dateSettled: row.date_settled ? new Date(row.date_settled).toLocaleString() : null,
      teamId: row.team_id,
      teamName: row.team_name,
      orderSubmitter: row.order_submitter,
      eventId: row.event_id,
      eventName: row.event_name,
      eventStartDate: row.event_start_date ? new Date(row.event_start_date).toLocaleString() : null,
      userId: row.user_id,
      userName: row.user_name,
      userEmail: row.user_email
    }));
    
    return res.json({
      success: true,
      data: formattedData
    });
  } catch (error) {
    console.error('Error fetching registration orders report:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch registration orders report',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Get all financial reports data based on type
 */
export async function getFinancialReportData(req: Request, res: Response) {
  try {
    const { reportType } = req.params;
    
    // Check if user is authenticated and has admin permission
    if (!req.user || !req.isAuthenticated()) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Check for admin status
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: 'You do not have permission to access this report' });
    }
    
    // Route to the appropriate report handler
    switch (reportType) {
      case 'registration-orders':
        return await getRegistrationOrdersReport(req, res);
      // Add more report types as needed
      default:
        return res.status(400).json({ error: `Unknown report type: ${reportType}` });
    }
  } catch (error) {
    console.error('Error fetching financial report:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch financial report',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}