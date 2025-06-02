#!/bin/bash

# Production Deployment Script
# This script prepares your application for stable production deployment

echo "🚀 Preparing production deployment..."

# 1. Set production environment
echo "📝 Setting production environment..."
export NODE_ENV=production

# 2. Build the frontend
echo "🏗️ Building frontend for production..."
npm run build

# 3. Verify build files exist
if [ -d "dist/public" ] && [ "$(ls -A dist/public)" ]; then
    echo "✅ Production build files created successfully"
else
    echo "❌ Production build failed - check for errors above"
    exit 1
fi

# 4. Create production environment file
echo "📄 Creating production environment configuration..."
cat > .env.production << EOF
NODE_ENV=production
# Add your production environment variables here
# DATABASE_URL=your_production_database_url
# STRIPE_SECRET_KEY=your_production_stripe_key
EOF

echo "🎉 Production deployment preparation complete!"
echo ""
echo "Next steps for deployment:"
echo "1. Copy the built files from 'dist/public' to your production server"
echo "2. Set NODE_ENV=production in your production environment"
echo "3. Ensure your production server uses the production build files"
echo ""
echo "This will eliminate the WebSocket connection issues you're experiencing."