import { Request, Response } from "express";
import { db } from "@db";
import { users, teams } from "@db/schema";
import { eq, gt, sql } from "drizzle-orm";

/**
 * Get count of new team registrations since the admin's last viewed timestamp
 * 
 * @param req Express request object
 * @param res Express response object
 */
export const getNewRegistrationsCount = async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Get the admin user with last viewed timestamp
    const [admin] = await db
      .select()
      .from(users)
      .where(eq(users.id, req.user.id))
      .limit(1);

    if (!admin) {
      return res.status(404).json({ error: "Admin user not found" });
    }

    // If admin has never viewed registrations, use their last login time
    // If neither exists, default to a recent timestamp (1 day ago)
    const lastViewTimestamp = admin.lastViewedRegistrations || admin.lastLogin || new Date(Date.now() - 86400000);

    // Count teams created after the last view timestamp
    const newRegistrationsCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(teams)
      .where(gt(teams.createdAt, lastViewTimestamp.toISOString()))
      .then(result => result[0]?.count || 0);

    // Return the count of new registrations
    return res.json({ 
      count: newRegistrationsCount,
      lastViewed: lastViewTimestamp
    });
  } catch (error) {
    console.error("Error fetching new registrations count:", error);
    return res.status(500).json({ error: "Failed to fetch new registrations count" });
  }
};

/**
 * Acknowledge new team registrations by updating the last viewed timestamp
 * 
 * @param req Express request object
 * @param res Express response object
 */
export const acknowledgeNewRegistrations = async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Update the admin's last viewed timestamp to now
    await db
      .update(users)
      .set({
        lastViewedRegistrations: new Date()
      })
      .where(eq(users.id, req.user.id));

    return res.json({ 
      success: true, 
      message: "New team registrations acknowledged",
      timestamp: new Date()
    });
  } catch (error) {
    console.error("Error acknowledging new registrations:", error);
    return res.status(500).json({ error: "Failed to acknowledge new registrations" });
  }
};