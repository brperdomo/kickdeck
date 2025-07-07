/**
 * Test Team 472 Payment Processing
 */

import dotenv from 'dotenv';
import { chargeApprovedTeam } from './server/routes/stripe-connect-payments.ts';

dotenv.config();

async function testTeam472() {
  console.log('🧪 TESTING TEAM 472 PAYMENT PROCESSING');
  console.log('=====================================');
  
  try {
    console.log('Calling chargeApprovedTeam(472)...');
    const result = await chargeApprovedTeam(472);
    
    console.log('✅ SUCCESS! Payment processed for Team 472');
    console.log('Result:', JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('❌ PAYMENT FAILED for Team 472:');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
  }
}

testTeam472().catch(console.error);