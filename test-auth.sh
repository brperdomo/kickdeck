#!/bin/bash

# Test admin login and get session cookie
echo "Testing admin authentication..."

# First, try to login as admin
LOGIN_RESPONSE=$(curl -s -c /tmp/admin_cookies.txt -X POST "http://localhost:5000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@matchpro.ai", "password": "admin123"}')

echo "Login response: $LOGIN_RESPONSE"

# Now test the schedule-calendar endpoint with cookies
echo "Testing schedule-calendar endpoint with authentication..."
SCHEDULE_RESPONSE=$(curl -s -b /tmp/admin_cookies.txt "http://localhost:5000/api/admin/events/1656618593/schedule-calendar")

echo "Schedule response: $SCHEDULE_RESPONSE" | jq '.'

# Clean up
rm -f /tmp/admin_cookies.txt