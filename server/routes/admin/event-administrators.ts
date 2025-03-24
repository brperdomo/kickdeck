import { Request, Response } from "express";
import { db } from "@db";
import { 
  eventAdministrators, 
  users, 
  roles, 
  adminRoles, 
  selectEventAdministratorSchema 
} from "@db/schema";
import { eq, and, inArray, not } from "drizzle-orm";
import { SQL, sql } from "drizzle-orm";

/**
 * Get all administrators for a specific event
 */
export async function getEventAdministrators(req: Request, res: Response) {
  try {
    const eventId = req.params.eventId;
    
    if (!eventId) {
      return res.status(400).json({ error: "Event ID is required" });
    }

    // Get administrators with their user information and roles
    const eventAdmins = await db
      .select({
        id: eventAdministrators.id,
        eventId: eventAdministrators.eventId,
        userId: eventAdministrators.userId,
        role: eventAdministrators.role,
        adminType: eventAdministrators.adminType,
        createdAt: eventAdministrators.createdAt,
        user: users,
        roles: sql<string[]>`array_agg(distinct ${roles.name})`
      })
      .from(eventAdministrators)
      .innerJoin(users, eq(eventAdministrators.userId, users.id))
      .leftJoin(adminRoles, eq(users.id, adminRoles.userId))
      .leftJoin(roles, eq(adminRoles.roleId, roles.id))
      .where(eq(eventAdministrators.eventId, eventId))
      .groupBy(
        eventAdministrators.id,
        eventAdministrators.eventId,
        eventAdministrators.userId,
        eventAdministrators.role,
        eventAdministrators.adminType,
        eventAdministrators.createdAt,
        users.id
      );

    return res.json(eventAdmins);
  } catch (error) {
    console.error("Error fetching event administrators:", error);
    return res.status(500).json({ error: "Failed to fetch event administrators" });
  }
}

/**
 * Get available administrators who aren't already assigned to this event
 */
export async function getAvailableAdministrators(req: Request, res: Response) {
  try {
    const eventId = req.query.eventId as string;
    
    if (!eventId) {
      return res.status(400).json({ error: "Event ID is required" });
    }

    // Get all admins
    const allAdmins = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        roles: sql<string[]>`array_agg(${roles.name})`
      })
      .from(users)
      .innerJoin(adminRoles, eq(users.id, adminRoles.userId))
      .innerJoin(roles, eq(adminRoles.roleId, roles.id))
      .where(eq(users.isAdmin, true))
      .groupBy(users.id);

    // Get the IDs of admins already assigned to this event
    const existingAdminIds = await db
      .select({ userId: eventAdministrators.userId })
      .from(eventAdministrators)
      .where(eq(eventAdministrators.eventId, eventId))
      .then(rows => rows.map(row => row.userId));

    // Filter out admins already assigned to this event
    const availableAdmins = allAdmins.filter(admin => !existingAdminIds.includes(admin.id));

    return res.json(availableAdmins);
  } catch (error) {
    console.error("Error fetching available administrators:", error);
    return res.status(500).json({ error: "Failed to fetch available administrators" });
  }
}

/**
 * Add an administrator to an event
 */
export async function addEventAdministrator(req: Request, res: Response) {
  try {
    const eventId = req.params.eventId;
    const { userId, role, adminType } = req.body;
    
    if (!eventId || !userId || !role) {
      return res.status(400).json({ error: "Event ID, user ID, and role are required" });
    }

    // Check if admin already exists for this event
    const existingAdmin = await db
      .select()
      .from(eventAdministrators)
      .where(
        and(
          eq(eventAdministrators.eventId, eventId),
          eq(eventAdministrators.userId, userId)
        )
      )
      .limit(1);

    if (existingAdmin.length > 0) {
      return res.status(400).json({ error: "Administrator is already assigned to this event" });
    }

    // Add new event administrator
    const newAdmin = await db
      .insert(eventAdministrators)
      .values({
        eventId,
        userId,
        role,
        adminType: adminType || 'tournament_admin',
        createdAt: new Date().toISOString()
      })
      .returning();

    // Get admin details with user info
    const adminDetails = await db
      .select({
        id: eventAdministrators.id,
        eventId: eventAdministrators.eventId,
        userId: eventAdministrators.userId,
        role: eventAdministrators.role,
        adminType: eventAdministrators.adminType,
        createdAt: eventAdministrators.createdAt,
        user: users,
        roles: sql<string[]>`array_agg(${roles.name})`
      })
      .from(eventAdministrators)
      .innerJoin(users, eq(eventAdministrators.userId, users.id))
      .leftJoin(adminRoles, eq(users.id, adminRoles.userId))
      .leftJoin(roles, eq(adminRoles.roleId, roles.id))
      .where(eq(eventAdministrators.id, newAdmin[0].id))
      .groupBy(
        eventAdministrators.id,
        eventAdministrators.eventId,
        eventAdministrators.userId,
        eventAdministrators.role,
        eventAdministrators.adminType,
        eventAdministrators.createdAt,
        users.id
      )
      .then(rows => rows[0]);

    return res.status(201).json(adminDetails);
  } catch (error) {
    console.error("Error adding event administrator:", error);
    return res.status(500).json({ error: "Failed to add event administrator" });
  }
}

/**
 * Update an event administrator's roles
 */
export async function updateEventAdministrator(req: Request, res: Response) {
  try {
    const eventId = req.params.eventId;
    const adminId = parseInt(req.params.adminId);
    const { role, adminType } = req.body;
    
    if (isNaN(adminId) || !eventId) {
      return res.status(400).json({ error: "Valid event ID and admin ID are required" });
    }

    // Update event administrator
    const [updatedAdmin] = await db
      .update(eventAdministrators)
      .set({
        role: role || undefined,
        adminType: adminType || undefined
      })
      .where(
        and(
          eq(eventAdministrators.id, adminId),
          eq(eventAdministrators.eventId, eventId)
        )
      )
      .returning();

    if (!updatedAdmin) {
      return res.status(404).json({ error: "Event administrator not found" });
    }

    // Get updated admin details with user info
    const adminDetails = await db
      .select({
        id: eventAdministrators.id,
        eventId: eventAdministrators.eventId,
        userId: eventAdministrators.userId,
        role: eventAdministrators.role,
        adminType: eventAdministrators.adminType,
        createdAt: eventAdministrators.createdAt,
        user: users,
        roles: sql<string[]>`array_agg(${roles.name})`
      })
      .from(eventAdministrators)
      .innerJoin(users, eq(eventAdministrators.userId, users.id))
      .leftJoin(adminRoles, eq(users.id, adminRoles.userId))
      .leftJoin(roles, eq(adminRoles.roleId, roles.id))
      .where(eq(eventAdministrators.id, updatedAdmin.id))
      .groupBy(
        eventAdministrators.id,
        eventAdministrators.eventId,
        eventAdministrators.userId,
        eventAdministrators.role,
        eventAdministrators.adminType,
        eventAdministrators.createdAt,
        users.id
      )
      .then(rows => rows[0]);

    return res.json(adminDetails);
  } catch (error) {
    console.error("Error updating event administrator:", error);
    return res.status(500).json({ error: "Failed to update event administrator" });
  }
}

/**
 * Remove an administrator from an event
 */
export async function removeEventAdministrator(req: Request, res: Response) {
  try {
    const eventId = req.params.eventId;
    const adminId = parseInt(req.params.adminId);
    
    if (isNaN(adminId) || !eventId) {
      return res.status(400).json({ error: "Valid event ID and admin ID are required" });
    }

    // Delete event administrator
    const [deletedAdmin] = await db
      .delete(eventAdministrators)
      .where(
        and(
          eq(eventAdministrators.id, adminId),
          eq(eventAdministrators.eventId, eventId)
        )
      )
      .returning();

    if (!deletedAdmin) {
      return res.status(404).json({ error: "Event administrator not found" });
    }

    return res.json({ success: true, message: "Administrator removed from event", id: adminId });
  } catch (error) {
    console.error("Error removing event administrator:", error);
    return res.status(500).json({ error: "Failed to remove event administrator" });
  }
}