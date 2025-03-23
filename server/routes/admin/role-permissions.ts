import { Request, Response } from 'express';
import { db } from "@db";
import { rolePermissions } from "@db/schema/permissions";
import { roles } from "@db/schema";
import { eq, sql } from 'drizzle-orm';
import { PERMISSIONS, PERMISSION_GROUPS, DEFAULT_ROLE_PERMISSIONS } from '@db/schema/permissions';

/**
 * Get all roles with their permissions
 */
export async function getRolesWithPermissions(req: Request, res: Response) {
  try {
    // Query all roles
    const allRoles = await db.select().from(roles);
    
    // For each role, get its permissions
    const rolesWithPermissions = await Promise.all(
      allRoles.map(async (role) => {
        const permissions = await db
          .select({ permission: rolePermissions.permission })
          .from(rolePermissions)
          .where(eq(rolePermissions.roleId, role.id));
        
        return {
          ...role,
          permissions: permissions.map(p => p.permission)
        };
      })
    );
    
    return res.json({
      roles: rolesWithPermissions,
      permissionGroups: PERMISSION_GROUPS
    });
  } catch (error) {
    console.error('Error fetching roles with permissions:', error);
    return res.status(500).json({ error: 'Failed to fetch roles and permissions' });
  }
}

/**
 * Get a single role with its permissions
 */
export async function getRoleWithPermissions(req: Request, res: Response) {
  try {
    const roleId = parseInt(req.params.id);
    
    // Query the role
    const [role] = await db
      .select()
      .from(roles)
      .where(eq(roles.id, roleId));
    
    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }
    
    // Get the role's permissions
    const permissions = await db
      .select({ permission: rolePermissions.permission })
      .from(rolePermissions)
      .where(eq(rolePermissions.roleId, roleId));
    
    return res.json({
      ...role,
      permissions: permissions.map(p => p.permission),
      permissionGroups: PERMISSION_GROUPS
    });
  } catch (error) {
    console.error('Error fetching role with permissions:', error);
    return res.status(500).json({ error: 'Failed to fetch role and permissions' });
  }
}

/**
 * Update role permissions
 */
export async function updateRolePermissions(req: Request, res: Response) {
  try {
    const roleId = parseInt(req.params.id);
    const { permissions } = req.body;
    
    if (!permissions || !Array.isArray(permissions)) {
      return res.status(400).json({ error: 'Permissions must be provided as an array' });
    }
    
    // Check if role exists
    const [role] = await db
      .select()
      .from(roles)
      .where(eq(roles.id, roleId));
    
    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }
    
    // Special handling for super_admin - prevent removal of critical permissions
    if (role.name === 'super_admin') {
      const criticalPermissions = [
        'administrators.view', 
        'administrators.create', 
        'administrators.edit', 
        'administrators.delete'
      ];
      
      const hasCriticalPermissions = criticalPermissions.every(p => permissions.includes(p));
      
      if (!hasCriticalPermissions) {
        return res.status(400).json({ 
          error: 'Cannot remove critical permissions from super_admin role' 
        });
      }
    }
    
    // Update permissions in a transaction
    await db.transaction(async (tx) => {
      // First delete all existing permissions for this role
      await tx
        .delete(rolePermissions)
        .where(eq(rolePermissions.roleId, roleId));
      
      // Then insert the new permissions
      for (const permission of permissions) {
        await tx
          .insert(rolePermissions)
          .values({
            roleId,
            permission
          });
      }
    });
    
    return res.json({ 
      success: true, 
      message: `Updated permissions for role: ${role.name}`,
      permissions
    });
  } catch (error) {
    console.error('Error updating role permissions:', error);
    return res.status(500).json({ error: 'Failed to update role permissions' });
  }
}

/**
 * Get all available permissions
 */
export async function getAllPermissions(req: Request, res: Response) {
  try {
    return res.json({
      permissions: Object.values(PERMISSIONS).flat(),
      permissionGroups: PERMISSION_GROUPS
    });
  } catch (error) {
    console.error('Error fetching permissions:', error);
    return res.status(500).json({ error: 'Failed to fetch permissions' });
  }
}

/**
 * Reset role permissions to defaults
 */
export async function resetRolePermissions(req: Request, res: Response) {
  try {
    const roleId = parseInt(req.params.id);
    
    // Check if role exists
    const [role] = await db
      .select()
      .from(roles)
      .where(eq(roles.id, roleId));
    
    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }
    
    // Get default permissions for this role type
    let defaultPermissions: string[] = [];
    if (DEFAULT_ROLE_PERMISSIONS[role.name as keyof typeof DEFAULT_ROLE_PERMISSIONS]) {
      defaultPermissions = DEFAULT_ROLE_PERMISSIONS[role.name as keyof typeof DEFAULT_ROLE_PERMISSIONS];
    } else {
      // If no defaults are defined, use an empty array
      console.warn(`No default permissions defined for role: ${role.name}`);
    }
    
    // Update permissions in a transaction
    await db.transaction(async (tx) => {
      // First delete all existing permissions for this role
      await tx
        .delete(rolePermissions)
        .where(eq(rolePermissions.roleId, roleId));
      
      // Then insert the default permissions
      for (const permission of defaultPermissions) {
        await tx
          .insert(rolePermissions)
          .values({
            roleId,
            permission
          });
      }
    });
    
    return res.json({ 
      success: true, 
      message: `Reset permissions for role: ${role.name}`,
      permissions: defaultPermissions
    });
  } catch (error) {
    console.error('Error resetting role permissions:', error);
    return res.status(500).json({ error: 'Failed to reset role permissions' });
  }
}