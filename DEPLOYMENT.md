# Deployment Guide for Replit

This guide provides detailed instructions for deploying this application on Replit.

## Deployment Methods

We provide multiple deployment methods to accommodate different scenarios:

1. **Improved ESM Deployment** (Recommended): Converts TypeScript to JavaScript with proper ES module imports and extensions.
2. **Fixed Deployment**: Uses relative imports instead of path aliases.
3. **Server-Only Deployment**: Faster testing without frontend build for rapid iterations.

## Prerequisites

- The application must be hosted on Replit
- PostgreSQL database is required for full functionality
- Environment variables are set up (see Environment Variables section)

## Recommended Method: Improved ESM Deployment

This method properly handles ES modules with .js extensions and directory imports:

```sh
# Make the script executable
chmod +x deploy-esm-improved.sh

# Run the deployment script
./deploy-esm-improved.sh
```

The script will:
1. Convert all TypeScript files to JavaScript with proper ES module imports
2. Add .js extensions to imports where needed
3. Handle directory structure and file copying
4. Build the frontend with Vite
5. Create the server entry point with proper imports

## Alternative Method 1: Fixed Deployment

This method uses a simplified approach with relative imports:

```sh
# Make the script executable
chmod +x deploy-fixed.sh

# Run the deployment script
./deploy-fixed.sh
```

## Alternative Method 2: Server-Only Deployment

For faster testing without rebuilding the frontend:

```sh
# Make the script executable
chmod +x deploy-server-only.sh

# Run the deployment script
./deploy-server-only.sh
```

## Manual Deployment Steps

If you need to deploy manually:

1. Compile the server code:
```sh
npx esbuild server/prod-server.ts --platform=node --packages=external --format=esm --outfile=dist/server/prod-server.js
```

2. Fix import paths to include .js extensions:
```sh
# Use sed or a script to add .js to imports
sed -i 's/from "\.\.\(.*\)"/from "\.\.\1\.js"/g' dist/server/prod-server.js
```

3. Copy the db directory:
```sh
mkdir -p dist/db
cp -r db/* dist/db/
```

4. Create a server entry point (index.js) that uses dynamic imports for ES modules compatibility

5. Build the frontend:
```sh
npx vite build --outDir ../dist/public
```

## Troubleshooting

### Common Issues

1. **ERR_UNSUPPORTED_DIR_IMPORT**: Directory imports aren't supported in ES modules. Fix by importing from specific files with .js extension.

   ```js
   // Error:
   import { db } from '../db';
   
   // Fix:
   import { db } from '../db/index.js';
   ```

2. **Module not found errors**: Path aliases don't work in production. Use relative paths instead.

   ```js
   // Error:
   import { users } from '@db/schema';
   
   // Fix:
   import { users } from '../db/schema.js';
   ```

3. **Missing JS extension**: ES modules require .js extensions for imports.

   ```js
   // Error:
   import { setupServer } from './prod-server';
   
   // Fix:
   import { setupServer } from './prod-server.js';
   ```

### Debugging Tips

- Check Replit logs for detailed error information
- Verify environment variables are properly set
- Test database connectivity at startup
- Use a fallback server to display helpful error messages
- If deployment fails, try the server-only deployment for quicker testing

## Environment Variables

The following environment variables are used:

- `DATABASE_URL`: PostgreSQL connection string
- `PORT`: Server port (defaults to 3000)
- `SESSION_SECRET`: Secret for session encryption (defaults to REPL_ID)
- `NODE_ENV`: Set to "production" for deployment

## Post-Deployment Verification

After deploying, verify the following:

1. Static files are served from the correct location
2. API endpoints are properly responding
3. Database connection is working
4. Authentication system functions correctly
5. Frontend application loads and works as expected

## Additional Resources

- [Replit Deployments Documentation](https://docs.replit.com/hosting/deployments/about-deployments)
- [ES Modules in Node.js](https://nodejs.org/api/esm.html)
- [Express.js Deployment Best Practices](https://expressjs.com/en/advanced/best-practice-performance.html)