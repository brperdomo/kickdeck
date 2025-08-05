import postgres from 'postgres';
import Stripe from 'stripe';
import 'dotenv/config';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });

async function fixPaymentIssues() {
  try {
    console.log('🔧 Fixing payment issues for teams 851 and 859...');
    
    // Get the specific teams that are failing
    const failingTeams = await sql`
      SELECT id, name, setup_intent_id, payment_method_id, stripe_customer_id
      FROM teams 
      WHERE id IN (851, 859)
    `;
    
    for (const team of failingTeams) {
      console.log(`\n🔍 Processing team ${team.id}: ${team.name}`);
      
      if (team.setup_intent_id) {
        try {
          // Retrieve the setup intent from Stripe
          const setupIntent = await stripe.setupIntents.retrieve(team.setup_intent_id);
          
          console.log(`  Setup Intent status: ${setupIntent.status}`);
          console.log(`  Customer: ${setupIntent.customer || 'None'}`);
          console.log(`  Payment method: ${setupIntent.payment_method || 'None'}`);
          
          if (setupIntent.status === 'succeeded') {
            let updateData = {
              payment_method_id: setupIntent.payment_method || team.payment_method_id
            };
            
            // Check if this is a Link payment method
            if (setupIntent.payment_method) {
              const paymentMethod = await stripe.paymentMethods.retrieve(setupIntent.payment_method);
              
              if (paymentMethod.type === 'link') {
                console.log(`  🔗 Link payment method detected - keeping customer ID as null`);
                updateData.stripe_customer_id = null;
              } else if (setupIntent.customer) {
                console.log(`  💳 Regular payment method - setting customer ID`);
                updateData.stripe_customer_id = setupIntent.customer;
              }
            }
            
            // Update the team record
            await sql`
              UPDATE teams 
              SET 
                stripe_customer_id = ${updateData.stripe_customer_id || null},
                payment_method_id = ${updateData.payment_method_id || null},
                payment_status = 'payment_ready'
              WHERE id = ${team.id}
            `;
            
            console.log(`  ✅ Updated team ${team.id} with correct payment data`);
          } else {
            console.log(`  ⚠️  Setup intent not completed: ${setupIntent.status}`);
          }
        } catch (error) {
          console.error(`  ❌ Error processing team ${team.id}:`, error.message);
        }
      } else {
        console.log(`  ⚠️  No setup intent found for team ${team.id}`);
      }
    }
    
    console.log('\n✅ Payment issue fix completed');
    
  } catch (error) {
    console.error('❌ Error fixing payment issues:', error);
  } finally {
    await sql.end();
  }
}

// Run the fix
fixPaymentIssues();