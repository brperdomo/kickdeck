import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { log } from "./vite";
import { db } from "@db";
import { users } from "@db/schema";
import { eq } from "drizzle-orm";

// Simple rate limiting middleware with IP fallback
const rateLimit = (windowMs: number, maxRequests: number) => {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();

    const userRequests = requests.get(ip) || { count: 0, resetTime: now + windowMs };

    if (now > userRequests.resetTime) {
      userRequests.count = 0;
      userRequests.resetTime = now + windowMs;
    }

    userRequests.count++;
    requests.set(ip, userRequests);

    if (userRequests.count > maxRequests) {
      return res.status(429).send('Too many requests, please try again later.');
    }

    next();
  };
};

export function registerRoutes(app: Express): Server {
  const httpServer = createServer(app);

  try {
    // Apply rate limiting to auth routes
    app.use('/api/login', rateLimit(60 * 1000, 5)); // 5 requests per minute
    app.use('/api/register', rateLimit(60 * 1000, 3)); // 3 requests per minute
    app.use('/api/check-email', rateLimit(60 * 1000, 10)); // 10 requests per minute

    // Email availability check endpoint
    app.get('/api/check-email', async (req, res) => {
      try {
        const email = req.query.email as string;

        if (!email) {
          return res.status(400).json({ available: false, message: "Email is required" });
        }

        const [existingUser] = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        // Add a small delay to prevent brute force attempts
        await new Promise(resolve => setTimeout(resolve, 200));

        return res.json({ available: !existingUser });
      } catch (error) {
        console.error('Error checking email availability:', error);
        return res.status(500).json({ available: false, message: "Internal server error" });
      }
    });

    // Set up authentication routes and middleware
    setupAuth(app);
    log("Authentication routes registered successfully");

    return httpServer;
  } catch (error) {
    log("Error registering routes: " + (error as Error).message);
    throw error;
  }
}