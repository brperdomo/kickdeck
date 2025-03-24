import { Request, Response } from 'express';
import { db } from '@db/index';
import { rolePermissions, PERMISSIONS } from '@db/schema/permissions';
import { adminRoles } from '@db/schema';
import { eq } from 'drizzle-orm';

/**
 * Get the current authenticated admin's permissions
 */
export async function getCurrentUserPermissions(req: Request, res: Response) {
  try {
    // Get the user ID, considering emulation
    const userId = req.emulatedUserId || req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Fetch the user's roles
    const userRoles = await db.query.adminRoles.findMany({
      where: eq(adminRoles.userId, userId),
      columns: {
        roleType: true
      }
    });

    const roles = userRoles.map(role => role.roleType);
    
    // If the user is a super_admin, they have all permissions
    if (roles.includes('super_admin')) {
      return res.json({
        roles,
        permissions: Object.keys(PERMISSIONS)
      });
    }

    // Otherwise, fetch the specific permissions for their roles
    const allPermissions = new Set<string>();
    
    // For each role, get the assigned permissions
    for (const role of roles) {
      const rolePermissionsList = await db.query.rolePermissions.findMany({
        where: eq(rolePermissions.roleType, role),
        columns: {
          permission: true
        }
      });
      
      // Add each permission to the set
      rolePermissionsList.forEach(p => allPermissions.add(p.permission));
    }

    return res.json({
      roles,
      permissions: Array.from(allPermissions)
    });
  } catch (error) {
    console.error('Error fetching user permissions:', error);
    return res.status(500).json({ error: 'Failed to fetch user permissions' });
  }
}