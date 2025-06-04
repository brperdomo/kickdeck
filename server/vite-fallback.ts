import express, { type Express } from "express";
import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import { type Server } from "http";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  // Production mode - serve static files
  if (process.env.NODE_ENV === "production") {
    return serveStatic(app);
  }
  
  // Development mode - try to load vite or fallback to static
  try {
    const viteModule = await import("vite");
    const viteConfig = await import("../vite.config.js");
    
    const viteLogger = viteModule.createLogger();
    
    const vite = await viteModule.createServer({
      ...viteConfig.default,
      configFile: false,
      customLogger: {
        ...viteLogger,
        error: (msg: any, options: any) => {
          if (msg.includes("WebSocket server error")) return;
          if (msg.includes("ws connection")) return;
          viteLogger.error(msg, options);
        },
      },
      server: { middlewareMode: true },
    });

    app.use(vite.ssrLoadModule);
    app.use(vite.middlewares);
    
    log("Vite dev server initialized");
  } catch (error) {
    log("Vite not available, falling back to static serving", "vite-fallback");
    serveStatic(app);
  }
}

export function serveStatic(app: Express) {
  const publicPath = path.resolve(__dirname, "../dist/public");
  const distPath = path.resolve(__dirname, "../dist");
  
  // Try public directory first, then fallback to dist
  const staticPath = fs.existsSync(publicPath) ? publicPath : distPath;
  
  if (fs.existsSync(staticPath)) {
    app.use(express.static(staticPath));
    
    app.get("*", (req, res, next) => {
      if (req.path.startsWith("/api")) {
        return next();
      }
      
      const indexPath = path.join(staticPath, "index.html");
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send("Application not built. Run 'npm run build' first.");
      }
    });
    
    log(`Serving static files from ${staticPath}`);
  } else {
    log("No dist folder found. Application needs to be built.", "static");
    
    // Serve a simple development message
    app.get("*", (req, res, next) => {
      if (req.path.startsWith("/api")) {
        return next();
      }
      
      res.send(`
        <html>
          <head><title>Development Server</title></head>
          <body>
            <h1>Development Server Running</h1>
            <p>The application is starting up. Please wait...</p>
            <script>setTimeout(() => location.reload(), 3000);</script>
          </body>
        </html>
      `);
    });
  }
}