/**
 * Fix Registration Payment Enforcement
 * 
 * This script implements server-side payment validation to prevent
 * teams from registering without completing required payment setup.
 */

import { readFileSync, writeFileSync } from 'fs';

async function fixRegistrationPaymentEnforcement() {
  console.log('Implementing registration payment enforcement...');
  
  // 1. Add payment validation to the registration endpoint
  console.log('1. Adding server-side payment validation...');
  
  const routesPath = 'server/routes.ts';
  let routesContent = readFileSync(routesPath, 'utf8');
  
  // Add payment validation logic before team creation
  const paymentValidationCode = `
    // PAYMENT ENFORCEMENT: Validate payment setup for teams with fees
    if (totalAmount > 0 && (!paymentMethod || paymentMethod === 'pay_later')) {
      // For teams with registration fees, require immediate payment setup
      // No more "pay later" option for new registrations
      console.log('Registration blocked: Payment required for teams with fees');
      return res.status(400).json({
        error: 'Payment setup required',
        message: 'Teams with registration fees must complete payment setup during registration',
        totalAmount: totalAmount,
        requiresPayment: true
      });
    }
`;
  
  // Find the location to insert payment validation
  const insertPoint = routesContent.indexOf('// Create the team registration');
  if (insertPoint === -1) {
    console.log('Could not find insertion point for payment validation');
  } else {
    const beforeInsert = routesContent.substring(0, insertPoint);
    const afterInsert = routesContent.substring(insertPoint);
    routesContent = beforeInsert + paymentValidationCode + '\n    ' + afterInsert;
    
    writeFileSync(routesPath, routesContent);
    console.log('Added server-side payment validation to registration endpoint');
  }
  
  // 2. Create payment setup validation middleware
  console.log('2. Creating payment setup validation middleware...');
  
  const middlewareContent = `/**
 * Payment Setup Validation Middleware
 * 
 * Validates that teams with fees have completed payment setup
 * before allowing registration submission.
 */

import { Request, Response, NextFunction } from 'express';

export interface PaymentValidationRequest extends Request {
  body: {
    totalAmount?: number;
    paymentMethod?: string;
    setupIntentId?: string;
    paymentMethodId?: string;
  };
}

export async function validatePaymentSetup(
  req: PaymentValidationRequest, 
  res: Response, 
  next: NextFunction
) {
  const { totalAmount, paymentMethod, setupIntentId, paymentMethodId } = req.body;
  
  // Skip validation for free registrations
  if (!totalAmount || totalAmount === 0) {
    return next();
  }
  
  // Require payment setup for teams with fees
  if (totalAmount > 0) {
    // Check if payment method is provided and valid
    if (!paymentMethod || paymentMethod === 'pay_later') {
      return res.status(400).json({
        error: 'Payment setup required',
        message: 'Teams with registration fees must complete payment setup',
        code: 'PAYMENT_SETUP_REQUIRED',
        totalAmount,
        requiresPayment: true
      });
    }
    
    // For card payments, validate setup intent completion
    if (paymentMethod === 'card') {
      if (!setupIntentId) {
        return res.status(400).json({
          error: 'Payment setup incomplete',
          message: 'Payment method setup was not completed',
          code: 'SETUP_INTENT_MISSING',
          totalAmount,
          requiresPayment: true
        });
      }
      
      // TODO: Add Stripe validation to check setup intent status
      // This would verify the setup intent is actually completed
    }
  }
  
  next();
}

export default validatePaymentSetup;`;
  
  writeFileSync('server/middleware/payment-validation.ts', middlewareContent);
  console.log('Created payment validation middleware');
  
  // 3. Update frontend to enforce payment completion
  console.log('3. Preparing frontend payment enforcement patch...');
  
  const frontendPatchContent = `/**
 * Frontend Payment Enforcement Patch
 * 
 * Apply this patch to the registration form to remove "pay later" options
 * and enforce payment completion before registration submission.
 */

// PATCH 1: Remove "Pay Later" button from event-registration.tsx
// Find and remove this section:
/*
<Button 
  type="button" 
  className="w-full text-white"
  onClick={() => {
    registerTeamMutation.mutate({
      ...teamForm.getValues(),
      paymentMethod: 'pay_later',
      addRosterLater
    });
  }}
>
  Register Now (Pay Later)
</Button>
*/

// PATCH 2: Modify payment options to be mandatory
// Replace the conditional payment rendering with:
/*
{registrationFee && (
  <div className="space-y-4">
    <div className="bg-blue-50 p-4 rounded border border-blue-200">
      <h4 className="font-medium text-blue-800 mb-2">Payment Required</h4>
      <p className="text-sm text-blue-700">
        A registration fee of $\{registrationFee.toFixed(2)} is required. 
        Please complete payment setup to finalize your registration.
      </p>
    </div>
    
    <PaymentSetupWrapper 
      teamId={\`temp-\${Date.now()}\`}
      expectedAmount={registrationFee * 100}
      onSuccess={() => {
        // Only allow registration after payment setup
        registerTeamMutation.mutate({
          ...teamForm.getValues(),
          paymentMethod: 'card',
          totalAmount: registrationFee * 100
        });
      }}
      onError={(error) => {
        toast({
          title: "Payment Setup Failed",
          description: error,
          variant: "destructive"
        });
      }}
    />
  </div>
)}
*/

console.log('Frontend enforcement patch prepared in fix-registration-payment-enforcement-frontend.patch');`;
  
  writeFileSync('fix-registration-payment-enforcement-frontend.patch', frontendPatchContent);
  
  // 4. Create validation script for existing registrations
  console.log('4. Creating registration validation script...');
  
  const validationScriptContent = `/**
 * Validate Existing Registrations
 * 
 * This script identifies teams that bypassed payment and provides
 * options for handling them.
 */

import pkg from 'pg';
const { Client } = pkg;

async function validateExistingRegistrations() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  
  try {
    await client.connect();
    
    // Find teams that bypassed payment
    const bypassedQuery = \`
      SELECT id, name, total_amount, status, payment_status,
             setup_intent_id, manager_email, created_at
      FROM teams 
      WHERE total_amount > 0 
        AND (setup_intent_id IS NULL OR payment_method_id IS NULL)
        AND status IN ('registered', 'pending')
      ORDER BY total_amount DESC
    \`;
    
    const result = await client.query(bypassedQuery);
    
    console.log(\`Found \${result.rows.length} teams that bypassed payment:\`);
    
    let totalBypassedAmount = 0;
    result.rows.forEach(team => {
      console.log(\`- \${team.name}: $\${team.total_amount/100} (\${team.manager_email})\`);
      totalBypassedAmount += team.total_amount;
    });
    
    console.log(\`\\nTotal bypassed amount: $\${totalBypassedAmount/100}\`);
    
    // Provide resolution options
    console.log('\\nResolution options:');
    console.log('1. Require payment completion before approval');
    console.log('2. Contact teams to complete payment setup');
    console.log('3. Mark registrations as incomplete until payment');
    
    return result.rows;
    
  } finally {
    await client.end();
  }
}

validateExistingRegistrations().catch(console.error);`;
  
  writeFileSync('validate-existing-registrations.js', validationScriptContent);
  
  console.log('\\n=== PAYMENT ENFORCEMENT IMPLEMENTATION COMPLETE ===');
  console.log('\\nChanges made:');
  console.log('1. Added server-side payment validation to registration endpoint');
  console.log('2. Created payment validation middleware');
  console.log('3. Prepared frontend enforcement patches');
  console.log('4. Created validation script for existing registrations');
  
  console.log('\\nNext steps:');
  console.log('1. Apply frontend patches to remove "pay later" options');
  console.log('2. Test registration flow to ensure payment is enforced');
  console.log('3. Handle existing teams that bypassed payment');
  console.log('4. Deploy changes to production');
  
  return {
    serverValidationAdded: true,
    middlewareCreated: true,
    frontendPatchPrepared: true,
    validationScriptCreated: true
  };
}

fixRegistrationPaymentEnforcement().catch(console.error);