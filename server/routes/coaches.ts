/**
 * Coach-related API routes
 */
import { Request, Response } from "express";
import { db } from "../../db";
import { users, userRoles } from "../../db/schema";
import { eq, and } from "drizzle-orm";

/**
 * Check if a coach exists by email and return non-sensitive information
 */
export async function checkCoachEmail(req: Request, res: Response) {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        error: "Email is required" 
      });
    }
    
    // Find user with the given email
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
      columns: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
      },
      with: {
        roles: {
          columns: {
            roleId: true,
          }
        }
      }
    });
    
    if (!user) {
      return res.json({ 
        exists: false,
        message: "No coach found with this email"
      });
    }
    
    // Return the coach information
    return res.json({
      exists: true,
      coach: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone || '',
      }
    });
    
  } catch (error) {
    console.error("Error checking coach email:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to check coach email"
    });
  }
}