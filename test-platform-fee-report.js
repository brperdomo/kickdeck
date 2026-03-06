/**
 * Test Platform Fee Report API
 * 
 * This script tests the new platform fee report to verify
 * it's properly calculating KickDeck revenue vs Stripe fees.
 */

import axios from 'axios';

async function testPlatformFeeReport() {
  console.log('🧪 TESTING PLATFORM FEE REPORT API');
  console.log('==================================');
  
  try {
    // Test the platform fee report endpoint
    console.log('\n1. Testing platform fee report endpoint...');
    const response = await axios.get('http://localhost:5000/api/platform-fee-report');
    
    if (response.status === 200) {
      const data = response.data;
      
      console.log('\n✅ Platform Fee Report Generated Successfully!');
      console.log(`📊 Report Metadata:`);
      console.log(`   Generated: ${new Date(data.reportMetadata.generatedAt).toLocaleString()}`);
      console.log(`   Date Range: ${data.reportMetadata.dateRange.startDate || 'All Time'} - ${data.reportMetadata.dateRange.endDate || 'Present'}`);
      
      console.log(`\n💰 Summary Statistics:`);
      console.log(`   Total Transactions: ${data.summary.totalTransactions}`);
      console.log(`   Total Events: ${data.summary.totalEvents}`);
      console.log(`   Tournament Costs: $${(data.summary.totalTournamentCosts / 100).toFixed(2)}`);
      console.log(`   Total Charged: $${(data.summary.totalChargedToCustomers / 100).toFixed(2)}`);
      console.log(`   Platform Fees: $${(data.summary.totalPlatformFeesCollected / 100).toFixed(2)}`);
      console.log(`   Stripe Fees: $${(data.summary.totalStripeFeespaid / 100).toFixed(2)}`);
      console.log(`   KickDeck Revenue: $${(data.summary.totalKickDeckNetRevenue / 100).toFixed(2)}`);
      
      console.log(`\n📈 Fee Structure Analysis:`);
      console.log(`   Platform Fee Rate: ${data.summary.platformFeeRate}%`);
      console.log(`   Stripe Fee Rate: ${data.summary.stripeFeeRate}%`);
      console.log(`   KickDeck Margin: ${data.summary.kickdeckMarginRate}%`);
      console.log(`   Avg Revenue/Transaction: $${(data.summary.avgKickDeckRevenuePerTransaction / 100).toFixed(2)}`);
      
      console.log(`\n💳 Payment Method Breakdown:`);
      console.log(`   Card Payments: ${data.paymentMethodBreakdown.cardPayments.count} transactions`);
      console.log(`   Card Revenue: $${(data.paymentMethodBreakdown.cardPayments.revenue / 100).toFixed(2)}`);
      console.log(`   Link Payments: ${data.paymentMethodBreakdown.linkPayments.count} transactions`);
      console.log(`   Link Revenue: $${(data.paymentMethodBreakdown.linkPayments.revenue / 100).toFixed(2)}`);
      
      if (data.eventBreakdown.length > 0) {
        console.log(`\n🏆 Top 3 Events by KickDeck Revenue:`);
        data.eventBreakdown.slice(0, 3).forEach((event, index) => {
          console.log(`   ${index + 1}. ${event.eventName}: $${(event.kickdeckRevenue / 100).toFixed(2)} (${event.teamCount} teams)`);
        });
      }
      
      if (data.transactions.length > 0) {
        console.log(`\n📋 Sample Transactions (first 3):`);
        data.transactions.slice(0, 3).forEach((tx, index) => {
          console.log(`   ${index + 1}. ${tx.teamName} - ${tx.eventName}`);
          console.log(`      Tournament: $${(tx.tournamentCostCents / 100).toFixed(2)}, Total: $${(tx.totalChargedAmount / 100).toFixed(2)}`);
          console.log(`      KickDeck: $${(tx.kickdeckRevenue / 100).toFixed(2)}, Stripe: $${(tx.stripeFeeAmount / 100).toFixed(2)}`);
          console.log(`      Payment: ${tx.paymentMethodType}`);
        });
      }
      
    } else {
      console.log(`❌ API returned status: ${response.status}`);
    }
    
  } catch (error) {
    if (error.response) {
      console.log(`❌ API Error: ${error.response.status} - ${error.response.statusText}`);
      console.log(`Error details:`, error.response.data);
    } else {
      console.log(`❌ Network Error:`, error.message);
    }
  }
  
  console.log('\n✅ Platform fee report testing complete!');
}

testPlatformFeeReport().catch(console.error);