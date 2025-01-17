import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { log } from "./vite";
import { db } from "@db";
import { users, organizationSettings, complexes } from "@db/schema";
import { eq, sql } from "drizzle-orm";
import fs from "fs/promises";
import path from "path";
import { crypto } from "./crypto";
import session from "express-session";
import passport from "passport";

// Simple rate limiting middleware
const rateLimit = (windowMs: number, maxRequests: number) => {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: Function) => {
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

// Admin middleware
const isAdmin = (req: Request, res: Response, next: Function) => {
  if (!req.isAuthenticated()) {
    return res.status(401).send("Not authenticated");
  }

  if (!req.user?.isAdmin) {
    return res.status(403).send("Not authorized");
  }

  next();
};

export function registerRoutes(app: Express): Server {
  const httpServer = createServer(app);

  try {
    // Set up authentication first
    setupAuth(app);
    log("Authentication routes registered successfully");

    // Apply rate limiting to auth routes
    app.use('/api/login', rateLimit(60 * 1000, 5));
    app.use('/api/register', rateLimit(60 * 1000, 3));
    app.use('/api/check-email', rateLimit(60 * 1000, 10));

    // Complex management routes
    app.get('/api/admin/complexes', isAdmin, async (req, res) => {
      try {
        const allComplexes = await db
          .select()
          .from(complexes)
          .orderBy(complexes.name);

        res.json(allComplexes);
      } catch (error) {
        console.error('Error fetching complexes:', error);
        res.status(500).send("Internal server error");
      }
    });

    app.post('/api/admin/complexes', isAdmin, async (req, res) => {
      try {
        const [newComplex] = await db
          .insert(complexes)
          .values({
            name: req.body.name,
            address: req.body.address,
            city: req.body.city,
            state: req.body.state,
            country: req.body.country,
            openTime: req.body.openTime,
            closeTime: req.body.closeTime,
            rules: req.body.rules || null,
            directions: req.body.directions || null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })
          .returning();

        res.json(newComplex);
      } catch (error) {
        console.error('Error creating complex:', error);
        res.status(500).send("Failed to create complex");
      }
    });

    app.put('/api/admin/complexes/:id', isAdmin, async (req, res) => {
      try {
        const [updatedComplex] = await db
          .update(complexes)
          .set({
            name: req.body.name,
            address: req.body.address,
            city: req.body.city,
            state: req.body.state,
            country: req.body.country,
            openTime: req.body.openTime,
            closeTime: req.body.closeTime,
            rules: req.body.rules || null,
            directions: req.body.directions || null,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(complexes.id, parseInt(req.params.id)))
          .returning();

        if (!updatedComplex) {
          return res.status(404).send("Complex not found");
        }

        res.json(updatedComplex);
      } catch (error) {
        console.error('Error updating complex:', error);
        res.status(500).send("Failed to update complex");
      }
    });

    app.delete('/api/admin/complexes/:id', isAdmin, async (req, res) => {
      try {
        const [deletedComplex] = await db
          .delete(complexes)
          .where(eq(complexes.id, parseInt(req.params.id)))
          .returning();

        if (!deletedComplex) {
          return res.status(404).send("Complex not found");
        }

        res.json({ message: "Complex deleted successfully" });
      } catch (error) {
        console.error('Error deleting complex:', error);
        res.status(500).send("Failed to delete complex");
      }
    });

    // Analytics endpoint for complexes
    app.get('/api/admin/complexes/analytics', isAdmin, async (req, res) => {
      try {
        const [complexCount] = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(complexes);

        // Get the complex with the most recent activity
        const [mostActiveComplex] = await db
          .select({
            id: complexes.id,
            name: complexes.name,
            address: complexes.address,
            eventsCount: sql<number>`0::int`, // This will be updated when we add events
          })
          .from(complexes)
          .orderBy(complexes.updatedAt, 'desc')
          .limit(1);

        res.json({
          totalComplexes: complexCount?.count || 0,
          totalFields: 0, // This will be updated when we add fields
          eventsToday: 0, // This will be updated when we add events
          averageUsage: 0, // This will be calculated when we add usage tracking
          mostActiveComplex: mostActiveComplex || null,
        });
      } catch (error) {
        console.error('Error fetching complex analytics:', error);
        res.status(500).send("Failed to fetch analytics");
      }
    });

    // Organization settings endpoints
    app.get('/api/admin/organization-settings', isAdmin, async (req, res) => {
      try {
        const [settings] = await db
          .select()
          .from(organizationSettings)
          .limit(1);

        res.json(settings || {});
      } catch (error) {
        console.error('Error fetching organization settings:', error);
        res.status(500).send("Internal server error");
      }
    });

    app.post('/api/admin/organization-settings', isAdmin, async (req, res) => {
      try {
        const [existingSettings] = await db
          .select()
          .from(organizationSettings)
          .limit(1);

        const updatedSettings = {
          ...req.body,
          updatedAt: new Date().toISOString(),
        };

        let settings;
        if (existingSettings) {
          [settings] = await db
            .update(organizationSettings)
            .set(updatedSettings)
            .where(eq(organizationSettings.id, existingSettings.id))
            .returning();
        } else {
          [settings] = await db
            .insert(organizationSettings)
            .values({
              ...updatedSettings,
              createdAt: new Date().toISOString(),
            })
            .returning();
        }

        res.json(settings);
      } catch (error) {
        console.error('Error updating organization settings:', error);
        res.status(500).send("Internal server error");
      }
    });

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

    // Admin routes
    app.get('/api/admin/users', isAdmin, async (req, res) => {
      try {
        const allUsers = await db
          .select()
          .from(users)
          .orderBy(users.createdAt);

        // Remove password field from response
        const sanitizedUsers = allUsers.map(({ password, ...user }) => user);
        res.json(sanitizedUsers);
      } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).send("Internal server error");
      }
    });

    // Theme update endpoint
    app.post('/api/theme', async (req, res) => {
      try {
        const themeData = req.body;
        const themePath = path.resolve(process.cwd(), 'theme.json');

        await fs.writeFile(themePath, JSON.stringify(themeData, null, 2));

        res.json({ message: 'Theme updated successfully' });
      } catch (error) {
        console.error('Error updating theme:', error);
        res.status(500).json({ message: 'Failed to update theme' });
      }
    });


    // Add these new routes for profile management
    app.put('/api/user/profile', async (req, res) => {
      if (!req.isAuthenticated()) {
        return res.status(401).send("Not authenticated");
      }

      try {
        const { firstName, lastName, email, phone } = req.body;

        // Check if email is already taken by another user
        if (email !== req.user.email) {
          const [existingUser] = await db
            .select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1);

          if (existingUser) {
            return res.status(400).send("Email already in use");
          }
        }

        // Update user profile
        const [updatedUser] = await db
          .update(users)
          .set({
            firstName,
            lastName,
            email,
            phone,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(users.id, req.user.id))
          .returning();

        // Update session
        req.login(updatedUser, (err) => {
          if (err) {
            return res.status(500).send("Failed to update session");
          }
          res.json(updatedUser);
        });
      } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).send("Failed to update profile");
      }
    });

    app.put('/api/user/password', async (req, res) => {
      if (!req.isAuthenticated()) {
        return res.status(401).send("Not authenticated");
      }

      try {
        const { currentPassword, newPassword } = req.body;

        // Verify current password
        const isMatch = await crypto.compare(currentPassword, req.user.password);
        if (!isMatch) {
          return res.status(400).send("Current password is incorrect");
        }

        // Hash new password
        const hashedPassword = await crypto.hash(newPassword);

        // Update password
        await db
          .update(users)
          .set({
            password: hashedPassword,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(users.id, req.user.id));

        res.json({ message: "Password updated successfully" });
      } catch (error) {
        console.error('Error updating password:', error);
        res.status(500).send("Failed to update password");
      }
    });

    return httpServer;
  } catch (error) {
    log("Error registering routes: " + (error as Error).message);
    throw error;
  }
}