# KickDeck Registration Process Test Scripts

This directory contains a set of test scripts designed to validate the complete registration process for the KickDeck application. These scripts simulate user actions from authentication to team registration and payment processing.

## Available Scripts

1. **Complete Registration Flow (`test-registration-flow.js`)**
   - Simulates the entire user journey from registration to team creation and payment
   - Provides a high-level overview of the system functionality

2. **Team Registration Process (`test-team-registration.js`)**
   - Focuses specifically on the team registration workflow
   - Includes detailed validation and error handling
   - Allows specifying an event ID as a command-line parameter

3. **Authentication Flow (`test-auth-flow.js`)**
   - Tests the user authentication system including registration, login, and logout
   - Simulates password reset flow
   - Creates unique test users with each run

## Prerequisites

- Node.js installed
- KickDeck application running locally on port 5000
- Required npm packages: `node-fetch`

## How to Run

Make sure the application is running locally, then execute any of the scripts using Node:

```bash
# Complete registration flow
node test-registration-flow.js

# Team registration for a specific event
node test-team-registration.js <event_id>

# Authentication flow
node test-auth-flow.js
```

## Common Issues and Troubleshooting

1. **Authentication Errors**
   - If you encounter "User already exists" errors, the test scripts create unique usernames with each run
   - Cookie issues can be resolved by deleting the cookie files that are created

2. **Event ID Required**
   - The team registration script requires a valid event ID
   - If no event ID is provided, it will use a default ID from the logs

3. **Payment Processing**
   - Payment simulation requires the payment endpoints to be properly configured
   - The scripts use a test webhook to simulate successful payments

## Modifying Test Data

You can customize the test data by modifying the user and team information constants at the top of each script:

- `TEST_USER` - Contains user registration details
- `TEAM_DATA` / `createTeamData()` - Contains team registration details

## Test Output

Each script provides detailed logging of the test process, indicating:
- API calls being made
- Response status codes
- Success or failure of each step
- Authentication status throughout the flow

For successful test runs, you should see a "COMPLETED SUCCESSFULLY" message at the end of execution.