#!/bin/bash

# Run the improved ESM deployment script
echo "Starting ESM deployment process..."

# Make sure the script is executable
chmod +x deploy-esm.js

# Run the deployment script with Node in ESM mode
NODE_OPTIONS="--experimental-modules" node deploy-esm.js

# Check if the deployment was successful
if [ $? -eq 0 ]; then
  echo "✅ Deployment completed successfully!"
  echo "You can now deploy your application on Replit."
else
  echo "❌ Deployment failed. Please check the error messages above."
  exit 1
fi