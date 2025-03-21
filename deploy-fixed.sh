#!/bin/bash

# Run the fixed ESM deployment script
echo "Starting fixed ESM deployment process..."

# Make sure the script is executable
chmod +x deploy-fixed.js

# Run the deployment script with Node in ESM mode
NODE_OPTIONS="--experimental-modules" node deploy-fixed.js

# Check if the deployment was successful
if [ $? -eq 0 ]; then
  echo "✅ Deployment completed successfully!"
  echo "You can now deploy your application on Replit."
else
  echo "❌ Deployment failed. Please check the error messages above."
  exit 1
fi