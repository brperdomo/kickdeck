/**
 * Generate Payment Completion URL for Team 481
 * 
 * This creates a proper payment completion page URL that the customer
 * can use to complete their payment for Empire Surf Academy B2014.
 */

const clientSecret = "pi_3RiNIjP4BpmZARxt1xHli6oK_secret_eofj4r8AwAUhbgkuTsQEKG4ZZ";
const teamId = 481;
const amount = 49750; // $497.50

console.log('🎯 Payment Completion Details for Empire Surf Academy B2014');
console.log('====================================================');
console.log('');
console.log('📧 Send this information to: hector.deleon39@yahoo.com');
console.log('');
console.log('Subject: Complete Your Payment - Empire Super Cup Registration');
console.log('');
console.log('Dear Empire Surf Academy B2014 Team Manager,');
console.log('');
console.log('Your team registration for Empire Super Cup is almost complete!');
console.log('We need you to complete your payment to finalize the registration.');
console.log('');
console.log('🏷️  Team: Empire Surf Academy B2014');
console.log('🏆 Event: Empire Super Cup');
console.log('💰 Amount: $497.50');
console.log('');
console.log('💳 Complete Payment Here:');
console.log(`https://app.matchpro.ai/complete-payment?client_secret=${clientSecret}&team_id=${teamId}`);
console.log('');
console.log('Once payment is complete, your team will be reviewed for approval.');
console.log('');
console.log('If you have any questions, please contact tournament support.');
console.log('');
console.log('Thank you!');
console.log('Tournament Administration');
console.log('');
console.log('====================================================');
console.log('');
console.log('📋 Admin Notes:');
console.log(`- Team ID: ${teamId}`);
console.log(`- Payment Intent: pi_3RiNIjP4BpmZARxt1xHli6oK`);
console.log(`- Customer: cus_Sdebwvgqrn1m55`);
console.log(`- Amount: $${(amount/100).toFixed(2)}`);
console.log('- Status: Awaiting customer payment completion');
console.log('- Original issue: Link payment method detached, new payment required');