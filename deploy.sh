#!/bin/bash
# Simple deployment script for Replit

echo "Starting deployment process..."

# Run the Node.js deployment script
node deploy.cjs

# Check if the deployment was successful
if [ $? -eq 0 ]; then
  echo "Deployment preparation completed successfully."
  echo "The application is ready to be deployed on Replit."
  echo ""
  echo "Files prepared:"
  echo "  - server/index.cjs: Main server entry point (CommonJS format)"
  echo "  - server/public → dist/public: Static assets (symlink)"
  echo ""
  echo "To deploy, use the Replit interface to Deploy this repl."
else
  echo "Deployment preparation failed."
  exit 1
fi