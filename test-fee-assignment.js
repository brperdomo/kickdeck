// Simple test script to verify that fee assignments are working

async function main() {
  try {
    console.log('Testing fee assignment endpoints:');
    
    // 1. First, let's log in to get a session cookie
    console.log('\n1. Logging in...');
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'password123',
      }),
      credentials: 'include',
    });
    
    if (!loginResponse.ok) {
      console.error(`Login failed: ${loginResponse.status}`);
      return;
    }
    
    console.log('Login successful!');
    
    // 2. Check user status to confirm we're logged in
    console.log('\n2. Checking user status...');
    const userResponse = await fetch('http://localhost:5000/api/user', {
      credentials: 'include',
    });
    
    if (!userResponse.ok) {
      console.error(`User check failed: ${userResponse.status}`);
      return;
    }
    
    const user = await userResponse.json();
    console.log('Logged in as:', user);
    
    // 3. Create a test event
    console.log('\n3. Creating a test event...');
    const eventData = {
      name: 'Test Event for Fee Assignments',
      startDate: '2025-08-01',
      endDate: '2025-08-05',
      applicationDeadline: '2025-07-15',
      timezone: 'America/New_York',
      details: 'This is a test event',
      ageGroups: [
        {
          ageGroup: 'U10',
          gender: 'Boys',
          birthYear: 2015,
          fieldSize: '7v7',
          projectedTeams: 8
        },
        {
          ageGroup: 'U12',
          gender: 'Girls',
          birthYear: 2013,
          fieldSize: '9v9',
          projectedTeams: 6
        }
      ]
    };
    
    const createEventResponse = await fetch('http://localhost:5000/api/admin/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventData),
      credentials: 'include',
    });
    
    if (!createEventResponse.ok) {
      console.error(`Event creation failed: ${createEventResponse.status}`);
      return;
    }
    
    const event = await createEventResponse.json();
    console.log('Created event:', event);
    const eventId = event.id;
    
    // 4. Create a test fee
    console.log('\n4. Creating a test fee...');
    const feeData = {
      name: 'Early Registration Fee',
      amount: 450,
      beginDate: '2025-05-01',
      endDate: '2025-06-15',
      eventId: eventId
    };
    
    const createFeeResponse = await fetch(`http://localhost:5000/api/admin/events/${eventId}/fees`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(feeData),
      credentials: 'include',
    });
    
    if (!createFeeResponse.ok) {
      console.error(`Fee creation failed: ${createFeeResponse.status}`);
      return;
    }
    
    const fee = await createFeeResponse.json();
    console.log('Created fee:', fee);
    const feeId = fee.id;
    
    // 5. Get age groups for the event
    console.log('\n5. Getting age groups...');
    const ageGroupsResponse = await fetch(`http://localhost:5000/api/admin/age-groups?eventId=${eventId}`, {
      credentials: 'include',
    });
    
    if (!ageGroupsResponse.ok) {
      console.error(`Age groups retrieval failed: ${ageGroupsResponse.status}`);
      return;
    }
    
    const ageGroups = await ageGroupsResponse.json();
    console.log('Age groups:', ageGroups);
    
    // Select the first age group for our test
    const ageGroupId = ageGroups[0].id;
    
    // 6. Assign fee to age group
    console.log('\n6. Assigning fee to age group...');
    const assignmentData = {
      feeId: feeId,
      ageGroupIds: [ageGroupId]
    };
    
    const assignResponse = await fetch(`http://localhost:5000/api/admin/events/${eventId}/fee-assignments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(assignmentData),
      credentials: 'include',
    });
    
    if (!assignResponse.ok) {
      console.error(`Fee assignment failed: ${assignResponse.status}`);
      return;
    }
    
    const assignment = await assignResponse.json();
    console.log('Created fee assignment:', assignment);
    
    // 7. Get fee assignments to verify
    console.log('\n7. Getting fee assignments...');
    const getAssignmentsResponse = await fetch(`http://localhost:5000/api/admin/events/${eventId}/fee-assignments`, {
      credentials: 'include',
    });
    
    if (!getAssignmentsResponse.ok) {
      console.error(`Fee assignments retrieval failed: ${getAssignmentsResponse.status}`);
      return;
    }
    
    const assignments = await getAssignmentsResponse.json();
    console.log('Fee assignments:', assignments);
    
    // Done!
    console.log('\nTest completed successfully!');
  } catch (error) {
    console.error('Error during test:', error);
  }
}

main();