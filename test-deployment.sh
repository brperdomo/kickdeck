#!/bin/bash
# Test the deployment configuration by running the server with the replit-bridge.cjs

echo "===== TESTING DEPLOYMENT SOLUTION ====="

# Make sure the script is executable
chmod +x deploy-simplified.sh make-executable.sh build-frontend.sh

# Ensure all needed files are in place
echo "Checking if dist folder exists..."
if [ ! -d "dist/public" ]; then
  echo "Running deployment script to create frontend build..."
  ./deploy-simplified.sh
fi

# Kill any running node processes for clean testing
echo "Stopping any running node processes..."
pkill -f node || true
sleep 2

# Start the server using replit-bridge.cjs which tries all entry points
echo "Starting server using replit-bridge.cjs..."
node replit-bridge.cjs &
SERVER_PID=$!

# Wait for the server to start
echo "Waiting for server to start..."
sleep 5

# Test the server is responding
echo "Testing API endpoints..."
curl -s http://localhost:3000/api/health | jq . || echo "Failed to connect to server"
curl -s http://localhost:3000/api/deployment/status | jq . || echo "Failed to fetch deployment status"

# Test frontend is being served
echo "Testing frontend serving..."
curl -s -I http://localhost:3000/ | grep "HTTP" || echo "Failed to fetch frontend"

echo "===== DEPLOYMENT TEST COMPLETED ====="
echo "Server is running with PID: $SERVER_PID"
echo "To stop the server: kill $SERVER_PID"