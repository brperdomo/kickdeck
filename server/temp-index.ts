import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./simple-vite";
import { db } from "@db";
import { users } from "@db/schema";
import { createAdmin } from "./create-admin";
import path from "path";
import uploadRouter from "./routes/upload";
import { createEmailTemplatesTable } from './migrations/create_email_templates';
import { createEmailTemplateRoutingTable } from './migrations/create_email_template_routing';
import { createTables } from './create-tables';
import { setupAuth } from './auth';
import { emulationMiddleware } from './services/emulationService';
import { initializeStandardFolders } from './utils/initStandardFolders';
import { verifySuperAdminRoles, logPermissionDetails } from './middleware/role-verification';

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
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.substring(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

async function testDbConnection() {
  try {
    const result = await db.select().from(users).limit(1);
    log("✓ Database connection successful");
  } catch (error) {
    log(`✗ Database connection failed: ${error}`);
  }
}

(async () => {
  const server = app.listen(5000, "0.0.0.0", async () => {
    log(`Server running on http://0.0.0.0:5000`);
    
    await testDbConnection();
    
    // Initialize database tables and admin user
    try {
      await createTables();
      await createEmailTemplatesTable();
      await createEmailTemplateRoutingTable();
      await createAdmin();
      await initializeStandardFolders();
      await verifySuperAdminRoles();
      log("✓ Database initialization complete");
    } catch (error) {
      log(`Database initialization error: ${error}`);
    }
  });

  // Setup authentication
  setupAuth(app);
  
  // Add emulation middleware before API routes
  app.use('/api', emulationMiddleware);

  // Register API routes
  registerRoutes(app);

  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    await setupVite(app, server);
  }
})();