#!/bin/bash

# Run the improved ESM deployment script with proper ES module handling
echo "Starting improved ESM deployment process..."

# Make sure the script is executable
chmod +x deploy-esm-improved.js

# Run the deployment script with Node in ESM mode
NODE_OPTIONS="--experimental-modules" node deploy-esm-improved.js

# Check if the deployment was successful
if [ $? -eq 0 ]; then
  echo "✅ Improved ESM deployment completed successfully!"
  echo "You can now deploy your application on Replit."
else
  echo "❌ Deployment failed. Please check the error messages above."
  exit 1
fi