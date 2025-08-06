import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { db } from "@db";
import { users } from "@db/schema";
import { createAdmin } from "./create-admin";
import path from "path";
import uploadRouter from "./routes/upload";
import memberRosterUploadRouter from "./routes/member-roster-upload";
import memberTeamManagementRouter from "./routes/member-team-management";
import { createEmailTemplatesTable } from "./migrations/create_email_templates";
import { createEmailTemplateRoutingTable } from "./migrations/create_email_template_routing";
import { createTables } from "./create-tables";
import { setupAuth } from "./auth";
import { emulationMiddleware } from "./services/emulationService";
import { initializeStandardFolders } from "./utils/initStandardFolders";
import {
  verifySuperAdminRoles,
  logPermissionDetails,
} from "./middleware/role-verification";
import { phoneFormatterMiddleware } from "./middleware/phone-formatter";
import dotenv from "dotenv";

// Load environment variables based on NODE_ENV
const nodeEnv = process.env.NODE_ENV || "development";

if (nodeEnv === "production") {
  dotenv.config({ path: ".env.production" });
  log(`Loaded production environment variables from .env.production`);
  log("Applied exact development SendGrid configuration to production");
} else {
  dotenv.config();
  log(`Loaded development environment variables from .env`);
}

// Use environment variables for production deployment
// Only set defaults if not already configured
if (!process.env.SENDGRID_API_KEY && nodeEnv === "development") {
  process.env.SENDGRID_API_KEY = "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";
}
if (!process.env.DEFAULT_FROM_EMAIL) {
  process.env.DEFAULT_FROM_EMAIL = "support@matchpro.ai";
}

// Log critical environment variables for debugging (without exposing secrets)
log(`Environment: ${nodeEnv}`);
log(
  `SendGrid API Key: ${process.env.SENDGRID_API_KEY ? `Present (${process.env.SENDGRID_API_KEY.substring(0, 10)}...)` : "Missing"}`,
);
log(`Database URL: ${process.env.DATABASE_URL ? "Present" : "Missing"}`);
log(`Session Secret: ${process.env.SESSION_SECRET ? "Present" : "Missing"}`);

const app = express();

// Basic middleware setup
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: false, limit: "50mb" }));

// Serve uploaded files
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Register upload routes
app.use("/api/files", uploadRouter);

// Health check endpoint - moved below other middleware but before Vite setup
// Only apply to /_health to avoid conflicts with the frontend routes
app.get("/_health", (req, res) => {
  res.status(200).send("OK");
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
    const nodeEnv = process.env.NODE_ENV || "development";
    app.set("env", nodeEnv);

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
      log(
        "Migration failed: " +
          migrationsResult.error +
          " - retrying in 5 seconds...",
      );
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

    // Add phone formatting middleware to ensure consistent phone number formatting
    app.use("/api", phoneFormatterMiddleware);
    log("Phone formatting middleware set up successfully");

    // Register API routes BEFORE setting up static file serving or Vite middleware
    const routes = registerRoutes(app);

    // Register member roster upload routes after authentication is fully configured
    app.use("/api/member-roster", memberRosterUploadRouter);
    
    // Register member team management routes for updating contacts
    app.use("/api/member", memberTeamManagementRouter);

    // Register scheduling readiness route (dynamic import fixed)
    const { default: schedulingReadinessRoutes } = await import('./routes/admin/scheduling-readiness');
    app.use('/api/admin', schedulingReadinessRoutes);

    log("API routes registered");

    // Set up appropriate middleware based on environment
    if (nodeEnv === "production") {
      try {
        // Use production static files
        serveStatic(app);
        log("Static file serving configured for production");
        
        // Create HTTP server for production
        const { createServer } = await import("http");
        server = createServer(app);
      } catch (error) {
        log("Error setting up production static files: " + (error as Error).message);
        // Fallback to basic static serving
        const { createServer } = await import("http");
        server = createServer(app);
        serveStatic(app);
        log("Production fallback configured");
      }
    } else {
      // In development, create a temporary server for Vite HMR
      const { createServer } = await import("http");
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
          const { createServer } = await import("http");
          const tempServer = createServer();
          tempServer
            .listen(port, "0.0.0.0")
            .on("listening", () => {
              tempServer.close(() => resolve(port));
            })
            .on("error", (err: any) => {
              if (err.code === "EADDRINUSE") {
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
      // Use the exact PORT specified (don't search for available ports in production)
      const portToUse = nodeEnv === "production" ? PORT : await findAvailablePort(PORT);

      server.listen(portToUse, HOST, () => {
        log(`Server started successfully on ${HOST}:${portToUse}`);
        log(`Server environment: ${nodeEnv}`);
        log(`Server ready for connections`);
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
