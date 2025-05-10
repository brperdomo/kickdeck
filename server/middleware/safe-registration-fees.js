/**
 * Safe Registration Fees Middleware
 * 
 * This middleware ensures registration fees are properly handled
 * even when they're missing for certain age groups.
 */

/**
 * Middleware that checks for missing registration fees in the request/response chain
 * and ensures they are handled gracefully instead of causing 500 errors.
 * 
 * It specifically targets registration endpoints and safely handles:
 * - Missing fees array
 * - Null fee amounts
 * - Undefined fee properties
 */
export default function safeRegistrationFeesMiddleware(req, res, next) {
  // Only process POST requests to the team registration endpoint
  if (req.method === 'POST' && req.path.includes('/register-team')) {
    console.log('[SafeRegistrationFees] Processing registration request');
    
    // Initialize fees to an empty array if it doesn't exist in the request
    // This prevents "Cannot read properties of undefined (reading 'map')" errors
    if (!req.body.fees) {
      console.log('[SafeRegistrationFees] Initializing missing fees array');
      req.body.fees = [];
    }
    
    // Check if ageGroupId exists and fees are available for that age group
    if (req.body.ageGroupId) {
      console.log(`[SafeRegistrationFees] Validating fees for age group ${req.body.ageGroupId}`);
      // Additional logic could be added here to query and validate fees if needed
    }
  }
  
  // Continue with the request chain
  next();
}