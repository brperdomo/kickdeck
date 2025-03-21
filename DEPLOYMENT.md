# Deployment Guide for Replit

This guide covers how to successfully deploy the application on Replit's platform.

## Deployment Overview

The application uses a dual architecture:
- **Frontend**: React with Vite
- **Backend**: Express.js with TypeScript and PostgreSQL
- **Module System**: ES Modules (ESM)

## Key Deployment Challenges

Replit's production environment has several constraints:
1. The `.replit` file is protected and cannot be directly modified
2. Replit's production run starts with `node server/index.js` 
3. ES Module imports (`import` vs `require`) require special handling
4. Path aliases like `@db/schema` need conversion to relative paths

## Deployment Process

### Option 1: Using the Unified Deployment Script

Run the comprehensive deployment script:

```bash
./deploy-replit.sh
```

This script:
- Compiles TypeScript server files with proper ESM formatting
- Builds the frontend with Vite
- Creates the proper directory structure in `dist/`
- Fixes import paths for ES module compatibility
- Handles path aliases correctly
- Creates a production-ready server entry point

After running the script, to test locally:

```bash
NODE_ENV=production node dist/index.js
```

### Option 2: Server-Only Deployment (Faster)

For testing just API endpoints without building the frontend:

```bash
./deploy-server-only.sh
```

This is useful for quick iterations on server code.

## Environment Variables

The following environment variables are important for deployment:

- `NODE_ENV`: Set to `production` for production mode
- `DATABASE_URL`: PostgreSQL connection string (already configured in Replit)
- `PORT`: Server port (defaults to 3000 if not specified)

## Verifying Deployment

1. Check server logs for successful startup messages
2. Verify API endpoint access at `/api/health`
3. Confirm frontend assets are served correctly

## Troubleshooting

If you encounter deployment issues:

### Server Errors

1. **Database Connection**: Ensure DATABASE_URL environment variable is correct
   ```bash
   echo $DATABASE_URL
   ```

2. **Module Import Errors**: These usually appear as:
   - `ERR_UNSUPPORTED_DIR_IMPORT` - Directory imports not supported in ES modules
   - `Cannot use import statement outside a module` - ES module format issue
   
   Solution: Run the deployment script to fix import paths

3. **Missing Files**: Check if all required files are in the dist directory:
   ```bash
   ls -la dist/server
   ls -la dist/db
   ```

### Frontend Not Loading

1. Check if static files were built:
   ```bash
   ls -la dist/public
   ```

2. Verify the server is properly serving static files by checking logs:
   ```bash
   curl http://localhost:3000/
   ```

## Advanced Deployment Options

### Custom Frontend Path

If you need to customize the frontend path:

```js
// In prod-server.js
app.use(express.static(path.join(__dirname, '../public')));
```

### Manual Production Mode

To run in production mode with explicit options:

```bash
NODE_ENV=production node --no-warnings dist/index.js
```