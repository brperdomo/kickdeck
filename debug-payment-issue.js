// Debug Payment Processing Issues for Teams 851 & 859
// This script helps identify undefined values causing payment failures

const axios = require('axios');

async function debugPaymentIssue() {
  console.log('🔍 Debugging payment processing for teams 851 and 859...\n');
  
  const baseUrl = 'http://localhost:5000';
  
  // Test both teams
  for (const teamId of [851, 859]) {
    console.log(`\n=== Testing Team ${teamId} ===`);
    
    try {
      // Try to manually charge the team to see the exact error
      const response = await axios.post(`${baseUrl}/api/admin/teams/${teamId}/charge`, {}, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`✅ Team ${teamId} charged successfully:`, response.data);
      
    } catch (error) {
      if (error.response) {
        console.log(`❌ Team ${teamId} charge failed:`, {
          status: error.response.status,
          data: error.response.data
        });
      } else {
        console.log(`❌ Team ${teamId} network error:`, error.message);
      }
    }
  }
}

// Run the debug
debugPaymentIssue().catch(err => {
  console.error('Debug script failed:', err);
});