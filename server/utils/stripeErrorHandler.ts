/**
 * Enhanced Stripe Error Handler
 * 
 * This module provides detailed error parsing and user-friendly messages
 * for all types of Stripe payment failures including insufficient funds,
 * card declined reasons, authentication failures, etc.
 */

export interface DetailedPaymentError {
  type: 'card_error' | 'rate_limit_error' | 'invalid_request_error' | 'authentication_error' | 'api_connection_error' | 'api_error' | 'unknown_error';
  code?: string;
  decline_code?: string;
  message: string;
  userFriendlyMessage: string;
  adminMessage: string;
  requiresAction: string;
  canRetry: boolean;
  suggestedSolution: string;
}

/**
 * Parse Stripe error and provide detailed context
 */
export function parseStripeError(error: any): DetailedPaymentError {
  console.log('STRIPE ERROR DETAILS:', {
    type: error.type,
    code: error.code,
    decline_code: error.decline_code,
    message: error.message,
    payment_intent: error.payment_intent?.id,
    charge: error.charge?.id
  });

  // Card-related errors (most common)
  if (error.type === 'card_error') {
    return parseCardError(error);
  }

  // Rate limiting errors
  if (error.type === 'rate_limit_error') {
    return {
      type: 'rate_limit_error',
      code: error.code,
      message: error.message,
      userFriendlyMessage: 'Payment processing is temporarily unavailable due to high volume. Please try again in a few minutes.',
      adminMessage: `Rate limit exceeded: ${error.message}`,
      requiresAction: 'Wait and retry',
      canRetry: true,
      suggestedSolution: 'Wait 2-3 minutes before attempting payment again'
    };
  }

  // Invalid request errors
  if (error.type === 'invalid_request_error') {
    return {
      type: 'invalid_request_error',
      code: error.code,
      message: error.message,
      userFriendlyMessage: 'There was a configuration issue with the payment. Please contact support.',
      adminMessage: `Invalid request: ${error.message}`,
      requiresAction: 'Contact technical support',
      canRetry: false,
      suggestedSolution: 'Check payment configuration and API parameters'
    };
  }

  // Authentication errors
  if (error.type === 'authentication_error') {
    return {
      type: 'authentication_error',
      code: error.code,
      message: error.message,
      userFriendlyMessage: 'Payment system authentication error. Please contact support.',
      adminMessage: `Authentication failed: ${error.message}`,
      requiresAction: 'Check API keys',
      canRetry: false,
      suggestedSolution: 'Verify Stripe API keys are correct and active'
    };
  }

  // Connection errors
  if (error.type === 'api_connection_error') {
    return {
      type: 'api_connection_error',
      code: error.code,
      message: error.message,
      userFriendlyMessage: 'Unable to connect to payment processor. Please check your internet connection and try again.',
      adminMessage: `Connection error: ${error.message}`,
      requiresAction: 'Check connectivity',
      canRetry: true,
      suggestedSolution: 'Verify internet connection and Stripe service status'
    };
  }

  // Generic API errors
  if (error.type === 'api_error') {
    return {
      type: 'api_error',
      code: error.code,
      message: error.message,
      userFriendlyMessage: 'Payment processor is experiencing issues. Please try again later.',
      adminMessage: `Stripe API error: ${error.message}`,
      requiresAction: 'Wait and retry',
      canRetry: true,
      suggestedSolution: 'Check Stripe status page and retry payment'
    };
  }

  // Unknown/generic errors
  return {
    type: 'unknown_error',
    code: error.code,
    message: error.message || 'Unknown error',
    userFriendlyMessage: 'An unexpected payment error occurred. Please try again or contact support.',
    adminMessage: `Unknown error: ${error.message || 'No details available'}`,
    requiresAction: 'Investigate',
    canRetry: true,
    suggestedSolution: 'Check error logs and contact support if issue persists'
  };
}

/**
 * Parse specific card error types with detailed decline reasons
 */
function parseCardError(error: any): DetailedPaymentError {
  const declineCode = error.decline_code;
  const code = error.code;

  // Insufficient funds
  if (code === 'card_declined' && declineCode === 'insufficient_funds') {
    return {
      type: 'card_error',
      code,
      decline_code: declineCode,
      message: error.message,
      userFriendlyMessage: 'Your card was declined due to insufficient funds. Please use a different payment method.',
      adminMessage: `Card declined: Insufficient funds (Team needs different payment method)`,
      requiresAction: 'Team needs new payment method',
      canRetry: false,
      suggestedSolution: 'Ask team to provide different card or payment method'
    };
  }

  // Generic card declined
  if (code === 'card_declined' && declineCode === 'generic_decline') {
    return {
      type: 'card_error',
      code,
      decline_code: declineCode,
      message: error.message,
      userFriendlyMessage: 'Your card was declined by your bank. Please contact your bank or use a different payment method.',
      adminMessage: `Card declined: Generic decline by issuing bank`,
      requiresAction: 'Team needs to contact bank or use different card',
      canRetry: false,
      suggestedSolution: 'Team should contact their bank or try different payment method'
    };
  }

  // Lost/stolen card
  if (code === 'card_declined' && (declineCode === 'lost_card' || declineCode === 'stolen_card')) {
    return {
      type: 'card_error',
      code,
      decline_code: declineCode,
      message: error.message,
      userFriendlyMessage: 'Your card has been reported as lost or stolen. Please use a different payment method.',
      adminMessage: `Card declined: Card reported as ${declineCode.replace('_', ' ')}`,
      requiresAction: 'Team needs new payment method immediately',
      canRetry: false,
      suggestedSolution: 'Team must provide different card immediately'
    };
  }

  // Expired card
  if (code === 'expired_card') {
    return {
      type: 'card_error',
      code,
      decline_code: declineCode,
      message: error.message,
      userFriendlyMessage: 'Your card has expired. Please update your payment method with a current card.',
      adminMessage: `Card declined: Card expired`,
      requiresAction: 'Team needs to update card expiration',
      canRetry: false,
      suggestedSolution: 'Team should provide updated card with current expiration date'
    };
  }

  // Incorrect CVC
  if (code === 'incorrect_cvc') {
    return {
      type: 'card_error',
      code,
      decline_code: declineCode,
      message: error.message,
      userFriendlyMessage: 'The security code (CVC) on your card is incorrect. Please verify and try again.',
      adminMessage: `Card declined: Incorrect CVC code`,
      requiresAction: 'Team needs to re-enter correct CVC',
      canRetry: true,
      suggestedSolution: 'Ask team to double-check CVC code and retry'
    };
  }

  // Processing error
  if (code === 'processing_error') {
    return {
      type: 'card_error',
      code,
      decline_code: declineCode,
      message: error.message,
      userFriendlyMessage: 'There was an error processing your card. Please try again in a few minutes.',
      adminMessage: `Card processing error: ${error.message}`,
      requiresAction: 'Retry payment',
      canRetry: true,
      suggestedSolution: 'Wait a few minutes and retry the payment'
    };
  }

  // Authentication required (3D Secure)
  if (code === 'authentication_required') {
    return {
      type: 'card_error',
      code,
      decline_code: declineCode,
      message: error.message,
      userFriendlyMessage: 'Your bank requires additional authentication. Please complete the verification with your bank.',
      adminMessage: `Card declined: Authentication required (3D Secure)`,
      requiresAction: 'Team needs to complete bank authentication',
      canRetry: true,
      suggestedSolution: 'Guide team through 3D Secure authentication process'
    };
  }

  // Generic card error fallback
  return {
    type: 'card_error',
    code,
    decline_code: declineCode,
    message: error.message,
    userFriendlyMessage: `Your card was declined: ${error.message}. Please contact your bank or use a different payment method.`,
    adminMessage: `Card error: ${error.message} (Code: ${code}, Decline: ${declineCode})`,
    requiresAction: 'Team needs to resolve card issue',
    canRetry: code === 'processing_error' || code === 'authentication_required',
    suggestedSolution: 'Team should contact bank or provide different payment method'
  };
}

/**
 * Format error for database storage
 */
export function formatErrorForDatabase(error: DetailedPaymentError): string {
  return `${error.type.toUpperCase()}: ${error.adminMessage} | Action: ${error.requiresAction} | Solution: ${error.suggestedSolution}`;
}

/**
 * Format error for admin display
 */
export function formatErrorForAdmin(error: DetailedPaymentError): object {
  return {
    type: error.type,
    code: error.code,
    decline_code: error.decline_code,
    summary: error.adminMessage,
    action_required: error.requiresAction,
    can_retry: error.canRetry,
    suggested_solution: error.suggestedSolution,
    user_message: error.userFriendlyMessage
  };
}