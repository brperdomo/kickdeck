# Deployment Guide for Replit

This guide outlines the deployment process for the Soccer Tournament Management application on Replit, with a focus on solving the ES Module compatibility issues.

## Module Compatibility Solution

This deployment system resolves the critical module format conflict between:
- Development using modern ES Modules (package.json "type": "module")
- Replit's production environment requirements for CommonJS compatibility

Our solution maintains ES Module syntax while ensuring deployment compatibility through:
- Proper ES Module exports and dynamic imports
- Module-compatible bridge scripts
- Correct file extension handling
- CommonJS/ESM interoperability layers

## Deployment Solutions

We've created multiple deployment solutions to address different needs:

1. **Full Deployment (`deploy-replit.sh`)**: Builds both frontend and backend for complete application deployment
2. **Server-Only Deployment (`deploy-server-only.sh`)**: Faster deployment focusing only on backend API functionality
3. **Replit Starter (`start-replit.sh`)**: Optimized script for launching in Replit's environment
4. **Run Production Server (`run-prod-server.sh`)**: Quick script to test the production build locally

## Enhanced Resilience Features

The deployment solution includes enhanced fallback mechanisms for improved reliability:

- **Static File Detection**: Automatically detects and serves the frontend build when available
- **Layered Fallbacks**: Multiple levels of error recovery to prevent "white screen" issues
- **Intelligent Error Handling**: Detailed diagnostics for quicker troubleshooting
- **SPA Routing Support**: Proper client-side routing even in fallback mode
- **API Health Endpoint**: Always-available `/api/health` endpoint for status checks

## Understanding the Replit Bridge Solution

The deployment solution uses a "bridge" approach to address Replit's unique requirements:

- Replit's deployment configuration expects the entry point at `server/index.js`
- Our build system outputs production files to the `dist/` directory
- The bridge file redirects from the expected location to our actual build output

## Deployment Steps

### Option 1: Full Deployment (Recommended)

```bash
# Make the script executable if needed
chmod +x deploy-replit.sh

# Run the full deployment script
./deploy-replit.sh
```

This will:
- Build the backend server with ESBuild
- Build the frontend with Vite
- Create the bridge files for Replit compatibility
- Set up proper file paths and imports

### Option 2: Server-Only Deployment (Faster)

```bash
# Make the script executable if needed
chmod +x deploy-server-only.sh

# Run the server-only deployment script
./deploy-server-only.sh
```

This will:
- Build only the backend server (skipping the frontend build)
- Create a minimal placeholder frontend
- Set up the bridge for Replit compatibility

### Option 3: Starting on Replit (Recommended for Deployment)

```bash
# Make the script executable if needed
chmod +x start-replit.sh

# Run the Replit starter script
./start-replit.sh
```

This will:
- Verify deployment files exist (and run server-only deployment if needed)
- Set the proper production environment variables
- Start the server with the correct configuration for Replit

### Option 4: Testing Production Build Locally

```bash
# Make the script executable if needed
chmod +x run-prod-server.sh

# Run the production server
./run-prod-server.sh
```

## Technical Details

### Module Compatibility

The application uses ES Modules (ESM) in development, but Replit's production environment requires special handling:

- All import paths in production need explicit `.js` extensions
- Path aliases (like `@db/schema`) are replaced with relative paths
- Dynamic imports are used to maintain ESM compatibility

### File Structure

**Entry Points:**
- `start-replit.sh`: Primary launcher for Replit deployment (verifies and deploys if needed)
- `server/index.js`: Bridge file that Replit executes in production
- `server/replit-bridge.js`: ES Module compatibility layer with advanced error recovery

**Build Output:**
- `dist/index.js`: Actual production entry point (imported by the bridge)
- `dist/server/prod-server.js`: Production server logic
- `dist/public/`: Static frontend files served by Express

**Deployment Scripts:**
- `deploy-replit.sh`: Full deployment script (frontend + backend)
- `deploy-server-only.sh`: Backend-only deployment (faster)
- `run-prod-server.sh`: Local production testing

### Recovery Mechanism

The deployment includes a multi-layered recovery system:

1. **Primary Path**: Load production server via bridge
2. **Secondary Path**: Direct import of production server if bridge fails
3. **Tertiary Path**: Express server with frontend assets if server initialization fails
4. **Final Fallback**: Basic HTTP server with error information if all else fails

### Environment Variables

- `NODE_ENV`: Set to "production" automatically by deployment scripts
- `DATABASE_URL`: Must be set in Replit environment for database connectivity
- `PORT`: Optional, defaults to 3000 if not specified

## Deployment to Replit

To deploy on Replit:

1. Run the appropriate deployment script (`./deploy-replit.sh` recommended)
2. Start the server with `./start-replit.sh` (this will also deploy if needed)
3. Click the "Run" button in Replit or use their deployment feature
4. The bridge will automatically redirect to the proper production build

For CI/CD or automated deployments, use this sequence:
```bash
# Full deployment (one-time or when frontend changes)
./deploy-replit.sh

# Start server (for subsequent deployments)
./start-replit.sh
```

## Troubleshooting

### Common Issues

1. **Server Error Page**: 
   - Check the error console for detailed error messages
   - Verify database connection string is correctly set
   - Ensure all deployment scripts ran successfully

2. **404 Errors for API Endpoints**:
   - Verify the bridge file is correctly set up
   - Check server logs for routing initialization errors

3. **Static Files Not Loading**:
   - Ensure the frontend build completed successfully
   - Check the logs to see if frontend detection was successful

4. **White Screen with "ok" Text**:
   - This indicates the server is running but static file serving is not configured correctly
   - Make sure the deployment script completed successfully
   - Verify the static file paths in `dist/index.js`

5. **ES Module/CommonJS Conflicts**:
   - Error: `__filename is not defined in ES module scope`
   - Error: `This file is being treated as an ES module because it has a '.js' file extension and package.json contains "type": "module"`
   - Solution: Make sure all server files use proper ES module syntax:
     - Use `import` instead of `require()`
     - Use `export` instead of `module.exports`
     - Replace `__filename`/`__dirname` with `import.meta.url`
     - Use dynamic imports with `await import()` for ES module compatibility

### Logs and Debugging

For debugging deployment issues:

```bash
# View logs from the bridge redirection
cat bridge.log

# View server logs
cat server.log

# Check if frontend build exists
ls -la dist/public/
```

## Maintenance and Updates

When updating the application:

1. Make changes to the development files
2. Run the appropriate deployment script
3. Test the production build locally before deploying to Replit

## Advanced: ESM-specific Fixes

The deployment scripts handle several ESM-specific fixes:

- Converting TypeScript path aliases to JavaScript relative imports
- Adding `.js` extensions to all local imports
- Creating proper ES module structure for the production build
- Handling directory imports by targeting specific index.js files