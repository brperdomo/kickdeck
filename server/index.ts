import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { db } from "@db";
import { users } from "@db/schema";
import { createAdmin } from "./create-admin";
import { WebSocketServer } from "ws";
import path from "path";
import uploadRouter from "./routes/upload";
import { createEmailTemplatesTable } from "./migrations/create_email_templates";
import { createEmailTemplateRoutingTable } from "./migrations/create_email_template_routing";
import { createTables } from "./create-tables";
import express from "express";
import { fileURLToPath } from "url";
import { serveStatic } from "./vite.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV === "production") {
  serveStatic(app);
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Health check endpoints
app.get(["/", "/_health"], (req, res) => {
  res.status(200).send("OK");
});

// Basic middleware setup
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: false, limit: "50mb" }));

// Serve uploaded files
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Register upload routes
app.use("/api/files", uploadRouter);

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
  let server;

  try {
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

    // Register routes first to ensure all middleware is set up

    const PORT = process.env.PORT || 5000;
    server = app.listen();
    server.close(); // Create but don't start listening yet

    // Register routes
    registerRoutes(app);

    // Create WebSocket server
    const wss = new WebSocketServer({
      server,
      path: "/api/ws",
      verifyClient: (info) => {
        const protocol = info.req.headers["sec-websocket-protocol"];
        return !protocol || protocol !== "vite-hmr";
      },
    });

    // WebSocket connection handling
    wss.on("connection", (ws) => {
      log("New WebSocket connection established");

      // Set a timeout to close idle connections after 5 minutes
      const idleTimeout = 5 * 60 * 1000; // 5 minutes in milliseconds
      let timeoutId = setTimeout(() => {
        log("Closing idle WebSocket connection");
        ws.close();
      }, idleTimeout);

      ws.on("message", (message) => {
        // Reset timeout on activity
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          log("Closing idle WebSocket connection");
          ws.close();
        }, idleTimeout);

        // Handle incoming messages
        log("Received WebSocket message: " + message);
      });

      ws.on("close", () => {
        clearTimeout(timeoutId);
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
      // Use port 3000 for production deployment, otherwise use dynamic port
      const port = process.env.NODE_ENV === "production" ? 3000 : PORT;
      server.listen(port, HOST, () => {
        log(`Server started successfully on ${HOST}:${port}`);
      });
    } catch (error) {
      log(`Error starting server: ${(error as Error).message}`);
      // Don't exit in production, let the process manager handle it
      if (process.env.NODE_ENV !== "production") {
        process.exit(1);
      }
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
