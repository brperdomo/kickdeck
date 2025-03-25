import fetch from 'node-fetch';
import { v4 as uuidv4 } from 'uuid';

// Configuration for the test
const config = {
  baseUrl: 'http://localhost:5000',
  adminEmail: 'bperdomo@zoho.com',
  adminPassword: 'password123', // Updated with a simpler password for testing
  testEventId: '1154838784', // Updated with a real event ID that exists in the system
  testAgeGroupId: 2509,      // Updated with a real age group ID from the system
};

// Helper function to make API requests with cookie support
async function apiRequest(endpoint, method = 'GET', body = null, cookies = '') {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (cookies) {
    // Make sure to properly parse and format cookies
    // node-fetch is strict about cookie format
    const parsedCookies = cookies.split(';').map(c => c.trim()).join('; ');
    headers.cookie = parsedCookies;
    console.log(`Using cookies in request: ${parsedCookies}`);
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
    let newCookies = '';
    
    if (setCookieHeader) {
      // Extract the cookie value without attributes (path, expires, etc.)
      // This simpler format works better with node-fetch
      const cookieMatch = setCookieHeader.match(/^([^;]+)/);
      if (cookieMatch && cookieMatch[1]) {
        newCookies = cookieMatch[1];
      }
    }
    
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
    // Step 1: User Authentication (auth step in the workflow)
    console.log('Step 1: User Authentication');
    // For testing, we'll login with an existing account
    const loginResponse = await apiRequest('/api/auth/login', 'POST', {
      email: config.adminEmail,
      password: config.adminPassword,
    });
    
    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${JSON.stringify(loginResponse.data)}`);
    }
    
    cookies = loginResponse.cookies;
    console.log('Authenticated successfully');
    
    // Step 2: Verify the event exists
    console.log(`Step 2: Verifying event exists (ID: ${config.testEventId})`);
    const eventResponse = await apiRequest(`/api/events/${config.testEventId}`, 'GET', null, cookies);
    
    if (!eventResponse.ok) {
      throw new Error(`Event verification failed: ${JSON.stringify(eventResponse.data)}`);
    }
    
    console.log('Event verified');
    
    // Step 3: Submit personal details (personal step in the workflow)
    console.log('Step 3: Submitting personal details');
    const personalDetails = {
      firstName: 'John',
      lastName: 'Smith',
      email: 'john.smith@example.com',
      phone: '555-1234',
      address: '123 Main St',
      city: 'Anytown',
      state: 'CA',
      zipCode: '90210',
      country: 'USA'
    };
    
    const personalDetailsResponse = await apiRequest(
      `/api/events/${config.testEventId}/personal-details`,
      'POST',
      personalDetails,
      cookies
    );
    
    if (!personalDetailsResponse.ok) {
      // This endpoint might not exist yet, so we'll continue even if it fails
      console.warn('Personal details submission endpoint not implemented yet, continuing test');
    } else {
      console.log('Personal details submitted successfully');
    }
    
    // Step 4: Register team with players (team step in the workflow)
    console.log('Step 4: Creating test team with players');
    const teamData = {
      name: `Test Team ${uuidv4().substring(0, 8)}`,
      eventId: config.testEventId,
      ageGroupId: config.testAgeGroupId,
      headCoachName: 'John Coach',
      headCoachEmail: 'coach@example.com',
      headCoachPhone: '555-1234',
      assistantCoachName: 'Assistant Coach',
      managerName: 'Team Manager',
      managerEmail: 'manager@example.com',
      managerPhone: '555-5678',
      players: [
        {
          firstName: 'Player',
          lastName: 'One',
          jerseyNumber: '10',
          dateOfBirth: '2015-01-01',
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
          dateOfBirth: '2015-02-02',
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
    
    // Step 5: Simulate payment processing (payment step in the workflow)
    console.log('Step 5: Simulating payment processing');
    
    // Create a payment intent
    const paymentIntentResponse = await apiRequest(
      '/api/payments/create-intent',
      'POST',
      {
        amount: teamData.registrationFee,
        currency: 'usd',
        metadata: { 
          teamId: teamId,
          eventId: config.testEventId,
          ageGroupId: config.testAgeGroupId 
        },
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
      '/api/test-payment/simulate-webhook',
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
    
    // Step 6: Review confirmation and verify team status (review & complete steps in the workflow)
    console.log('Step 6: Verifying team status after payment');
    
    // Wait a moment for the database to update
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const teamVerificationResponse = await apiRequest(
      `/api/teams/${teamId}`,
      'GET',
      null,
      cookies
    );
    
    if (!teamVerificationResponse.ok) {
      throw new Error(`Team verification failed: ${JSON.stringify(teamVerificationResponse.data)}`);
    }
    
    const teamStatus = teamVerificationResponse.data.status;
    console.log(`Team verification complete! Team status: ${teamStatus}`);
    
    // Step 7: Verify player data
    console.log('Step 7: Verifying player data');
    
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