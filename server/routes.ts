import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { log } from "./vite";
import { db } from "@db";
import seasonalScopesRouter from "./routes/seasonal-scopes";
import uploadRouter from "./routes/upload";
import { createCoupon, getCoupons, updateCoupon, deleteCoupon } from "./routes/coupons";
import { sql, eq, and, or, inArray } from "drizzle-orm";
import {
  users,
  organizationSettings,
  complexes,
  fields,
  events,
  eventAgeGroups,
  gameTimeSlots,
  tournamentGroups,
  teams,
  games,
  eventScoringRules,
  chatRooms,
  chatParticipants,
  messages,
  households,
  householdInvitations,
  roles,
  adminRoles,
  eventComplexes,
  eventFieldSizes,
  files,
  coupons,
  eventFormTemplates,
  formFields,
  formFieldOptions,
  formResponses,
} from "@db/schema";
import fs from "fs/promises";
import path from "path";
import { crypto } from "./crypto";
import session from "express-session";
import passport from "passport";
import { setupWebSocketServer } from "./websocket";
import { randomBytes } from "crypto";

// Admin middleware (unchanged)
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
  setupWebSocketServer(httpServer);

  try {
    // Set up authentication first
    setupAuth(app);
    log("Authentication routes registered successfully");

    // Register seasonal scopes routes with admin middleware
    app.use('/api/admin/seasonal-scopes', isAdmin, seasonalScopesRouter);

    // Register coupon routes
    app.post('/api/admin/coupons', isAdmin, createCoupon);
    app.get('/api/admin/coupons', isAdmin, getCoupons);
    app.patch('/api/admin/coupons/:id', isAdmin, updateCoupon);
    app.delete('/api/admin/coupons/:id', isAdmin, deleteCoupon);

    // Public event endpoint
    app.get('/api/events/:id', async (req, res) => {
      try {
        const eventId = req.params.id;
        const [event] = await db
          .select({
            id: events.id,
            name: events.name,
            startDate: events.startDate,
            endDate: events.endDate,
            applicationDeadline: events.applicationDeadline,
            details: events.details,
          })
          .from(events)
          .where(eq(events.id, eventId));

        if (!event) {
          return res.status(404).send("Event not found");
        }

        res.json(event);
      } catch (error) {
        console.error('Error fetching event:', error);
        res.status(500).send("Failed to fetch event details");
      }
    });

    // Admin event details endpoint
    app.get('/api/admin/events/:id', isAdmin, async (req, res) => {
      try {
        const eventId = req.params.id; // Remove parseInt since ID is string

        // Simplified query to get basic event data
        const event = await db
          .select({
            id: events.id,
            name: events.name,
            startDate: events.startDate,
            endDate: events.endDate,
            applicationDeadline: events.applicationDeadline,
            timezone: events.timezone,
            details: events.details,
            agreement: events.agreement,
            refundPolicy: events.refundPolicy,
            createdAt: events.createdAt,
            updatedAt: events.updatedAt
          })
          .from(events)
          .where(eq(events.id, eventId))
          .limit(1);

        if (!event || event.length === 0) {
          return res.status(404).json({ message: "Event not found" });
        }

        res.json(event[0]);
      } catch (error) {
        console.error('Error fetching event details:', error);
        console.error("Error details:", error);
        res.status(500).json({ message: "Failed to fetch event details" });
      }
    });

    // Admin email check endpoint
    app.get('/api/admin/check-email', isAdmin, async (req, res) => {
      try {
        const email = req.query.email as string;

        if (!email) {
          return res.status(400).json({ exists: false, message: "Email is required" });
        }

        // Check if email exists in users table with isAdmin=true
        const [existingAdmin] = await db
          .select()
          .from(users)
          .where(
            and(
              eq(users.email, email),
              eq(users.isAdmin, true)
            )
          )
          .limit(1);

        // Add a small delay to prevent brute force attempts
        await new Promise(resolve => setTimeout(resolve, 200));

        return res.json({
          exists: !!existingAdmin,
          message: existingAdmin ? "Email is already registered" : undefined
        });
      } catch (error) {
        console.error('Error checking admin email:', error);
        // Added basic error logging for white screen debugging.
        console.error("Error details:", error);
        return res.status(500).json({ exists: false, message: "Internal server error" });
      }
    });

    // Administrator creation endpoint
    app.post('/api/admin/administrators', isAdmin, async (req, res) => {
      try {
        const { email, firstName, lastName, password, roles } = req.body;

        // Verify if email exists
        const [existingUser] = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        if (existingUser) {
          return res.status(400).send("Email already registered");
        }

        // Start a transaction to create user and assign roles
        await db.transaction(async (tx) => {
          // Create the user
          const hashedPassword = await crypto.hash(password);
          const [newAdmin] = await tx
            .insert(users)
            .values({
              email,
              username: email,
              firstName,
              lastName,
              password: hashedPassword,
              isAdmin: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            })
            .returning({
              id: users.id,
              email: users.email,
              username: users.username,
              firstName: users.firstName,
              lastName: users.lastName,
              isAdmin: users.isAdmin
            });

          // Ensure we have valid roles
          if (!Array.isArray(roles) || roles.length === 0) {
            throw new Error("At least one role is required");
          }

          // Get or create roles
          for (const roleName of roles) {
            // Get or create the role
            let role = await tx
              .select()
              .from(roles)
              .where(eq(roles.name, roleName))
              .limit(1)
              .then(rows => rows[0]);

            if (!role) {
              [role] = await tx
                .insert(roles)
                .values({
                  name: roleName,
                  description: `${roleName.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} role`,
                })
                .returning();
            }

            // Assign role to admin
            await tx
              .insert(adminRoles)
              .values({
                userId: newAdmin.id,
                roleId: role.id,
              });
          }
        });

        res.json({ message: "Administrator created successfully" });
      } catch (error) {
        console.error('Error creating administrator:', error);
        // Added basic error logging for white screen debugging.
        console.error("Error details:", error);
        res.status(500).send(error instanceof Error ? error.message : "Failed to create administrator");
      }
    });

    // Add administrator update endpoint
    app.patch('/api/admin/administrators/:id', isAdmin, async (req, res) => {
      try {
        const adminId = parseInt(req.params.id);
        const { email, firstName, lastName, roles } = req.body;

        // Verify admin exists
        const [existingAdmin] = await db
          .select({
            admin: users,
            roles: sql<string[]>`array_agg(${roles.name})`,
          })
          .from(users)
          .leftJoin(adminRoles, eq(users.id, adminRoles.userId))
          .leftJoin(roles, eq(adminRoles.roleId, roles.id))
          .where(eq(users.id, adminId))
          .groupBy(users.id)
          .limit(1);

        if (!existingAdmin) {
          return res.status(404).send("Administrator not found");
        }

        // If removing super_admin role, check if this is the last super admin
        const isSuperAdmin = existingAdmin.roles.includes('super_admin');
        const willRemoveSuperAdmin = isSuperAdmin && !roles.includes('super_admin');

        if (willRemoveSuperAdmin) {
          // Count other super admins
          const [{ count }] = await db
            .select({
              count: sql`COUNT(*)`,
            })
            .from(users)
            .innerJoin(adminRoles, eq(users.id, adminRoles.userId))
            .innerJoin(roles, eq(adminRoles.roleId, roles.id))
            .where(
              and(
                eq(roles.name, 'super_admin'),
                sql`${users.id} != ${adminId}`
              )
            );

          if (count === 0) {
            return res.status(400).json({
              error: "Cannot remove super_admin role from the last super administrator",
              code: "LAST_SUPER_ADMIN"
            });
          }
        }

        // If email is being changed, check if new email is available
        if (email !== existingAdmin.admin.email) {
          const [emailExists] = await db
            .select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1);

          if (emailExists) {
            return res.status(400).json({
              error: "Email already registered",
              code: "EMAIL_EXISTS"
            });
          }
        }

        // Start a transaction to update user and roles
        await db.transaction(async (tx) => {
          // Update user details
          await tx
            .update(users)
            .set({
              email,
              username: email,
              firstName,
              lastName,
              updatedAt: new Date().toISOString(),
            })
            .where(eq(users.id, adminId));

          // Remove existing roles
          await tx
            .delete(adminRoles)
            .where(eq(adminRoles.userId, adminId));

          // Add new roles
          for (const roleName of roles) {
            // Get or create the role
            let role = await tx
              .select()
              .from(roles)
              .where(eq(roles.name, roleName))
              .limit(1)
              .then(rows => rows[0]);

            if (!role) {
              [role] = await tx
                .insert(roles)
                .values({
                  name: roleName,
                  description: `${roleName.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} role`,
                })
                .returning();
            }

            // Assign role to admin
            await tx
              .insert(adminRoles)
              .values({
                userId: adminId,
                roleId: role.id,
              });
          }
        });

        // Fetch updated admin data
        const [updatedAdmin] = await db
          .select({
            id: users.id,
            email: users.email,
            firstName: users.firstName,
            lastName: users.lastName,
            roles: sql<string[]>`array_agg(${roles.name})`,
          })
          .from(users)
          .leftJoin(adminRoles, eq(users.id, adminRoles.userId))
          .leftJoin(roles, eq(adminRoles.roleId, roles.id))
          .where(eq(users.id, adminId))
          .groupBy(users.id)
          .limit(1);

        res.json({
          message: "Administrator updated successfully",
          admin: updatedAdmin
        });
      } catch (error) {
        console.error('Error updating administrator:', error);
        console.error("Error details:", error);
        res.status(500).json({
          error: error instanceof Error ? error.message : "Failed to update administrator",
          code: "UPDATE_FAILED"
        });
      }
    });

    // Add administrator deletion endpoint
    app.delete('/api/admin/administrators/:id', isAdmin, async (req, res) => {
      try {
        const adminId = parseInt(req.params.id);

        // Verify admin exists and is not the last super admin
        const [adminToDelete] = await db
          .select({
            admin: users,
            roles: sql<string[]>`array_agg(${roles.name})`,
          })
          .from(users)
          .leftJoin(adminRoles, eq(users.id, adminRoles.userId))
          .leftJoin(roles, eq(adminRoles.roleId, roles.id))
          .where(eq(users.id, adminId))
          .groupBy(users.id)
          .limit(1);

        if (!adminToDelete) {
          return res.status(404).send("Administrator not found");
        }

        // Check if this is a super admin
        const isSuperAdmin = adminToDelete.roles.includes('super_admin');
        if (isSuperAdmin) {
          // Count other super admins
          const [{ count }] = await db
            .select({
              count: sql`COUNT(*)`,
            })
            .from(users)
            .innerJoin(adminRoles, eq(users.id, adminRoles.userId))
            .innerJoin(roles, eq(adminRoles.roleId, roles.id))
            .where(
              and(
                eq(roles.name, 'super_admin'),
                sql`${users.id} != ${adminId}`
              )
            );

          if (count === 0) {
            return res.status(400).send("Cannot delete the last super administrator");
          }
        }

        // Start a transaction to delete admin roles and user
        await db.transaction(async (tx) => {
          // Delete admin roles
          await tx
            .delete(adminRoles)
            .where(eq(adminRoles.userId, adminId));

          // Delete user
          await tx
            .delete(users)
            .where(eq(users.id, adminId));
        });

        res.json({ message: "Administrator deleted successfully" });
      } catch (error) {
        console.error('Error deleting administrator:', error);
        console.error("Error details:", error);
        res.status(500).send(error instanceof Error ? error.message : "Failed to delete administrator");
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

        return res.json({
          available: !existingUser,
          message: existingUser ? "Email is already in use" : undefined
        });
      } catch (error) {
        console.error('Error checking email availability:', error);
        // Added basic error logging for white screen debugging.
        console.error("Error details:", error);
        return res.status(500).json({ available: false, message: "Internal server error" });
      }
    });

    // Add household invitation endpoints
    app.post('/api/household/invite', async (req, res) => {
      if (!req.isAuthenticated()) {
        return res.status(401).send("Not authenticated");
      }

      try {
        const { email } = req.body;
        const userId = req.user.id;
        const householdId = req.user.householdId;

        if (!householdId) {
          return res.status(400).send("You must be part of a household to send invitations");
        }

        // Check if email exists in the system
        const [existingUser] = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        if (existingUser) {
          return res.status(400).send("This email is already registered in the system");
        }

        // Check for existing pending invitation
        const [existingInvitation] = await db
          .select()
          .from(householdInvitations)
          .where(
            and(
              eq(householdInvitations.email, email),
              eq(householdInvitations.status, 'pending')
            )
          )
          .limit(1);

        if (existingInvitation) {
          return res.status(400).send("An invitation is already pending for this email");
        }

        // Generate invitation token and set expiration
        const token = randomBytes(32).toString('hex');
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24); // Expires in 24 hours

        // Create invitation
        const [invitation] = await db
          .insert(householdInvitations)
          .values({
            householdId: householdId,
            email: email,
            token: token,
            status: 'pending',
            expiresAt: expiresAt,
            createdBy: userId,
            createdAt: new Date().toISOString(),
          } as typeof householdInvitations.$inferInsert)
          .returning();

        // TODO: Send email with invitation link

        res.json({ message: "Invitation sent successfully", invitation });
      } catch (error) {
        console.error('Error sending invitation:', error);
        // Added basic error logging for white screen debugging.
        console.error("Error details:", error);
        res.status(500).send("Failed to send invitation");
      }
    });

    app.get('/api/household/invitations', async (req, res) => {
      if (!req.isAuthenticated()) {
        return res.status(401).send("Not authenticated");
      }

      try {
        const householdId = req.user.householdId;

        if (!householdId) {
          return res.status(400).send("You must be part of a household to view invitations");
        }

        const invitations = await db
          .select({
            invitation: householdInvitations,
            createdByUser: {
              id: users.id,
              firstName: users.firstName,
              lastName: users.lastName,
              email: users.email,
            },
          })
          .from(householdInvitations)
          .leftJoin(users, eq(householdInvitations.createdBy, users.id))
          .where(eq(householdInvitations.householdId, householdId));

        res.json(invitations);
      } catch (error) {
        console.error('Error fetching invitations:', error);
        // Added basic error logging for white screen debugging.
        console.error("Error details:", error);
        res.status(500).send("Failed to fetch invitations");
      }
    });

    app.post('/api/household/invitations/:token/accept', async (req, res) => {
      if (!req.isAuthenticated()) {
        return res.status(401).send("Not authenticated");
      }

      try {
        const { token } = req.params;
        const userId = req.user.id;

        // Find and validate invitation
        const [invitation] = await db
          .select()
          .from(householdInvitations)
          .where(
            and(
              eq(householdInvitations.token, token),
              eq(householdInvitations.status, 'pending')
            )
          )
          .limit(1);

        if (!invitation) {
          return res.status(404).send("Invalid or expired invitation");
        }

        if (new Date(invitation.expiresAt) < new Date()) {
          await db
            .update(householdInvitations)
            .set({ status: 'expired' })
            .where(eq(householdInvitations.id, invitation.id));

          return res.status(400).send("Invitation has expired");
        }

        if (req.user.email !== invitation.email) {
          return res.status(403).send("This invitation was sent to a different email address");
        }

        // Update user's household
        await db
          .update(users)
          .set({ householdId: invitation.householdId })
          .where(eq(users.id, userId));

        // Mark invitation as accepted
        await db
          .update(householdInvitations)
          .set({ status: 'accepted' })
          .where(eq(householdInvitations.id, invitation.id));

        res.json({ message: "Invitation accepted successfully" });
      } catch (error) {
        console.error('Error accepting invitation:', error);
        // Added basic error logging for white screen debugging.
        console.error("Error details:", error);
        res.status(500).send("Failed to accept invitation");
      }
    });

    app.post('/api/household/invitations/:token/decline', async (req, res) => {
      if (!req.isAuthenticated()) {
        return res.status(401).send("Not authenticated");
      }

      try {
        const { token } = req.params;

        // Find and validate invitation
        const [invitation] = await db
          .select()
          .from(householdInvitations)
          .where(
            and(
              eq(householdInvitations.token, token),
              eq(householdInvitations.status, 'pending')
            )
          )
          .limit(1);

        if (!invitation) {
          return res.status(404).send("Invalid or expired invitation");
        }

        if (req.user.email !== invitation.email) {
          return res.status(403).send("This invitation was sent to a different email address");
        }

        // Mark invitation as declined
        await db
          .update(householdInvitations)
          .set({ status: 'declined' })
          .where(eq(householdInvitations.id, invitation.id));

        res.json({ message: "Invitation declined successfully" });
      } catch (error) {
        console.error('Error declining invitation:', error);
        // Added basic error logging for white screen debugging.
        console.error("Error details:", error);
        res.status(500).send("Failed to decline invitation");
      }
    });

    // Complex management routes
    app.get('/api/admin/complexes', isAdmin, async (req, res) => {
      try {
        const complexesWithFields = await db
          .select({
            complex: {
              id: complexes.id,
              name: complexes.name,
              address: complexes.address,
              city: complexes.city,
              state: complexes.state,
              country: complexes.country,
              openTime: complexes.openTime,
              closeTime: complexes.closeTime,
              rules: complexes.rules,
              directions: complexes.directions,
              isOpen: complexes.isOpen,
              createdAt: complexes.createdAt,
              updatedAt: complexes.updatedAt,
            },
            fields: sql<any>`json_agg(
              CASE WHEN ${fields.id} IS NOT NULL THEN
                json_build_object(
                  'id', ${fields.id},
                  'name', ${fields.name},
                  'hasLights', ${fields.hasLights},
                  'hasParking', ${fields.hasParking},
                  'isOpen', ${fields.isOpen},
                  'specialInstructions', ${fields.specialInstructions}
                )
              ELSE NULL
              END
            )`.mapWith((f) => f === null ? [] : f.filter(Boolean)),
            openFields: sql<number>`count(case when ${fields.isOpen} = true then 1 end)`.mapWith(Number),
            closedFields: sql<number>`count(case when ${fields.isOpen} = false then 1 end)`.mapWith(Number),
          })
          .from(complexes)
          .leftJoin(fields, eq(complexes.id, fields.complexId))
          .groupBy(complexes.id)
          .orderBy(complexes.name);

        // Format the response
        const formattedComplexes = complexesWithFields.map(({ complex, fields, openFields, closedFields }) => ({
          ...complex,
          fields: fields || [],
          openFields,
          closedFields
        }));

        // Add debug logging
        console.log('Complexes retrieved:', formattedComplexes.length);

        res.json(formattedComplexes);
      } catch (error) {
        console.error('Error fetching complexes:', error);
        // Added basic error logging for white screen debugging.
        console.error("Error details:", error);
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
        // Added basic error logging for white screen debugging.
        console.error("Error details:", error);
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
        // Added basic error logging for white screen debugging.
        console.error("Error details:", error);
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

          // Update all fields based on complex status
          await tx
            .update(fields)
            .set({
              isOpen,
              updatedAt: new Date().toISOString(),
            })
            .where(eq(fields.complexId, complexId));

          res.json(updatedComplex);
        });
      } catch (error) {
        console.error('Error updating complex status:', error);
        // Added basic error logging for white screen debugging.
        console.error("Error details:", error);
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
        // Added basic error logging for white screen debugging.
        console.error("Error details:", error);
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
        // Added basic error logging for white screen debugging.
        console.error("Error details:", error);
        res.status(500).send("Failed to fetch analytics");
      }
    });


    // Organization settings endpoints
    app.get('/api/admin/organization-settings', isAdmin, async (req, res) => {
      try {
        const [settings] = await db
          .select({
            id: organizationSettings.id,
            name: organizationSettings.name,
            primaryColor: organizationSettings.primaryColor,
            secondaryColor: organizationSettings.secondaryColor,
            logoUrl: organizationSettings.logoUrl,
            createdAt: organizationSettings.createdAt,
            updatedAt: organizationSettings.updatedAt,
          })
          .from(organizationSettings)
          .limit(1);

        res.json(settings || {});
      } catch (error) {
        console.error('Error fetching organization settings:', error);
        // Added basic error logging for white screen debugging.
        console.error("Error details:", error);
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
              ...req.body,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            })
            .returning();
        }

        res.json(settings);
      } catch (error) {
        console.error('Error updating organization settings:', error);
        console.error("Error details:", error);
        res.status(500).send("Internal server error");
      }
    });

    // Coupon management endpoints
    app.get('/api/admin/coupons', isAdmin, async (req, res) => {
      try {
        const eventId = req.query.eventId ? Number(req.query.eventId) : undefined;
        const query = db.select().from(coupons);

        if (eventId) {
          query.where(eq(coupons.eventId, eventId));
        }

        const allCoupons = await query;
        res.json(allCoupons);
      } catch (error) {
        console.error('Error fetching coupons:', error);
        res.status(500).json({ message: "Failed to fetch coupons" });
      }
    });

    app.post('/api/admin/coupons', isAdmin, async (req, res) => {
      try {
        const {
          code,
          discountType,
          amount,
          expirationDate,
          description,
          eventId,
          maxUses,
        } = req.body;

        // Verify if coupon code already exists
        const [existingCoupon] = await db
          .select()
          .from(coupons)
          .where(eq(coupons.code, code))
          .limit(1);

        if (existingCoupon) {
          return res.status(400).json({ message: "Coupon code already exists" });
        }

        // Convert eventId to number or null
        const numericEventId = eventId ? Number(eventId) : null;

        const [newCoupon] = await db
          .insert(coupons)
          .values({
            code,
            discountType,
            amount: Number(amount),
            expirationDate: expirationDate ? new Date(expirationDate) : null,
            description: description || null,
            eventId: numericEventId,
            maxUses: maxUses ? Number(maxUses) : null,
            usageCount: 0,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();

        res.json(newCoupon);
      } catch (error) {
        console.error('Error creating coupon:', error);
        res.status(500).json({ message: "Failed to create coupon" });
      }
    });

    app.patch('/api/admin/coupons/:id', isAdmin, async (req, res) => {
      try {
        const couponId = parseInt(req.params.id);
        const {
          code,
          discountType,
          amount,
          expirationDate,
          description,
          eventId,
          maxUses,
          isActive
        } = req.body;

        // Check if the coupon exists
        const [existingCoupon] = await db
          .select()
          .from(coupons)
          .where(eq(coupons.id, couponId))
          .limit(1);

        if (!existingCoupon) {
          return res.status(404).json({ message: "Coupon not found" });
        }

        // Check if the new code already exists (if code is being changed)
        if (code !== existingCoupon.code) {
          const [duplicateCoupon] = await db
            .select()
            .from(coupons)
            .where(eq(coupons.code, code))
            .limit(1);

          if (duplicateCoupon) {
            return res.status(400).json({ message: "Coupon code already exists" });
          }
        }

        // Convert eventId to number or null
        const numericEventId = eventId ? Number(eventId) : null;

        const [updatedCoupon] = await db
          .update(coupons)
          .set({
            code,
            discountType,
            amount: Number(amount),
            expirationDate: expirationDate ? new Date(expirationDate) : null,
            description: description || null,
            eventId: numericEventId,
            maxUses: maxUses ? Number(maxUses) : null,
            isActive,
            updatedAt: new Date()
          })
          .where(eq(coupons.id, couponId))
          .returning();

        res.json(updatedCoupon);
      } catch (error) {
        console.error('Error updating coupon:', error);
        res.status(500).json({ message: "Failed to update coupon" });
      }
    }); 

    // Coupon management endpoints
    app.get('/api/admin/coupons', isAdmin, async (req, res) => {
      try {
        const eventId = req.query.eventId ? Number(req.query.eventId) : undefined;
        const query = db.select().from(coupons);

        if (eventId) {
          query.where(eq(coupons.eventId, eventId));
        }

        const allCoupons = await query;
        res.json(allCoupons);
      } catch (error) {
        console.error('Error fetching coupons:', error);
        res.status(500).json({ message: "Failed to fetch coupons" });
      }
    });

    app.post('/api/admin/coupons', isAdmin, async (req, res) => {
      try {
        const {
          code,
          discountType,
          amount,
          expirationDate,
          description,
          eventId,
          maxUses,
        } = req.body;

        // Verify if coupon code already exists
        const [existingCoupon] = await db
          .select()
          .from(coupons)
          .where(eq(coupons.code, code))
          .limit(1);

        if (existingCoupon) {
          return res.status(400).json({ message: "Coupon code already exists" });
        }

        // Convert eventId to number or null
        const numericEventId = eventId ? Number(eventId) : null;

        const [newCoupon] = await db
          .insert(coupons)
          .values({
            code,
            discountType,
            amount: Number(amount),
            expirationDate: expirationDate ? new Date(expirationDate) : null,
            description: description || null,
            eventId: numericEventId,
            maxUses: maxUses ? Number(maxUses) : null,
            usageCount: 0,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();

        res.json(newCoupon);
      } catch (error) {
        console.error('Error creating coupon:', error);
        res.status(500).json({ message: "Failed to create coupon" });
      }
    });

    app.patch('/api/admin/coupons/:id', isAdmin, async (req, res) => {
      try {
        const couponId = parseInt(req.params.id);
        const {
          code,
          discountType,
          amount,
          expirationDate,
          description,
          eventId,
          maxUses,
          isActive
        } = req.body;

        // Check if the coupon exists
        const [existingCoupon] = await db
          .select()
          .from(coupons)
          .where(eq(coupons.id, couponId))
          .limit(1);

        if (!existingCoupon) {
          return res.status(404).json({ message: "Coupon not found" });
        }

        // Check if the new code already exists (if code is being changed)
        if (code !== existingCoupon.code) {
          const [duplicateCoupon] = await db
            .select()
            .from(coupons)
            .where(eq(coupons.code, code))
            .limit(1);

          if (duplicateCoupon) {
            return res.status(400).json({ message: "Coupon code already exists" });
          }
        }

        // Convert eventId to number or null
        const numericEventId = eventId ? Number(eventId) : null;

        const [updatedCoupon] = await db
          .update(coupons)
          .set({
            code,
            discountType,
            amount: Number(amount),
            expirationDate: expirationDate ? new Date(expirationDate) : null,
            description: description || null,
            eventId: numericEventId,
            maxUses: maxUses ? Number(maxUses) : null,
            isActive,
            updatedAt: new Date()
          })
          .where(eq(coupons.id, couponId))
          .returning();

        res.json(updatedCoupon);
      } catch (error) {
        console.error('Error updating coupon:', error);
        res.status(500).json({ message: "Failed to update coupon" });
      }
    });

    app.delete('/api/admin/coupons/:id', isAdmin, async (req, res) => {
      try {
        const couponId = parseInt(req.params.id);

        const [deletedCoupon] = await db
          .delete(coupons)
          .where(eq(coupons.id, couponId))
          .returning();

        if (!deletedCoupon) {
          return res.status(404).json({ message: "Coupon not found" });
        }

        res.json({ message: "Coupon deleted successfully" });
      } catch (error) {
        console.error('Error deleting coupon:', error);
        res.status(500).json({ message: "Failed to delete coupon" });
      }
    });

    // Styling settings endpoints
    app.get('/api/admin/styling', isAdmin, async (req, res) => {
      try {
        const [settings] = await db
          .select({
            id: organizationSettings.id,
            name: organizationSettings.name,
            primaryColor: organizationSettings.primaryColor,
            secondaryColor: organizationSettings.secondaryColor,
            logoUrl: organizationSettings.logoUrl,
          })
          .from(organizationSettings)
          .limit(1);

        // Convert database values to style config format
        const styleConfig = {
          primary: settings?.primaryColor || '#000000',
          secondary: settings?.secondaryColor || '#32CD32',
          accent: '#FF8C00',
          background: '#F5F5F6',
          foreground: '#000000',
          border: '#CCCCCCCC',
          muted: '#999999',
          hover: '#FF8C00',
          active: '#32CD32',
          success: '#32CD32',
          warning: '#FF8C00',
          destructive: '#E63946',
          superAdmin: '#DB4D4D',
          tournamentAdmin: '#4CAF50',
          scoreAdmin: '#4169E1',
          financeAdmin: '#9C27B0',
          logoUrl: settings?.logoUrl || '/uploads/MatchProAI_Linear_Black.png',
          youtubeVideoId: '8DFc6wHHWPY'
        };

        res.json(styleConfig);
      } catch (error) {
        console.error('Error fetching styling settings:', error);
        res.status(500).send("Internal server error");
      }
    });

    app.post('/api/admin/styling', isAdmin, async (req, res) => {
      try {
        const styleConfig = req.body;

        // Update organization settings with the new colors
        const [settings] = await db
          .select()
          .from(organizationSettings)
          .limit(1);

        if (settings) {
          await db
            .update(organizationSettings)
            .set({
              primaryColor: styleConfig.primary,
              secondaryColor: styleConfig.secondary,
              logoUrl: styleConfig.logoUrl,
              updatedAt: new Date().toISOString(),
            })
            .where(eq(organizationSettings.id, settings.id));
        } else {
          await db
            .insert(organizationSettings)
            .values({
              primaryColor: styleConfig.primary,
              secondaryColor: styleConfig.secondary,
              logoUrl: styleConfig.logoUrl,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
        }

        res.json({ message: "Styling settings updated successfully" });
      } catch (error) {
        console.error('Error updating styling settings:', error);
        res.status(500).send("Failed to update styling settings");
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
        // Added basic error logging for white screen debugging.
        console.error("Error details:", error);
        res.status(500).send("Internal server error");
      }
    });

    // File management routes
    app.use('/api/admin/files', isAdmin, uploadRouter);

    // Add bulk action endpoint after the upload router registration
    app.post('/api/files/bulk', isAdmin, async (req, res) => {
      try {
        const { action, fileIds, targetFolderId } = req.body;

        if (!Array.isArray(fileIds) || fileIds.length === 0) {
          return res.status(400).json({ error: "No files selected" });
        }

        switch (action) {
          case 'delete':
            // Delete files from storage and database
            for (const fileId of fileIds) {
              try {
                // Get file info first
                const [file] = await db
                  .select()
                  .from(files)
                  .where(eq(files.id, fileId))
                  .limit(1);

                if (file) {
                  // Delete physical file
                  const filePath = path.join(process.cwd(), 'uploads', path.basename(file.url));
                  await fs.unlink(filePath).catch(() => {
                    // Ignore error if file doesn't exist
                    console.log(`Physical file not found: ${filePath}`);
                  });

                  // Delete from database
                  await db
                    .delete(files)
                    .where(eq(files.id, fileId));
                }
              } catch (error) {
                console.error(`Error deleting file ${fileId}:`, error);
              }
            }
            break;

          case 'move':
            if (!targetFolderId) {
              return res.status(400).json({ error: "Target folder not specified" });
            }

            // Update file records with new folder ID
            await db
              .update(files)
              .set({ 
                folderId: targetFolderId,
                updatedAt: new Date().toISOString()
              })
              .where(inArray(files.id, fileIds));
            break;

          default:
            return res.status(400).json({ error: "Invalid action" });
        }

        res.json({ success: true });
      } catch (error) {
        console.error('Error performing bulk action:', error);
        res.status(500).json({ error: "Failed to perform bulk action" });
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
        // Added basic error logging for white screen debugging.
        console.error("Error details:", error);
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
        // Added basic error logging for white screen debugging.
        console.error("Error details:", error);
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
        // Added basic error logging for white screen debugging.
        console.error("Error details:", error);
        res.status(500).send("Failed to fetch fields");
      }
    });

    // Delete field endpoint (fixed syntax error)
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
        // Added basic error logging for white screen debugging.
        console.error("Error details:", error);
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
          } as typeof users.$inferInsert)
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
        // Added basic error logging for white screen debugging.
        console.error("Error details:", error);
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
          } as typeof users.$inferInsert)
          .where(eq(users.id, req.user.id));

        res.json({ message: "Password updated successfully" });
      } catch (error) {
        console.error('Error updating password:', error);
        // Added basic error logging for white screen debugging.
        console.error("Error details:", error);
        res.status(500).send("Failed to update password");
      }
    });

    // Event creation endpoint
    app.post('/api/admin/events', isAdmin, async (req, res) => {
      try {
        const formData = req.body;

        // Ensure we have valid data
        if (!formData || typeof formData !== 'object') {
          return res.status(400).json({ 
            error: "Invalid request body"
          });
        }

        const { name, startDate, endDate, timezone, applicationDeadline } = formData;

        if (!name || !startDate || !endDate || !applicationDeadline) {
          return res.status(400).json({ 
            error: "Name, start date, end date, and application deadline are required" 
          });
        }

        // Create the event
        const eventId = crypto.generateEventId();
        const [newEvent] = await db
          .insert(events)
          .values({
            id: eventId,
            name,
            startDate,
            endDate,
            timezone: timezone || 'America/New_York',
            applicationDeadline,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })
          .returning();

          res.status(201).json({ message: "Event created successfully", event: newEvent });
      } catch (error) {
        console.error('Error creating event:', error);
        console.error("Error details:", error);
        res.status(500).json({ 
          error: error instanceof Error ? error.message : "Failed to create event",
          details: error instanceof Error ? error.stack : undefined
        });
      }
    });

    // Add this new update endpoint after the existing event creation endpoint
    app.patch('/api/admin/events/:id', isAdmin, async (req, res) => {
      try {
        const eventId = req.params.id;
        let eventData;

        if (req.headers['content-type']?.includes('multipart/form-data')) {
          eventData = JSON.parse(req.body.data);
        } else {
          eventData = req.body;
        }

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
            throw new Error("Event not found");
          }

          // Update complex assignments
          await tx.execute(sql`DELETE FROM event_complexes WHERE event_id = ${eventId}`);

          if (eventData.selectedComplexIds && eventData.selectedComplexIds.length > 0) {
            for (const complexId of eventData.selectedComplexIds) {
              await tx.execute(
                sql`INSERT INTO event_complexes (event_id, complex_id, created_at) 
                    VALUES (${eventId}, ${complexId}, ${new Date().toISOString()})`
              );
            }
          }

          // Update field size assignments
          await tx
            .delete(eventFieldSizes)
            .where(eq(eventFieldSizes.eventId, eventId));

          if (eventData.complexFieldSizes) {
            for (const [fieldId, fieldSize] of Object.entries(eventData.complexFieldSizes)) {
              await tx
                .insert(eventFieldSizes)
                .values({
                  eventId,
                  fieldId: parseInt(fieldId),
                  fieldSize: fieldSize as string,
                  createdAt: new Date().toISOString(),
                });
            }
          }

          if (!updatedEvent) {
            throw new Error("Event not found");
          }

          // Get existing agegroups
          const existingAgeGroups = await tx
            .select()
            .from(eventAgeGroups)
            .where(eq(eventAgeGroups.eventId, eventId));

          // Get age groups that have teams
          const ageGroupsWithTeams = await tx
            .select({
              ageGroupId: teams.ageGroupId,
              teamCount: sql<number>`count(*)`.mapWith(Number)
            })
            .from(teams)
            .where(eq(teams.eventId, eventId))
            .groupBy(teams.ageGroupId);

          const ageGroupsWithTeamsMap = new Map(
            ageGroupsWithTeams.map(({ ageGroupId, teamCount }) => [ageGroupId, teamCount])
          );

          // Map of existing age groups by their properties for comparison
          const existingAgeGroupsMap = new Map(
            existingAgeGroups.map(group => [
              `${group.gender}-${group.ageGroup}-${group.fieldSize}`,
              group
            ])
          );

          // Process each age group from the request
          for (const group of eventData.ageGroups) {
            const groupKey = `${group.gender}-${group.ageGroup}-${group.fieldSize}`;
            const existingGroup = existingAgeGroupsMap.get(groupKey);

            if (existingGroup) {
              // Update existing group
              await tx
                .update(eventAgeGroups)
                .set({
                  projectedTeams: group.projectedTeams,
                  birthDateStart: group.birthDateStart,
                  birthDateEnd: group.birthDateEnd,
                  scoringRule: group.scoringRule,
                  amountDue: group.amountDue || null,
                })
                .where(eq(eventAgeGroups.id, existingGroup.id));

              // Remove from map to track which ones need to be deleted
              existingAgeGroupsMap.delete(groupKey);
            } else {
              // Create new group
              await tx
                .insert(eventAgeGroups)
                .values({
                  eventId,
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
          }

          // Handle age groups that were removed
          const remainingGroups = Array.from(existingAgeGroupsMap.entries());
          for (const [, group] of remainingGroups) {
            // Check if the age group has teams
            if (!ageGroupsWithTeamsMap.has(group.id)) {
              // Only delete if no teams are associated
              await tx
                .delete(eventAgeGroups)
                .where(eq(eventAgeGroups.id, group.id));
            }
          }

          // Update complex assignments
          await tx.execute(sql`DELETE FROM event_complexes WHERE event_id = ${eventId}`);

          for (const complexId of eventData.selectedComplexIds) {
            await tx.execute(
              sql`INSERT INTO event_complexes (event_id, complex_id, created_at) 
                  VALUES (${eventId}, ${complexId}, ${new Date().toISOString()})`
            );
          }

          // Update field size assignments
          await tx
            .delete(eventFieldSizes)
            .where(eq(eventFieldSizes.eventId, eventId));

          for (const [fieldId, fieldSize] of Object.entries(eventData.complexFieldSizes)) {
            await tx
              .insert(eventFieldSizes)
              .values({
                eventId,
                fieldId: parseInt(fieldId),
                fieldSize,
                createdAt: new Date().toISOString(),
              });
          }
        });

        res.json({ message: "Event updated successfully" });
      } catch (error) {
        console.error('Error updating event:', error);
        // Added basic error logging for white screen debugging.
        console.error("Error details:", error);
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
            applicationCount: sql<number>`count(distinct ${teams.id})`.mapWith(Number),
            teamCount: sql<number>`count(${teams.id})`.mapWith(Number),
          })
          .from(events)
          .leftJoin(teams, eq(events.id, teams.eventId))
          .groupBy(events.id)
          .orderBy(events.startDate);

        // Format the response
        const formattedEvents = eventsList.map(({ event, applicationCount, teamCount }) => ({
          ...event,
          applicationCount,
          teamCount
        }));

        res.json(formattedEvents);
      } catch (error) {
        console.error('Error fetching events:', error);
        // Added basic error logging for white screen debugging.
        console.error("Error details:", error);
        res.status(500).send("Failed to fetch events");
      }
    });

    // Add this new endpoint to get event details for editing
    app.get('/api/admin/events/:id/edit', async (req, res) => {
      try {
        const eventId = req.params.id;

        // Get event details
        const [event] = await db
          .select()
          .from(events)
          .where(eq(events.id, eventId));

        if (!event) {
          return res.status(404).send("Event not found");
        }

        // Get age groups with their teams count
        const ageGroups = await db
          .select({
            ageGroup: eventAgeGroups,
            teamCount: sql<number>`count(distinct ${teams.id})`.mapWith(Number),
          })
          .from(eventAgeGroups)
          .leftJoin(teams, eq(teams.ageGroupId, eventAgeGroups.id))
          .where(eq(eventAgeGroups.eventId, eventId))
          .groupBy(eventAgeGroups.id);

        // Get all complexes with their fields and full metadata
        const complexData = await db
          .select({
            complex: complexes,
            fields: sql<any>`json_agg(
              CASE WHEN ${fields.id} IS NOT NULL THEN
                json_build_object(
                  'id', ${fields.id},
                  'name', ${fields.name},
                  'hasLights', ${fields.hasLights},
                  'hasParking', ${fields.hasParking},
                  'isOpen', ${fields.isOpen},
                  'specialInstructions', ${fields.specialInstructions}
                )
              ELSE NULL
              END
            ) FILTER (WHERE ${fields.id} IS NOT NULL)`.mapWith((f) => f || []),
            openFields: sql<number>`count(case when ${fields.isOpen} = true then 1 end)`.mapWith(Number),
            closedFields: sql<number>`count(case when ${fields.isOpen} = false then 1 end)`.mapWith(Number),
          })
          .from(complexes)
          .leftJoin(fields, eq(complexes.id, fields.complexId))
          .groupBy(complexes.id)
          .orderBy(complexes.name);

        // Get scoring rules
        const scoringRules = await db
          .select()
          .from(eventScoringRules)
          .where(eq(eventScoringRules.eventId, eventId));

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

        // Get all administrators
        const administrators = await db
          .select({
            id: users.id,
            username: users.username,
            firstName: users.firstName,
            lastName: users.lastName,
            email: users.email
          })
          .from(users)
          .where(eq(users.isAdmin, true));

        // Format response to match create event view structure exactly
        const response = {
          ...event,
          ageGroups: ageGroups.map(({ ageGroup, teamCount }) => ({
            ...ageGroup,
            teamCount,
            assignedFields: [], // Will be populated by frontend
            assignedTeams: []   // Will be populated by frontend
          })),
          complexes: complexData.map(({ complex, fields, openFields, closedFields }) => ({
            ...complex,
            fields: fields || [],
            openFields: openFields || 0,
            closedFields: closedFields || 0
          })),
          selectedComplexIds: complexAssignments.map(a => a.complexId),
          complexFieldSizes: Object.fromEntries(
            fieldSizes.map(f => [f.fieldId, f.fieldSize])
          ),
          scoringRules,
          administrators,
          // Additional metadata needed by create view
          availableAgeGroups: ageGroups.map(({ ageGroup }) => ageGroup.ageGroup),
          availableFieldSizes: [...new Set(fieldSizes.map(f => f.fieldSize))].filter(Boolean),
          timeZones: event.timezone ? [event.timezone] : [], // Include current timezone
          validationErrors: {} // Empty object for frontend validation
        };

        res.json(response);
      } catch (error) {
        console.error('Error fetching event details:', error);
        // Added basic error logging for white screen debugging.
        console.error("Error details:", error);
        res.status(500).send("Failed to fetch event details");
      }
    });

    // Add this new endpoint after the existing event endpoints
    app.get('/api/admin/events/:id', isAdmin, async (req, res) => {
      try {
        const eventId = req.params.id;

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

        // Get scoring rules
        const scoringRules = await db
          .select()
          .from(eventScoringRules)
          .where(eq(eventScoringRules.eventId, eventId));

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
          scoringRules,
          selectedComplexIds: complexAssignments.map(a => a.complexId),
          complexFieldSizes: Object.fromEntries(
            fieldSizes.map(f => [f.fieldId, f.fieldSize])
          )
        };

        res.json(response);
      } catch (error) {
        console.error('Error fetching event details:', error);
        // Added basic error logging for white screen debugging.
        console.error("Error details:", error);
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
        // Added basic error logging for white screen debugging.
        console.error("Error details:", error);
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
                  updatedAt: new Date().toISOString(),                });

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

          //          // 6. Schedule will be generated based on registered teams          // This will be implemented in a separate endpoint once teams are registered
        });

        res.json({ message: "Schedule framework generated successfully" });
      } catch (error) {
        console.error('Error generating schedule:', error);
        // Added basic error logging for white screen debugging.
        console.error("Error details:", error);
        res.status(500).send("Failed to generate schedule");
      }
    });

    // Teams management endpoints
    app.get('/api/admin/events/:eventId/age-groups', isAdmin, async (req, res) => {
      try {
        const eventId = parseInt(req.params.eventId);
        const ageGroups = await db
          .select()
          .from(eventAgeGroups)
          .where(eq(eventAgeGroups.eventId, eventId))
          .orderBy(eventAgeGroups.ageGroup);

        res.json(ageGroups);
      } catch (error) {
        console.error('Error fetching age groups:', error);
        // Added basic error logging for white screen debugging.
        console.error("Error details:", error);
        res.status(500).send("Failed to fetch age groups");
      }
    });

    app.get('/api/admin/teams', isAdmin, async (req, res) => {
      try {
        const eventId = parseInt(req.query.eventId as string);
        const ageGroupId = req.query.ageGroupId ? parseInt(req.query.ageGroupId as string) : null;

        let query = db
          .select({
            team: teams,
            ageGroup: eventAgeGroups,
          })
          .from(teams)
          .leftJoin(eventAgeGroups, eq(teams.ageGroupId, eventAgeGroups.id))
          .where(eq(teams.eventId, eventId));

        // Add age group filter if specified
        if (ageGroupId) {
          query = query.where(eq(teams.ageGroupId, ageGroupId));
        }

        const results = await query.orderBy(teams.name);

        // Format the response
        const formattedTeams = results.map(({ team, ageGroup }) => ({
          ...team,
          ageGroup: ageGroup?.ageGroup || 'Unknown',
        }));

        res.json(formattedTeams);
      } catch (error) {
        console.error('Error fetching teams:', error);
        // Added basic error logging for white screen debugging.
        console.error("Error details:", error);
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
            eq(eventAgeGroups.ageGroup, ageGroup)          ));

        if (!ageGroupRecord) {
          return res.status(404).send("Age group not found");
        }

        //        // Create the team
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
        // Added basic error logging for white screen debugging.
        console.error("Error details:", error);
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
        // Added basic error logging for white screen debugging.
        console.error("Error details:", error);
        res.status(500).send("Failed to fetch age groups");
      }
    });

    // Add administrators endpoint
    app.post('/api/admin/administrators', isAdmin, async (req, res) => {
      try {
        const { firstName, lastName, email, password, roles } = req.body;

        // Check if user exists
        const [existingUser] = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        if (existingUser) {
          return res.status(400).send("User with this email already exists");
        }

        // Hash the password
        const hashedPassword = await crypto.hash(password);

        // Start a transaction
        await db.transaction(async (tx) => {
          // Create the administrator
          const [newAdmin] = await tx
            .insert(users)
            .values({
              email,
              username: email,
              password: hashedPassword,
              firstName,
              lastName,
              isAdmin: true,
              isParent: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            })
            .returning();

          // Create roles if they don't exist and assign them
          for (const roleName of roles) {
            let [role] = await tx
              .select()
              .from(roles)
              .where(eq(roles.name, roleName))
              .limit(1);

            if (!role) {
              [role] = await tx
                .insert(roles)
                .values({
                  name: roleName,
                  description: `${roleName} role`
                })
                .returning();
            }

            await tx
              .insert(adminRoles)
              .values({
                userId: newAdmin.id,
                roleId: role.id
              });
          }

          // Send response without password
          const { password: _, ...adminWithoutPassword } = newAdmin;
          res.status(201).json(adminWithoutPassword);
        });
      } catch (error) {
        console.error('Error creating administrator:', error);
        // Added basic error logging for white screen debugging.
        console.error("Error details:", error);
        res.status(500).send("Failed to create administrator");
      }
    });

    app.get('/api/admin/administrators', isAdmin, async (req, res) => {
      try {
        const administrators = await db
          .select({
            id: users.id,
            email: users.email,
            firstName: users.firstName,
            lastName: users.lastName,
            createdAt: users.createdAt,
          })
          .from(users)
          .where(eq(users.isAdmin, true))
          .orderBy(users.createdAt);

        res.json(administrators);
      } catch (error) {
        console.error('Error fetching administrators:', error);
        // Added basic error logging for white screen debugging.
        console.error("Error details:", error);
        res.status(500).send("Failed to fetch administrators");
      }
    });

    // Teams management endpoints
    app.patch('/api/admin/teams/:id', isAdmin, async (req, res) => {
      try {
        const teamId = parseInt(req.params.id);
        const { name, coach, managerName, managerPhone, managerEmail } = req.body;

        const [updatedTeam] = await db
          .update(teams)
          .set({
            name,
            coach,
            managerName,
            managerPhone,
            managerEmail,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(teams.id, teamId))
          .returning();

        if (!updatedTeam) {
          return res.status(404).send("Team not found");
        }

        res.json(updatedTeam);
      } catch (error) {
        console.error('Error updating team:', error);
        // Added basic error logging for white screen debugging.
        console.error("Error details:", error);
        res.status(500).send("Failed to update team");
      }
    });

    // Form Template endpoints
    app.get('/api/admin/events/:id/form-template', isAdmin, async (req, res) => {
      try {
        const eventId = req.params.id;
        const [template] = await db
          .select({
            template: eventFormTemplates,
            fields: sql<any[]>`json_agg(
              CASE WHEN ${formFields.id} IS NOT NULL THEN
                json_build_object(
                  'id', ${formFields.id},
                  'label', ${formFields.label},
                  'type', ${formFields.type},
                  'required', ${formFields.required},
                  'order', ${formFields.order},
                  'placeholder', ${formFields.placeholder},
                  'helpText', ${formFields.helpText},
                  'validation', ${formFields.validation},
                  'options', (
                    SELECT json_agg(
                      json_build_object(
                        'id', ${formFieldOptions.id},
                        'label', ${formFieldOptions.label},
                        'value', ${formFieldOptions.value},
                        'order', ${formFieldOptions.order}
                      ) ORDER BY ${formFieldOptions.order}
                    )
                    FROM ${formFieldOptions}
                    WHERE ${formFieldOptions.fieldId} = ${formFields.id}
                  )
                )
              ELSE NULL END
            ) FILTER (WHERE ${formFields.id} IS NOT NULL)`.mapWith(f => f || [])
          })
          .from(eventFormTemplates)
          .leftJoin(formFields, eq(formFields.templateId, eventFormTemplates.id))
          .where(eq(eventFormTemplates.eventId, eventId))
          .groupBy(eventFormTemplates.id);

        if (!template) {
          return res.json({
            id: null,
            eventId,
            name: '',
            description: '',
            isPublished: false,
            fields: []
          });
        }

        res.json({
          ...template.template,
          fields: template.fields
        });
      } catch (error) {
        console.error('Error fetching form template:', error);
        res.status(500).json({ error: "Failed to fetch form template" });
      }
    });

    app.get('/api/admin/form-templates', isAdmin, async (req, res) => {
      try {
        const templates = await db
          .select({
            id: eventFormTemplates.id,
            name: eventFormTemplates.name,
            description: eventFormTemplates.description,
            isPublished: eventFormTemplates.isPublished,
            createdAt: eventFormTemplates.createdAt,
            updatedAt: eventFormTemplates.updatedAt,
            fields: sql<any[]>`json_agg(
              CASE WHEN ${formFields.id} IS NOT NULL THEN
                json_build_object(
                  'id', ${formFields.id},
                  'label', ${formFields.label},
                  'type', ${formFields.type}
                )
              ELSE NULL END
            ) FILTER (WHERE ${formFields.id} IS NOT NULL)`.mapWith(f => f || [])
          })
          .from(eventFormTemplates)
          .leftJoin(formFields, eq(formFields.templateId, eventFormTemplates.id))
          .groupBy(eventFormTemplates.id);

        res.json(templates);
      } catch (error) {
        console.error('Error fetching form templates:', error);
        res.status(500).json({ error: "Failed to fetch form templates" });
      }
    });

    app.post('/api/admin/form-templates', isAdmin, async (req, res) => {
      try {
        const { name, description, isPublished, fields, eventId } = req.body;

        if (!eventId) {
          return res.status(400).json({ error: "Event ID is required" });
        }

        await db.transaction(async (tx) => {
          // Create form template
          const [template] = await tx
            .insert(eventFormTemplates)
            .values({
              eventId,
              name,
              description,
              isPublished: isPublished || false,
              createdAt: new Date(),
              updatedAt: new Date()
            })
            .returning();

          // Create fields
          if (fields?.length) {
            for (const field of fields) {
              const [newField] = await tx
                .insert(formFields)
                .values({
                  templateId: template.id,
                  label: field.label,
                  type: field.type,
                  required: field.required,
                  order: field.order,
                  placeholder: field.placeholder,
                  helpText: field.helpText,
                  validation: field.validation
                })
                .returning();

              // Create options for dropdown fields
              if (field.type === 'dropdown' && field.options?.length) {
                await tx
                  .insert(formFieldOptions)
                  .values(
                    field.options.map((option: any, index: number) => ({
                      fieldId: newField.id,
                      label: option.label,
                      value: option.value,
                      order: option.order || index
                    }))
                  );
              }
            }
          }
        });

        res.status(201).json({ message: "Form template created successfully" });
      } catch (error) {
        console.error('Error creating form template:', error);
        res.status(500).json({ error: "Failed to create form template" });
      }
    });

    app.post('/api/admin/events/:id/form-template', isAdmin, async (req, res) => {
      try {
        const eventId = req.params.id;
        const { name, description, isPublished, fields } = req.body;

        // Start a transaction
        await db.transaction(async (tx) => {
          // Create form template
          const [template] = await tx
            .insert(eventFormTemplates)
            .values({
              eventId,
              name,
              description,
              isPublished: isPublished || false,
              createdAt: new Date(),
              updatedAt: new Date()
            })
            .returning();

          // Create fields
          for (const [index, field] of fields.entries()) {
            const [newField] = await tx
              .insert(formFields)
              .values({
                templateId: template.id,
                label: field.label,
                type: field.type,
                required: field.required || false,
                order: index,
                placeholder: field.placeholder,
                helpText: field.helpText,
                validation: field.validation,
                createdAt: new Date(),
                updatedAt: new Date()
              })
              .returning();

            // Create options for dropdown fields
            if (field.type === 'dropdown' && field.options?.length > 0) {
              await tx
                .insert(formFieldOptions)
                .values(
                  field.options.map((option: any, optionIndex: number) => ({
                    fieldId: newField.id,
                    label: option.label,
                    value: option.value,
                    order: optionIndex,
                    createdAt: new Date()
                  }))
                );
            }
          }
        });

        res.status(201).json({ message: "Form template created successfully" });
      } catch (error) {
        console.error('Error creating form template:', error);
        res.status(500).json({ error: "Failed to create form template" });
      }
    });

    app.put('/api/admin/events/:eventId/form-template', isAdmin, async (req, res) => {
      try {
        const eventId = req.params.eventId;
        const { id, name, description, isPublished, fields } = req.body;

        await db.transaction(async (tx) => {
          // Update template
          await tx
            .update(eventFormTemplates)
            .set({
              name,
              description,
              isPublished,
              updatedAt: new Date()
            })
            .where(eq(eventFormTemplates.id, id));

          // Delete existing fields and options
          const existingFields = await tx
            .select()
            .from(formFields)
            .where(eq(formFields.templateId, id));

          for (const field of existingFields) {
            await tx
              .delete(formFieldOptions)
              .where(eq(formFieldOptions.fieldId, field.id));
          }

          await tx
            .delete(formFields)
            .where(eq(formFields.templateId, id));

          // Create new fields
          for (const [index, field] of fields.entries()) {
            const [newField] = await tx
              .insert(formFields)
              .values({
                templateId: id,
                label: field.label,
                type: field.type,
                required: field.required || false,
                order: index,
                placeholder: field.placeholder,
                helpText: field.helpText,
                validation: field.validation,
                createdAt: new Date(),
                updatedAt: new Date()
              })
              .returning();

            // Create options for dropdown fields
            if (field.type === 'dropdown' && field.options?.length > 0) {
              await tx
                .insert(formFieldOptions)
                .values(
                  field.options.map((option: any, optionIndex: number) => ({
                    fieldId: newField.id,
                    label: option.label,
                    value: option.value,
                    order: optionIndex,
                    createdAt: new Date()
                  }))
                );
            }
          }
        });

        res.json({ message: "Form template updated successfully" });
      } catch (error) {
        console.error('Error updating form template:', error);
        res.status(500).json({ error: "Failed to update form template" });
      }
    });

    app.delete('/api/admin/events/:eventId/form-template/:id', isAdmin, async (req, res) => {
      try {
        const templateId = parseInt(req.params.id);

        await db.transaction(async (tx) => {
          // Delete all field options
          await tx
            .delete(formFieldOptions)
            .where(
              inArray(
                formFieldOptions.fieldId,
                db.select({ id: formFields.id })
                  .from(formFields)
                  .where(eq(formFields.templateId, templateId))
              )
            );

          // Delete all fields
          await tx
            .delete(formFields)
            .where(eq(formFields.templateId, templateId));

          // Delete template
          const [deletedTemplate] = await tx
            .delete(eventFormTemplates)
            .where(eq(eventFormTemplates.id, templateId))
            .returning();

          if (!deletedTemplate) {
            return res.status(404).json({ error: "Template not found" });
          }
        });

        res.json({ message: "Form template deleted successfully" });
      } catch (error) {
        console.error('Error deleting form template:', error);
        res.status(500).json({ error: "Failed to delete form template" });
      }
    });

    app.delete('/api/admin/teams/:id', isAdmin, async (req, res) => {
      try {
        const teamId = parseInt(req.params.id);

        // Check if team has any associated games
        const [gameCount] = await db
          .select({
            count: sql<number>`count(*)`.mapWith(Number)
          })
          .from(games)
          .where(
            or(
              eq(games.homeTeamId, teamId),
              eq(games.awayTeamId, teamId)
            )
          );

        if (gameCount.count > 0) {
          return res.status(400).send("Cannot delete team with associated games");
        }

        const [deletedTeam] = await db
          .delete(teams)
          .where(eq(teams.id, teamId))
          .returning();

        if (!deletedTeam) {
          return res.status(404).send("Team notfound");
        }

        res.json(deletedTeam);
      } catch (error) {
        console.error('Error deleting team:', error);
        // Added basic error logging for white screen debugging.
        console.error("Error details:", error);
        res.status(500).send("Failed to delete team");
      }
    });

    // Add these new endpoints for event management
    app.get('/api/admin/events', isAdmin, async (req, res) => {
      try {
        const eventsList = await db
          .select({
            event: events,
            applicationCount: sql<number>`count(distinct ${teams.id})`.mapWith(Number),
            teamCount: sql<number>`count(${teams.id})`.mapWith(Number),
          })
          .from(events)
          .leftJoin(teams, eq(events.id, teams.eventId))
          .groupBy(events.id)
          .orderBy(events.startDate);

        // Format the response
        const formattedEvents = eventsList.map(({ event, applicationCount, teamCount }) => ({
          ...event,
          applicationCount,
          teamCount
        }));

        res.json(formattedEvents);
      } catch (error) {
        console.error('Error fetching events:', error);
        // Added basic error logging for white screen debugging.
        console.error("Error details:", error);
        res.status(500).send("Failed to fetch events");
      }
    });

    // Bulk delete events endpoint
    app.delete('/api/admin/events/bulk', isAdmin, async (req, res) => {
      try {
        const { eventIds } = req.body;

        if (!Array.isArray(eventIds) || eventIds.length === 0) {
          return res.status(400).json({ message: "No events selected" });
        }

        // Start a transaction to handle cascade deletion
        await db.transaction(async (tx) => {
          // Delete related records first
          await tx.delete(eventAgeGroups).where(inArray(eventAgeGroups.eventId, eventIds));
          await tx.execute(sql`DELETE FROM event_complexes WHERE event_id = ANY(${eventIds})`);
          await tx.delete(eventFieldSizes).where(inArray(eventFieldSizes.eventId, eventIds));
          await tx.delete(teams).where(inArray(teams.eventId, eventIds));

          // Finally delete the events
          await tx.delete(events).where(inArray(events.id, eventIds));
        });

        res.json({ message: "Events deleted successfully" });
      } catch (error) {
        console.error('Error deleting events:', error);
        let errorMessage = "Failed to delete events";
        if (error instanceof Error) {
          errorMessage = error.message;
        }
        res.status(500).send(errorMessage);
      }
    });

    app.delete('/api/admin/events/:id', isAdmin, async (req, res) => {
      try {
        const eventId = req.params.id;

        // Start a transaction to handle cascade deletion
        await db.transaction(async (tx) => {
          // First delete teams to remove references to age groups
          await tx.delete(teams).where(eq(teams.eventId, eventId));

          // Then delete tournament groups
          await tx.delete(tournamentGroups).where(eq(tournamentGroups.eventId, eventId));
          
          // Delete other related records
          await tx.delete(eventAgeGroups).where(eq(eventAgeGroups.eventId, eventId));
          await tx.execute(sql`DELETE FROM event_complexes WHERE event_id = ${eventId}`);
          await tx.delete(eventFieldSizes).where(eq(eventFieldSizes.eventId, eventId));
          await tx.delete(teams).where(eq(teams.eventId, eventId));

          // Finally delete the event
          const [deletedEvent] = await tx
            .delete(events)
            .where(eq(events.id, eventId))
            .returning();

          if (!deletedEvent) {
            throw new Error("Event not found");
          }
        });

        res.json({ message: "Event deleted successfully" });
      } catch (error) {
        console.error('Error deleting event:', error);
        // Added basic error logging for white screen debugging.
        console.error("Error details:", error);
        let errorMessage = "Failed to delete event";
        if (error instanceof Error) {
          errorMessage = error.message;
        }
        res.status(500).send(errorMessage);
      }
    });

    // Chat-related routes
    app.post('/api/chat/rooms', async (req, res) => {
      if (!req.isAuthenticated()) {
        return res.status(401).send("Not authenticated");
      }

      try {
        const { name, type, eventId, teamId } = req.body;

        // Create chat room
        const [chatRoom] = await db.transaction(async (tx) => {
          const [room] = await tx
            .insert(chatRooms)
            .values({
              name,
              type,
              eventId: eventId || null,
              teamId: teamId || null,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            })
            .returning();

          // Add creator as admin participant
          await tx
            .insert(chatParticipants)
            .values({
              chatRoomId: room.id,
              userId: req.user.id,
              isAdmin: true,
              lastReadAt: new Date().toISOString(),
              createdAt: new Date().toISOString(),
            });

          return [room];
        });

        res.json(chatRoom);
      } catch (error) {
        console.error('Error creating chat room:', error);
        // Added basic error logging for white screen debugging.
        console.error("Error details:", error);
        res.status(500).send("Failed to create chat room");
      }
    });

    app.get('/api/chat/rooms', async (req, res) => {
      if (!req.isAuthenticated()) {
        return res.status(401).send("Not authenticated");
      }

      try {
        const userRooms = await db
          .select({
            room: chatRooms,
            unreadCount: sql<number>`
              count(case when ${messages.createdAt} > ${chatParticipants.lastReadAt} then 1 end)
            `.mapWith(Number),
          })
          .from(chatParticipants)
          .innerJoin(chatRooms, eq(chatParticipants.chatRoomId, chatRooms.id))
          .leftJoin(messages, eq(messages.chatRoomId, chatRooms.id))
          .where(eq(chatParticipants.userId, req.user.id))
          .groupBy(chatRooms.id)
          .orderBy(chatRooms.updatedAt);

        res.json(userRooms);
      } catch (error) {
        console.error('Error fetching chat rooms:', error);
        // Added basic error logging for white screen debugging.
        console.error("Error details:", error);
        res.status(500).send("Failed to fetch chat rooms");
      }
    });

    app.get('/api/chat/rooms/:roomId/messages', async (req, res) => {
      if (!req.isAuthenticated()) {
        return res.status(401).send("Not authenticated");
      }

      try {
        const roomId = parseInt(req.params.roomId);

        // Verify user is a participant
        const [participant] = await db
          .select()
          .from(chatParticipants)
          .where(and(
            eq(chatParticipants.chatRoomId, roomId),
            eq(chatParticipants.userId, req.user.id)
          ));

        if (!participant) {
          return res.status(403).send("Not a participant of this chat room");
        }

        const roomMessages = await db
          .select({
            message: messages,
            user: {
              id: users.id,
              username: users.username,
              firstName: users.firstName,
              lastName: users.lastName,
            },
          })
          .from(messages)
          .innerJoin(users, eq(messages.userId, users.id))
          .where(eq(messages.chatRoomId, roomId))
          .orderBy(messages.createdAt);

        // Update last read timestamp
        await db
          .update(chatParticipants)
          .set({
            lastReadAt: new Date().toISOString(),
          })
          .where(and(
            eq(chatParticipants.chatRoomId, roomId),
            eq(chatParticipants.userId, req.user.id)
          ));

        res.json(roomMessages);
      } catch (error) {
        console.error('Error fetching messages:', error);
        // Added basic error logging for white screen debugging.
        console.error("Error details:", error);
        res.status(500).send("Failed to fetch messages");
      }
    });

    app.post('/api/chat/rooms/:roomId/participants', async (req, res) => {
      if (!req.isAuthenticated()) {
        return res.status(401).send("Not authenticated");
      }

      try {
        const roomId = parseInt(req.params.roomId);
        const { userIds } = req.body;

        // Verify requester is an admin of the room
        const [requesterParticipant] = await db
          .select()
          .from(chatParticipants)
          .where(and(
            eq(chatParticipants.chatRoomId, roomId),
            eq(chatParticipants.userId, req.user.id),
            eq(chatParticipants.isAdmin, true)
          ));

        if (!requesterParticipant) {
          return res.status(403).send("Not authorized to add participants");
        }

        // Add new participants
        const newParticipants = await db
          .insert(chatParticipants)
          .values(
            userIds.map((userId: number) => ({
              chatRoomId: roomId,
              userId,
              isAdmin: false,
              lastReadAt: new Date().toISOString(),
              createdAt: new Date().toISOString(),
            }))
          )
          .returning();

        res.json(newParticipants);
      } catch (error) {
        console.error('Error adding participants:', error);
        // Added basic error logging for white screen debugging.
        console.error("Error details:", error);
        res.status(500).send("Failed to add participants");
      }
    });

    return httpServer;
  } catch (error) {
    console.error('Error registering routes:', error);
    throw error;
  }
}