#!/bin/bash

# Run the server-only deployment script for quicker testing
echo "Starting server-only deployment process..."

# Make sure the script is executable
chmod +x deploy-server-only.js

# Run the deployment script with Node in ESM mode
NODE_OPTIONS="--experimental-modules" node deploy-server-only.js

# Check if the deployment was successful
if [ $? -eq 0 ]; then
  echo "✅ Server-only deployment completed successfully!"
  echo "You can now test the server API endpoints. Note: No frontend files were built in this mode."
else
  echo "❌ Deployment failed. Please check the error messages above."
  exit 1
fi