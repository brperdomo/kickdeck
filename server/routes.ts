import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { log } from "./vite";
import { db } from "@db";
import {
  users,
  organizationSettings,
  complexes,
  fields,
  events,
  eventAgeGroups,
  eventComplexes,
  eventFieldSizes,
  gameTimeSlots,
  tournamentGroups,
  teams,
  games
} from "@db/schema";
import { eq, sql, count, and, gte, lte } from "drizzle-orm";
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

    // Add this new update endpoint after the existing event creation endpoint
    app.patch('/api/admin/events/:id', isAdmin, async (req, res) => {
      try {
        const eventId = parseInt(req.params.id);
        const eventData = req.body;

        // Start a transaction to update event and related records
        await db.transaction(async (tx) => {
          // Update the event
          const [updatedEvent] = await tx
            .update(events)
            .set({
              name: eventData.name,
              startDate: eventData.startDate,
              endDate: eventData.endDate,
              timezone: eventData.timezone,
              applicationDeadline: eventData.applicationDeadline,
              details: eventData.details || null,
              agreement: eventData.agreement || null,
              refundPolicy: eventData.refundPolicy || null,
              updatedAt: new Date().toISOString(),
            })
            .where(eq(events.id, eventId))
            .returning();

          if (!updatedEvent) {
            return res.status(404).send("Event not found");
          }

          // First, delete tournament groups associated with the event's age groups
          await tx
            .delete(tournamentGroups)
            .where(eq(tournamentGroups.eventId, eventId));

          // Then delete age groups
          await tx
            .delete(eventAgeGroups)
            .where(eq(eventAgeGroups.eventId, eventId));

          // Create new age groups
          for (const group of eventData.ageGroups) {
            await tx
              .insert(eventAgeGroups)
              .values({
                eventId: eventId,
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

          // Update complex assignments
          await tx
            .delete(eventComplexes)
            .where(eq(eventComplexes.eventId, eventId));

          for (const complexId of eventData.selectedComplexIds) {
            await tx
              .insert(eventComplexes)
              .values({
                eventId: eventId,
                complexId: complexId,
                createdAt: new Date().toISOString(),
              });
          }

          // Update field size assignments
          await tx
            .delete(eventFieldSizes)
            .where(eq(eventFieldSizes.eventId, eventId));

          for (const [fieldId, fieldSize] of Object.entries(eventData.complexFieldSizes)) {
            await tx
              .insert(eventFieldSizes)
              .values({
                eventId: eventId,
                fieldId: parseInt(fieldId),
                fieldSize: fieldSize,
                createdAt: new Date().toISOString(),
              });
          }
        });

        res.json({ message: "Event updated successfully" });
      } catch (error) {
        console.error('Error updating event:', error);
        let errorMessage = "Failed to update event";
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

    // Add this new endpoint to get event details for editing
    app.get('/api/admin/events/:id/edit', isAdmin, async (req, res) => {
      try {
        const eventId = parseInt(req.params.id);

        // Get event details
        const [event] = await db
          .select()
          .from(events)
          .where(eq(events.id, eventId));

        if (!event) {
          return res.status(404).send("Event not found");
        }

        // Get age groups
        const ageGroups = await db
          .select()
          .from(eventAgeGroups)
          .where(eq(eventAgeGroups.eventId, eventId));

        // Get complex assignments
        const complexAssignments = await db
          .select()
          .from(eventComplexes)
          .where(eq(eventComplexes.eventId, eventId));

        // Get field size assignments
        const fieldSizes = await db
          .select()
          .from(eventFieldSizes)
          .where(eq(eventFieldSizes.eventId, eventId));

        // Format response
        const response = {
          ...event,
          ageGroups,
          selectedComplexIds: complexAssignments.map(a => a.complexId),
          complexFieldSizes: Object.fromEntries(
            fieldSizes.map(f => [f.fieldId, f.fieldSize])
          )
        };

        res.json(response);
      } catch (error) {
        console.error('Error fetching event details:', error);
        res.status(500).send("Failed to fetch event details");
      }
    });

    // Add these new endpoints for scheduling functionality
    app.get('/api/admin/events/:id/schedule', isAdmin, async (req, res) => {
      try {
        const eventId = parseInt(req.params.id);

        // Fetch all games for this event with related data
        const schedule = await db
          .select({
            game: games,
            homeTeam: teams,
            awayTeam: sql<{ id: number; name: string }>`json_build_object('id', ${sql.raw('away_teams')}.id, 'name', ${sql.raw('away_teams')}.name)`,
            field: fields,
            timeSlot: gameTimeSlots,
            ageGroup: eventAgeGroups,
          })
          .from(games)
          .leftJoin(teams, eq(games.homeTeamId, teams.id))
          .leftJoin(sql.raw('teams as away_teams'), eq(games.awayTeamId, sql.raw('away_teams.id')))
          .leftJoin(fields, eq(games.fieldId, fields.id))
          .leftJoin(gameTimeSlots, eq(games.timeSlotId, gameTimeSlots.id))
          .leftJoin(eventAgeGroups, eq(games.ageGroupId, eventAgeGroups.id))
          .where(eq(games.eventId, eventId))
          .orderBy(gameTimeSlots.startTime);

        // Format the schedule for frontend display with null checks
        const formattedSchedule = schedule
          .filter(item => item.timeSlot && item.field && item.homeTeam && item.ageGroup)
          .map(item => ({
            id: item.game.id,
            startTime: item.timeSlot!.startTime,
            endTime: item.timeSlot!.endTime,
            fieldName: item.field!.name,
            ageGroup: item.ageGroup!.ageGroup,
            homeTeam: item.homeTeam!.name,
            awayTeam: (item.awayTeam as { name: string }).name,
            status: item.game.status,
          }));

        res.json({ games: formattedSchedule });
      } catch (error) {
        console.error('Error fetching schedule:', error);
        res.status(500).send("Failed to fetch schedule");
      }
    });

    app.post('/api/admin/events/:id/generate-schedule', isAdmin, async (req, res) => {
      try {
        const eventId = parseInt(req.params.id);
        const { gamesPerDay, minutesPerGame, breakBetweenGames } = req.body;

        // Start a transaction for the entire schedule generation process
        await db.transaction(async (tx) => {
          // 1. Fetch event details
          const [event] = await tx
            .select()
            .from(events)
            .where(eq(events.id, eventId));

          if (!event) {
            throw new Error("Event not found");
          }

          // 2. Fetch all age groups for this event
          const ageGroups = await tx
            .select()
            .from(eventAgeGroups)
            .where(eq(eventAgeGroups.eventId, eventId));

          // 3. Fetch all available fields
          const eventFields = await tx
            .select({
              field: fields,
              complex: complexes,
            })
            .from(eventComplexes)
            .innerJoin(fields, eq(eventComplexes.complexId, fields.complexId))
            .innerJoin(complexes, eq(eventComplexes.complexId, complexes.id))
            .where(eq(eventComplexes.eventId, eventId));

          // 4. Generate time slots for each day
          const startDate = new Date(event.startDate);
          const endDate = new Date(event.endDate);
          const dayCount = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

          for (let dayIndex = 0; dayIndex < dayCount; dayIndex++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(currentDate.getDate() + dayIndex);

            for (const { field, complex } of eventFields) {
              const complexOpenTime = new Date(`${currentDate.toISOString().split('T')[0]}T${complex.openTime}`);
              const complexCloseTime = new Date(`${currentDate.toISOString().split('T')[0]}T${complex.closeTime}`);

              let currentTime = complexOpenTime;
              while (currentTime.getTime() + (minutesPerGame * 60 * 1000) <= complexCloseTime.getTime()) {
                const endTime = new Date(currentTime.getTime() + (minutesPerGame * 60 * 1000));

                await tx.insert(gameTimeSlots).values({
                  eventId,
                  fieldId: field.id,
                  startTime: currentTime.toISOString(),
                  endTime: endTime.toISOString(),
                  dayIndex,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                });

                // Add break time before next game
                currentTime = new Date(endTime.getTime() + (breakBetweenGames * 60 * 1000));
              }
            }
          }

          // 5. Create tournament groups for each age group
          for (const ageGroup of ageGroups) {
            await tx.insert(tournamentGroups).values({
              eventId,
              ageGroupId: ageGroup.id,
              name: `Group A - ${ageGroup.ageGroup}`,
              type: 'round_robin',
              stage: 'group',
              createdAt: new Date().toISOString(),
            });
          }

          // 6. Schedule will be generated based on registered teams
          // This will be implemented in a separate endpoint once teams are registered
        });

        res.json({ message: "Schedule framework generated successfully" });
      } catch (error) {
        console.error('Error generating schedule:', error);
        res.status(500).send("Failed to generate schedule");
      }
    });

    // Teams management endpoints
    app.get('/api/admin/teams', isAdmin, async (req, res) => {
      try {
        const { eventId, ageGroup } = req.query;

        if (!eventId || !ageGroup) {
          return res.status(400).send("Event ID and age group are required");
        }

        const [ageGroupRecord] = await db
          .select()
          .from(eventAgeGroups)
          .where(
            and(
              eq(eventAgeGroups.eventId, Number(eventId)),
              eq(eventAgeGroups.ageGroup, ageGroup as string)
            )
          );

        if (!ageGroupRecord) {
          return res.status(404).send("Age group not found");
        }

        const teamsList = await db
          .select()
          .from(teams)
          .where(
            and(
              eq(teams.eventId, Number(eventId)),
              eq(teams.ageGroupId, ageGroupRecord.id)
            )
          )
          .orderBy(teams.name);

        res.json(teamsList);
      } catch (error) {
        console.error('Error fetching teams:', error);
        res.status(500).send("Failed to fetch teams");
      }
    });

    app.post('/api/admin/teams', isAdmin, async (req, res) => {
      try {
        const { name, eventId, ageGroup } = req.body;

        if (!name || !eventId || !ageGroup) {
          return res.status(400).send("Name, event ID, and age group are required");
        }

        // Get the age group ID first
        const [ageGroupRecord] = await db
          .select()
          .from(eventAgeGroups)
          .where(and(
            eq(eventAgeGroups.eventId, eventId),
            eq(eventAgeGroups.ageGroup, ageGroup)
          ));

        if (!ageGroupRecord) {
          return res.status(404).send("Age group not found");
        }

        // Create the team
        const [newTeam] = await db
          .insert(teams)
          .values({
            name,
            eventId,
            ageGroupId: ageGroupRecord.id,
            createdAt: new Date().toISOString(),
          })
          .returning();

        res.json(newTeam);
      } catch (error) {
        console.error('Error creating team:', error);
        res.status(500).send("Failed to create team");
      }
    });

    // Add endpoint to get age groups for an event
    app.get('/api/admin/events/:id/age-groups', isAdmin, async (req, res) => {
      try {
        const eventId = parseInt(req.params.id);

        const ageGroups = await db
          .select({
            ageGroup: eventAgeGroups.ageGroup,
            gender: eventAgeGroups.gender,
            teamCount: sql<number>`count(${teams.id})`.mapWith(Number)
          })
          .from(eventAgeGroups)
          .leftJoin(teams, eq(teams.ageGroupId, eventAgeGroups.id))
          .where(eq(eventAgeGroups.eventId, eventId))
          .groupBy(eventAgeGroups.id, eventAgeGroups.ageGroup, eventAgeGroups.gender)
          .orderBy(eventAgeGroups.ageGroup);

        res.json(ageGroups);
      } catch (error) {
        console.error('Error fetching age groups:', error);
        res.status(500).send("Failed to fetch age groups");
      }
    });

    return httpServer;

  } catch (error) {
    log("Error registering routes: " + (error as Error).message);
    throw error;
  }
}