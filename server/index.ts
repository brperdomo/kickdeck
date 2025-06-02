import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
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
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Test database connection
async function testDbConnection() {
  try {
    await db.select().from(users).limit(1);
    log("Database connection successful");
    return true;
  } catch (error) {
    log("Database connection failed: " + (error as Error).message);
    return false;
  }
}

(async () => {
  let server: any; // Fix implicit any error
  
  try {
    // Use NODE_ENV from environment or default to development
    const nodeEnv = process.env.NODE_ENV || 'development';
    app.set('env', nodeEnv);
    
    log(`Server starting in ${nodeEnv} mode`);
    
    // Test database connection first
    const dbConnected = await testDbConnection();
    if (!dbConnected) {
      log("Database connection failed - retrying in 5 seconds...");
      setTimeout(() => testDbConnection(), 5000);
      return;
    }

    // Run database migrations
    const migrationsResult = await createTables();
    if (!migrationsResult.success) {
      log("Migration failed: " + migrationsResult.error + " - retrying in 5 seconds...");
      setTimeout(() => createTables(), 5000);
      return;
    }
    log("Database migrations completed successfully");

    // Create admin user if it doesn't exist
    await createAdmin();
    log("Admin user setup completed");
    
    // Verify super admin role permissions to prevent missing access issues
    await verifySuperAdminRoles();
    
    // Initialize standard folder structure
    await initializeStandardFolders();

    // Get port configuration
    const PORT = Number(process.env.PORT) || 5000; // Ensure PORT is a number
    
    // Set up authentication BEFORE registering routes
    setupAuth(app);
    log("Authentication middleware set up successfully");
    
    // Apply emulation middleware after authentication but before routes
    app.use(emulationMiddleware);
    log("User emulation middleware set up successfully");
    
    // Add permission logging middleware to catch and debug 403 errors
    app.use(logPermissionDetails);
    log("Permission logging middleware set up successfully");
    
    // Register routes after authentication setup
    const routes = registerRoutes(app);
    log("API routes registered");

    // Set up appropriate middleware based on environment
    if (nodeEnv === 'production') {
      try {
        // Try production static files first
        serveStatic(app);
        log("Static file serving configured for production");
      } catch (error) {
        // Fall back to development mode if production files don't exist
        log("Production files not found, falling back to development mode");
        const { createServer } = await import('http');
        server = createServer(app);
        await setupVite(app, server);
        log("Vite middleware setup complete for development fallback");
      }
    } else {
      // In development, create a temporary server for Vite HMR
      const { createServer } = await import('http');
      server = createServer(app);
      await setupVite(app, server);
      log("Vite middleware setup complete for development");
    }

    // Error handling middleware
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      log("Error encountered: " + err.message);
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ message });
    });

    // Start the server
    const HOST = process.env.HOST || "0.0.0.0";

    const findAvailablePort = async (startPort: number): Promise<number> => {
      return new Promise((resolve, reject) => {
        const tryPort = async (port: number) => {
          const { createServer } = await import('http');
          const tempServer = createServer();
          tempServer.listen(port, "0.0.0.0")
            .on('listening', () => {
              tempServer.close(() => resolve(port));
            })
            .on('error', (err: any) => {
              if (err.code === 'EADDRINUSE') {
                log(`Port ${port} is busy, trying ${port + 1}`);
                tryPort(port + 1);
              } else {
                reject(err);
              }
            });
        };
        tryPort(startPort);
      });
    };

    try {
      const availablePort = await findAvailablePort(PORT);
      
      // Create and start the server properly
      if (nodeEnv === 'production') {
        // In production, create a new server instance
        const { createServer } = await import('http');
        server = createServer(app);
      }
      
      server.listen(availablePort, HOST, () => {
        log(`Server started successfully on ${HOST}:${availablePort}`);
      });
    } catch (error) {
      log(`Error starting server: ${(error as Error).message}`);
      process.exit(1);
    }

    // Handle shutdown gracefully
    process.on("SIGTERM", () => {
      log("SIGTERM received. Shutting down gracefully");
      server.close(() => {
        log("Server closed");
        process.exit(0);
      });
    });
  } catch (error) {
    log("Failed to start server: " + (error as Error).message);
    process.exit(1);
  }
})();