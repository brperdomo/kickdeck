/**
 * Permissions Middleware
 * 
 * This middleware provides tools for checking user permissions in API routes.
 * It works with the existing role-based permissions system.
 */

import { Request } from 'express';
import { db } from '@db';
import { adminRoles, roles, rolePermissions } from '@db/schema';
import { eq, and, inArray } from 'drizzle-orm';

/**
 * Check if the current user has a specific permission
 * 
 * @param req Express request object
 * @param permission Permission to check (e.g., 'finance.view')
 * @returns boolean indicating if user has the permission
 */
export const checkPermission = async (req: Request, permission: string): Promise<boolean> => {
  try {
    // Get the user ID, considering emulation
    const emulatedUserId = (req as any).emulatedUserId;
    const userId = emulatedUserId || req.user?.id;
    
    if (!userId) {
      return false; // No authenticated user
    }
    
    // Special handling for main admin (bperdomo@zoho.com)
    if (req.user?.email === 'bperdomo@zoho.com') {
      return true; // Main admin has all permissions
    }

    // Check if user is a super_admin (they have all permissions)
    const userRoles = await db
      .select({
        roleName: roles.name
      })
      .from(adminRoles)
      .innerJoin(roles, eq(adminRoles.roleId, roles.id))
      .where(eq(adminRoles.userId, userId));
    
    if (userRoles.some(role => role.roleName === 'super_admin')) {
      return true; // Super admins have all permissions
    }

    // Get the user's role IDs
    const roleIds = await db
      .select({
        roleId: adminRoles.roleId
      })
      .from(adminRoles)
      .where(eq(adminRoles.userId, userId));
    
    if (roleIds.length === 0) {
      return false; // User has no roles
    }

    // Check if any of the user's roles have the required permission
    const permissions = await db
      .select()
      .from(rolePermissions)
      .where(
        and(
          inArray(rolePermissions.roleId, roleIds.map(r => r.roleId)),
          eq(rolePermissions.permission, permission)
        )
      );
    
    return permissions.length > 0;
  } catch (error) {
    console.error('Error checking permission:', error);
    return false; // Default to denying access on error
  }
};

/**
 * Middleware to check if user has a specific permission
 * Use this as middleware in router definitions
 * 
 * @param permission Permission to check
 */
export const requirePermission = (permission: string) => {
  return async (req: Request, res: any, next: Function) => {
    const hasPermission = await checkPermission(req, permission);
    
    if (!hasPermission) {
      return res.status(403).json({ 
        error: 'Access denied. You do not have the required permission.' 
      });
    }
    
    next();
  };
};