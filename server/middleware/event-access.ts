import { Request, Response, NextFunction } from "express";
import { db } from "@db";
import { eventAdministrators, adminRoles, roles } from "@db/schema";
import { eq, and } from "drizzle-orm";

/**
 * Middleware to check if a user has access to a specific event
 * This middleware should be used after isAdmin middleware
 */
export const hasEventAccess = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // If not authenticated, deny access
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }
    
    // If not an admin, deny access
    if (!req.user?.isAdmin) {
      return res.status(403).send("Not authorized");
    }
    
    // Extract event ID from request
    const eventId = req.params.eventId || req.params.id;
    
    if (!eventId) {
      return res.status(400).send("Event ID is required");
    }
    
    // Get the user's roles
    const userId = req.user.id;
    const userRoles = await db
      .select({
        roleName: roles.name
      })
      .from(adminRoles)
      .innerJoin(roles, eq(adminRoles.roleId, roles.id))
      .where(eq(adminRoles.userId, userId));
    
    const roleNames = userRoles.map(r => r.roleName);
    
    // Super admins have access to all events
    if (roleNames.includes("super_admin")) {
      return next();
    }
    
    // Check if user is an event administrator for this event
    const eventAdmin = await db
      .select()
      .from(eventAdministrators)
      .where(
        and(
          eq(eventAdministrators.eventId, eventId),
          eq(eventAdministrators.userId, userId)
        )
      )
      .limit(1);
    
    // If user is an event administrator, allow access
    if (eventAdmin && eventAdmin.length > 0) {
      return next();
    }
    
    // Check if user is a tournament admin (has general access to events)
    if (roleNames.includes("tournament_admin")) {
      return next();
    }
    
    // Deny access if none of the above conditions are met
    return res.status(403).send("Not authorized to access this event");
  } catch (error) {
    console.error("Error checking event access:", error);
    return res.status(500).send("Internal server error");
  }
};