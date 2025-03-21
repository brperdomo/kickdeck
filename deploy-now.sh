#!/bin/bash
# Simple deployment script that runs the fixed deployment process

echo "====================================================="
echo "MatchPro Deployment Script"
echo "This will prepare your app for deployment on Replit"
echo "====================================================="

# Run the fixed deployment script
./deploy-fixed.sh

echo "====================================================="
echo "✅ Deployment preparation complete!"
echo "====================================================="
echo "Now you need to:"
echo "1. Click the 'Deploy' button in the Replit interface"
echo "2. The application will use server/index.cjs as the entry point"
echo "3. All required files have been created in the correct locations"
echo "====================================================="
echo ""
echo "After successful deployment, you can verify with:"
echo "node verify-deployment.js https://your-replit-url.repl.co"
echo "====================================================="