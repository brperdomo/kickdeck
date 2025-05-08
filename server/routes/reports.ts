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
        pt.payment_method, 
        pt.status, 
        pt.created_at,
        pt.payment_intent_id,
        pt.stripe_receipt_url,
        pt.accounting_code,
        pt.payment_method_details,
        pt.refunded_at, 
        teams.name as team_name,
        teams.manager_name,
        teams.manager_email,
        teams.manager_phone,
        teams.club_name,
        events.id as event_id,
        events.name as event_name,
        event_age_groups.name as age_group
      FROM payment_transactions pt
      LEFT JOIN teams ON pt.team_id = teams.id
      LEFT JOIN events ON teams.event_id = events.id
      LEFT JOIN event_age_groups ON teams.age_group_id = event_age_groups.id
      ORDER BY pt.created_at DESC
    `;

    const transactions = await db.execute(query);

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
        payment_method as "paymentMethod",
        COUNT(id) as count,
        SUM(amount) as "totalAmount",
        AVG(amount) as "avgAmount"
      FROM payment_transactions
      WHERE created_at BETWEEN ${startDate.toISOString()} AND ${endDate.toISOString()}
      AND status = 'succeeded'
      GROUP BY payment_method
      ORDER BY "totalAmount" DESC
    `;
    const paymentMethods = await db.execute(paymentMethodsQuery);
    
    // Get top events by revenue
    const topEventsQuery = sql`
      SELECT 
        e.id as "eventId",
        e.name as "eventName",
        SUM(pt.amount) as revenue,
        COUNT(pt.id) as "transactionCount"
      FROM payment_transactions pt
      JOIN teams t ON pt.team_id = t.id
      JOIN events e ON t.event_id = e.id
      WHERE pt.created_at BETWEEN ${startDate.toISOString()} AND ${endDate.toISOString()}
      AND pt.status = 'succeeded'
      GROUP BY e.id, e.name
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
 * Fetches detailed financial data for a specific event.
 */
export async function getEventFinancialReport(req: Request, res: Response) {
  try {
    const { eventId } = req.params;
    const { includeAI = 'true' } = req.query;
    const includeAIInsights = includeAI === 'true';
    
    if (!eventId) {
      return res.status(400).json({ success: false, error: 'Event ID is required' });
    }
    
    // Get event details
    const eventQuery = sql`
      SELECT id, name, start_date, end_date, application_deadline, is_archived
      FROM events
      WHERE id = ${eventId}
    `;
    const eventResult = await db.execute(eventQuery);
    
    if (!eventResult || eventResult.length === 0) {
      return res.status(404).json({ success: false, error: 'Event not found' });
    }
    
    const event = eventResult[0];
    
    // Get financial data
    const financialsQuery = sql`
      SELECT 
        SUM(pt.amount) as total_revenue,
        COUNT(pt.id) as transaction_count,
        AVG(pt.amount) as avg_transaction_amount
      FROM payment_transactions pt
      JOIN teams t ON pt.team_id = t.id
      WHERE t.event_id = ${eventId}
      AND pt.status = 'succeeded'
    `;
    const financialsResult = await db.execute(financialsQuery);
    const financials = {
      totalRevenue: financialsResult[0]?.total_revenue || 0,
      transactionCount: financialsResult[0]?.transaction_count || 0,
      avgTransactionAmount: financialsResult[0]?.avg_transaction_amount || 0
    };
    
    // Get refund data
    const refundsQuery = sql`
      SELECT 
        COUNT(pt.id) as total_refunds,
        SUM(pt.amount) as total_refund_amount
      FROM payment_transactions pt
      JOIN teams t ON pt.team_id = t.id
      WHERE t.event_id = ${eventId}
      AND pt.refunded_at IS NOT NULL
    `;
    const refundsResult = await db.execute(refundsQuery);
    const refunds = {
      totalRefunds: refundsResult[0]?.total_refunds || 0,
      totalRefundAmount: refundsResult[0]?.total_refund_amount || 0
    };
    
    // Get registration data
    const registrationsQuery = sql`
      SELECT 
        COUNT(id) as total_teams,
        SUM(CASE WHEN payment_status = 'paid' THEN 1 ELSE 0 END) as paid_teams,
        SUM(CASE WHEN payment_status != 'paid' THEN 1 ELSE 0 END) as pending_teams
      FROM teams
      WHERE event_id = ${eventId}
    `;
    const registrationsResult = await db.execute(registrationsQuery);
    const registrations = {
      totalTeams: registrationsResult[0]?.total_teams || 0,
      paidTeams: registrationsResult[0]?.paid_teams || 0,
      pendingTeams: registrationsResult[0]?.pending_teams || 0
    };
    
    // Get revenue by age group
    const ageGroupRevenueQuery = sql`
      SELECT 
        eag.name as age_group,
        eag.gender,
        SUM(pt.amount) as total_revenue,
        COUNT(DISTINCT t.id) as team_count
      FROM payment_transactions pt
      JOIN teams t ON pt.team_id = t.id
      JOIN event_age_groups eag ON t.age_group_id = eag.id
      WHERE t.event_id = ${eventId}
      AND pt.status = 'succeeded'
      GROUP BY eag.id, eag.name, eag.gender
      ORDER BY total_revenue DESC
    `;
    const ageGroupRevenue = await db.execute(ageGroupRevenueQuery);
    
    // Get daily revenue and registration trend
    const dailyRevenueQuery = sql`
      SELECT 
        DATE_TRUNC('day', pt.created_at) as day,
        SUM(pt.amount) as daily_revenue,
        COUNT(DISTINCT t.id) as daily_registrations
      FROM payment_transactions pt
      JOIN teams t ON pt.team_id = t.id
      WHERE t.event_id = ${eventId}
      AND pt.status = 'succeeded'
      GROUP BY DATE_TRUNC('day', pt.created_at)
      ORDER BY day ASC
    `;
    const dailyRevenue = await db.execute(dailyRevenueQuery);
    
    // Prepare response data
    const data = {
      event,
      financials,
      refunds,
      registrations,
      ageGroupRevenue,
      dailyRevenue
    };
    
    // Generate AI insights if requested
    let aiInsights = null;
    if (includeAIInsights && process.env.OPENAI_API_KEY) {
      try {
        // Format data for OpenAI
        const analysisData = JSON.stringify({
          event,
          financials,
          refunds,
          registrations,
          ageGroupRevenue,
          dailyRevenue
        });
        
        // Call OpenAI for analysis
        const response = await openai.chat.completions.create({
          model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
          messages: [
            { 
              role: "system", 
              content: `You are a financial analyst for a sports tournament management platform. Analyze the event financial data and provide insights and recommendations.` 
            },
            { 
              role: "user", 
              content: `Analyze this event financial data and provide key insights, patterns, and recommendations. Focus on revenue distribution by age group, registration timeline, and areas for improvement: ${analysisData}` 
            }
          ],
          response_format: { type: "json_object" }
        });
        
        // Parse OpenAI response
        const aiResponse = JSON.parse(response.choices[0].message.content);
        aiInsights = {
          keyInsights: aiResponse.keyInsights || [],
          recommendations: aiResponse.recommendations || [],
          visualizationCaptions: aiResponse.visualizationCaptions || {},
          growthOpportunities: aiResponse.growthOpportunities || []
        };
      } catch (error) {
        console.error('Error generating AI insights for event report:', error);
        // Continue without AI insights if there's an error
      }
    }
    
    return res.json({
      success: true,
      data,
      aiInsights
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
    
    // Get top performing fees
    const topPerformingFeesQuery = sql`
      SELECT 
        ef.id,
        ef.name,
        ef.fee_type as fee_type,
        ef.amount,
        e.name as event_name,
        COUNT(pt.id) as transactions,
        SUM(pt.amount) as total_revenue
      FROM event_fees ef
      JOIN events e ON ef.event_id = e.id
      JOIN payment_transactions pt ON pt.team_id IN (
        SELECT id FROM teams WHERE event_id = e.id
      )
      GROUP BY ef.id, ef.name, ef.fee_type, ef.amount, e.name
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
// Set up routes
router.get('/registration-orders', getRegistrationOrdersReport);
router.get('/financial-overview', getFinancialOverviewReport);
router.get('/event/:eventId/financial', getEventFinancialReport);
router.get('/fees-analysis', getFeesAnalysisReport);

export default router;
