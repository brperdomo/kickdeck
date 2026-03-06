
# KickDeck Event Management System

A comprehensive event management system for sports organizations.

## System Overview

This platform helps sports organizations manage events, team registrations, payments, and more. It features a user-friendly interface for administrators to organize tournaments and events, and for teams to register and participate.

## API Documentation

### Team Management API

The following endpoints are available for managing team registrations:

#### Get Teams

```
GET /api/admin/teams
```

Query parameters:
- `eventId`: Filter teams by event ID
- `status`: Filter teams by status (registered, approved, rejected, paid, withdrawn, refunded)
- `search`: Search for teams by name, manager email, or submitter email
- `sortBy`: Sort teams by 'createdAt' or 'name'
- `sortOrder`: 'asc' or 'desc'

#### Get Team by ID

```
GET /api/admin/teams/:teamId
```

Returns detailed information about a specific team registration.

#### Update Team Status

```
PUT /api/admin/teams/:teamId/status
```

Updates a team's status. Supports both PUT and PATCH HTTP methods.

Request body:
```json
{
  "status": "approved",
  "notes": "Optional notes about the status change"
}
```

Valid status values:
- `registered`: Initial status when a team submits registration
- `approved`: Team registration has been approved by administrators
- `rejected`: Team registration has been rejected by administrators
- `paid`: Team has paid their registration fees
- `withdrawn`: Team has withdrawn from the event
- `refunded`: Team has been refunded their registration fees

Response format:
```json
{
  "status": "success",
  "message": "Team status updated to approved",
  "team": {
    "id": 123,
    "name": "Team Name",
    "status": "approved",
    "...": "Other team properties"
  },
  "notification": {
    "status": "sent",
    "recipients": ["manager@example.com", "submitter@example.com"],
    "message": "Email notification sent successfully"
  }
}
```

#### Process Refund

```
POST /api/admin/teams/:teamId/refund
```

Processes a refund for a team that has already paid.

Request body:
```json
{
  "reason": "Optional reason for the refund"
}
```

Response format:
```json
{
  "status": "success",
  "message": "Refund processed successfully",
  "team": {
    "id": 123,
    "name": "Team Name",
    "status": "refunded",
    "...": "Other team properties"
  },
  "refund": {
    "id": "refund_id_from_stripe",
    "stripeStatus": "success",
    "amount": "150.00",
    "date": "2025-03-29T12:00:00.000Z"
  },
  "notification": {
    "status": "sent",
    "message": "Email notification sent successfully"
  }
}
```

## Development

### Testing

Several test scripts are available to verify the functionality of the API:

- `test-team-registration.js`: Tests the team registration flow
- `test-team-status-flow.js`: Tests the team status update and refund flows
- `test-payment-flow.js`: Tests the payment processing flow

Run these scripts using Node.js:

```
node test-team-status-flow.js
```

## License

This software is proprietary and subject to the following terms:

1. This software is not for resale or redistribution except by the original author.
2. The software may be resold with customer-specific branding only upon explicit approval from the original author.
3. All rights reserved.

Copyright (c) 2024 KickDeck

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## Third-Party Licenses

This project uses several third-party packages under their respective licenses. See `package.json` for a complete list of dependencies.
