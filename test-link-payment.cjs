/**
 * Test Link Payment Method Processing
 * 
 * This script tests whether the Link payment method can be processed
 * correctly without a customer association.
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function testLinkPayment() {
  try {
    const paymentMethodId = 'pm_1ReUBhP4BpmZARxtxF4udImY'; // Team 194's Link payment method
    const amount = 138; // $1.38 in cents
    
    console.log('Testing Link payment method processing...');
    
    // Test 1: Verify payment method details
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
    console.log(`Payment method type: ${paymentMethod.type}`);
    console.log(`Payment method customer: ${paymentMethod.customer}`);
    
    // Test 2: Create payment intent WITHOUT customer (should work)
    console.log('\nTesting payment intent creation WITHOUT customer...');
    const paymentIntentWithoutCustomer = await stripe.paymentIntents.create({
      amount: amount,
      currency: 'usd',
      payment_method: paymentMethodId,
      confirm: true,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never'
      },
      metadata: {
        test: 'link_payment_without_customer'
      }
    });
    
    console.log(`Payment intent created successfully: ${paymentIntentWithoutCustomer.id}`);
    console.log(`Status: ${paymentIntentWithoutCustomer.status}`);
    
    // Test 3: Create payment intent WITH customer (should fail)
    console.log('\nTesting payment intent creation WITH customer...');
    try {
      const paymentIntentWithCustomer = await stripe.paymentIntents.create({
        amount: amount,
        currency: 'usd',
        payment_method: paymentMethodId,
        customer: 'cus_SZcm0hxi9JfsmV', // Team 194's original customer
        confirm: true,
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: 'never'
        },
        metadata: {
          test: 'link_payment_with_customer'
        }
      });
      
      console.log('ERROR: Payment intent with customer should have failed!');
    } catch (error) {
      console.log(`Expected error occurred: ${error.message}`);
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testLinkPayment();