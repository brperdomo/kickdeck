# Quick Deployment Guide for MatchPro

## One-Step Deployment

Run this command in the terminal:

```bash
./deploy-now.sh
```

Then click the "Deploy" button in the Replit interface.

## What This Does

1. **Configures** your project for deployment
2. **Builds** your application
3. **Prepares** deployment server configuration

## Troubleshooting

If you encounter any issues:

1. Visit `/deployment-status` on your deployed site for diagnostics
2. Make sure you have `http-proxy` installed
3. Check that static files are properly built in `dist/public`

## Manual Deployment Steps

If the automated script doesn't work:

1. Run `node deploy-dual-mode.cjs` 
2. Run `npm run build`
3. Copy deployment server: `cp deploy-dual-mode-server.js dist/`
4. Click "Deploy" in Replit interface

## For More Information

See the full deployment guide in `DEPLOY-NOW.md`