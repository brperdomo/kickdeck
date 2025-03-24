import { Request, Response } from "express";
import { db } from "db";
import { eq, and } from "drizzle-orm";
import { events, eventAdministrators, users, adminRoles } from "@db/schema";

/**
 * Get all administrators for a specific event
 */
export async function getEventAdministrators(req: Request, res: Response) {
  try {
    const { eventId } = req.params;
    
    if (!eventId) {
      return res.status(400).json({ error: "Event ID is required" });
    }

    const administrators = await db.query.eventAdministrators.findMany({
      where: eq(eventAdministrators.eventId, eventId),
      with: {
        user: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        }
      }
    });

    // Format response for the client
    const formattedAdmins = administrators.map(admin => ({
      id: admin.userId.toString(),
      firstName: admin.user.firstName,
      lastName: admin.user.lastName,
      email: admin.user.email,
      roles: admin.roles,
    }));

    return res.json(formattedAdmins);
  } catch (error) {
    console.error("Error getting event administrators:", error);
    return res.status(500).json({ error: "Failed to get event administrators" });
  }
}

/**
 * Get available administrators who aren't already assigned to this event
 */
export async function getAvailableAdministrators(req: Request, res: Response) {
  try {
    const { eventId } = req.query;
    
    if (!eventId) {
      return res.status(400).json({ error: "Event ID is required" });
    }

    // Get IDs of users already assigned to this event
    const eventAdmins = await db.query.eventAdministrators.findMany({
      where: eq(eventAdministrators.eventId, eventId.toString()),
      columns: {
        userId: true
      }
    });
    
    const assignedUserIds = eventAdmins.map(admin => admin.userId);

    // Get admin users not yet assigned to this event
    const availableAdmins = await db.query.users.findMany({
      where: (users) => {
        // Only include admin users who aren't already assigned to this event
        return and(
          eq(users.isAdmin, true),
          // If no users are assigned yet, don't filter by not in
          assignedUserIds.length > 0
            ? users.id.notInArray(assignedUserIds)
            : undefined
        );
      },
      columns: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
      with: {
        adminRoles: {
          columns: {
            roleId: true
          }
        }
      }
    });

    return res.json(availableAdmins);
  } catch (error) {
    console.error("Error getting available administrators:", error);
    return res.status(500).json({ error: "Failed to get available administrators" });
  }
}

/**
 * Add an administrator to an event
 */
export async function addEventAdministrator(req: Request, res: Response) {
  try {
    const { eventId } = req.params;
    const { adminId, roles } = req.body;
    
    if (!eventId || !adminId || !roles) {
      return res.status(400).json({ error: "Event ID, admin ID, and roles are required" });
    }
    
    if (!Array.isArray(roles) || roles.length === 0) {
      return res.status(400).json({ error: "Roles must be a non-empty array" });
    }
    
    // Check if event exists
    const eventExists = await db.query.events.findFirst({
      where: eq(events.id, parseInt(eventId))
    });
    
    if (!eventExists) {
      return res.status(404).json({ error: "Event not found" });
    }
    
    // Check if the user exists and is an admin
    const adminUser = await db.query.users.findFirst({
      where: and(
        eq(users.id, parseInt(adminId)),
        eq(users.isAdmin, true)
      )
    });
    
    if (!adminUser) {
      return res.status(404).json({ error: "Administrator not found or user is not an admin" });
    }
    
    // Check if admin is already assigned to this event
    const existingAssignment = await db.query.eventAdministrators.findFirst({
      where: and(
        eq(eventAdministrators.eventId, eventId),
        eq(eventAdministrators.userId, parseInt(adminId))
      )
    });
    
    if (existingAssignment) {
      return res.status(409).json({ error: "Administrator is already assigned to this event" });
    }
    
    // Add the administrator to the event
    const newEventAdmin = await db.insert(eventAdministrators).values({
      eventId: eventId,
      userId: parseInt(adminId),
      roles: roles,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }).returning();
    
    return res.status(201).json({
      id: adminId,
      roles,
      message: "Administrator added to event successfully"
    });
  } catch (error) {
    console.error("Error adding event administrator:", error);
    return res.status(500).json({ error: "Failed to add administrator to event" });
  }
}

/**
 * Update an event administrator's roles
 */
export async function updateEventAdministrator(req: Request, res: Response) {
  try {
    const { eventId, adminId } = req.params;
    const { roles } = req.body;
    
    if (!eventId || !adminId || !roles) {
      return res.status(400).json({ error: "Event ID, admin ID, and roles are required" });
    }
    
    if (!Array.isArray(roles) || roles.length === 0) {
      return res.status(400).json({ error: "Roles must be a non-empty array" });
    }
    
    // Check if this assignment exists
    const existingAssignment = await db.query.eventAdministrators.findFirst({
      where: and(
        eq(eventAdministrators.eventId, eventId),
        eq(eventAdministrators.userId, parseInt(adminId))
      )
    });
    
    if (!existingAssignment) {
      return res.status(404).json({ error: "Event administrator assignment not found" });
    }
    
    // Update the roles
    await db.update(eventAdministrators)
      .set({ 
        roles: roles,
        updatedAt: new Date().toISOString()
      })
      .where(and(
        eq(eventAdministrators.eventId, eventId),
        eq(eventAdministrators.userId, parseInt(adminId))
      ));
    
    return res.json({
      id: adminId,
      roles,
      message: "Administrator roles updated successfully"
    });
  } catch (error) {
    console.error("Error updating event administrator:", error);
    return res.status(500).json({ error: "Failed to update administrator roles" });
  }
}

/**
 * Remove an administrator from an event
 */
export async function removeEventAdministrator(req: Request, res: Response) {
  try {
    const { eventId, adminId } = req.params;
    
    if (!eventId || !adminId) {
      return res.status(400).json({ error: "Event ID and admin ID are required" });
    }
    
    // Check if this assignment exists
    const existingAssignment = await db.query.eventAdministrators.findFirst({
      where: and(
        eq(eventAdministrators.eventId, eventId),
        eq(eventAdministrators.userId, parseInt(adminId))
      )
    });
    
    if (!existingAssignment) {
      return res.status(404).json({ error: "Event administrator assignment not found" });
    }
    
    // Remove the assignment
    await db.delete(eventAdministrators)
      .where(and(
        eq(eventAdministrators.eventId, eventId),
        eq(eventAdministrators.userId, parseInt(adminId))
      ));
    
    return res.json({
      message: "Administrator removed from event successfully"
    });
  } catch (error) {
    console.error("Error removing event administrator:", error);
    return res.status(500).json({ error: "Failed to remove administrator from event" });
  }
}