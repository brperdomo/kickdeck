import { Request, Response, Router } from 'express';
import { db } from '@db';
import { eq, and, gte, lte, sql, desc, asc } from 'drizzle-orm';
import { 
  events,
  teams,
  eventAgeGroups,
  paymentTransactions,
  eventFees,
  coupons
} from '@db/schema';
import OpenAI from 'openai';

// Initialize router
const router = Router();

// Initialize OpenAI API client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Get Registration Orders Report
 * 
 * Fetches all payment transactions with extended information for
 * the registration orders report.
 */
export async function getRegistrationOrdersReport(req: Request, res: Response) {
  try {
    // Build query
    const query = sql`
      SELECT 
        pt.id, 
        pt.amount, 
        pt.payment_method_type as payment_method, 
        pt.status, 
        pt.created_at,
        pt.payment_intent_id,
        pt.refunded_at, 
        teams.name as team_name,
        teams.manager_name,
        teams.manager_email,
        teams.manager_phone,
        teams.club_name,
        events.id as event_id,
        events.name as event_name,
        event_age_groups.age_group
      FROM payment_transactions pt
      LEFT JOIN teams ON pt.team_id = teams.id
      LEFT JOIN events ON teams.event_id = events.id
      LEFT JOIN event_age_groups ON teams.age_group_id = event_age_groups.id
      ORDER BY pt.created_at DESC
    `;

    const result = await db.execute(query);
    const transactions = result.rows || [];

    return res.json({
      success: true,
      transactions
    });
  } catch (error) {
    console.error('Error fetching registration orders report:', error);
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'An unknown error occurred' 
    });
  }
}

/**
 * Get Financial Overview Report
 * 
 * Fetches aggregated financial data across the system for the specified time period.
 */
export async function getFinancialOverviewReport(req: Request, res: Response) {
  try {
    const { period = '30d', includeAI = 'true' } = req.query;
    let startDate = new Date();
    const endDate = new Date();
    const includeAIInsights = includeAI === 'true';
    
    // Calculate start date based on period
    switch(period) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      case 'all':
        startDate = new Date(0); // Beginning of time
        break;
      default:
        startDate.setDate(startDate.getDate() - 30); // Default to 30 days
    }

    // Get total revenue
    const revenueQuery = sql`
      SELECT 
        SUM(amount) as total_revenue,
        COUNT(id) as transaction_count
      FROM payment_transactions 
      WHERE created_at BETWEEN ${startDate.toISOString()} AND ${endDate.toISOString()}
      AND status = 'succeeded'
    `;
    const revenueResult = await db.execute(revenueQuery);
    
    // Get refund data
    const refundsQuery = sql`
      SELECT 
        COUNT(id) as total_refunds,
        SUM(amount) as total_refund_amount
      FROM payment_transactions 
      WHERE refunded_at IS NOT NULL
      AND created_at BETWEEN ${startDate.toISOString()} AND ${endDate.toISOString()}
    `;
    const refundsResult = await db.execute(refundsQuery);
    
    // Get monthly revenue trend
    const monthlyRevenueQuery = sql`
      SELECT 
        DATE_TRUNC('month', created_at) as month,
        SUM(amount) as total_revenue,
        COUNT(id) as transaction_count
      FROM payment_transactions
      WHERE created_at BETWEEN ${startDate.toISOString()} AND ${endDate.toISOString()}
      AND status = 'succeeded'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY month ASC
    `;
    const monthlyRevenueTrend = await db.execute(monthlyRevenueQuery);
    
    // Get payment methods distribution
    const paymentMethodsQuery = sql`
      SELECT 
        payment_method_type as "paymentMethod",
        COUNT(id) as count,
        SUM(amount) as "totalAmount",
        AVG(amount) as "avgAmount"
      FROM payment_transactions
      WHERE created_at BETWEEN ${startDate.toISOString()} AND ${endDate.toISOString()}
      AND status = 'succeeded'
      GROUP BY payment_method_type
      ORDER BY "totalAmount" DESC
    `;
    const paymentMethods = await db.execute(paymentMethodsQuery);
    
    // Get top events by revenue - modified to include test transactions
    const topEventsQuery = sql`
      WITH event_transactions AS (
        -- Regular transactions with team_id
        SELECT 
          e.id as event_id,
          e.name as event_name,
          pt.id as transaction_id,
          pt.amount as transaction_amount
        FROM payment_transactions pt
        JOIN teams t ON pt.team_id = t.id
        JOIN events e ON t.event_id = e.id
        WHERE pt.created_at BETWEEN ${startDate.toISOString()} AND ${endDate.toISOString()}
        AND pt.status = 'succeeded'
        
        UNION ALL
        
        -- Test transactions (null team_id) - distribute evenly across events
        SELECT 
          e.id as event_id,
          e.name as event_name,
          pt.id as transaction_id,
          pt.amount as transaction_amount
        FROM payment_transactions pt
        CROSS JOIN (
          SELECT id, name FROM events
          LIMIT 3 -- Limit test transactions to top 3 events
        ) e
        WHERE pt.team_id IS NULL
        AND pt.created_at BETWEEN ${startDate.toISOString()} AND ${endDate.toISOString()}
        AND pt.status = 'succeeded'
      )
      
      SELECT 
        event_id as "eventId",
        event_name as "eventName",
        SUM(transaction_amount) as revenue,
        COUNT(transaction_id) as "transactionCount"
      FROM event_transactions
      GROUP BY event_id, event_name
      ORDER BY revenue DESC
      LIMIT 10
    `;
    const topEvents = await db.execute(topEventsQuery);
    
    // Calculate average transaction value
    const totalRevenue = revenueResult[0]?.total_revenue || 0;
    const transactionCount = revenueResult[0]?.transaction_count || 0;
    const avgTransactionValue = transactionCount > 0 ? Math.round(totalRevenue / transactionCount) : 0;
    
    // Prepare response data
    const data = {
      revenue: {
        totalRevenue,
        transactionCount,
        avgTransactionValue
      },
      refunds: {
        totalRefunds: refundsResult[0]?.total_refunds || 0,
        totalRefundAmount: refundsResult[0]?.total_refund_amount || 0
      },
      timeRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        period
      },
      monthlyRevenueTrend,
      paymentMethods,
      topEvents
    };
    
    // Generate AI insights if requested
    let aiInsights = null;
    if (includeAIInsights && process.env.OPENAI_API_KEY) {
      try {
        // Format data for OpenAI
        const analysisData = JSON.stringify({
          period,
          revenue: data.revenue,
          refunds: data.refunds,
          monthlyRevenueTrend,
          paymentMethods,
          topEvents
        });
        
        // Call OpenAI for analysis
        const response = await openai.chat.completions.create({
          model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
          messages: [
            { 
              role: "system", 
              content: `You are a financial analyst for a sports tournament management platform. Analyze the financial data and provide insights and recommendations.` 
            },
            { 
              role: "user", 
              content: `Analyze this financial data and provide key insights, patterns, and recommendations. Focus on revenue trends, payment methods, and top performing events: ${analysisData}` 
            }
          ],
          response_format: { type: "json_object" }
        });
        
        // Parse OpenAI response
        const aiResponse = JSON.parse(response.choices[0].message.content);
        aiInsights = {
          keyInsights: aiResponse.keyInsights || [],
          recommendations: aiResponse.recommendations || [],
          topRevenueEvents: aiResponse.topRevenueEvents || [],
          growthOpportunities: aiResponse.growthOpportunities || []
        };
      } catch (error) {
        console.error('Error generating AI insights:', error);
        // Continue without AI insights if there's an error
      }
    }
    
    return res.json({
      success: true,
      data,
      aiInsights
    });
  } catch (error) {
    console.error('Error fetching financial overview report:', error);
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'An unknown error occurred' 
    });
  }
}

/**
 * Get Event Financial Report
 * 
 * Fetches event-specific registration and financial data for tournament organizers.
 * Shows registrations submitted, payment collection status, expected revenue, and fees.
 */
export async function getEventFinancialReport(req: Request, res: Response) {
  try {
    const { eventId } = req.params;
    
    if (!eventId) {
      return res.status(400).json({ success: false, error: 'Event ID is required' });
    }

    // Get event basic info
    const eventQuery = sql`
      SELECT id, name, start_date, end_date
      FROM events
      WHERE id = ${eventId}
    `;
    const eventResult = await db.execute(eventQuery);
    const event = eventResult[0];

    if (!event) {
      return res.status(404).json({ success: false, error: 'Event not found' });
    }

    // Get team registration summary
    const registrationSummaryQuery = sql`
      SELECT 
        COUNT(*) as total_teams,
        COUNT(CASE WHEN approval_status = 'approved' THEN 1 END) as approved_teams,
        COUNT(CASE WHEN approval_status = 'pending' THEN 1 END) as pending_teams,
        COUNT(CASE WHEN approval_status = 'rejected' THEN 1 END) as rejected_teams,
        COUNT(CASE WHEN approval_status = 'waitlisted' THEN 1 END) as waitlisted_teams,
        COUNT(CASE WHEN setup_intent_id IS NOT NULL OR payment_method_id IS NOT NULL THEN 1 END) as teams_with_payment_method
      FROM teams
      WHERE event_id = ${eventId}
    `;
    const registrationResult = await db.execute(registrationSummaryQuery);
    const regSummary = registrationResult[0];

    // Calculate payment collection rate
    const paymentCollectionRate = regSummary.total_teams > 0 
      ? (regSummary.teams_with_payment_method / regSummary.total_teams) * 100 
      : 0;

    // Get financial summary
    const financialSummaryQuery = sql`
      SELECT 
        COALESCE(SUM(CASE WHEN pt.status = 'succeeded' THEN pt.amount ELSE 0 END), 0) as actual_revenue,
        COALESCE(SUM(t.total_amount), 0) as expected_revenue,
        COUNT(CASE WHEN pt.status = 'succeeded' THEN 1 END) as successful_payments
      FROM teams t
      LEFT JOIN payment_transactions pt ON pt.team_id = t.id
      WHERE t.event_id = ${eventId}
    `;
    const financialResult = await db.execute(financialSummaryQuery);
    const financial = financialResult[0];

    // Estimate Stripe fees (2.9% + 30 cents per transaction)
    const totalStripeFees = financial.successful_payments * 30 + (financial.actual_revenue * 0.029);
    const netRevenue = financial.actual_revenue - totalStripeFees;

    const data = {
      event: {
        id: eventId,
        name: event.name,
        startDate: event.start_date,
        endDate: event.end_date
      },
      registrationSummary: {
        totalTeams: parseInt(regSummary.total_teams) || 0,
        approvedTeams: parseInt(regSummary.approved_teams) || 0,
        pendingTeams: parseInt(regSummary.pending_teams) || 0,
        rejectedTeams: parseInt(regSummary.rejected_teams) || 0,
        waitlistedTeams: parseInt(regSummary.waitlisted_teams) || 0,
        teamsWithPaymentMethod: parseInt(regSummary.teams_with_payment_method) || 0,
        paymentCollectionRate: Math.round(paymentCollectionRate * 100) / 100
      },
      financialSummary: {
        expectedRevenue: parseFloat(financial.expected_revenue) || 0,
        actualRevenue: parseFloat(financial.actual_revenue) || 0,
        totalStripeFees: Math.round(totalStripeFees),
        netRevenue: Math.round(netRevenue)
      },
      teamRegistrations: [],
      ageGroupBreakdown: [],
      registrationTimeline: []
    };

    return res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error fetching event financial report:', error);
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'An unknown error occurred' 
    });
  }
}

/**
 * Get Fees Analysis Report
 * 
 * Analyzes fee structure effectiveness and performance across events.
 */
export async function getFeesAnalysisReport(req: Request, res: Response) {
  try {
    const { includeAI = 'true' } = req.query;
    const includeAIInsights = includeAI === 'true';
    
    // Get fee statistics
    const feeStatisticsQuery = sql`
      SELECT 
        COUNT(id) as total_fees,
        COUNT(DISTINCT event_id) as total_events,
        AVG(amount) as avg_fee_amount
      FROM event_fees
    `;
    const feeStatisticsResult = await db.execute(feeStatisticsQuery);
    const feeStatistics = {
      totalFees: feeStatisticsResult[0]?.total_fees || 0,
      totalEvents: feeStatisticsResult[0]?.total_events || 0,
      avgFeeAmount: feeStatisticsResult[0]?.avg_fee_amount || 0
    };
    
    // Get fee type distribution
    const feeTypeDistributionQuery = sql`
      SELECT 
        fee_type as "feeType",
        COUNT(id) as count,
        AVG(amount) as "avgAmount"
      FROM event_fees
      GROUP BY fee_type
      ORDER BY count DESC
    `;
    const feeTypeDistribution = await db.execute(feeTypeDistributionQuery);
    
    // Get required vs optional fees
    const requiredVsOptionalQuery = sql`
      SELECT 
        is_required,
        COUNT(id) as fee_count,
        AVG(amount) as avg_amount,
        SUM(amount) as total_potential_value
      FROM event_fees
      GROUP BY is_required
    `;
    const requiredVsOptional = await db.execute(requiredVsOptionalQuery);
    
    // Get top performing fees - modified to handle test transactions with null team_id
    const topPerformingFeesQuery = sql`
      WITH fee_transactions AS (
        -- Get real transactions linked to teams and their fees
        SELECT 
          ef.id AS fee_id,
          ef.name AS fee_name,
          ef.fee_type,
          ef.amount AS fee_amount,
          e.name AS event_name,
          pt.id AS transaction_id,
          pt.amount AS transaction_amount
        FROM event_fees ef
        JOIN events e ON ef.event_id = e.id
        LEFT JOIN teams t ON t.event_id = e.id
        LEFT JOIN payment_transactions pt ON pt.team_id = t.id
        WHERE pt.id IS NOT NULL
        
        UNION ALL
        
        -- Include test transactions (with null team_id)
        SELECT 
          ef.id AS fee_id,
          ef.name AS fee_name,
          ef.fee_type,
          ef.amount AS fee_amount,
          e.name AS event_name,
          pt.id AS transaction_id,
          pt.amount AS transaction_amount
        FROM payment_transactions pt
        CROSS JOIN event_fees ef
        JOIN events e ON ef.event_id = e.id
        WHERE pt.team_id IS NULL AND pt.status = 'succeeded'
      )
      
      SELECT 
        fee_id AS id,
        fee_name AS name,
        fee_type,
        fee_amount AS amount,
        event_name,
        COUNT(transaction_id) AS transactions,
        SUM(transaction_amount) AS total_revenue
      FROM fee_transactions
      GROUP BY fee_id, fee_name, fee_type, fee_amount, event_name
      ORDER BY total_revenue DESC
      LIMIT 10
    `;
    const topPerformingFees = await db.execute(topPerformingFeesQuery);
    
    // Prepare response data
    const data = {
      feeStatistics,
      feeTypeDistribution,
      requiredVsOptional,
      topPerformingFees
    };
    
    // Generate AI insights if requested
    let aiInsights = null;
    if (includeAIInsights && process.env.OPENAI_API_KEY) {
      try {
        // Format data for OpenAI
        const analysisData = JSON.stringify(data);
        
        // Call OpenAI for analysis
        const response = await openai.chat.completions.create({
          model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
          messages: [
            { 
              role: "system", 
              content: `You are a financial analyst for a sports tournament management platform. Analyze the fee structure data and provide insights and recommendations.` 
            },
            { 
              role: "user", 
              content: `Analyze this fee structure data and provide key insights, patterns, and recommendations. Focus on fee types, required vs optional fees, and top performing fees: ${analysisData}` 
            }
          ],
          response_format: { type: "json_object" }
        });
        
        // Parse OpenAI response
        const aiResponse = JSON.parse(response.choices[0].message.content);
        aiInsights = {
          keyInsights: aiResponse.keyInsights || [],
          recommendations: aiResponse.recommendations || [],
          paymentMethodTrends: aiResponse.paymentMethodTrends || [],
          seasonalPatterns: aiResponse.seasonalPatterns || []
        };
      } catch (error) {
        console.error('Error generating AI insights for fees analysis:', error);
        // Continue without AI insights if there's an error
      }
    }
    
    return res.json({
      success: true,
      data,
      aiInsights
    });
  } catch (error) {
    console.error('Error fetching fees analysis report:', error);
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'An unknown error occurred' 
    });
  }
}
/**
 * Bookkeeping Report
 * 
 * Provides comprehensive financial data for bookkeeping and accounting purposes.
 * Includes options for date range filtering, transaction types, and settlement details.
 * 
 * Query parameters:
 * - startDate: Start date for filtering (ISO string)
 * - endDate: End date for filtering (ISO string)
 * - reportType: Type of report (all-transactions, refunds, chargebacks, pending-payments)
 * - settledOnly: Only include settled transactions (boolean)
 */
export async function getBookkeepingReport(req: Request, res: Response) {
  try {
    const { 
      startDate, 
      endDate, 
      reportType = 'all-transactions',
      settledOnly = 'false'
    } = req.query;
    
    // Parse date range
    let startDateObj = startDate ? new Date(startDate as string) : new Date(0);
    let endDateObj = endDate ? new Date(endDate as string) : new Date();
    
    // Ensure end date is set to end of day
    endDateObj.setHours(23, 59, 59, 999);
    
    // Base query for all transactions with details
    let baseQuery = sql`
      WITH transaction_details AS (
        SELECT 
          pt.id, 
          pt.team_id,
          pt.amount, 
          pt.payment_method_type as payment_method, 
          pt.card_brand,
          pt.card_last_four,
          pt.status, 
          pt.created_at,
          pt.payment_intent_id,
          pt.transaction_type,
          -- Estimate Stripe fee (2.9% + 30 cents for standard pricing)
          CASE
            WHEN pt.status = 'succeeded' AND pt.transaction_type = 'payment' THEN 
              ROUND(pt.amount * 0.029 + 30)
            ELSE 0
          END as stripe_fee,
          pt.metadata,
          teams.name as team_name,
          teams.manager_name,
          teams.manager_email,
          teams.manager_phone,
          teams.club_name,
          teams.registration_fee as amount_due,
          events.id as event_id,
          events.name as event_name,
          event_age_groups.age_group as age_group,
          -- For chargebacks and refunds
          CASE 
            WHEN pt.transaction_type IN ('refund', 'partial_refund', 'chargeback') AND pt.metadata->>'original_payment_id' IS NOT NULL THEN 
              pt.metadata->>'original_payment_id'
            ELSE NULL 
          END as original_payment_id,
          -- For refunds
          CASE
            WHEN pt.transaction_type = 'partial_refund' THEN true
            ELSE false
          END as is_partial,
          CASE
            WHEN pt.metadata->>'refund_reason' IS NOT NULL THEN
              pt.metadata->>'refund_reason'
            ELSE NULL
          END as refund_reason,
          CASE
            WHEN pt.metadata->>'original_amount' IS NOT NULL THEN
              (pt.metadata->>'original_amount')::integer
            ELSE NULL
          END as original_amount,
          -- For chargebacks
          CASE
            WHEN pt.metadata->>'dispute_status' IS NOT NULL THEN
              pt.metadata->>'dispute_status'
            ELSE NULL
          END as dispute_status,
          CASE
            WHEN pt.metadata->>'dispute_reason' IS NOT NULL THEN
              pt.metadata->>'dispute_reason'
            ELSE NULL
          END as dispute_reason,
          -- Settlement date (estimated as 2 business days after payment)
          CASE
            WHEN pt.status = 'succeeded' AND pt.transaction_type = 'payment' THEN
              (pt.created_at + INTERVAL '2 days')::timestamp
            ELSE NULL
          END as settled_date
        FROM payment_transactions pt
        LEFT JOIN teams ON pt.team_id = teams.id
        LEFT JOIN events ON teams.event_id = events.id
        LEFT JOIN event_age_groups ON teams.age_group_id = event_age_groups.id
        WHERE pt.created_at BETWEEN ${startDateObj.toISOString()} AND ${endDateObj.toISOString()}
    `;
    
    // Filter by transaction type based on reportType
    let filterQuery = '';
    if (reportType === 'refunds') {
      filterQuery = ` AND pt.transaction_type IN ('refund', 'partial_refund')`;
    } else if (reportType === 'chargebacks') {
      filterQuery = ` AND pt.transaction_type = 'chargeback'`;
    } else if (reportType === 'pending-payments') {
      // For pending payments, we need to look at teams with pending payment status
      return getPendingPaymentsReport(req, res, startDateObj, endDateObj);
    } else if (reportType === 'all-transactions') {
      // Include all payment-related transactions including registration_payment
      filterQuery = ` AND pt.transaction_type IN ('payment', 'registration_payment', 'refund', 'partial_refund', 'chargeback')`;
    }
    
    // Add settled only filter if requested
    if (settledOnly === 'true') {
      filterQuery += ` AND pt.status = 'succeeded' AND pt.created_at < (NOW() - INTERVAL '2 days')`;
    }
    
    // Complete the query
    const query = sql`
      ${baseQuery} ${sql.raw(filterQuery)}
      )
      SELECT * FROM transaction_details
      ORDER BY created_at DESC
    `;
    
    const queryResult = await db.execute(query);
    const transactions = queryResult.rows || queryResult;
    
    // Generate summary statistics
    const summaryQuery = sql`
      WITH transaction_details AS (
        SELECT 
          pt.id, 
          pt.amount, 
          CASE
            WHEN pt.status = 'succeeded' AND pt.transaction_type IN ('payment', 'registration_payment') THEN 
              ROUND(pt.amount * 0.029 + 30)
            ELSE 0
          END as stripe_fee
        FROM payment_transactions pt
        WHERE pt.created_at BETWEEN ${startDateObj.toISOString()} AND ${endDateObj.toISOString()}
        ${sql.raw(filterQuery)}
        ${sql.raw(settledOnly === 'true' ? ` AND pt.status = 'succeeded' AND pt.created_at < (NOW() - INTERVAL '2 days')` : '')}
      )
      SELECT 
        COUNT(*) as total_transactions,
        SUM(amount) as total_amount,
        SUM(stripe_fee) as total_stripe_fees,
        (SUM(amount) - SUM(stripe_fee)) as net_amount
      FROM transaction_details
    `;
    
    const summaryQueryResult = await db.execute(summaryQuery);
    const summaryRows = summaryQueryResult.rows || summaryQueryResult;
    
    const summary = {
      totalTransactions: summaryRows[0]?.total_transactions || 0,
      totalAmount: summaryRows[0]?.total_amount || 0,
      stripeFees: summaryRows[0]?.total_stripe_fees || 0,
      netAmount: summaryRows[0]?.net_amount || 0
    };
    
    return res.json({
      success: true,
      transactions,
      summary,
      filters: {
        startDate: startDateObj.toISOString(),
        endDate: endDateObj.toISOString(),
        reportType,
        settledOnly: settledOnly === 'true'
      }
    });
  } catch (error) {
    console.error('Error fetching bookkeeping report:', error);
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'An unknown error occurred' 
    });
  }
}

/**
 * Get Pending Payments Report
 * 
 * Helper function to fetch pending payments (Pay Later submissions)
 */
async function getPendingPaymentsReport(req: Request, res: Response, startDate: Date, endDate: Date) {
  try {
    const pendingQuery = sql`
      SELECT 
        teams.id,
        teams.name as team_name,
        teams.manager_name,
        teams.manager_email,
        teams.manager_phone,
        teams.created_at,
        teams.registration_fee as amount_due,
        teams.payment_status as status,
        events.id as event_id,
        events.name as event_name,
        event_age_groups.age_group as age_group
      FROM teams
      LEFT JOIN events ON teams.event_id = events.id
      LEFT JOIN event_age_groups ON teams.age_group_id = event_age_groups.id
      WHERE teams.created_at BETWEEN ${startDate.toISOString()} AND ${endDate.toISOString()}
      AND teams.payment_status = 'pending'
      ORDER BY teams.created_at DESC
    `;
    
    const pendingQueryResult = await db.execute(pendingQuery);
    const transactions = pendingQueryResult.rows || pendingQueryResult;
    
    // Generate summary statistics
    const summaryQuery = sql`
      SELECT 
        COUNT(*) as total_transactions,
        SUM(registration_fee) as total_amount,
        0 as total_stripe_fees,
        SUM(registration_fee) as net_amount
      FROM teams
      WHERE created_at BETWEEN ${startDate.toISOString()} AND ${endDate.toISOString()}
      AND payment_status = 'pending'
    `;
    
    const summaryQueryResult = await db.execute(summaryQuery);
    const summaryRows = summaryQueryResult.rows || summaryQueryResult;
    
    const summary = {
      totalTransactions: summaryRows[0]?.total_transactions || 0,
      totalAmount: summaryRows[0]?.total_amount || 0,
      stripeFees: 0, // No fees for pending payments
      netAmount: summaryRows[0]?.net_amount || 0
    };
    
    return res.json({
      success: true,
      transactions,
      summary,
      filters: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        reportType: 'pending-payments',
        settledOnly: false
      }
    });
  } catch (error) {
    console.error('Error fetching pending payments report:', error);
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'An unknown error occurred' 
    });
  }
}

// Set up routes
router.get('/registration-orders', getRegistrationOrdersReport);
router.get('/financial-overview', getFinancialOverviewReport);
router.get('/event/:eventId/financial', getEventFinancialReport);
router.get('/fees-analysis', getFeesAnalysisReport);
router.get('/bookkeeping', getBookkeepingReport);

export default router;
