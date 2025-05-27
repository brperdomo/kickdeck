import { Request, Response } from 'express';
import { db } from '@db';
import { sql } from 'drizzle-orm';
import { 
  paymentTransactions, 
  eventFees, 
  eventAgeGroupFees, 
  eventAgeGroups, 
  events, 
  teams 
} from '@db/schema';

/**
 * Enhanced Financial Reports API
 * Provides comprehensive revenue analysis with Stripe fee tracking and fee-type breakdowns
 */

/**
 * Get comprehensive event revenue report with fee breakdown and Stripe costs
 */
export async function getEnhancedEventFinancialReport(req: Request, res: Response) {
  try {
    const { eventId } = req.params;
    const { startDate, endDate } = req.query;

    console.log(`Generating enhanced financial report for event ${eventId}`);

    // Get overall event revenue with Stripe fee analysis
    const overallRevenueQuery = sql`
      SELECT 
        COUNT(pt.id) as total_transactions,
        SUM(pt.amount) as gross_revenue,
        SUM(COALESCE(pt.stripe_fee, ROUND(pt.amount * 0.029 + 30))) as total_stripe_fees,
        SUM(COALESCE(pt.net_amount, pt.amount - ROUND(pt.amount * 0.029 + 30))) as net_revenue,
        AVG(pt.amount) as avg_transaction_amount,
        COUNT(DISTINCT pt.team_id) as unique_teams_paid
      FROM payment_transactions pt
      JOIN teams t ON pt.team_id = t.id
      WHERE t.event_id = ${eventId}
      AND pt.status = 'succeeded'
      AND pt.transaction_type = 'payment'
      ${startDate ? sql`AND pt.created_at >= ${startDate}` : sql``}
      ${endDate ? sql`AND pt.created_at <= ${endDate}` : sql``}
    `;
    
    const overallRevenue = await db.execute(overallRevenueQuery);

    // Get revenue breakdown by fee type
    const feeTypeRevenueQuery = sql`
      WITH fee_payments AS (
        SELECT 
          ef.fee_type,
          ef.name as fee_name,
          ef.amount as fee_amount,
          COUNT(pt.id) as payment_count,
          SUM(pt.amount) as gross_revenue,
          SUM(COALESCE(pt.stripe_fee, ROUND(pt.amount * 0.029 + 30))) as stripe_fees,
          SUM(COALESCE(pt.net_amount, pt.amount - ROUND(pt.amount * 0.029 + 30))) as net_revenue
        FROM payment_transactions pt
        JOIN teams t ON pt.team_id = t.id
        JOIN event_age_group_fees eagf ON t.age_group_id = eagf.age_group_id
        JOIN event_fees ef ON eagf.fee_id = ef.id
        WHERE t.event_id = ${eventId}
        AND pt.status = 'succeeded'
        AND pt.transaction_type = 'payment'
        ${startDate ? sql`AND pt.created_at >= ${startDate}` : sql``}
        ${endDate ? sql`AND pt.created_at <= ${endDate}` : sql``}
        GROUP BY ef.fee_type, ef.name, ef.amount
      )
      SELECT 
        fee_type,
        SUM(payment_count) as total_payments,
        SUM(gross_revenue) as total_gross_revenue,
        SUM(stripe_fees) as total_stripe_fees,
        SUM(net_revenue) as total_net_revenue,
        AVG(fee_amount) as avg_fee_amount,
        COUNT(DISTINCT fee_name) as unique_fees
      FROM fee_payments
      GROUP BY fee_type
      ORDER BY total_gross_revenue DESC
    `;

    const feeTypeRevenue = await db.execute(feeTypeRevenueQuery);

    // Get individual fee performance
    const individualFeeQuery = sql`
      SELECT 
        ef.id,
        ef.name,
        ef.fee_type,
        ef.amount as fee_amount,
        ef.is_required,
        COUNT(DISTINCT eagf.age_group_id) as assigned_age_groups,
        COUNT(pt.id) as payment_count,
        SUM(pt.amount) as gross_revenue,
        SUM(COALESCE(pt.stripe_fee, ROUND(pt.amount * 0.029 + 30))) as stripe_fees,
        SUM(COALESCE(pt.net_amount, pt.amount - ROUND(pt.amount * 0.029 + 30))) as net_revenue,
        ROUND(AVG(pt.amount), 2) as avg_payment_amount
      FROM event_fees ef
      LEFT JOIN event_age_group_fees eagf ON ef.id = eagf.fee_id
      LEFT JOIN teams t ON eagf.age_group_id = t.age_group_id AND t.event_id = ${eventId}
      LEFT JOIN payment_transactions pt ON t.id = pt.team_id 
        AND pt.status = 'succeeded' 
        AND pt.transaction_type = 'payment'
        ${startDate ? sql`AND pt.created_at >= ${startDate}` : sql``}
        ${endDate ? sql`AND pt.created_at <= ${endDate}` : sql``}
      WHERE ef.event_id = ${eventId}
      GROUP BY ef.id, ef.name, ef.fee_type, ef.amount, ef.is_required
      ORDER BY gross_revenue DESC NULLS LAST
    `;

    const individualFees = await db.execute(individualFeeQuery);

    // Get Stripe fee analysis by payment method
    const paymentMethodAnalysisQuery = sql`
      SELECT 
        pt.card_brand,
        pt.payment_method_type,
        COUNT(pt.id) as transaction_count,
        SUM(pt.amount) as gross_revenue,
        SUM(COALESCE(pt.stripe_fee, ROUND(pt.amount * 0.029 + 30))) as stripe_fees,
        AVG(COALESCE(pt.stripe_fee, ROUND(pt.amount * 0.029 + 30))) as avg_stripe_fee,
        ROUND(
          (SUM(COALESCE(pt.stripe_fee, ROUND(pt.amount * 0.029 + 30))) * 100.0 / NULLIF(SUM(pt.amount), 0)), 
          2
        ) as stripe_fee_percentage
      FROM payment_transactions pt
      JOIN teams t ON pt.team_id = t.id
      WHERE t.event_id = ${eventId}
      AND pt.status = 'succeeded'
      AND pt.transaction_type = 'payment'
      ${startDate ? sql`AND pt.created_at >= ${startDate}` : sql``}
      ${endDate ? sql`AND pt.created_at <= ${endDate}` : sql``}
      GROUP BY pt.card_brand, pt.payment_method_type
      ORDER BY gross_revenue DESC
    `;

    const paymentMethodAnalysis = await db.execute(paymentMethodAnalysisQuery);

    // Get daily revenue trend with net vs gross
    const dailyTrendQuery = sql`
      SELECT 
        DATE(pt.created_at) as date,
        COUNT(pt.id) as daily_transactions,
        SUM(pt.amount) as daily_gross_revenue,
        SUM(COALESCE(pt.stripe_fee, ROUND(pt.amount * 0.029 + 30))) as daily_stripe_fees,
        SUM(COALESCE(pt.net_amount, pt.amount - ROUND(pt.amount * 0.029 + 30))) as daily_net_revenue
      FROM payment_transactions pt
      JOIN teams t ON pt.team_id = t.id
      WHERE t.event_id = ${eventId}
      AND pt.status = 'succeeded'
      AND pt.transaction_type = 'payment'
      ${startDate ? sql`AND pt.created_at >= ${startDate}` : sql``}
      ${endDate ? sql`AND pt.created_at <= ${endDate}` : sql``}
      GROUP BY DATE(pt.created_at)
      ORDER BY date DESC
      LIMIT 30
    `;

    const dailyTrend = await db.execute(dailyTrendQuery);

    // Calculate key financial metrics
    const revenue = overallRevenue[0];
    const stripeFeePercentage = revenue?.total_stripe_fees && revenue?.gross_revenue 
      ? (revenue.total_stripe_fees / revenue.gross_revenue * 100).toFixed(2)
      : '0.00';
    
    const profitMargin = revenue?.net_revenue && revenue?.gross_revenue
      ? (revenue.net_revenue / revenue.gross_revenue * 100).toFixed(2)
      : '0.00';

    const response = {
      eventId: parseInt(eventId),
      dateRange: { startDate, endDate },
      overview: {
        totalTransactions: revenue?.total_transactions || 0,
        grossRevenue: revenue?.gross_revenue || 0,
        totalStripeFees: revenue?.total_stripe_fees || 0,
        netRevenue: revenue?.net_revenue || 0,
        avgTransactionAmount: revenue?.avg_transaction_amount || 0,
        uniqueTeamsPaid: revenue?.unique_teams_paid || 0,
        stripeFeePercentage: parseFloat(stripeFeePercentage),
        profitMargin: parseFloat(profitMargin)
      },
      feeTypeBreakdown: feeTypeRevenue,
      individualFeePerformance: individualFees,
      paymentMethodAnalysis: paymentMethodAnalysis,
      dailyRevenueTrend: dailyTrend,
      generatedAt: new Date().toISOString()
    };

    console.log(`Enhanced financial report generated for event ${eventId}`);
    res.json(response);

  } catch (error) {
    console.error('Error generating enhanced financial report:', error);
    res.status(500).json({ 
      error: 'Failed to generate enhanced financial report',
      details: error.message 
    });
  }
}

/**
 * Get organization-wide revenue summary with Stripe fee analysis
 */
export async function getOrganizationFinancialSummary(req: Request, res: Response) {
  try {
    const { startDate, endDate, includeEventBreakdown = 'true' } = req.query;

    console.log('Generating organization-wide financial summary');

    // Overall organization metrics
    const orgSummaryQuery = sql`
      SELECT 
        COUNT(pt.id) as total_transactions,
        COUNT(DISTINCT pt.event_id) as active_events,
        COUNT(DISTINCT pt.team_id) as unique_teams,
        SUM(pt.amount) as gross_revenue,
        SUM(COALESCE(pt.stripe_fee, ROUND(pt.amount * 0.029 + 30))) as total_stripe_fees,
        SUM(COALESCE(pt.net_amount, pt.amount - ROUND(pt.amount * 0.029 + 30))) as net_revenue,
        AVG(pt.amount) as avg_transaction_amount
      FROM payment_transactions pt
      WHERE pt.status = 'succeeded'
      AND pt.transaction_type = 'payment'
      ${startDate ? sql`AND pt.created_at >= ${startDate}` : sql``}
      ${endDate ? sql`AND pt.created_at <= ${endDate}` : sql``}
    `;

    const orgSummary = await db.execute(orgSummaryQuery);

    // Fee type performance across all events
    const globalFeeTypeQuery = sql`
      SELECT 
        ef.fee_type,
        COUNT(DISTINCT ef.event_id) as events_using_fee_type,
        COUNT(pt.id) as total_payments,
        SUM(pt.amount) as gross_revenue,
        SUM(COALESCE(pt.stripe_fee, ROUND(pt.amount * 0.029 + 30))) as stripe_fees,
        SUM(COALESCE(pt.net_amount, pt.amount - ROUND(pt.amount * 0.029 + 30))) as net_revenue,
        AVG(ef.amount) as avg_fee_amount
      FROM event_fees ef
      LEFT JOIN event_age_group_fees eagf ON ef.id = eagf.fee_id
      LEFT JOIN teams t ON eagf.age_group_id = t.age_group_id
      LEFT JOIN payment_transactions pt ON t.id = pt.team_id 
        AND pt.status = 'succeeded' 
        AND pt.transaction_type = 'payment'
        ${startDate ? sql`AND pt.created_at >= ${startDate}` : sql``}
        ${endDate ? sql`AND pt.created_at <= ${endDate}` : sql``}
      GROUP BY ef.fee_type
      ORDER BY gross_revenue DESC NULLS LAST
    `;

    const globalFeeTypes = await db.execute(globalFeeTypeQuery);

    let eventBreakdown = [];
    if (includeEventBreakdown === 'true') {
      // Revenue by event
      const eventBreakdownQuery = sql`
        SELECT 
          e.id as event_id,
          e.name as event_name,
          COUNT(pt.id) as transactions,
          SUM(pt.amount) as gross_revenue,
          SUM(COALESCE(pt.stripe_fee, ROUND(pt.amount * 0.029 + 30))) as stripe_fees,
          SUM(COALESCE(pt.net_amount, pt.amount - ROUND(pt.amount * 0.029 + 30))) as net_revenue,
          COUNT(DISTINCT pt.team_id) as teams_paid
        FROM events e
        LEFT JOIN teams t ON e.id = t.event_id
        LEFT JOIN payment_transactions pt ON t.id = pt.team_id 
          AND pt.status = 'succeeded' 
          AND pt.transaction_type = 'payment'
          ${startDate ? sql`AND pt.created_at >= ${startDate}` : sql``}
          ${endDate ? sql`AND pt.created_at <= ${endDate}` : sql``}
        GROUP BY e.id, e.name
        HAVING SUM(pt.amount) > 0
        ORDER BY gross_revenue DESC
      `;

      eventBreakdown = await db.execute(eventBreakdownQuery);
    }

    const summary = orgSummary[0];
    const stripeFeePercentage = summary?.total_stripe_fees && summary?.gross_revenue 
      ? (summary.total_stripe_fees / summary.gross_revenue * 100).toFixed(2)
      : '0.00';

    const response = {
      dateRange: { startDate, endDate },
      organizationSummary: {
        totalTransactions: summary?.total_transactions || 0,
        activeEvents: summary?.active_events || 0,
        uniqueTeams: summary?.unique_teams || 0,
        grossRevenue: summary?.gross_revenue || 0,
        totalStripeFees: summary?.total_stripe_fees || 0,
        netRevenue: summary?.net_revenue || 0,
        avgTransactionAmount: summary?.avg_transaction_amount || 0,
        stripeFeePercentage: parseFloat(stripeFeePercentage)
      },
      globalFeeTypePerformance: globalFeeTypes,
      eventBreakdown: eventBreakdown,
      generatedAt: new Date().toISOString()
    };

    console.log('Organization financial summary generated');
    res.json(response);

  } catch (error) {
    console.error('Error generating organization financial summary:', error);
    res.status(500).json({ 
      error: 'Failed to generate organization financial summary',
      details: error.message 
    });
  }
}

/**
 * Get Stripe fee optimization insights
 */
export async function getStripeFeeOptimizationReport(req: Request, res: Response) {
  try {
    const { startDate, endDate } = req.query;

    console.log('Generating Stripe fee optimization report');

    // Analyze fee structures and their impact on Stripe costs
    const feeOptimizationQuery = sql`
      WITH fee_analysis AS (
        SELECT 
          ef.id,
          ef.name,
          ef.amount as fee_amount,
          ef.fee_type,
          COUNT(pt.id) as payment_count,
          SUM(pt.amount) as gross_revenue,
          SUM(COALESCE(pt.stripe_fee, ROUND(pt.amount * 0.029 + 30))) as stripe_fees,
          -- Calculate what fees would be with optimized amounts
          SUM(ROUND((ef.amount + 35) * 0.029 + 30)) as estimated_optimized_fees,
          -- Calculate potential savings
          SUM(COALESCE(pt.stripe_fee, ROUND(pt.amount * 0.029 + 30))) - 
          SUM(ROUND((ef.amount + 35) * 0.029 + 30)) as potential_savings
        FROM event_fees ef
        LEFT JOIN event_age_group_fees eagf ON ef.id = eagf.fee_id
        LEFT JOIN teams t ON eagf.age_group_id = t.age_group_id
        LEFT JOIN payment_transactions pt ON t.id = pt.team_id 
          AND pt.status = 'succeeded' 
          AND pt.transaction_type = 'payment'
          ${startDate ? sql`AND pt.created_at >= ${startDate}` : sql``}
          ${endDate ? sql`AND pt.created_at <= ${endDate}` : sql``}
        GROUP BY ef.id, ef.name, ef.amount, ef.fee_type
        HAVING COUNT(pt.id) > 0
      )
      SELECT 
        *,
        ROUND((stripe_fees * 100.0 / NULLIF(gross_revenue, 0)), 2) as stripe_fee_percentage,
        ROUND((potential_savings * 100.0 / NULLIF(stripe_fees, 0)), 2) as potential_savings_percentage
      FROM fee_analysis
      ORDER BY potential_savings DESC
    `;

    const feeOptimization = await db.execute(feeOptimizationQuery);

    // Payment method cost analysis
    const paymentMethodCostQuery = sql`
      SELECT 
        pt.card_brand,
        pt.payment_method_type,
        COUNT(pt.id) as transaction_count,
        AVG(pt.amount) as avg_transaction_amount,
        AVG(COALESCE(pt.stripe_fee, ROUND(pt.amount * 0.029 + 30))) as avg_stripe_fee,
        SUM(COALESCE(pt.stripe_fee, ROUND(pt.amount * 0.029 + 30))) as total_stripe_fees,
        ROUND(
          (AVG(COALESCE(pt.stripe_fee, ROUND(pt.amount * 0.029 + 30))) * 100.0 / NULLIF(AVG(pt.amount), 0)), 
          2
        ) as avg_fee_percentage
      FROM payment_transactions pt
      WHERE pt.status = 'succeeded'
      AND pt.transaction_type = 'payment'
      ${startDate ? sql`AND pt.created_at >= ${startDate}` : sql``}
      ${endDate ? sql`AND pt.created_at <= ${endDate}` : sql``}
      GROUP BY pt.card_brand, pt.payment_method_type
      ORDER BY avg_fee_percentage DESC
    `;

    const paymentMethodCosts = await db.execute(paymentMethodCostQuery);

    const response = {
      dateRange: { startDate, endDate },
      feeOptimizationOpportunities: feeOptimization,
      paymentMethodCostAnalysis: paymentMethodCosts,
      recommendations: [
        {
          type: 'fee_structure',
          title: 'Consider consolidating small fees',
          description: 'Multiple small fees result in higher Stripe fee percentages. Consider bundling fees where possible.'
        },
        {
          type: 'payment_timing',
          title: 'Optimize payment timing',
          description: 'Collecting larger amounts less frequently can reduce the impact of Stripe\'s fixed $0.30 fee.'
        },
        {
          type: 'payment_methods',
          title: 'Encourage lower-cost payment methods',
          description: 'Some card types have lower processing fees. Consider incentivizing these methods.'
        }
      ],
      generatedAt: new Date().toISOString()
    };

    console.log('Stripe fee optimization report generated');
    res.json(response);

  } catch (error) {
    console.error('Error generating Stripe fee optimization report:', error);
    res.status(500).json({ 
      error: 'Failed to generate Stripe fee optimization report',
      details: error.message 
    });
  }
}