/**
 * Role Verification Middleware
 * 
 * This middleware serves two purposes:
 * 1. Automatically verifies that super_admin roles have appropriate permissions
 * 2. Logs detailed permission information when users attempt to access admin sections
 */

import { db } from '@db';
import { roles, adminRoles, users } from '@db/schema';
import { rolePermissions, PERMISSIONS } from '@db/schema/permissions';
import { eq, and, inArray, count } from 'drizzle-orm';
import { Request, Response, NextFunction } from 'express';

// This will run on application start to verify admin roles are properly set up
export async function verifySuperAdminRoles() {
  try {
    console.log('Verifying super_admin role permissions...');
    
    // Check if super_admin role exists
    const superAdminRoles = await db
      .select()
      .from(roles)
      .where(eq(roles.name, 'super_admin'));
    
    if (superAdminRoles.length === 0) {
      console.error('ERROR: super_admin role does not exist in the database!');
      return;
    }
    
    const superAdminRoleId = superAdminRoles[0].id;
    
    // Get count of permissions for super_admin role
    const permissionsCount = await db
      .select({ count: count() })
      .from(rolePermissions)
      .where(eq(rolePermissions.roleId, superAdminRoleId));
    
    // Get count of assigned users
    const assignedUsers = await db
      .select({
        count: count(),
      })
      .from(adminRoles)
      .where(eq(adminRoles.roleId, superAdminRoleId));
    
    console.log(`Found ${assignedUsers[0].count} users with super_admin role`);
    console.log(`Found ${permissionsCount[0].count} permissions assigned to super_admin role`);
    
    // If permissions are missing, assign them
    if (permissionsCount[0].count < Object.keys(PERMISSIONS).length) {
      console.log('WARNING: super_admin role is missing some permissions, fixing...');
      
      // Delete existing permissions to avoid duplicates
      await db.delete(rolePermissions)
        .where(eq(rolePermissions.roleId, superAdminRoleId));
      
      // Add all permissions
      for (const permission of Object.values(PERMISSIONS).flat()) {
        await db.insert(rolePermissions)
          .values({
            roleId: superAdminRoleId,
            permission
          })
          .onConflictDoNothing();
      }
      
      console.log('super_admin permissions fixed successfully');
    } else {
      console.log('super_admin role permissions verified ✓');
    }
    
    // Verify that main admin user has super_admin role
    const mainAdmin = await db
      .select()
      .from(users)
      .where(eq(users.email, 'bperdomo@zoho.com'))
      .limit(1);
    
    if (mainAdmin.length === 0) {
      console.log('Main admin user not found - this is normal for some environments');
      return;
    }
    
    // Check if user has super_admin role
    const adminRoleAssignment = await db
      .select()
      .from(adminRoles)
      .where(
        and(
          eq(adminRoles.userId, mainAdmin[0].id),
          eq(adminRoles.roleId, superAdminRoleId)
        )
      );
    
    if (adminRoleAssignment.length === 0) {
      console.log('WARNING: Main admin missing super_admin role, fixing...');
      
      await db.insert(adminRoles)
        .values({
          userId: mainAdmin[0].id,
          roleId: superAdminRoleId,
          createdAt: new Date()
        });
      
      console.log('Main admin super_admin role assigned successfully');
    } else {
      console.log('Main admin super_admin role verified ✓');
    }
  } catch (error) {
    console.error('Error verifying super_admin roles:', error);
  }
}

// Middleware to log permission details when a 403 is about to happen
export function logPermissionDetails(req: Request, res: Response, next: NextFunction) {
  const originalStatus = res.status;
  
  // Intercept status function to detect 403 responses
  res.status = function(code) {
    if (code === 403 && req.user && req.isAuthenticated()) {
      // Log detailed permission information for debugging
      console.log(`🔐 Permission denied for user ${req.user.email} (ID: ${req.user.id})`);
      console.log(`Attempted to access: ${req.method} ${req.originalUrl}`);
      
      // Schedule an async check of user permissions without blocking response
      (async () => {
        try {
          // Since we've already checked that req.user exists above, we can safely use it here
          const userId = req.user!.id;
          
          const userRoles = await db
            .select({
              roleName: roles.name
            })
            .from(adminRoles)
            .innerJoin(roles, eq(adminRoles.roleId, roles.id))
            .where(eq(adminRoles.userId, userId));
          
          console.log(`User roles: ${userRoles.map(r => r.roleName).join(', ') || 'none'}`);
          
          if (userRoles.some(r => r.roleName === 'super_admin')) {
            console.log('WARNING: User has super_admin role but was denied access - this indicates a permissions bug');
          }
        } catch (error) {
          console.error('Error checking user permissions:', error);
        }
      })();
    }
    
    // Call the original status function
    return originalStatus.apply(res, [code]);
  };
  
  next();
}