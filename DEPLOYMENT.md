# MatchPro Deployment Guide

This document provides instructions for deploying the MatchPro Soccer Management application on Replit.

## Background

The application uses a mixed module format:
- Development mode uses ES modules (type="module" in package.json)
- Production deployment requires ESM compatibility

## Deployment Steps

Follow these steps to deploy the application:

1. **Prepare Deployment Files**:
   ```bash
   ./deploy-replit.sh
   ```
   This script creates the necessary structure in the `dist` directory.

2. **Deploy on Replit**:
   - Click the "Deploy" button in your Replit interface
   - The deployment will use the prepared files in the `dist` directory

## Deployment Configuration

The deployment is configured to:
- Serve static files from `dist/public`
- Use ESM-compatible server code
- Start the server on the port specified by `PORT` environment variable

## Troubleshooting

If you encounter issues during deployment:

1. **Module Format Errors**:
   - If you see errors about `require` not being defined in ESM, the ESM bridge may not be properly set up.
   - Run `./deploy-replit.sh` again to recreate the ESM deployment structure.

2. **Database Connectivity**:
   - Ensure the `DATABASE_URL` environment variable is properly set.
   - Check the database connectivity by accessing the `/api/health` endpoint.

3. **Static Files Not Found**:
   - Make sure the `dist/public` directory contains the necessary static assets.
   - If files are missing, you may need to run a full build process before deployment.

## Manual Testing

To test the production server locally before deployment:

```bash
NODE_ENV=production node dist/index.js
```

This will start the server in production mode using the deployment files.

## Additional Notes

- The deployment uses a simplified server configuration that focuses on serving static files and basic API routes.
- For a full-featured deployment with all backend functionality, you'll need to run the complete build process.