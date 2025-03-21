#!/bin/bash
# Simplified deployment script for MatchPro
set -e

echo "========================================"
echo "        MATCHPRO DEPLOYMENT TOOL"
echo "========================================"
echo "This script will build and prepare the app for deployment"
echo

# Make sure scripts are executable
chmod +x *.sh
echo "✓ Made scripts executable"

# Clean up any old deployment files
echo "Cleaning previous build artifacts..."
rm -rf dist || true
mkdir -p dist
mkdir -p dist/public

# Build the frontend with enhanced error handling
echo
echo "Building frontend..."
./build-frontend.sh

# Verify frontend build succeeded before continuing
if [ ! -f "dist/public/index.html" ]; then
  echo "❌ Frontend build failed!"
  echo "Please check build logs and try again."
  exit 1
fi

# Copy server files to the dist directory
echo
echo "Setting up server files..."

# Copy our entry points (both ES module and CommonJS versions)
cp index.js dist/
cp index.cjs dist/
cp replit.js dist/ 2>/dev/null || true
cp replit.cjs dist/ 2>/dev/null || true
cp replit-bridge.cjs dist/ 2>/dev/null || true

# Create a package.json for deployment 
cat > dist/package.json << EOF
{
  "name": "matchpro-soccer-management",
  "version": "1.0.0",
  "description": "Soccer tournament management platform",
  "main": "index.js",
  "type": "module",
  "scripts": {
    "start": "node index.js"
  },
  "dependencies": {
    "express": "^4.18.2"
  }
}
EOF

echo "✓ Server files copied to dist/"
echo "✓ Created deployment package.json"

# Create a .replit file in the dist directory for automatic configuration
cat > dist/.replit << EOF
run = "node index.js"
hidden = [".config", ".git", ".github", "node_modules"]

[nix]
channel = "stable-23_05"

[deployment]
run = ["node", "index.js"]
deploymentTarget = "cloudrun"
ignorePorts = false
EOF

echo "✓ Created .replit configuration"

# Create a startup script for production
cat > dist/start.sh << EOF
#!/bin/bash
# MatchPro production startup script
echo "Starting MatchPro Soccer Management Platform..."
node index.js
EOF
chmod +x dist/start.sh

echo "✓ Created production startup script"

# Print deployment instructions
echo
echo "========================================"
echo "      DEPLOYMENT INSTRUCTIONS"
echo "========================================"
echo "Deployment files have been prepared in the 'dist' directory."
echo
echo "To deploy on Replit:"
echo "1. Push the 'Deploy' button in the Replit UI"
echo "2. Select the whole dist directory"
echo
echo "Your app should now be accessible at your Replit domain:"
echo "https://<your-repl-name>.<your-username>.repl.co"
echo "========================================"