#!/bin/bash

# Easy payment fix script for ELI7E FC G-2013 Select (Team 998)
echo "🔧 Fixing payment for Team 998..."

# Step 1: Login as admin
echo "Step 1: Logging in..."
curl -X POST http://localhost:5000/login \
  -H "Content-Type: application/json" \
  -d '{"email": "bperdomo@zoho.com", "password": "Bella2024!"}' \
  --cookie-jar /tmp/cookies.txt \
  -s > /dev/null

if [ $? -eq 0 ]; then
  echo "✅ Login successful"
else 
  echo "❌ Login failed"
  exit 1
fi

# Step 2: Fix the payment
echo "Step 2: Fixing payment for Team 998..."
response=$(curl -X POST http://localhost:5000/api/admin/teams/998/fix-payment \
  -H "Content-Type: application/json" \
  -d '{}' \
  --cookie /tmp/cookies.txt \
  -s)

echo "Response:"
echo "$response" | jq '.' 2>/dev/null || echo "$response"

# Check if successful
if echo "$response" | grep -q '"success": true'; then
  echo "🎉 Payment fixed successfully!"
else
  echo "❌ Payment fix failed"
fi