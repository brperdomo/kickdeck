# Deployment Guide for Replit

This guide outlines the deployment process for the Soccer Tournament Management application on Replit.

## Deployment Solutions

We've created multiple deployment solutions to address different needs:

1. **Full Deployment (`deploy-replit.sh`)**: Builds both frontend and backend for complete application deployment
2. **Server-Only Deployment (`deploy-server-only.sh`)**: Faster deployment focusing only on backend API functionality
3. **Run Production Server (`run-prod-server.sh`)**: Quick script to test the production build locally

## Understanding the Replit Bridge Solution

The deployment solution uses a "bridge" approach to address Replit's unique requirements:

- Replit's deployment configuration expects the entry point at `server/index.js`
- Our build system outputs production files to the `dist/` directory
- The bridge file redirects from the expected location to our actual build output

## Deployment Steps

### Option 1: Full Deployment

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

### Testing Production Build Locally

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

- `server/index.js`: Bridge file that Replit executes in production
- `dist/index.js`: Actual production entry point (imported by the bridge)
- `dist/server/prod-server.js`: Production server logic
- `dist/public/`: Static frontend files

### Environment Variables

- `NODE_ENV`: Set to "production" automatically by deployment scripts
- `DATABASE_URL`: Must be set in Replit environment for database connectivity

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
   - Verify static file serving is properly configured

### Logs and Debugging

For debugging deployment issues:

```bash
# View logs from the bridge redirection
cat bridge.log

# View server logs
cat server.log
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