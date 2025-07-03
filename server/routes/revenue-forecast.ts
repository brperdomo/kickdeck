import { Request, Response } from 'express';
import { db } from '@db';
import { sql } from 'drizzle-orm';

/**
 * Revenue Forecast Report
 * 
 * Provides forecasted revenue based on captured transactions (collect now, charge later)
 * and pending team approvals. Shows both realized and projected revenue.
 */
export async function getRevenueForecastReport(req: Request, res: Response) {
  try {
    const { 
      startDate, 
      endDate, 
      eventId 
    } = req.query;
    
    // Parse date range - default to current month if not provided
    const startDateObj = startDate 
      ? new Date(startDate as string) 
      : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const endDateObj = endDate 
      ? new Date(endDate as string) 
      : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);
    
    // Build event filter if provided
    const eventFilter = eventId ? sql` AND t.event_id = ${eventId}` : sql``;
    
    // Query for captured transactions (setup intents created)
    const capturedQuery = sql`
      SELECT 
        COUNT(*) as captured_count,
        SUM(pt.amount) as captured_amount,
        SUM(ROUND(pt.amount * 0.029 + 30)) as estimated_stripe_fees,
        e.id as event_id,
        e.name as event_name,
        COUNT(CASE WHEN t.payment_status = 'pending' THEN 1 END) as pending_approval_count,
        COUNT(CASE WHEN t.payment_status = 'approved' THEN 1 END) as approved_count,
        COUNT(CASE WHEN t.payment_status = 'rejected' THEN 1 END) as rejected_count
      FROM payment_transactions pt
      JOIN teams t ON pt.team_id = t.id
      JOIN events e ON t.event_id = e.id
      WHERE pt.created_at BETWEEN ${startDateObj.toISOString()} AND ${endDateObj.toISOString()}
        AND pt.transaction_type = 'registration_payment'
        AND pt.status = 'succeeded'
        ${eventFilter}
      GROUP BY e.id, e.name
      ORDER BY e.name
    `;
    
    // Query for pending teams (not yet captured but registered)
    const pendingQuery = sql`
      SELECT 
        COUNT(*) as pending_registrations,
        SUM(t.total_amount) as potential_revenue,
        e.id as event_id,
        e.name as event_name,
        COUNT(CASE WHEN t.payment_status = 'pending' THEN 1 END) as awaiting_approval_count,
        SUM(CASE WHEN t.payment_status = 'pending' THEN t.total_amount ELSE 0 END) as awaiting_approval_amount
      FROM teams t
      JOIN events e ON t.event_id = e.id
      WHERE t.created_at::timestamp BETWEEN ${startDateObj.toISOString()} AND ${endDateObj.toISOString()}
        AND (t.stripe_customer_id IS NULL OR t.setup_intent_id IS NULL)
        AND t.total_amount > 0
        ${eventFilter}
      GROUP BY e.id, e.name
      ORDER BY e.name
    `;
    
    // Query for overall summary
    const summaryQuery = sql`
      WITH captured_summary AS (
        SELECT 
          COUNT(*) as total_captured,
          SUM(pt.amount) as total_captured_amount,
          COUNT(CASE WHEN t.payment_status = 'pending' THEN 1 END) as pending_charges,
          SUM(CASE WHEN t.payment_status = 'pending' THEN pt.amount ELSE 0 END) as pending_charge_amount
        FROM payment_transactions pt
        JOIN teams t ON pt.team_id = t.id
        WHERE pt.created_at BETWEEN ${startDateObj.toISOString()} AND ${endDateObj.toISOString()}
          AND pt.transaction_type = 'registration_payment'
          AND pt.status = 'succeeded'
          ${eventFilter}
      ),
      potential_summary AS (
        SELECT 
          COUNT(*) as potential_registrations,
          SUM(t.total_amount) as potential_amount,
          COUNT(CASE WHEN t.payment_status = 'pending' THEN 1 END) as teams_awaiting_approval,
          SUM(CASE WHEN t.payment_status = 'pending' THEN t.total_amount ELSE 0 END) as amount_awaiting_approval
        FROM teams t
        WHERE t.created_at::timestamp BETWEEN ${startDateObj.toISOString()} AND ${endDateObj.toISOString()}
          AND (t.stripe_customer_id IS NULL OR t.setup_intent_id IS NULL)
          AND t.total_amount > 0
          ${eventFilter}
      )
      SELECT 
        cs.*,
        ps.potential_registrations,
        ps.potential_amount,
        (cs.total_captured_amount + COALESCE(ps.potential_amount, 0)) as forecasted_total
      FROM captured_summary cs
      CROSS JOIN potential_summary ps
    `;
    
    const [capturedResults, pendingResults, summaryResults] = await Promise.all([
      db.execute(capturedQuery),
      db.execute(pendingQuery),
      db.execute(summaryQuery)
    ]);
    
    // Process results - convert cents to dollars
    const capturedByEvent = capturedResults.map((row: any) => ({
      eventId: row.event_id,
      eventName: row.event_name,
      capturedCount: parseInt(row.captured_count) || 0,
      capturedAmount: (parseInt(row.captured_amount) || 0) / 100,
      estimatedStripeFees: (parseInt(row.estimated_stripe_fees) || 0) / 100,
      pendingApprovalCount: parseInt(row.pending_approval_count) || 0,
      approvedCount: parseInt(row.approved_count) || 0,
      rejectedCount: parseInt(row.rejected_count) || 0,
      netCapturedAmount: ((parseInt(row.captured_amount) || 0) - (parseInt(row.estimated_stripe_fees) || 0)) / 100
    }));
    
    const pendingByEvent = pendingResults.map((row: any) => ({
      eventId: row.event_id,
      eventName: row.event_name,
      pendingRegistrations: parseInt(row.pending_registrations) || 0,
      potentialRevenue: (parseInt(row.potential_revenue) || 0) / 100,
      estimatedStripeFees: (Math.round((parseInt(row.potential_revenue) || 0) * 0.029 + 30)) / 100,
      netPotentialRevenue: ((parseInt(row.potential_revenue) || 0) - Math.round((parseInt(row.potential_revenue) || 0) * 0.029 + 30)) / 100
    }));
    
    const summary = summaryResults[0] ? {
      totalCaptured: parseInt(summaryResults[0].total_captured) || 0,
      totalCapturedAmount: (parseInt(summaryResults[0].total_captured_amount) || 0) / 100,
      pendingCharges: parseInt(summaryResults[0].pending_charges) || 0,
      pendingChargeAmount: (parseInt(summaryResults[0].pending_charge_amount) || 0) / 100,
      potentialRegistrations: parseInt(summaryResults[0].potential_registrations) || 0,
      potentialAmount: (parseInt(summaryResults[0].potential_amount) || 0) / 100,
      forecastedTotal: (parseInt(summaryResults[0].forecasted_total) || 0) / 100,
      estimatedTotalFees: (Math.round((parseInt(summaryResults[0].forecasted_total) || 0) * 0.029 + 30)) / 100,
      forecastedNetRevenue: ((parseInt(summaryResults[0].forecasted_total) || 0) - Math.round((parseInt(summaryResults[0].forecasted_total) || 0) * 0.029 + 30)) / 100
    } : {
      totalCaptured: 0,
      totalCapturedAmount: 0,
      pendingCharges: 0,
      pendingChargeAmount: 0,
      potentialRegistrations: 0,
      potentialAmount: 0,
      forecastedTotal: 0,
      estimatedTotalFees: 0,
      forecastedNetRevenue: 0
    };
    
    return res.json({
      success: true,
      summary,
      capturedByEvent,
      pendingByEvent,
      filters: {
        startDate: startDateObj.toISOString(),
        endDate: endDateObj.toISOString(),
        eventId: eventId || null
      }
    });
  } catch (error) {
    console.error('Error fetching revenue forecast report:', error);
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'An unknown error occurred' 
    });
  }
}