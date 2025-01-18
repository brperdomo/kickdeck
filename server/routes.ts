import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { log } from "./vite";
import { db } from "@db";
import { users, organizationSettings, complexes, fields, events, eventAgeGroups, eventComplexes, eventFieldSizes } from "@db/schema";
import { eq, sql, count } from "drizzle-orm";
import fs from "fs/promises";
import path from "path";
import { crypto } from "./crypto";
import session from "express-session";
import passport from "passport";
import { insertEventSchema } from "@db/schema";

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
    app.use('/api/login', rateLimit(60 * 1000, 5)); // 5 requests per minute
    app.use('/api/register', rateLimit(60 * 1000, 3)); // 3 requests per minute
    app.use('/api/check-email', rateLimit(60 * 1000, 10)); // 10 requests per minute

    // Complex management routes
    app.get('/api/admin/complexes', isAdmin, async (req, res) => {
      try {
        const complexesWithFields = await db
          .select({
            complex: complexes,
            openFields: sql<number>`count(case when ${fields.isOpen} = true then 1 end)`.mapWith(Number),
            closedFields: sql<number>`count(case when ${fields.isOpen} = false then 1 end)`.mapWith(Number),
          })
          .from(complexes)
          .leftJoin(fields, eq(complexes.id, fields.complexId))
          .groupBy(complexes.id, complexes.name)
          .orderBy(complexes.name);

        // Format the response
        const formattedComplexes = complexesWithFields.map(({ complex, openFields, closedFields }) => ({
          ...complex,
          openFields,
          closedFields
        }));

        res.json(formattedComplexes);
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

    // Add complex update endpoint after the create endpoint
    app.patch('/api/admin/complexes/:id', isAdmin, async (req, res) => {
      try {
        const complexId = parseInt(req.params.id);
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
          .where(eq(complexes.id, complexId))
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

    // Add complex status update endpoint
    app.patch('/api/admin/complexes/:id/status', isAdmin, async (req, res) => {
      try {
        const complexId = parseInt(req.params.id);
        const { isOpen } = req.body;

        // Start a transaction to update both complex and fields
        await db.transaction(async (tx) => {
          // Update complex status
          const [updatedComplex] = await tx
            .update(complexes)
            .set({
              isOpen,
              updatedAt: new Date().toISOString(),
            })
            .where(eq(complexes.id, complexId))
            .returning();

          if (!updatedComplex) {
            return res.status(404).send("Complex not found");
          }

          // If complex is closed, force all fields to be closed
          if (!isOpen) {
            await tx
              .update(fields)
              .set({
                isOpen: false,
                updatedAt: new Date().toISOString(),
              })
              .where(eq(fields.complexId, complexId));
          }

          res.json(updatedComplex);
        });
      } catch (error) {
        console.error('Error updating complex status:', error);
        res.status(500).send("Failed to update complex status");
      }
    });

    // Add complex deletion endpoint
    app.delete('/api/admin/complexes/:id', isAdmin, async (req, res) => {
      try {
        const complexId = parseInt(req.params.id);

        // First delete all fields associated with this complex
        await db
          .delete(fields)
          .where(eq(fields.complexId, complexId));

        // Then delete the complex
        const [deletedComplex] = await db
          .delete(complexes)
          .where(eq(complexes.id, complexId))
          .returning();

        if (!deletedComplex) {
          return res.status(404).send("Complex not found");
        }

        res.json(deletedComplex);
      } catch (error) {
        console.error('Error deleting complex:', error);
        res.status(500).send("Failed to delete complex");
      }
    });

    // Analytics endpoint for complexes
    app.get('/api/admin/complexes/analytics', isAdmin, async (req, res) => {
      try {
        // Get all complexes with their fields
        const complexesWithFields = await db
          .select({
            complex: complexes,
            fieldCount: sql<number>`count(${fields.id})`.mapWith(Number)
          })
          .from(complexes)
          .leftJoin(fields, eq(complexes.id, fields.complexId))
          .groupBy(complexes.id)
          .orderBy(complexes.name);

        if (complexesWithFields.length === 0) {
          return res.json({
            totalComplexes: 0,
            totalFields: 0,
            eventsToday: 0,
            averageUsage: 0,
            message: "Start by adding your first complex and scheduling events to see analytics!",
            mostActiveComplex: null
          });
        }

        // Calculate totals
        const totalComplexes = complexesWithFields.length;
        const totalFields = complexesWithFields.reduce((sum, complex) =>
          sum + Number(complex.fieldCount), 0);

        // Find the complex with most fields
        const mostActive = complexesWithFields.reduce((prev, current) =>
          Number(current.fieldCount) > Number(prev.fieldCount) ? current : prev
        );

        res.json({
          totalComplexes,
          totalFields,
          eventsToday: 0, // This will be implemented when events are added
          averageUsage: 0, // This will be implemented when usage tracking is added
          message: totalFields === 0 ?
            "Add fields to your complexes and start scheduling events to see usage analytics!" :
            undefined,
          mostActiveComplex: {
            name: mostActive.complex.name,
            address: mostActive.complex.address,
            fieldCount: Number(mostActive.fieldCount)
          }
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

    // Add field creation endpoint
    app.post('/api/admin/fields', isAdmin, async (req, res) => {
      try {
        const [newField] = await db
          .insert(fields)
          .values({
            name: req.body.name,
            hasLights: req.body.hasLights,
            hasParking: req.body.hasParking,
            specialInstructions: req.body.specialInstructions || null,
            complexId: req.body.complexId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })
          .returning();

        res.json(newField);
      } catch (error) {
        console.error('Error creating field:', error);
        res.status(500).send("Failed to create field");
      }
    });

    // Add field listing endpoint
    app.get('/api/admin/complexes/:id/fields', isAdmin, async (req, res) => {
      try {
        const complexId = parseInt(req.params.id);
        const complexFields = await db
          .select()
          .from(fields)
          .where(eq(fields.complexId, complexId))
          .orderBy(fields.name);

        res.json(complexFields);
      } catch (error) {
        console.error('Error fetching fields:', error);
        res.status(500).send("Failed to fetch fields");
      }
    });

    // Add field deletion endpoint
    app.delete('/api/admin/fields/:id', isAdmin, async (req, res) => {
      try {
        const fieldId = parseInt(req.params.id);
        const [deletedField] = await db
          .delete(fields)
          .where(eq(fields.id, fieldId))
          .returning();

        if (!deletedField) {
          return res.status(404).send("Field not found");
        }

        res.json(deletedField);
      } catch (error) {
        console.error('Error deleting field:', error);
        res.status(500).send("Failed to delete field");
      }
    });

    // Update the field status endpoint to respect complex status
    app.patch('/api/admin/fields/:id/status', isAdmin, async (req, res) => {
      try {
        const fieldId = parseInt(req.params.id);
        const { isOpen } = req.body;

        // First check if the complex is open
        const [field] = await db
          .select({
            field: fields,
            complexIsOpen: complexes.isOpen,
          })
          .from(fields)
          .innerJoin(complexes, eq(fields.complexId, complexes.id))
          .where(eq(fields.id, fieldId));

        if (!field) {
          return res.status(404).send("Field not found");
        }

        // If trying to open a field while complex is closed, return error
        if (isOpen && !field.complexIsOpen) {
          return res.status(400).send("Cannot open field when complex is closed");
        }

        const [updatedField] = await db
          .update(fields)
          .set({
            isOpen,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(fields.id, fieldId))
          .returning();

        res.json(updatedField);
      } catch (error) {
        console.error('Error updating field status:', error);
        res.status(500).send("Failed to update field status");
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

    // Add this new event creation endpoint
    app.post('/api/admin/events', isAdmin, async (req, res) => {
      try {
        const eventData = req.body;

        // Start a transaction to create event and related records
        await db.transaction(async (tx) => {
          // Create the event
          const [event] = await tx
            .insert(events)
            .values({
              name: eventData.name,
              startDate: eventData.startDate,
              endDate: eventData.endDate,
              timezone: eventData.timezone,
              applicationDeadline: eventData.applicationDeadline,
              details: eventData.details || null,
              agreement: eventData.agreement || null,
              refundPolicy: eventData.refundPolicy || null,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            })
            .returning();

          // Create age groups
          for (const group of eventData.ageGroups) {
            await tx
              .insert(eventAgeGroups)
              .values({
                eventId: event.id,
                gender: group.gender,
                projectedTeams: group.projectedTeams,
                birthDateStart: group.birthDateStart,
                birthDateEnd: group.birthDateEnd,
                scoringRule: group.scoringRule,
                ageGroup: group.ageGroup,
                fieldSize: group.fieldSize,
                amountDue: group.amountDue || null,
                createdAt: new Date().toISOString(),
              });
          }

          // Create complex assignments
          for (const complexId of eventData.selectedComplexIds) {
            await tx
              .insert(eventComplexes)
              .values({
                eventId: event.id,
                complexId: complexId,
                createdAt: new Date().toISOString(),
              });
          }

          // Create field size assignments
          for (const [fieldId, fieldSize] of Object.entries(eventData.complexFieldSizes)) {
            await tx
              .insert(eventFieldSizes)
              .values({
                eventId: event.id,
                fieldId: parseInt(fieldId),
                fieldSize: fieldSize,
                createdAt: new Date().toISOString(),
              });
          }
        });

        res.json({ message: "Event created successfully" });
      } catch (error) {
        console.error('Error creating event:', error);
        let errorMessage = "Failed to create event";
        if (error instanceof Error) {
          errorMessage = error.message;
        }
        res.status(500).send(errorMessage);
      }
    });

    // Add this new endpoint after the existing event creation endpoint
    app.get('/api/admin/events', isAdmin, async (req, res) => {
      try {
        const eventsList = await db
          .select({
            event: events,
            ageGroupCount: sql<number>`count(distinct ${eventAgeGroups.id})`.mapWith(Number),
            complexCount: sql<number>`count(distinct ${eventComplexes.id})`.mapWith(Number),
          })
          .from(events)
          .leftJoin(eventAgeGroups, eq(events.id, eventAgeGroups.eventId))
          .leftJoin(eventComplexes, eq(events.id, eventComplexes.eventId))
          .groupBy(events.id)
          .orderBy(events.createdAt);

        // Format the response
        const formattedEvents = eventsList.map(({ event, ageGroupCount, complexCount }) => ({
          ...event,
          ageGroupCount,
          complexCount
        }));

        res.json(formattedEvents);
      } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).send("Failed to fetch events");
      }
    });

    return httpServer;
  } catch (error) {
    log("Error registering routes: " + (error as Error).message);
    throw error;
  }
}