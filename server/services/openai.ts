/**
 * OpenAI Service for MatchPro.ai
 * 
 * This service provides a unified interface for utilizing OpenAI's capabilities
 * in various aspects of the application, particularly financial reporting and analysis.
 */

import OpenAI from "openai";
import { db } from "@db";
import { users, events, teams, eventFees, paymentTransactions, matchupTemplates, eventBrackets, games, eventFieldConfigurations, fields } from "@db/schema";
import { eq, and, gte, lte, desc, sql, sum, count, avg, inArray } from "drizzle-orm";
// Simple console.log replacement for now
const log = (message: string, category?: string) => console.log(`[${category || 'OpenAI'}]`, message);

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Verify the OpenAI API key is configured
const verifyApiKey = async (): Promise<boolean> => {
  if (!process.env.OPENAI_API_KEY) {
    log('OpenAI API key is not configured', 'openai');
    return false;
  }
  
  try {
    // Make a minimal API call to verify key is valid
    await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [{ role: "user", content: "API key test" }],
      max_tokens: 5
    });
    
    log('OpenAI API key verified successfully', 'openai');
    return true;
  } catch (error) {
    log(`OpenAI API key verification failed: ${error.message}`, 'openai');
    return false;
  }
};

/**
 * Analyze financial data for a specific event
 * 
 * @param eventId - The ID of the event to analyze
 * @param timeframe - Optional timeframe for the analysis
 * @returns AI insights about the event's financial performance
 */
const analyzeEventFinancials = async (eventId: string, timeframe?: { start: Date, end: Date }) => {
  try {
    // Verify API key before proceeding
    const isApiKeyValid = await verifyApiKey();
    if (!isApiKeyValid) {
      return { error: "OpenAI API key is not configured or invalid" };
    }
    
    // Fetch event data
    const [eventData] = await db
      .select()
      .from(events)
      .where(eq(events.id, eventId));
      
    if (!eventData) {
      return { error: "Event not found" };
    }
    
    // Fetch financial data for this event
    const financialData = await getEventFinancialData(eventId, timeframe);

    // Get payment transactions for this event
    const transactions = await db
      .select()
      .from(paymentTransactions)
      .where(eq(paymentTransactions.eventId, eventId))
      .orderBy(desc(paymentTransactions.createdAt));
      
    // Get fees for this event
    const fees = await db
      .select()
      .from(eventFees)
      .where(eq(eventFees.eventId, eventId));

    // Get revenue by age group data
    const ageGroupRevenue = await getRevenueByAgeGroup(eventId);
    
    // Get daily revenue data
    const dailyRevenue = await getDailyRevenue(eventId);
    
    // Build the prompt for OpenAI
    const prompt = `
      You are an expert financial analyst for soccer tournament management. Analyze this event's financial data and provide insights.
      
      Event: ${eventData.name}
      Dates: ${eventData.startDate} to ${eventData.endDate}
      
      Financial Summary:
      - Total Revenue: $${(financialData.totalRevenue / 100).toFixed(2)}
      - Number of Transactions: ${financialData.transactionCount}
      - Average Transaction Amount: $${(financialData.avgTransactionAmount / 100).toFixed(2)}
      
      Registration Status:
      - Total Teams: ${financialData.totalTeams}
      - Paid Teams: ${financialData.paidTeams}
      - Pending Teams: ${financialData.pendingTeams}
      
      Revenue by Age Group:
      ${JSON.stringify(ageGroupRevenue)}
      
      Daily Revenue:
      ${JSON.stringify(dailyRevenue)}
      
      Fee Structure:
      ${JSON.stringify(fees)}
      
      Transaction History:
      ${JSON.stringify(transactions.slice(0, 10))}
      
      Provide a financial analysis with the following elements in JSON format:
      1. keyInsights: An array of 3-5 bullet points highlighting the most important financial insights
      2. recommendations: An array of 2-4 actionable recommendations for optimizing revenue
      3. visualizationCaptions: An object with captions explaining what the ageGroupRevenue and dailyRevenue data shows
      4. growthOpportunities: An array of 2-3 specific growth opportunities
    `;
    
    // Call OpenAI API for insights
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });
    
    // Parse the response
    const insights = JSON.parse(response.choices[0].message.content);
    
    return insights;
  } catch (error) {
    log(`Error analyzing event financials: ${error.message}`, 'openai');
    return { error: error.message };
  }
};

/**
 * Analyze overall financial performance across all events
 * 
 * @param period - Time period for analysis (e.g., '30d', '90d', 'year')
 * @returns AI insights about overall financial performance
 */
const analyzeFinancialOverview = async (period: string = '30d') => {
  try {
    // Verify API key before proceeding
    const isApiKeyValid = await verifyApiKey();
    if (!isApiKeyValid) {
      return { error: "OpenAI API key is not configured or invalid" };
    }
    
    // Determine the start date based on the period
    const startDate = new Date();
    if (period === '7d') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === '30d') {
      startDate.setDate(startDate.getDate() - 30);
    } else if (period === '90d') {
      startDate.setDate(startDate.getDate() - 90);
    } else if (period === 'year') {
      startDate.setFullYear(startDate.getFullYear() - 1);
    } else if (period === 'all') {
      // Set to a far past date to include all records
      startDate.setFullYear(2000);
    }
    
    // Get aggregated financial data
    const financialData = await getFinancialOverviewData(startDate);
    
    // Get revenue trend by month
    const monthlyRevenueTrend = await getMonthlyRevenueTrend(startDate);
    
    // Get payment method distribution
    const paymentMethods = await getPaymentMethodDistribution(startDate);
    
    // Get top performing events
    const topEvents = await getTopPerformingEvents(startDate);
    
    // Build the prompt for OpenAI
    const prompt = `
      You are an expert financial analyst for a sports tournament management platform. Analyze the following financial data and provide insights.
      
      Time Period: ${period}
      Date Range: ${startDate.toISOString()} to ${new Date().toISOString()}
      
      Financial Summary:
      - Total Revenue: $${(financialData.totalRevenue / 100).toFixed(2)}
      - Number of Transactions: ${financialData.transactionCount}
      - Average Transaction Amount: $${(financialData.avgTransactionAmount / 100).toFixed(2)}
      
      Monthly Revenue Trend:
      ${JSON.stringify(monthlyRevenueTrend)}
      
      Payment Method Distribution:
      ${JSON.stringify(paymentMethods)}
      
      Top Performing Events:
      ${JSON.stringify(topEvents)}
      
      Provide a comprehensive financial analysis with the following elements in JSON format:
      1. keyInsights: An array of 3-5 bullet points highlighting the most important financial insights
      2. recommendations: An array of 2-4 actionable recommendations for optimizing revenue
      3. topRevenueEvents: An array of 3 events that have performed exceptionally well with their key success metrics
      4. growthOpportunities: An array of 2-3 specific growth opportunities based on the data
    `;
    
    // Call OpenAI API for insights
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });
    
    // Parse the response
    const insights = JSON.parse(response.choices[0].message.content);
    
    return insights;
  } catch (error) {
    log(`Error analyzing financial overview: ${error.message}`, 'openai');
    return { error: error.message };
  }
};

/**
 * Analyze fee structure and performance across events
 * 
 * @returns AI insights about fee structure effectiveness
 */
const analyzeFeesStructure = async () => {
  try {
    // Verify API key before proceeding
    const isApiKeyValid = await verifyApiKey();
    if (!isApiKeyValid) {
      return { error: "OpenAI API key is not configured or invalid" };
    }
    
    // Get fee type distribution
    const feeTypeDistribution = await getFeeTypeDistribution();
    
    // Get required vs optional fees comparison
    const requiredVsOptional = await getRequiredVsOptionalFees();
    
    // Get top performing fees
    const topPerformingFees = await getTopPerformingFees();

    // Get fee statistics
    const feeStatistics = await getFeeStatistics();
    
    // Build the prompt for OpenAI
    const prompt = `
      You are an expert financial analyst for a sports tournament management platform. Analyze the following fee structure data and provide insights.
      
      Fee Statistics:
      - Total Fees Created: ${feeStatistics.totalFees}
      - Total Events with Fees: ${feeStatistics.totalEvents}
      - Average Fee Amount: $${(feeStatistics.avgFeeAmount / 100).toFixed(2)}
      
      Fee Type Distribution:
      ${JSON.stringify(feeTypeDistribution)}
      
      Required vs Optional Fees:
      ${JSON.stringify(requiredVsOptional)}
      
      Top Performing Fees:
      ${JSON.stringify(topPerformingFees)}
      
      Provide a comprehensive fee structure analysis with the following elements in JSON format:
      1. keyInsights: An array of 3-5 bullet points highlighting the most important fee structure insights
      2. recommendations: An array of 2-4 actionable recommendations for optimizing the fee structure
      3. paymentMethodTrends: An array of 3-4 trends in fee type usage with their percentages
      4. seasonalPatterns: An array of 2-3 observed seasonal patterns in fee effectiveness
    `;
    
    // Call OpenAI API for insights
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });
    
    // Parse the response
    const insights = JSON.parse(response.choices[0].message.content);
    
    return insights;
  } catch (error) {
    log(`Error analyzing fee structure: ${error.message}`, 'openai');
    return { error: error.message };
  }
};

// Helper function to get event financial data
const getEventFinancialData = async (eventId: string, timeframe?: { start: Date, end: Date }) => {
  // Base query for financial data
  let query = db
    .select({
      totalRevenue: sql<number>`COALESCE(SUM(amount), 0)`.as('total_revenue'),
      transactionCount: sql<number>`COUNT(*)`.as('transaction_count')
    })
    .from(paymentTransactions)
    .where(eq(paymentTransactions.eventId, eventId));
  
  // Add timeframe filter if provided
  if (timeframe) {
    query = query.where(
      and(
        gte(paymentTransactions.createdAt, timeframe.start.toISOString()),
        lte(paymentTransactions.createdAt, timeframe.end.toISOString())
      )
    );
  }
  
  // Execute financial query
  const [financialResult] = await query;
  
  // Get team registration data
  const teamsQuery = await db
    .select({
      totalTeams: sql<number>`COUNT(*)`.as('total_teams'),
      paidTeams: sql<number>`SUM(CASE WHEN payment_status = 'paid' THEN 1 ELSE 0 END)`.as('paid_teams'),
      pendingTeams: sql<number>`SUM(CASE WHEN payment_status = 'pending' THEN 1 ELSE 0 END)`.as('pending_teams')
    })
    .from(teams)
    .where(eq(teams.eventId, eventId));
  
  const [teamsResult] = teamsQuery;
  
  // Calculate average transaction amount
  const avgTransactionAmount = financialResult.transactionCount > 0 
    ? financialResult.totalRevenue / financialResult.transactionCount 
    : 0;
  
  return {
    totalRevenue: financialResult.totalRevenue || 0,
    transactionCount: financialResult.transactionCount || 0,
    avgTransactionAmount,
    totalTeams: teamsResult.totalTeams || 0,
    paidTeams: teamsResult.paidTeams || 0,
    pendingTeams: teamsResult.pendingTeams || 0
  };
};

// Helper function to get revenue by age group
const getRevenueByAgeGroup = async (eventId: string) => {
  const ageGroupRevenue = await db.execute(sql`
    SELECT 
      ea.name as age_group,
      ea.gender as gender,
      COUNT(DISTINCT t.id) as team_count,
      COALESCE(SUM(pt.amount), 0) as total_revenue
    FROM 
      event_age_groups ea
    LEFT JOIN 
      teams t ON t.age_group_id = ea.id
    LEFT JOIN 
      payment_transactions pt ON pt.team_id = t.id
    WHERE 
      ea.event_id = ${eventId}
    GROUP BY 
      ea.id, ea.name, ea.gender
    ORDER BY 
      ea.name, ea.gender
  `);
  
  return ageGroupRevenue;
};

// Helper function to get daily revenue
const getDailyRevenue = async (eventId: string) => {
  const dailyRevenue = await db.execute(sql`
    SELECT 
      DATE(pt.created_at) as day,
      COUNT(*) as daily_registrations,
      COALESCE(SUM(pt.amount), 0) as daily_revenue
    FROM 
      payment_transactions pt
    WHERE 
      pt.event_id = ${eventId}
    GROUP BY 
      DATE(pt.created_at)
    ORDER BY 
      day
  `);
  
  return dailyRevenue;
};

// Helper function to get financial overview data
const getFinancialOverviewData = async (startDate: Date) => {
  // Get overall financial data
  const [financialResult] = await db
    .select({
      totalRevenue: sql<number>`COALESCE(SUM(amount), 0)`.as('total_revenue'),
      transactionCount: sql<number>`COUNT(*)`.as('transaction_count')
    })
    .from(paymentTransactions)
    .where(gte(paymentTransactions.createdAt, startDate.toISOString()));
  
  // Calculate average transaction amount
  const avgTransactionAmount = financialResult.transactionCount > 0 
    ? financialResult.totalRevenue / financialResult.transactionCount 
    : 0;
  
  // Get refund data
  const [refundResult] = await db
    .select({
      totalRefunds: sql<number>`COUNT(*)`.as('total_refunds'),
      totalRefundAmount: sql<number>`COALESCE(SUM(amount), 0)`.as('total_refund_amount')
    })
    .from(paymentTransactions)
    .where(
      and(
        gte(paymentTransactions.createdAt, startDate.toISOString()),
        eq(paymentTransactions.status, 'refunded')
      )
    );
  
  return {
    totalRevenue: financialResult.totalRevenue || 0,
    transactionCount: financialResult.transactionCount || 0,
    avgTransactionAmount,
    refunds: {
      totalRefunds: refundResult.totalRefunds || 0,
      totalRefundAmount: refundResult.totalRefundAmount || 0
    },
    timeRange: {
      start: startDate.toISOString(),
      end: new Date().toISOString()
    }
  };
};

// Helper function to get monthly revenue trend
const getMonthlyRevenueTrend = async (startDate: Date) => {
  const monthlyRevenue = await db.execute(sql`
    SELECT 
      DATE_TRUNC('month', pt.created_at) as month,
      COUNT(*) as transaction_count,
      COALESCE(SUM(pt.amount), 0) as total_revenue
    FROM 
      payment_transactions pt
    WHERE 
      pt.created_at >= ${startDate.toISOString()}
    GROUP BY 
      DATE_TRUNC('month', pt.created_at)
    ORDER BY 
      month
  `);
  
  return monthlyRevenue;
};

// Helper function to get payment method distribution
const getPaymentMethodDistribution = async (startDate: Date) => {
  const paymentMethods = await db.execute(sql`
    SELECT 
      payment_method as "paymentMethod",
      COUNT(*) as "count",
      COALESCE(SUM(amount), 0) as "totalAmount"
    FROM 
      payment_transactions
    WHERE 
      created_at >= ${startDate.toISOString()}
    GROUP BY 
      payment_method
    ORDER BY 
      "totalAmount" DESC
  `);
  
  return paymentMethods;
};

// Helper function to get top performing events
const getTopPerformingEvents = async (startDate: Date) => {
  const topEvents = await db.execute(sql`
    SELECT 
      e.id as "eventId",
      e.name as "eventName",
      COUNT(pt.id) as "transactionCount",
      COALESCE(SUM(pt.amount), 0) as "revenue"
    FROM 
      payment_transactions pt
    JOIN 
      events e ON pt.event_id = e.id
    WHERE 
      pt.created_at >= ${startDate.toISOString()}
    GROUP BY 
      e.id, e.name
    ORDER BY 
      "revenue" DESC
    LIMIT 10
  `);
  
  return topEvents;
};

// Helper function to get fee type distribution
const getFeeTypeDistribution = async () => {
  const feeTypes = await db.execute(sql`
    SELECT 
      fee_type as "feeType",
      COUNT(*) as "count",
      AVG(amount) as "avgAmount"
    FROM 
      event_fees
    GROUP BY 
      fee_type
    ORDER BY 
      "count" DESC
  `);
  
  return feeTypes;
};

// Helper function to get required vs optional fees
const getRequiredVsOptionalFees = async () => {
  const requiredVsOptional = await db.execute(sql`
    SELECT 
      is_required,
      COUNT(*) as fee_count,
      AVG(amount) as avg_amount,
      SUM(amount) as total_potential_value
    FROM 
      event_fees
    GROUP BY 
      is_required
  `);
  
  return requiredVsOptional;
};

// Helper function to get top performing fees
const getTopPerformingFees = async () => {
  const topFees = await db.execute(sql`
    WITH fee_selections AS (
      SELECT 
        f.id,
        f.name,
        f.fee_type,
        f.amount,
        e.id as event_id,
        e.name as event_name,
        COUNT(t.id) as selections
      FROM 
        event_fees f
      JOIN 
        events e ON f.event_id = e.id
      LEFT JOIN 
        teams t ON t.event_id = e.id AND (t.selected_fee_ids @> ARRAY[f.id])
      GROUP BY 
        f.id, f.name, f.fee_type, f.amount, e.id, e.name
    )
    SELECT 
      fs.id,
      fs.name,
      fs.fee_type,
      fs.amount,
      fs.event_id,
      fs.event_name,
      fs.selections as transactions,
      (fs.amount * fs.selections) as total_revenue
    FROM 
      fee_selections fs
    WHERE 
      fs.selections > 0
    ORDER BY 
      total_revenue DESC
    LIMIT 10
  `);
  
  return topFees;
};

// Helper function to get fee statistics
const getFeeStatistics = async () => {
  // Get overall fee statistics
  const [feeStats] = await db
    .select({
      totalFees: sql<number>`COUNT(*)`.as('total_fees'),
      avgFeeAmount: sql<number>`AVG(amount)`.as('avg_fee_amount')
    })
    .from(eventFees);
  
  // Get count of events with fees
  const [eventCount] = await db
    .select({
      totalEvents: sql<number>`COUNT(DISTINCT event_id)`.as('total_events')
    })
    .from(eventFees);
  
  return {
    totalFees: feeStats.totalFees || 0,
    avgFeeAmount: feeStats.avgFeeAmount || 0,
    totalEvents: eventCount.totalEvents || 0
  };
};

// Get comprehensive field data for AI assistant
const getEventFieldsData = async (eventId: string) => {
  try {
    // Get all field configurations for this event with field details
    const fieldsData = await db
      .select({
        fieldId: eventFieldConfigurations.fieldId,
        fieldName: fields.name,
        fieldSize: eventFieldConfigurations.fieldSize,
        isActive: eventFieldConfigurations.isActive,
        sortOrder: eventFieldConfigurations.sortOrder,
        hasLights: fields.hasLights,
        complexId: fields.complexId
      })
      .from(eventFieldConfigurations)
      .leftJoin(fields, eq(fields.id, eventFieldConfigurations.fieldId))
      .where(eq(eventFieldConfigurations.eventId, parseInt(eventId)))
      .orderBy(eventFieldConfigurations.sortOrder);

    const totalFields = fieldsData.length;
    const activeFields = fieldsData.filter(f => f.isActive).length;
    
    // Create field size breakdown
    const sizeBreakdown = fieldsData.reduce((acc, field) => {
      if (field.isActive) {
        acc[field.fieldSize] = (acc[field.fieldSize] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const fieldSizeBreakdown = Object.entries(sizeBreakdown)
      .map(([size, count]) => `${count} x ${size}`)
      .join(', ');

    return {
      totalFields,
      activeFields,
      fieldSizeBreakdown,
      fieldDetails: fieldsData.map(f => ({
        id: f.fieldId,
        name: f.fieldName,
        fieldSize: f.fieldSize,
        isActive: f.isActive,
        hasLights: f.hasLights,
        complexId: f.complexId
      }))
    };
  } catch (error) {
    console.error('Error fetching fields data:', error);
    return {
      totalFields: 0,
      activeFields: 0,
      fieldSizeBreakdown: 'No field data available',
      fieldDetails: []
    };
  }
};

// Tournament data access functions for AI assistant
const getTournamentData = async (eventId: string) => {
  try {
    // Get tournament format templates
    const formatTemplates = await db
      .select({
        id: matchupTemplates.id,
        name: matchupTemplates.name,
        description: matchupTemplates.description,
        teamCount: matchupTemplates.teamCount,
        bracketStructure: matchupTemplates.bracketStructure,
        totalGames: matchupTemplates.totalGames
      })
      .from(matchupTemplates)
      .where(eq(matchupTemplates.isActive, true));

    // Get event brackets configuration
    const brackets = await db
      .select({
        id: eventBrackets.id,
        name: eventBrackets.name,
        tournamentFormat: eventBrackets.tournamentFormat,
        teamCount: sql<number>`COUNT(${teams.id})`.as('team_count')
      })
      .from(eventBrackets)
      .leftJoin(teams, and(
        eq(teams.bracketId, eventBrackets.id),
        eq(teams.status, 'approved')
      ))
      .where(eq(eventBrackets.eventId, eventId))
      .groupBy(eventBrackets.id)
      .limit(20);

    // Get scheduled games count
    const [gamesCount] = await db
      .select({
        totalGames: sql<number>`COUNT(*)`.as('total_games'),
        scheduledGames: sql<number>`COUNT(CASE WHEN field_id IS NOT NULL THEN 1 END)`.as('scheduled_games')
      })
      .from(games)
      .where(eq(games.eventId, eventId));

    // Get detailed games information with field details first
    const gamesWithFields = await db
      .select({
        id: games.id,
        scheduledDate: games.scheduledDate,
        scheduledTime: games.scheduledTime,
        homeTeamId: games.homeTeamId,
        awayTeamId: games.awayTeamId,
        fieldId: games.fieldId,
        fieldName: fields.name,
        round: games.round,
        matchNumber: games.matchNumber,
        status: games.status
      })
      .from(games)
      .leftJoin(fields, eq(games.fieldId, fields.id))
      .where(eq(games.eventId, eventId))
      .orderBy(games.scheduledDate, games.scheduledTime)
      .limit(50);

    // Get all teams for this event to create a lookup map
    const eventTeams = await db
      .select({
        id: teams.id,
        name: teams.name
      })
      .from(teams)
      .where(eq(teams.eventId, eventId));

    const teamsMap = new Map<number, string>();
    eventTeams.forEach(team => {
      teamsMap.set(team.id, team.name);
    });

    // Combine games with team names
    const detailedGames = gamesWithFields.map(game => ({
      ...game,
      homeTeamName: game.homeTeamId ? teamsMap.get(game.homeTeamId) || 'TBD' : 'TBD',
      awayTeamName: game.awayTeamId ? teamsMap.get(game.awayTeamId) || 'TBD' : 'TBD'
    }));

    // Get approved teams count
    const [teamsCount] = await db
      .select({
        totalTeams: sql<number>`COUNT(*)`.as('total_teams'),
        approvedTeams: sql<number>`COUNT(CASE WHEN status = 'approved' THEN 1 END)`.as('approved_teams')
      })
      .from(teams)
      .where(eq(teams.eventId, eventId));

    // Group games by date for easier analysis
    const gamesByDate = detailedGames.reduce((acc, game) => {
      const date = game.scheduledDate?.toString() || 'Unscheduled';
      if (!acc[date]) acc[date] = [];
      acc[date].push(game);
      return acc;
    }, {} as Record<string, typeof detailedGames>);

    return {
      formatTemplates: formatTemplates.length,
      availableFormats: formatTemplates.map(t => ({ name: t.name, teamCount: t.teamCount, games: t.totalGames })),
      totalBrackets: brackets.length,
      configuredBrackets: brackets.filter(b => b.tournamentFormat).length,
      bracketDetails: brackets.slice(0, 10).map(b => ({
        name: b.name,
        format: b.tournamentFormat,
        teams: b.teamCount
      })),
      totalGames: gamesCount.totalGames || 0,
      scheduledGames: gamesCount.scheduledGames || 0,
      totalTeams: teamsCount.totalTeams || 0,
      approvedTeams: teamsCount.approvedTeams || 0,
      detailedGames,
      gamesByDate
    };
  } catch (error) {
    console.error('Error fetching tournament data:', error);
    return null;
  }
};

// Enhanced AI chat function with tournament data access
const chatWithTournamentContext = async (eventId: string, userMessage: string) => {
  try {
    // Verify API key before proceeding
    const isApiKeyValid = await verifyApiKey();
    if (!isApiKeyValid) {
      return { error: "OpenAI API key is not configured or invalid" };
    }

    // Get comprehensive tournament data including fields
    const [financialData, tournamentData, fieldsData] = await Promise.all([
      getEventFinancialData(eventId),
      getTournamentData(eventId),
      getEventFieldsData(eventId)
    ]);

    if (!tournamentData) {
      return { error: "Unable to access tournament data" };
    }

    // Build comprehensive context prompt with fields data
    const contextPrompt = `
You are a tournament management assistant for the Empire Super Cup soccer tournament with full access to field management capabilities.

TOURNAMENT STATUS:
- Format Templates Available: ${tournamentData.formatTemplates} (including 4-Team Single, 6-Team Crossover, 8-Team Dual, Round Robin, Swiss, Single Elimination)
- Total Brackets: ${tournamentData.totalBrackets}
- Configured Brackets: ${tournamentData.configuredBrackets} (${Math.round((tournamentData.configuredBrackets/tournamentData.totalBrackets)*100)}% configured)
- Teams: ${tournamentData.approvedTeams.toLocaleString()} approved out of ${tournamentData.totalTeams.toLocaleString()} total
- Games: ${tournamentData.totalGames.toLocaleString()} generated, ${tournamentData.scheduledGames.toLocaleString()} scheduled

SCHEDULED GAMES BY DATE:
${Object.keys(tournamentData.gamesByDate).map(date => 
  `${date}: ${tournamentData.gamesByDate[date].length} games scheduled\n${tournamentData.gamesByDate[date].map(game => 
    `  - ${game.scheduledTime || 'TBD'}: ${game.homeTeamName} vs ${game.awayTeamName} on Field ${game.fieldName || game.fieldId} (Round ${game.round})`
  ).join('\n')}`
).join('\n\n')}

RECENT GAMES DETAILS:
${tournamentData.detailedGames.slice(0, 10).map(game => 
  `- Game #${game.id}: ${game.homeTeamName} vs ${game.awayTeamName} on ${game.scheduledDate} at ${game.scheduledTime || 'TBD'}, Field ${game.fieldName || game.fieldId} (Round ${game.round})`
).join('\n')}

FIELD MANAGEMENT:
- Total Fields Available: ${fieldsData.totalFields}
- Active Fields: ${fieldsData.activeFields}
- Field Size Distribution: ${fieldsData.fieldSizeBreakdown}

DETAILED FIELD INVENTORY:
${fieldsData.fieldDetails.map(f => `- Field ${f.name}: ${f.fieldSize} (${f.isActive ? 'Active' : 'Inactive'})${f.hasLights ? ' - Lighted' : ''}`).join('\n')}

AVAILABLE TOURNAMENT FORMATS:
${tournamentData.availableFormats.map(f => `- ${f.name}: ${f.teamCount} teams, ${f.games} games`).join('\n')}

RECENT BRACKET CONFIGURATIONS:
${tournamentData.bracketDetails.map(b => `- ${b.name}: ${b.format} format, ${b.teams} teams`).join('\n')}

FINANCIAL DATA:
- Total Revenue: $${(financialData.totalRevenue / 100).toFixed(2)}
- Paid Teams: ${financialData.paidTeams}
- Pending Teams: ${financialData.pendingTeams}

You can answer questions about field management, game scheduling, field availability, field sizes, and help move games between fields. When discussing specific fields, reference them by their actual names and sizes shown above.

User Question: ${userMessage}
`;

    // Call OpenAI API with full context
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are an expert tournament management assistant with access to comprehensive tournament data. Provide accurate, helpful responses based on the actual tournament status provided."
        },
        {
          role: "user",
          content: contextPrompt
        }
      ],
      max_tokens: 500,
      temperature: 0.3
    });

    return {
      response: response.choices[0].message.content,
      context: {
        formatTemplates: tournamentData.formatTemplates,
        configuredBrackets: tournamentData.configuredBrackets,
        totalBrackets: tournamentData.totalBrackets,
        approvedTeams: tournamentData.approvedTeams,
        scheduledGames: tournamentData.scheduledGames
      }
    };

  } catch (error) {
    log(`Error in AI chat with tournament context: ${error.message}`, 'openai');
    return { error: error.message };
  }
};

export {
  verifyApiKey,
  analyzeEventFinancials,
  analyzeFinancialOverview,
  analyzeFeesStructure,
  getTournamentData,
  getEventFieldsData,
  chatWithTournamentContext
};