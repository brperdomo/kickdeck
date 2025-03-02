import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { db } from "@db";
import { users } from "@db/schema";
import { createAdmin } from "./create-admin";
import { WebSocketServer } from "ws";
import path from "path";
import uploadRouter from "./routes/upload";

const app = express();

// Basic middleware setup
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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
    await db.select({ id: users.id }).from(users).limit(1);
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

    // Create admin user if it doesn't exist
    await createAdmin();
    log("Admin user setup completed");

    // Initialize email service
    const { initEmailService } = await import('./services/email-service');
    await initEmailService();
    log("Email service initialized");

    // Create seasonal scopes table if it doesn't exist
    await db.execute(`
      CREATE TABLE IF NOT EXISTS seasonal_scopes (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        start_year INTEGER NOT NULL,
        end_year INTEGER NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS age_group_settings (
        id SERIAL PRIMARY KEY,
        seasonal_scope_id INTEGER NOT NULL REFERENCES seasonal_scopes(id) ON DELETE CASCADE,
        age_group TEXT NOT NULL,
        min_birth_year INTEGER NOT NULL,
        max_birth_year INTEGER NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);


    // Register routes first to ensure all middleware is set up
    const server = registerRoutes(app);

    // We'll create the WebSocket server after the HTTP server has started successfully
    let wss: WebSocketServer;

    // Function to initialize WebSocket after server is listening
    const initializeWebSocket = () => {
      // Create WebSocket server
      wss = new WebSocketServer({ 
        server,
        path: "/ws", // Use consistent path with setupWebSocketServer
        verifyClient: (info) => {
          const protocol = info.req.headers['sec-websocket-protocol'];
          return !protocol || protocol !== 'vite-hmr';
        }
      });

      // Log WebSocket server setup
      log("WebSocket server created with path: /ws");

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
    };

    // WebSocket initialization happens after server starts successfully

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

    // Start the server
    const PORT = process.env.PORT ? parseInt(process.env.PORT) : 5000;
    const ALTERNATIVE_PORTS = [5001, 5002, 5003, 5432, 6000];

    const startServer = (port: number, attemptIndex = 0) => {
      const serverInstance = server.listen(port, "0.0.0.0", () => {
        log(`Server started successfully on port ${port}`);

        // Initialize WebSocket server after HTTP server starts successfully
        initializeWebSocket();
      });

      serverInstance.on('error', (error: any) => {
        if (error.code === 'EADDRINUSE') {
          log(`Port ${port} is already in use.`);

          // Try next alternative port
          if (attemptIndex < ALTERNATIVE_PORTS.length) {
            const nextPort = ALTERNATIVE_PORTS[attemptIndex];
            log(`Attempting to use alternative port: ${nextPort}`);
            startServer(nextPort, attemptIndex + 1);
          } else {
            log(`Error: All ports are in use. Please close other running servers or specify a different port.`);
            process.exit(1);
          }
        } else {
          log(`Error starting server: ${error.message}`);
          process.exit(1);
        }
      });
    };

    startServer(PORT);

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