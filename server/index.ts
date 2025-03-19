import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { db } from "@db";
import { users } from "@db/schema";
import { createAdmin } from "./create-admin";
import { WebSocketServer } from "ws";
import path from "path";
import uploadRouter from "./routes/upload";
import { createEmailTemplatesTable } from './migrations/create_email_templates';
import { createEmailTemplateRoutingTable } from './migrations/create_email_template_routing';
import { createTables } from './create-tables';

const app = express();

// Basic middleware setup
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Register upload routes
app.use('/api/files', uploadRouter);

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
  try {
    // Test database connection first
    const dbConnected = await testDbConnection();
    if (!dbConnected) {
      throw new Error("Could not connect to database");
    }

    // Run database migrations
    const migrationsResult = await createTables();
    if (!migrationsResult.success) {
      throw new Error("Failed to run migrations: " + migrationsResult.error);
    }
    log("Database migrations completed successfully");

    // Create admin user if it doesn't exist
    await createAdmin();
    log("Admin user setup completed");


    // Register routes first to ensure all middleware is set up
    const server = registerRoutes(app);

    // Create WebSocket server
    const wss = new WebSocketServer({ 
      server,
      path: "/api/ws",
      verifyClient: (info) => {
        const protocol = info.req.headers['sec-websocket-protocol'];
        return !protocol || protocol !== 'vite-hmr';
      }
    });

    // WebSocket connection handling
    wss.on('connection', (ws) => {
      log("New WebSocket connection established");

      ws.on('message', (message) => {
        // Handle incoming messages
        log("Received WebSocket message: " + message);
      });

      ws.on('close', () => {
        log("WebSocket connection closed");
      });
    });

    if (app.get("env") === "development") {
      // Setup Vite middleware
      await setupVite(app, server);
      log("Vite middleware setup complete");
    } else {
      // Static file serving in production
      serveStatic(app);
    }

    // Error handling middleware
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      log("Error encountered: " + err.message);
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ message });
    });

    // Add health check endpoints
    app.get('/', (_req, res) => {
      res.status(200).send('OK');
    });

    app.get('/health', (_req, res) => {
      res.status(200).json({ status: 'healthy' });
    });

    // Start the server
    const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;
    const HOST = "0.0.0.0"; // Listen on all interfaces

    // Serve static files in production
    if (app.get('env') === 'production') {
      app.use(express.static(path.join(process.cwd(), 'dist', 'public')));
      // Handle SPA routing by serving index.html for any unknown routes
      app.get('*', (_req: Request, res: Response) => {
        res.sendFile(path.join(process.cwd(), 'dist', 'public', 'index.html'));
      });
    } else {
      app.get('/', (_req: Request, res: Response) => {
        res.send('Server is running. In development mode, please use the Vite dev server.');
      });
    }

    try {
      server.listen(PORT, HOST, () => {
        log(`Server started successfully on ${HOST}:${PORT}`);
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