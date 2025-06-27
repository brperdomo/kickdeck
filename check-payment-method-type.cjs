/**
 * Check Payment Method Type for Team Testing
 */

const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });

async function checkPaymentMethodType() {
  try {
    // Check Team 149 payment method
    const paymentMethodId = 'pm_1ReFyeP4BpmZARxta4bf0SqV';
    
    console.log(`Checking payment method: ${paymentMethodId}`);
    
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
    
    console.log(`Payment method type: ${paymentMethod.type}`);
    console.log(`Payment method customer: ${paymentMethod.customer}`);
    
    if (paymentMethod.type === 'card') {
      console.log(`Card brand: ${paymentMethod.card?.brand}`);
      console.log(`Card last 4: ${paymentMethod.card?.last4}`);
    }
    
    if (paymentMethod.type === 'link') {
      console.log('This is a Link payment method - will require detachment during processing');
    } else {
      console.log('This is a regular payment method - good for testing platform fee recording');
    }
    
  } catch (error) {
    console.error('Error checking payment method:', error);
  }
}

checkPaymentMethodType();