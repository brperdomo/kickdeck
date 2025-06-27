/**
 * CRITICAL FIX: Strengthen Setup Intent Validation
 * 
 * This script adds bulletproof validation to prevent registration
 * with incomplete Setup Intents. This will stop users from bypassing
 * payment setup completion.
 */

const fs = require('fs');
const path = require('path');

// Read the current routes.ts file
const routesPath = path.join(__dirname, 'server', 'routes.ts');
let routesContent = fs.readFileSync(routesPath, 'utf8');

console.log('🔧 Adding bulletproof Setup Intent validation to registration endpoint...');

// Find the registration endpoint and strengthen the validation
const newValidationCode = `
            // BULLETPROOF SETUP INTENT VALIDATION
            if (totalAmount > 0) {
              if (!setupIntentId) {
                console.log(\`❌ REGISTRATION BLOCKED: No Setup Intent provided for team with \${totalAmount} cents\`);
                return res.status(400).json({
                  error: 'Payment method setup required',
                  message: 'Registration requires payment setup. Please complete the payment form before submitting.',
                  totalAmount: totalAmount,
                  requiresPayment: true,
                  debug: {
                    teamName: req.body.name,
                    hasSetupIntentId: !!setupIntentId,
                    totalAmountCents: totalAmount
                  }
                });
              }

              // Verify Setup Intent exists and is completed
              const { default: stripe } = await import(path.join(process.cwd(), 'node_modules/stripe/esm/stripe.esm.node.mjs')).then((module) => ({ default: module }));
              const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY!, {
                apiVersion: '2023-10-16',
              });
              
              let setupIntent;
              try {
                setupIntent = await stripeInstance.setupIntents.retrieve(setupIntentId);
              } catch (error) {
                console.log(\`❌ REGISTRATION BLOCKED: Setup Intent \${setupIntentId} not found in Stripe\`);
                return res.status(400).json({
                  error: 'Invalid payment setup',
                  message: 'Payment setup reference is invalid. Please complete payment setup again.',
                  totalAmount: totalAmount,
                  requiresPayment: true,
                  debug: {
                    setupIntentId: setupIntentId,
                    teamName: req.body.name,
                    stripeError: error instanceof Error ? error.message : 'Unknown error'
                  }
                });
              }
              
              if (setupIntent.status !== 'succeeded') {
                console.log(\`❌ REGISTRATION BLOCKED: Setup Intent \${setupIntentId} status is \${setupIntent.status} (required: succeeded)\`);
                console.log(\`   Team: \${req.body.name}\`);
                console.log(\`   Email: \${req.body.managerEmail}\`);
                
                return res.status(400).json({
                  error: 'Payment setup not completed',
                  message: \`Payment setup was not completed. Status: \${setupIntent.status}. Please complete the payment form and try again.\`,
                  totalAmount: totalAmount,
                  requiresPayment: true,
                  setupIntentStatus: setupIntent.status,
                  debug: {
                    setupIntentId: setupIntentId,
                    hasPaymentMethod: !!setupIntent.payment_method,
                    status: setupIntent.status,
                    teamName: req.body.name
                  }
                });
              }
              
              if (!setupIntent.payment_method) {
                console.log(\`❌ REGISTRATION BLOCKED: Setup Intent \${setupIntentId} has no payment method attached\`);
                console.log(\`   Team: \${req.body.name}\`);
                
                return res.status(400).json({
                  error: 'Payment method not attached',
                  message: 'Payment setup is incomplete - no payment method attached. Please complete payment setup again.',
                  totalAmount: totalAmount,
                  requiresPayment: true,
                  setupIntentStatus: setupIntent.status,
                  debug: {
                    setupIntentId: setupIntentId,
                    hasPaymentMethod: false,
                    status: setupIntent.status,
                    teamName: req.body.name
                  }
                });
              }

              // Verify payment method ID matches (if provided)
              if (paymentMethodId && setupIntent.payment_method !== paymentMethodId) {
                console.log(\`❌ REGISTRATION BLOCKED: Payment method mismatch\`);
                console.log(\`   Setup Intent has: \${setupIntent.payment_method}\`);
                console.log(\`   Registration claims: \${paymentMethodId}\`);
                
                return res.status(400).json({
                  error: 'Payment method mismatch',
                  message: 'Payment method verification failed. Please complete payment setup again.',
                  totalAmount: totalAmount,
                  requiresPayment: true,
                  debug: {
                    setupIntentId: setupIntentId,
                    setupIntentPaymentMethod: setupIntent.payment_method,
                    registrationPaymentMethod: paymentMethodId,
                    teamName: req.body.name
                  }
                });
              }
              
              console.log(\`✅ REGISTRATION VALIDATION PASSED: Setup Intent \${setupIntentId} is properly completed\`);
              console.log(\`   Status: \${setupIntent.status}\`);
              console.log(\`   Payment Method: \${setupIntent.payment_method}\`);
              console.log(\`   Team: \${req.body.name}\`);
            }`;

// Find where to insert the validation (after totalAmount calculation, before team creation)
if (routesContent.includes('BULLETPROOF SETUP INTENT VALIDATION')) {
  console.log('✅ Setup Intent validation already strengthened');
} else {
  // Find the location to insert validation
  const insertionPoint = routesContent.indexOf('// Only validate Setup Intent if payment is required');
  
  if (insertionPoint !== -1) {
    // Replace the existing validation with our bulletproof version
    const beforeValidation = routesContent.substring(0, insertionPoint);
    const afterValidation = routesContent.substring(routesContent.indexOf('// Create the team record', insertionPoint));
    
    routesContent = beforeValidation + newValidationCode + '\n\n            ' + afterValidation;
    
    fs.writeFileSync(routesPath, routesContent);
    console.log('✅ Bulletproof Setup Intent validation added to registration endpoint');
  } else {
    console.log('❌ Could not find insertion point for Setup Intent validation');
    console.log('   Current validation patterns in file:', routesContent.match(/Setup Intent|setupIntent/g) || 'None found');
  }
}

console.log('🎯 Setup Intent validation strengthening complete');
console.log('🎯 This will prevent users from registering with incomplete payment setup');