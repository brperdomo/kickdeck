import fetch from 'node-fetch';

async function apiRequest(endpoint, method = 'GET', body = null) {
  const url = `http://localhost:5000${endpoint}`;
  
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  const data = await response.json();
  
  return { status: response.status, data };
}

async function testPlayerInsertion() {
  console.log("Testing team registration with players...");
  
  // Use the test event and age group IDs
  const eventId = "2079688377"; 
  const ageGroupId = 2572;

  // Create team registration data with players
  const teamData = {
    name: "Test Team Players",
    ageGroupId,
    headCoachName: "Coach Smith",
    headCoachEmail: "coach@example.com",
    headCoachPhone: "123-456-7890",
    assistantCoachName: "Asst Coach Jones",
    managerName: "Manager Brown",
    managerEmail: "manager@example.com",
    managerPhone: "123-456-7891",
    termsAcknowledged: true,
    termsAcknowledgedAt: new Date().toISOString(),
    registrationFee: 15000, // $150.00
    players: [
      {
        firstName: "John",
        lastName: "Doe",
        jerseyNumber: "10",
        dateOfBirth: "2010-01-01",
        position: "Forward",
        medicalNotes: "No allergies",
        parentGuardianName: "Parent Doe",
        parentGuardianEmail: "parent@example.com",
        parentGuardianPhone: "123-456-7892",
        emergencyContactName: "Emergency Contact",
        emergencyContactPhone: "123-456-7893"
      },
      {
        firstName: "Jane",
        lastName: "Smith",
        jerseyNumber: "7",
        dateOfBirth: "2010-02-15",
        position: "Midfielder",
        medicalNotes: "No allergies",
        parentGuardianName: "Parent Smith",
        parentGuardianEmail: "parent2@example.com",
        parentGuardianPhone: "123-456-7894",
        emergencyContactName: "Emergency Contact 2",
        emergencyContactPhone: "123-456-7895"
      }
    ]
  };

  try {
    // Register the team
    console.log("Registering team...");
    const registerResponse = await apiRequest(
      `/api/events/${eventId}/register-team`,
      'POST',
      teamData
    );
    
    console.log(`Team registration status: ${registerResponse.status}`);
    console.log("Registration response:", JSON.stringify(registerResponse.data, null, 2));
    
    if (registerResponse.status === 201) {
      const teamId = registerResponse.data.team.id;
      
      // Verify the team exists with players
      console.log(`\nVerifying team with ID ${teamId}...`);
      const teamResponse = await apiRequest(`/api/admin/teams/${teamId}`, 'GET');
      
      console.log(`Team fetch status: ${teamResponse.status}`);
      console.log("Team data:", JSON.stringify(teamResponse.data, null, 2));
      
      if (teamResponse.data.players) {
        console.log(`\nPlayer count: ${teamResponse.data.players.length}`);
        console.log("Players:", JSON.stringify(teamResponse.data.players, null, 2));
      } else {
        console.error("No players found in the team response");
      }
    }
  } catch (error) {
    console.error("Error during test:", error);
  }
}

// Run the test
testPlayerInsertion().catch(err => console.error('Test failed with error:', err));