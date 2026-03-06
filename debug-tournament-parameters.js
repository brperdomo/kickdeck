#!/usr/bin/env node

import fetch from 'node-fetch';

async function testTournamentParametersAPI() {
  try {
    console.log('🔍 TESTING TOURNAMENT PARAMETERS API');
    console.log('====================================');
    
    // Step 1: Login as admin
    console.log('Step 1: Logging in as admin...');
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@kickdeck.io',
        password: 'admin123'
      })
    });
    
    if (!loginResponse.ok) {
      console.error('❌ Login failed:', await loginResponse.text());
      return;
    }
    
    const cookies = loginResponse.headers.get('set-cookie');
    console.log('✅ Login successful');
    console.log('Cookies received:', cookies);
    
    // Step 2: Test tournament parameters API
    console.log('\nStep 2: Testing tournament parameters API...');
    const apiResponse = await fetch('http://localhost:5000/api/admin/events/1844329078/tournament-parameters', {
      headers: {
        'Cookie': cookies
      }
    });
    
    if (!apiResponse.ok) {
      console.error('❌ API failed:', await apiResponse.text());
      return;
    }
    
    const data = await apiResponse.json();
    console.log('✅ API successful');
    
    // Step 3: Analyze response
    console.log('\n📊 API RESPONSE ANALYSIS');
    console.log('========================');
    console.log('Available Fields:', data.availableFields ? data.availableFields.length : 'undefined');
    console.log('Available Complexes:', data.availableComplexes ? data.availableComplexes.length : 'undefined');
    console.log('Age Groups:', data.ageGroups ? data.ageGroups.length : 'undefined');
    console.log('Game Formats:', data.gameFormats ? data.gameFormats.length : 'undefined');
    
    if (data.availableFields && data.availableFields.length > 0) {
      console.log('\n🏟️ FIELDS BREAKDOWN:');
      data.availableFields.forEach(field => {
        console.log(`  - ${field.name} (${field.fieldSize}) at ${field.complexName}`);
      });
    } else {
      console.log('\n❌ NO FIELDS RETURNED - DEBUGGING NEEDED');
    }
    
    console.log('\n📋 FULL API RESPONSE:');
    console.log(JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testTournamentParametersAPI();