/**
 * Platform Fee Report API
 * 
 * Provides comprehensive breakdown of KickDeck revenue and Stripe fees
 * from all processed transactions across all events.
 */

import { Request, Response } from 'express';
import { db } from '@db';
import { sql } from 'drizzle-orm';

/**
 * Get comprehensive platform fee breakdown report
 */
export async function getPlatformFeeReport(req: Request, res: Response) {
  try {
    const { startDate, endDate, eventId } = req.query;
    
    console.log('Generating platform fee report...');
    
    // Base query conditions
    let dateFilter = '';
    let eventFilter = '';
    
    if (startDate && endDate) {
      dateFilter = `AND t.created_at BETWEEN '${startDate}' AND '${endDate}'`;
    }
    
    if (eventId) {
      eventFilter = `AND t.event_id = '${eventId}'`;
    }
    
    // Get comprehensive payment data with calculated fees
    const paymentDataQuery = sql`
      SELECT 
        t.id as team_id,
        t.name as team_name,
        e.name as event_name,
        t.total_amount as tournament_cost_cents,
        t.payment_intent_id,
        t.stripe_customer_id,
        t.payment_status,
        t.created_at,
        t.approved_at,
        pt.total_charged_amount,
        pt.platform_fee_amount,
        pt.stripe_fee_amount,
        pt.kickdeck_revenue,
        pt.net_amount as tournament_receives,
        CASE 
          WHEN t.stripe_customer_id IS NULL THEN 'Link'
          ELSE 'Card'
        END as payment_method_type
      FROM teams t
      LEFT JOIN events e ON t.event_id = e.id
      LEFT JOIN payment_transactions pt ON t.payment_intent_id = pt.payment_intent_id
      WHERE t.payment_status = 'paid' 
        AND t.payment_intent_id IS NOT NULL
        ${dateFilter}
        ${eventFilter}
      ORDER BY t.approved_at DESC
    `;
    
    const paymentData = await db.execute(paymentDataQuery);
    
    // Calculate aggregated statistics
    const summaryQuery = sql`
      SELECT 
        COUNT(*) as total_transactions,
        COUNT(DISTINCT t.event_id) as total_events,
        SUM(t.total_amount) as total_tournament_costs,
        SUM(pt.total_charged_amount) as total_charged_to_customers,
        SUM(pt.platform_fee_amount) as total_platform_fees_collected,
        SUM(pt.stripe_fee_amount) as total_stripe_fees_paid,
        SUM(pt.kickdeck_revenue) as total_kickdeck_net_revenue,
        AVG(pt.kickdeck_revenue) as avg_kickdeck_revenue_per_transaction,
        SUM(CASE WHEN t.stripe_customer_id IS NULL THEN pt.kickdeck_revenue ELSE 0 END) as link_payment_revenue,
        SUM(CASE WHEN t.stripe_customer_id IS NOT NULL THEN pt.kickdeck_revenue ELSE 0 END) as card_payment_revenue,
        COUNT(CASE WHEN t.stripe_customer_id IS NULL THEN 1 END) as link_payment_count,
        COUNT(CASE WHEN t.stripe_customer_id IS NOT NULL THEN 1 END) as card_payment_count
      FROM teams t
      LEFT JOIN payment_transactions pt ON t.payment_intent_id = pt.payment_intent_id
      WHERE t.payment_status = 'paid' 
        AND t.payment_intent_id IS NOT NULL
        ${dateFilter}
        ${eventFilter}
    `;
    
    const summaryResult = await db.execute(summaryQuery);
    const summary = summaryResult[0] || {};
    
    // Calculate fee effectiveness metrics
    const platformFeeRate = summary.total_tournament_costs > 0 
      ? (summary.total_platform_fees_collected / summary.total_tournament_costs) * 100 
      : 0;
      
    const stripeFeeRate = summary.total_charged_to_customers > 0
      ? (summary.total_stripe_fees_paid / summary.total_charged_to_customers) * 100
      : 0;
      
    const kickdeckMarginRate = summary.total_platform_fees_collected > 0
      ? (summary.total_kickdeck_net_revenue / summary.total_platform_fees_collected) * 100
      : 0;
    
    // Get event-level breakdown
    const eventBreakdownQuery = sql`
      SELECT 
        e.id as event_id,
        e.name as event_name,
        COUNT(t.id) as team_count,
        SUM(t.total_amount) as tournament_costs,
        SUM(pt.total_charged_amount) as total_charged,
        SUM(pt.platform_fee_amount) as platform_fees,
        SUM(pt.stripe_fee_amount) as stripe_fees,
        SUM(pt.kickdeck_revenue) as kickdeck_revenue,
        AVG(pt.kickdeck_revenue) as avg_revenue_per_team
      FROM events e
      INNER JOIN teams t ON e.id = t.event_id
      LEFT JOIN payment_transactions pt ON t.payment_intent_id = pt.payment_intent_id
      WHERE t.payment_status = 'paid' 
        AND t.payment_intent_id IS NOT NULL
        ${dateFilter}
        ${eventFilter}
      GROUP BY e.id, e.name
      ORDER BY kickdeck_revenue DESC
    `;
    
    const eventBreakdown = await db.execute(eventBreakdownQuery);
    
    // Format the response
    const response = {
      reportMetadata: {
        generatedAt: new Date().toISOString(),
        dateRange: { startDate: startDate || null, endDate: endDate || null },
        eventFilter: eventId || null
      },
      summary: {
        totalTransactions: parseInt(summary.total_transactions) || 0,
        totalEvents: parseInt(summary.total_events) || 0,
        totalTournamentCosts: parseInt(summary.total_tournament_costs) || 0,
        totalChargedToCustomers: parseInt(summary.total_charged_to_customers) || 0,
        totalPlatformFeesCollected: parseInt(summary.total_platform_fees_collected) || 0,
        totalStripeFeespaid: parseInt(summary.total_stripe_fees_paid) || 0,
        totalKickDeckNetRevenue: parseInt(summary.total_kickdeck_net_revenue) || 0,
        avgKickDeckRevenuePerTransaction: parseInt(summary.avg_kickdeck_revenue_per_transaction) || 0,
        platformFeeRate: parseFloat(platformFeeRate.toFixed(2)),
        stripeFeeRate: parseFloat(stripeFeeRate.toFixed(2)),
        kickdeckMarginRate: parseFloat(kickdeckMarginRate.toFixed(2))
      },
      paymentMethodBreakdown: {
        linkPayments: {
          count: parseInt(summary.link_payment_count) || 0,
          revenue: parseInt(summary.link_payment_revenue) || 0,
          avgRevenuePerPayment: summary.link_payment_count > 0 
            ? parseInt(summary.link_payment_revenue) / parseInt(summary.link_payment_count)
            : 0
        },
        cardPayments: {
          count: parseInt(summary.card_payment_count) || 0,
          revenue: parseInt(summary.card_payment_revenue) || 0,
          avgRevenuePerPayment: summary.card_payment_count > 0
            ? parseInt(summary.card_payment_revenue) / parseInt(summary.card_payment_count)
            : 0
        }
      },
      eventBreakdown: eventBreakdown.map(event => ({
        eventId: event.event_id,
        eventName: event.event_name,
        teamCount: parseInt(event.team_count),
        tournamentCosts: parseInt(event.tournament_costs),
        totalCharged: parseInt(event.total_charged),
        platformFees: parseInt(event.platform_fees),
        stripeFees: parseInt(event.stripe_fees),
        kickdeckRevenue: parseInt(event.kickdeck_revenue),
        avgRevenuePerTeam: parseInt(event.avg_revenue_per_team)
      })),
      transactions: paymentData.map(payment => ({
        teamId: payment.team_id,
        teamName: payment.team_name,
        eventName: payment.event_name,
        tournamentCostCents: parseInt(payment.tournament_cost_cents),
        totalChargedAmount: parseInt(payment.total_charged_amount),
        platformFeeAmount: parseInt(payment.platform_fee_amount),
        stripeFeeAmount: parseInt(payment.stripe_fee_amount),
        kickdeckRevenue: parseInt(payment.kickdeck_revenue),
        tournamentReceives: parseInt(payment.tournament_receives),
        paymentMethodType: payment.payment_method_type,
        paymentIntentId: payment.payment_intent_id,
        approvedAt: payment.approved_at,
        createdAt: payment.created_at
      }))
    };
    
    console.log(`Platform fee report generated: ${response.summary.totalTransactions} transactions, $${(response.summary.totalKickDeckNetRevenue / 100).toFixed(2)} total KickDeck revenue`);
    
    res.json(response);
    
  } catch (error) {
    console.error('Error generating platform fee report:', error);
    res.status(500).json({ 
      error: 'Failed to generate platform fee report',
      details: error.message 
    });
  }
}

/**
 * Get revenue trends over time
 */
export async function getRevenueTrends(req: Request, res: Response) {
  try {
    const { period = 'daily', startDate, endDate, eventId } = req.query;
    
    console.log(`Generating revenue trends report (${period})`);
    
    let dateGrouping = '';
    switch (period) {
      case 'daily':
        dateGrouping = `DATE(t.approved_at)`;
        break;
      case 'weekly':
        dateGrouping = `DATE_TRUNC('week', t.approved_at)`;
        break;
      case 'monthly':
        dateGrouping = `DATE_TRUNC('month', t.approved_at)`;
        break;
      default:
        dateGrouping = `DATE(t.approved_at)`;
    }
    
    let dateFilter = '';
    let eventFilter = '';
    
    if (startDate && endDate) {
      dateFilter = `AND t.approved_at BETWEEN '${startDate}' AND '${endDate}'`;
    }
    
    if (eventId) {
      eventFilter = `AND t.event_id = '${eventId}'`;
    }
    
    const trendsQuery = sql`
      SELECT 
        ${dateGrouping} as period,
        COUNT(*) as transaction_count,
        SUM(pt.kickdeck_revenue) as kickdeck_revenue,
        SUM(pt.stripe_fee_amount) as stripe_fees,
        SUM(pt.platform_fee_amount) as platform_fees,
        SUM(pt.total_charged_amount) as total_charged,
        AVG(pt.kickdeck_revenue) as avg_revenue_per_transaction
      FROM teams t
      LEFT JOIN payment_transactions pt ON t.payment_intent_id = pt.payment_intent_id
      WHERE t.payment_status = 'paid' 
        AND t.payment_intent_id IS NOT NULL
        AND t.approved_at IS NOT NULL
        ${dateFilter}
        ${eventFilter}
      GROUP BY ${dateGrouping}
      ORDER BY period ASC
    `;
    
    const trends = await db.execute(trendsQuery);
    
    const response = {
      period,
      dateRange: { startDate: startDate || null, endDate: endDate || null },
      eventFilter: eventId || null,
      trends: trends.map(trend => ({
        period: trend.period,
        transactionCount: parseInt(trend.transaction_count),
        kickdeckRevenue: parseInt(trend.kickdeck_revenue),
        stripeFees: parseInt(trend.stripe_fees),
        platformFees: parseInt(trend.platform_fees),
        totalCharged: parseInt(trend.total_charged),
        avgRevenuePerTransaction: parseInt(trend.avg_revenue_per_transaction)
      })),
      generatedAt: new Date().toISOString()
    };
    
    console.log(`Revenue trends report generated: ${trends.length} periods`);
    res.json(response);
    
  } catch (error) {
    console.error('Error generating revenue trends:', error);
    res.status(500).json({ 
      error: 'Failed to generate revenue trends',
      details: error.message 
    });
  }
}