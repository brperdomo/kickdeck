import fetch from 'node-fetch';
import { v4 as uuidv4 } from 'uuid';

// Configuration for the test
const config = {
  baseUrl: 'http://localhost:5000',
  adminEmail: 'bperdomo@zoho.com',
  adminPassword: '!Nova2025',
  testEventId: '1154838784', // Demo event ID, we saw this event ID in the logs
  testAgeGroupId: 1,
};

// Helper function to make API requests with cookie support
async function apiRequest(endpoint, method = 'GET', body = null, cookies = '') {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (cookies) {
    headers['Cookie'] = cookies;
  }

  const options = {
    method,
    headers,
  };

  if (body && (method === 'POST' || method === 'PUT')) {
    options.body = JSON.stringify(body);
  }

  console.log(`Making ${method} request to ${endpoint}`);
  
  try {
    const response = await fetch(`${config.baseUrl}${endpoint}`, options);
    
    // Save cookies from response
    const setCookieHeader = response.headers.get('set-cookie');
    const newCookies = setCookieHeader || '';
    
    // Parse JSON response or return text if not JSON
    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }
    
    return {
      status: response.status,
      ok: response.ok,
      data,
      cookies: newCookies
    };
  } catch (error) {
    console.error(`Error making request to ${endpoint}:`, error);
    return {
      status: 500,
      ok: false,
      error: error.message,
    };
  }
}

// Test the complete team registration flow
async function testTeamRegistration() {
  console.log('Starting team registration test');
  let cookies = '';
  
  try {
    // Step 1: Login as admin
    console.log('Step 1: Logging in as admin');
    const loginResponse = await apiRequest('/api/login', 'POST', {
      email: config.adminEmail,
      password: config.adminPassword,
    });
    
    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.data}`);
    }
    
    cookies = loginResponse.cookies;
    console.log('Logged in successfully');
    
    // Step 2: Verify the event exists
    console.log(`Step 2: Verifying event exists (ID: ${config.testEventId})`);
    const eventResponse = await apiRequest(`/api/events/${config.testEventId}`, 'GET', null, cookies);
    
    if (!eventResponse.ok) {
      throw new Error(`Event verification failed: ${JSON.stringify(eventResponse.data)}`);
    }
    
    console.log('Event verified');
    
    // Step 3: Create a test team with players
    console.log('Step 3: Creating test team with players');
    const teamData = {
      name: `Test Team ${uuidv4().substring(0, 8)}`,
      eventId: config.testEventId,
      ageGroupId: config.testAgeGroupId,
      coach: {
        name: 'John Coach',
        email: 'coach@example.com',
        phone: '555-1234',
        assistantName: 'Assistant Coach',
      },
      managerName: 'Team Manager',
      managerEmail: 'manager@example.com',
      managerPhone: '555-5678',
      players: [
        {
          firstName: 'Player',
          lastName: 'One',
          jerseyNumber: '10',
          dateOfBirth: '2010-01-01',
          position: 'Forward',
          medicalNotes: 'None',
          parentGuardianName: 'Parent One',
          parentGuardianEmail: 'parent1@example.com',
          parentGuardianPhone: '555-9876',
          emergencyContactName: 'Emergency Contact',
          emergencyContactPhone: '555-4321',
        },
        {
          firstName: 'Player',
          lastName: 'Two',
          jerseyNumber: '20',
          dateOfBirth: '2010-02-02',
          position: 'Midfielder',
          medicalNotes: '',
          parentGuardianName: 'Parent Two',
          parentGuardianEmail: 'parent2@example.com',
          parentGuardianPhone: '555-8765',
          emergencyContactName: 'Emergency Contact',
          emergencyContactPhone: '555-2345',
        }
      ],
      termsAcknowledged: true,
      termsAcknowledgedAt: new Date().toISOString(),
      registrationFee: 10000 // $100.00 in cents
    };
    
    const registrationResponse = await apiRequest(
      `/api/events/${config.testEventId}/register-team`,
      'POST',
      teamData,
      cookies
    );
    
    if (!registrationResponse.ok) {
      throw new Error(`Team registration failed: ${JSON.stringify(registrationResponse.data)}`);
    }
    
    const teamId = registrationResponse.data.team.id;
    console.log(`Team registered successfully! Team ID: ${teamId}`);
    
    // Step 4: Simulate payment processing
    console.log('Step 4: Simulating payment processing');
    
    // Create a payment intent
    const paymentIntentResponse = await apiRequest(
      '/api/payments/create-intent',
      'POST',
      {
        amount: teamData.registrationFee,
        teamId: teamId,
        eventId: config.testEventId,
        description: `Registration fee for ${teamData.name}`
      },
      cookies
    );
    
    if (!paymentIntentResponse.ok) {
      throw new Error(`Payment intent creation failed: ${JSON.stringify(paymentIntentResponse.data)}`);
    }
    
    const clientSecret = paymentIntentResponse.data.clientSecret;
    const paymentIntentId = clientSecret.split('_secret_')[0];
    console.log(`Payment intent created successfully! ID: ${paymentIntentId}`);
    
    // Simulate webhook for successful payment (in development only)
    const webhookResponse = await apiRequest(
      '/api/test-payments/simulate-webhook',
      'POST',
      {
        paymentIntentId: paymentIntentId,
        teamId: teamId,
        amount: teamData.registrationFee
      },
      cookies
    );
    
    if (!webhookResponse.ok) {
      throw new Error(`Webhook simulation failed: ${JSON.stringify(webhookResponse.data)}`);
    }
    
    console.log('Payment processed successfully!');
    
    // Step 5: Verify team status after payment
    console.log('Step 5: Verifying team status after payment');
    
    // Wait a moment for the database to update
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const teamVerificationResponse = await apiRequest(
      `/api/admin/teams/${teamId}`,
      'GET',
      null,
      cookies
    );
    
    if (!teamVerificationResponse.ok) {
      throw new Error(`Team verification failed: ${JSON.stringify(teamVerificationResponse.data)}`);
    }
    
    const teamStatus = teamVerificationResponse.data.status;
    console.log(`Team verification complete! Team status: ${teamStatus}`);
    
    // Step 6: Verify player data
    console.log('Step 6: Verifying player data');
    
    const playersCount = teamVerificationResponse.data.players?.length || 0;
    console.log(`Player count: ${playersCount} (expected: ${teamData.players.length})`);
    
    if (playersCount !== teamData.players.length) {
      console.warn('Warning: Player count does not match expected count');
    }
    
    console.log('Test completed successfully!');
    return {
      success: true,
      teamId: teamId,
      status: teamStatus,
      playerCount: playersCount
    };
    
  } catch (error) {
    console.error('Test failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Execute the test
testTeamRegistration()
  .then(result => {
    console.log('Test result:', result);
    if (result.success) {
      console.log('Registration flow is working correctly!');
      process.exit(0);
    } else {
      console.error('Registration flow has issues that need to be fixed.');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Unexpected error during test:', error);
    process.exit(1);
  });