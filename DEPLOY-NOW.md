# MatchPro Soccer Management Platform Deployment Guide

This guide provides step-by-step instructions for deploying the MatchPro application to Replit's production environment.

## Understanding the Deployment Challenge

The primary challenge with deploying this application on Replit is the module format conflict:

- The application is built with ESM modules (`"type": "module"` in package.json)
- Replit's production environment prefers CommonJS modules

To address this, we've created a "dual-mode" server that automatically detects the proper module format and adapts accordingly.

## Quick Deployment

For the fastest deployment:

1. Run the included deployment script:
   ```bash
   ./deploy-now.sh
   ```
   
2. After the script completes, click the **Deploy** button in the Replit interface.

3. Your application will be available at your .replit.app domain.

## Manual Deployment Steps

If you prefer to manually control the deployment process, follow these steps:

### 1. Setup Dual-Mode Deployment

```bash
node deploy-dual-mode.cjs
```

This script:
- Creates a fallback index.html file
- Configures the .replit file for production deployment
- Makes the deployment server executable

### 2. Build the Application

```bash
npm run build
```

This builds your frontend assets and server code.

### 3. Copy Deployment Files

```bash
cp deploy-dual-mode-server.js dist/
cp -f index.html dist/
```

This ensures the deployment server is included in the distribution folder.

### 4. Deploy to Production

Click the **Deploy** button in the Replit interface.

## How It Works

The dual-mode server (`deploy-dual-mode-server.js`) handles:

1. **Module format detection**: Automatically determines if ESM or CommonJS should be used
2. **Static file serving**: Serves your frontend assets from dist/public
3. **API routing**: Handles API requests by:
   - Attempting to use compiled server code from dist/server
   - Proxying to a locally running development server if available
   - Providing fallback implementations for critical endpoints (login, user)

## Troubleshooting

### Deployment Status Check

After deployment, visit `/deployment-status` on your application domain to see diagnostic information.

### Common Issues

#### "Cannot POST /api/login" or API 404 errors

The API proxy may not be set up correctly. Check that:
- http-proxy is installed (`npm install http-proxy`)
- The dual-mode server is being used as the entrypoint
- LOCAL_SERVER_PORT environment variable is set if you're using a local API server

#### Only "OK" text shown

This means the health check is working but the static files are not being served properly. Check that:
- The application was properly built with `npm run build`
- The dist/public directory contains your frontend assets
- The dist directory contains deploy-dual-mode-server.js

#### Database Connection Errors

Make sure you've configured your database connection strings properly:
- For development: Local PostgreSQL instance
- For production: Use the DATABASE_URL environment variable provided by Replit

## Advanced Deployment Options

### Environment Variables

Set these environment variables before deployment if needed:

- `NODE_ENV`: Set to "production" for production mode
- `LOCAL_SERVER_PORT`: If using a separate API server, set this to its port

### Custom Domain

To use a custom domain:
1. Configure your domain in the Replit dashboard
2. Add domain verification via DNS records
3. Set up HTTPS certificates (handled automatically by Replit)

## Maintenance

### Server Updates

If you update the server code:
1. Rebuild the application with `npm run build`
2. Re-copy the deployment server: `cp deploy-dual-mode-server.js dist/`
3. Re-deploy using the Replit interface

### Client Updates

If you only update frontend code:
1. Rebuild with `npm run build`
2. Re-deploy using the Replit interface

## Need Help?

If you encounter any issues not covered here, check:
- Replit's deployment logs
- Server logs in the Replit console
- The `/deployment-status` endpoint for diagnostics

For persistent issues, consider:
- Rebuilding from scratch with `npm run build`
- Updating the http-proxy dependency
- Checking for any Replit platform updates