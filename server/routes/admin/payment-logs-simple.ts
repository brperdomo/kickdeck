import { Request, Response } from 'express';
import { db } from '@db';
import { sql, eq, and, or, like, desc, asc, isNotNull, ilike, count, sum } from 'drizzle-orm';
import { paymentTransactions, teams, events, eventAgeGroups } from '@db/schema';

/**
 * Enhanced error code mapping for better user understanding
 */
const ERROR_CODE_DESCRIPTIONS: Record<string, string> = {
  // Card decline codes
  'insufficient_funds': 'Insufficient funds - Card declined due to lack of funds',
  'card_declined': 'Card declined - General decline by card issuer',
  'expired_card': 'Expired card - The card has expired',
  'incorrect_cvc': 'Incorrect CVC - Security code verification failed',
  'processing_error': 'Processing error - Temporary issue with card processor',
  'call_issuer': 'Call issuer - Customer needs to contact their bank',
  'pickup_card': 'Pickup card - Card flagged by issuer',
  'restricted_card': 'Restricted card - Card restricted by issuer',
  'security_violation': 'Security violation - Transaction flagged as suspicious',
  'lost_card': 'Lost card - Card reported as lost',
  'stolen_card': 'Stolen card - Card reported as stolen',
  'do_not_honor': 'Do not honor - Generic decline by issuer',
  'do_not_try_again': 'Do not try again - Permanent decline',
  'invalid_account': 'Invalid account - Account number invalid',
  'new_account_information_available': 'New account info available - Account updated',
  'try_again_later': 'Try again later - Temporary decline',
  
  // Stripe specific errors
  'authentication_required': 'Authentication required - 3D Secure authentication needed',
  'approve_with_id': 'Approve with ID - Manual approval required',
  'issuer_not_available': 'Issuer not available - Bank systems temporarily down',
  'reenter_transaction': 'Re-enter transaction - Retry the transaction',
  'withdrawal_count_limit_exceeded': 'Withdrawal limit exceeded - Daily limit reached',
  
  // Setup/Processing errors
  'setup_intent_authentication_failure': 'Setup authentication failed - Payment method setup failed',
  'payment_intent_authentication_failure': 'Payment authentication failed - Payment confirmation failed',
  'customer_missing': 'Customer missing - No Stripe customer associated with payment method',
  'payment_method_missing': 'Payment method missing - No payment method found for transaction'
};

/**
 * Get user-friendly error description
 */
function getErrorDescription(errorCode: string | null, errorMessage: string | null): string {
  if (!errorCode && !errorMessage) return '';
  
  const description = errorCode ? ERROR_CODE_DESCRIPTIONS[errorCode] : null;
  if (description) {
    return description;
  }
  
  // Extract decline code from error message if present
  if (errorMessage) {
    const declineCodeMatch = errorMessage.match(/decline_code:\s*(\w+)/);
    if (declineCodeMatch) {
      const declineCode = declineCodeMatch[1];
      const declineDescription = ERROR_CODE_DESCRIPTIONS[declineCode];
      if (declineDescription) {
        return declineDescription;
      }
    }
  }
  
  // Return original error message if no mapping found
  return errorMessage || errorCode || 'Unknown error';
}

/**
 * Get comprehensive payment logs with filtering and search capabilities
 * Provides detailed transaction history including enhanced error information
 */
export async function getPaymentLogs(req: Request, res: Response) {
  try {
    const { status, type, search, format, limit = '100', offset = '0', completeOnly } = req.query;
    
    console.log('Payment logs request:', { status, type, search, format, limit, offset, completeOnly });
    
    // Build WHERE conditions using Drizzle ORM
    const conditions = [];
    
    if (status && status !== 'all') {
      conditions.push(eq(paymentTransactions.status, status as string));
    }
    
    if (type && type !== 'all') {
      conditions.push(eq(paymentTransactions.transactionType, type as string));
    }
    
    if (search) {
      const searchTerm = search as string;
      conditions.push(
        or(
          ilike(teams.name, `%${searchTerm}%`),
          ilike(teams.managerName, `%${searchTerm}%`),
          ilike(teams.managerEmail, `%${searchTerm}%`),
          ilike(events.name, `%${searchTerm}%`),
          ilike(paymentTransactions.paymentIntentId, `%${searchTerm}%`),
          ilike(paymentTransactions.setupIntentId, `%${searchTerm}%`),
          ilike(paymentTransactions.errorCode, `%${searchTerm}%`),
          ilike(paymentTransactions.errorMessage, `%${searchTerm}%`)
        )
      );
    }
    
    if (completeOnly === 'true') {
      conditions.push(
        and(
          isNotNull(paymentTransactions.teamId),
          isNotNull(paymentTransactions.eventId)
        )
      );
    }
    
    const whereCondition = conditions.length > 0 ? and(...conditions) : undefined;
    
    // Handle CSV export
    if (format === 'csv') {
      const transactions = await db
        .select({
          id: paymentTransactions.id,
          createdAt: paymentTransactions.createdAt,
          teamName: teams.name,
          eventName: events.name,
          ageGroup: eventAgeGroups.ageGroup,
          managerName: teams.managerName,
          managerEmail: teams.managerEmail,
          managerPhone: teams.managerPhone,
          clubName: teams.clubName,
          transactionType: paymentTransactions.transactionType,
          amount: paymentTransactions.amount,
          stripeFee: paymentTransactions.stripeFee,
          netAmount: paymentTransactions.netAmount,
          status: paymentTransactions.status,
          paymentMethodType: paymentTransactions.paymentMethodType,
          cardBrand: paymentTransactions.cardBrand,
          cardLastFour: paymentTransactions.cardLastFour,
          paymentIntentId: paymentTransactions.paymentIntentId,
          setupIntentId: paymentTransactions.setupIntentId,
          errorCode: paymentTransactions.errorCode,
          errorMessage: paymentTransactions.errorMessage,
          settlementDate: paymentTransactions.settlementDate,
          payoutId: paymentTransactions.payoutId
        })
        .from(paymentTransactions)
        .leftJoin(teams, eq(paymentTransactions.teamId, teams.id))
        .leftJoin(events, eq(paymentTransactions.eventId, events.id))
        .leftJoin(eventAgeGroups, eq(teams.ageGroupId, eventAgeGroups.id))
        .where(whereCondition)
        .orderBy(desc(paymentTransactions.createdAt));

      // Generate CSV content with enhanced error descriptions
      const csvHeaders = [
        'ID', 'Date', 'Team Name', 'Event Name', 'Age Group', 'Manager Name', 'Manager Email', 
        'Manager Phone', 'Club Name', 'Transaction Type', 'Amount ($)', 'Stripe Fee ($)', 'Net Amount ($)', 
        'Status', 'Payment Method', 'Card Brand', 'Card Last Four', 'Payment Intent ID', 
        'Setup Intent ID', 'Error Code', 'Error Description', 'Settlement Date', 'Payout ID'
      ].join(',');

      const csvRows = transactions.map((t: any) => [
        t.id,
        new Date(t.createdAt).toISOString(),
        `"${(t.teamName || '').replace(/"/g, '""')}"`,
        `"${(t.eventName || '').replace(/"/g, '""')}"`,
        `"${(t.ageGroup || '').replace(/"/g, '""')}"`,
        `"${(t.managerName || '').replace(/"/g, '""')}"`,
        t.managerEmail || '',
        t.managerPhone || '',
        `"${(t.clubName || '').replace(/"/g, '""')}"`,
        t.transactionType || '',
        (t.amount || 0) / 100, // Convert cents to dollars
        (t.stripeFee || 0) / 100,
        (t.netAmount || t.amount || 0) / 100,
        t.status,
        t.paymentMethodType || '',
        t.cardBrand || '',
        t.cardLastFour || '',
        t.paymentIntentId || '',
        t.setupIntentId || '',
        t.errorCode || '',
        `"${getErrorDescription(t.errorCode, t.errorMessage).replace(/"/g, '""')}"`,
        t.settlementDate || '',
        t.payoutId || ''
      ].join(','));

      const csvContent = [csvHeaders, ...csvRows].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="payment-logs-${new Date().toISOString().split('T')[0]}.csv"`);
      return res.send(csvContent);
    }

    // Get summary statistics using Drizzle aggregations
    const summaryQuery = await db
      .select({
        totalTransactions: count(),
        totalAmount: sum(paymentTransactions.amount),
        successfulTransactions: sum(sql`CASE WHEN ${paymentTransactions.status} = 'succeeded' THEN 1 ELSE 0 END`),
        failedTransactions: sum(sql`CASE WHEN ${paymentTransactions.status} = 'failed' THEN 1 ELSE 0 END`),
        pendingTransactions: sum(sql`CASE WHEN ${paymentTransactions.status} = 'pending' THEN 1 ELSE 0 END`),
        refundedTransactions: sum(sql`CASE WHEN ${paymentTransactions.status} = 'refunded' THEN 1 ELSE 0 END`)
      })
      .from(paymentTransactions)
      .leftJoin(teams, eq(paymentTransactions.teamId, teams.id))
      .leftJoin(events, eq(paymentTransactions.eventId, events.id))
      .where(whereCondition);

    const summary = summaryQuery[0];

    // Get paginated transactions with enhanced error information
    const limitValue = parseInt(limit as string);
    const offsetValue = parseInt(offset as string);

    const transactions = await db
      .select({
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
        // Age group details
        ageGroup: eventAgeGroups.ageGroup
      })
      .from(paymentTransactions)
      .leftJoin(teams, eq(paymentTransactions.teamId, teams.id))
      .leftJoin(events, eq(paymentTransactions.eventId, events.id))
      .leftJoin(eventAgeGroups, eq(teams.ageGroupId, eventAgeGroups.id))
      .where(whereCondition)
      .orderBy(desc(paymentTransactions.createdAt))
      .limit(limitValue)
      .offset(offsetValue);

    // Enhance transactions with user-friendly error descriptions
    const enhancedTransactions = transactions.map(transaction => ({
      ...transaction,
      errorDescription: getErrorDescription(transaction.errorCode, transaction.errorMessage),
      amountFormatted: `$${((transaction.amount || 0) / 100).toFixed(2)}`,
      stripeFeeFormatted: `$${((transaction.stripeFee || 0) / 100).toFixed(2)}`,
      netAmountFormatted: `$${((transaction.netAmount || transaction.amount || 0) / 100).toFixed(2)}`
    }));

    return res.json({
      success: true,
      transactions: enhancedTransactions,
      summary: {
        totalTransactions: Number(summary.totalTransactions) || 0,
        totalAmount: Number(summary.totalAmount) || 0,
        successfulTransactions: Number(summary.successfulTransactions) || 0,
        failedTransactions: Number(summary.failedTransactions) || 0,
        pendingTransactions: Number(summary.pendingTransactions) || 0,
        refundedTransactions: Number(summary.refundedTransactions) || 0
      },
      pagination: {
        limit: limitValue,
        offset: offsetValue,
        hasMore: transactions.length === limitValue
      }
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

    const transaction = await db
      .select({
        // Payment transaction fields
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
        // Age group details
        ageGroup: eventAgeGroups.ageGroup
      })
      .from(paymentTransactions)
      .leftJoin(teams, eq(paymentTransactions.teamId, teams.id))
      .leftJoin(events, eq(paymentTransactions.eventId, events.id))
      .leftJoin(eventAgeGroups, eq(teams.ageGroupId, eventAgeGroups.id))
      .where(eq(paymentTransactions.id, parseInt(transactionId)))
      .limit(1);

    if (!transaction || transaction.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Payment transaction not found'
      });
    }

    const transactionDetail = transaction[0];
    
    // Enhance with error description
    const enhancedTransaction = {
      ...transactionDetail,
      errorDescription: getErrorDescription(transactionDetail.errorCode, transactionDetail.errorMessage),
      amountFormatted: `$${((transactionDetail.amount || 0) / 100).toFixed(2)}`,
      stripeFeeFormatted: `$${((transactionDetail.stripeFee || 0) / 100).toFixed(2)}`,
      netAmountFormatted: `$${((transactionDetail.netAmount || transactionDetail.amount || 0) / 100).toFixed(2)}`
    };

    return res.json({
      success: true,
      transaction: enhancedTransaction
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
        teamId: paymentTransactions.teamId,
        teamName: teams.name,
        eventName: events.name,
        amount: paymentTransactions.amount,
        errorCode: paymentTransactions.errorCode,
        errorMessage: paymentTransactions.errorMessage,
        createdAt: paymentTransactions.createdAt
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

    // Enhance with error descriptions
    const enhancedFailures = failures.map(failure => ({
      ...failure,
      errorDescription: getErrorDescription(failure.errorCode, failure.errorMessage),
      amountFormatted: `$${((failure.amount || 0) / 100).toFixed(2)}`
    }));

    return res.json({
      success: true,
      failures: enhancedFailures,
      count: failures.length
    });

  } catch (error) {
    console.error('Error fetching recent payment failures:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch recent failures'
    });
  }
}