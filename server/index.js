import express from "express";
import { registerRoutes } from "./routes/index.js";
import { setupVite, serveStatic, log } from "./vite.js";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { createAdmin } from "./create-admin.js";
import path from "path";
import uploadRouter from "./routes/upload.js";
import { createEmailTemplatesTable } from './migrations/create_email_templates.js';
import { createEmailTemplateRoutingTable } from './migrations/create_email_template_routing.js';
import { createTables } from './create-tables.js';
import { setupAuth } from './auth.js';
import { emulationMiddleware } from './services/emulationService.js';
import { initializeStandardFolders } from './utils/initStandardFolders.js';
import { verifySuperAdminRoles, logPermissionDetails } from './middleware/role-verification.js';

const app = express();

// Basic middleware setup
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Register upload routes
app.use('/api/files', uploadRouter);

// Health check endpoint - moved below other middleware but before Vite setup
// Only apply to /_health to avoid conflicts with the frontend routes
app.get('/_health', (req, res) => {
  res.status(200).send('OK');
});

// Add request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (res.statusCode >= 400) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      log(logLine);
    }
  });

  next();
});

// Setup authentication first
await setupAuth(app);

// Add emulation middleware after auth
app.use(emulationMiddleware);

// Initialize database tables
await createTables();

// Create default email templates 
await createEmailTemplatesTable();
await createEmailTemplateRoutingTable();

// Initialize standard folders
await initializeStandardFolders();

// Verify super admin roles exist and log permission details
try {
  await verifySuperAdminRoles();
  await logPermissionDetails('bperdomo@zoho.com');
} catch (error) {
  log('Error verifying super admin roles:', error);
}

// Register API routes  
registerRoutes(app);

// Setup Vite middleware for development or static file serving for production
const server = await setupVite(app);

// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, "0.0.0.0", () => {
  log(`Server running on port ${PORT}`);
});