import { Request, Response } from "express";
import { db } from "../../../db";
import { roles } from "../../../db/schema";
import { rolePermissions, PERMISSIONS, DEFAULT_ROLE_PERMISSIONS } from "../../../db/schema/permissions";
import { eq, and, sql } from "drizzle-orm";

/**
 * Get all roles with their permissions
 */
export async function getRolesWithPermissions(req: Request, res: Response) {
  try {
    // Get all roles
    const rolesList = await db.select().from(roles).orderBy(roles.id);
    
    // For each role, get its permissions
    const result = await Promise.all(
      rolesList.map(async (role) => {
        const permissions = await db
          .select({ permission: rolePermissions.permission })
          .from(rolePermissions)
          .where(eq(rolePermissions.roleId, role.id));
          
        return {
          id: role.id,
          name: role.name,
          description: role.description,
          permissions: permissions.map(p => p.permission)
        };
      })
    );
    
    res.json(result);
  } catch (error) {
    console.error("Error fetching roles with permissions:", error);
    res.status(500).json({ 
      error: "Failed to fetch roles with permissions",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
}

/**
 * Get a single role with its permissions
 */
export async function getRoleWithPermissions(req: Request, res: Response) {
  try {
    const roleId = Number(req.params.id);
    
    if (isNaN(roleId)) {
      return res.status(400).json({ error: "Invalid role ID" });
    }
    
    // Get the role
    const [role] = await db
      .select()
      .from(roles)
      .where(eq(roles.id, roleId));
      
    if (!role) {
      return res.status(404).json({ error: "Role not found" });
    }
    
    // Get the role's permissions
    const permissions = await db
      .select({ permission: rolePermissions.permission })
      .from(rolePermissions)
      .where(eq(rolePermissions.roleId, roleId));
      
    res.json({
      id: role.id,
      name: role.name,
      description: role.description,
      permissions: permissions.map(p => p.permission)
    });
  } catch (error) {
    console.error(`Error fetching role with ID ${req.params.id}:`, error);
    res.status(500).json({ 
      error: "Failed to fetch role with permissions",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
}

/**
 * Update role permissions
 */
export async function updateRolePermissions(req: Request, res: Response) {
  try {
    const roleId = Number(req.params.id);
    const { permissions } = req.body;
    
    if (isNaN(roleId)) {
      return res.status(400).json({ error: "Invalid role ID" });
    }
    
    if (!Array.isArray(permissions)) {
      return res.status(400).json({ error: "Permissions must be an array" });
    }
    
    // Validate each permission
    for (const permission of permissions) {
      if (!Object.values(PERMISSIONS).includes(permission)) {
        return res.status(400).json({ 
          error: `Invalid permission: ${permission}`,
          validPermissions: Object.values(PERMISSIONS)
        });
      }
    }
    
    // Get the role
    const [role] = await db
      .select()
      .from(roles)
      .where(eq(roles.id, roleId));
      
    if (!role) {
      return res.status(404).json({ error: "Role not found" });
    }
    
    // For super_admin role, ensure they have all permissions
    if (role.name === "super_admin") {
      return res.status(400).json({ 
        error: "Cannot modify super_admin permissions. They always have all permissions." 
      });
    }
    
    // Update the permissions in a transaction
    await db.transaction(async (tx) => {
      // Delete existing permissions
      await tx
        .delete(rolePermissions)
        .where(eq(rolePermissions.roleId, roleId));
        
      // Add new permissions
      if (permissions.length > 0) {
        await tx.insert(rolePermissions)
          .values(
            permissions.map(permission => ({
              roleId,
              permission,
              createdAt: new Date()
            }))
          );
      }
    });
    
    // Get updated permissions
    const updatedPermissions = await db
      .select({ permission: rolePermissions.permission })
      .from(rolePermissions)
      .where(eq(rolePermissions.roleId, roleId));
    
    res.json({
      id: role.id,
      name: role.name,
      description: role.description,
      permissions: updatedPermissions.map(p => p.permission)
    });
  } catch (error) {
    console.error(`Error updating permissions for role ID ${req.params.id}:`, error);
    res.status(500).json({ 
      error: "Failed to update role permissions",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
}

/**
 * Get all available permissions
 */
export async function getAllPermissions(req: Request, res: Response) {
  try {
    // Return both the flat list and grouped permissions
    res.json({
      permissions: Object.values(PERMISSIONS),
      permissionGroups: Object.entries(PERMISSIONS).reduce((groups, [key, value]) => {
        const groupName = key.split('_')[0].toLowerCase();
        if (!groups[groupName]) {
          groups[groupName] = [];
        }
        groups[groupName].push(value);
        return groups;
      }, {} as Record<string, string[]>)
    });
  } catch (error) {
    console.error("Error fetching all permissions:", error);
    res.status(500).json({ 
      error: "Failed to fetch permissions",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
}

/**
 * Reset role permissions to defaults
 */
export async function resetRolePermissions(req: Request, res: Response) {
  try {
    const roleId = Number(req.params.id);
    
    if (isNaN(roleId)) {
      return res.status(400).json({ error: "Invalid role ID" });
    }
    
    // Get the role
    const [role] = await db
      .select()
      .from(roles)
      .where(eq(roles.id, roleId));
      
    if (!role) {
      return res.status(404).json({ error: "Role not found" });
    }
    
    // Get default permissions for this role
    let defaultPermissions: string[] = [];
    
    if (role.name in DEFAULT_ROLE_PERMISSIONS) {
      defaultPermissions = DEFAULT_ROLE_PERMISSIONS[role.name as keyof typeof DEFAULT_ROLE_PERMISSIONS];
    } else {
      return res.status(400).json({ error: "No default permissions defined for this role" });
    }
    
    // Update the permissions in a transaction
    await db.transaction(async (tx) => {
      // Delete existing permissions
      await tx
        .delete(rolePermissions)
        .where(eq(rolePermissions.roleId, roleId));
        
      // Add default permissions
      await tx.insert(rolePermissions)
        .values(
          defaultPermissions.map(permission => ({
            roleId,
            permission,
            createdAt: new Date()
          }))
        );
    });
    
    // Get updated permissions
    const updatedPermissions = await db
      .select({ permission: rolePermissions.permission })
      .from(rolePermissions)
      .where(eq(rolePermissions.roleId, roleId));
    
    res.json({
      id: role.id,
      name: role.name,
      description: role.description,
      permissions: updatedPermissions.map(p => p.permission)
    });
  } catch (error) {
    console.error(`Error resetting permissions for role ID ${req.params.id}:`, error);
    res.status(500).json({ 
      error: "Failed to reset role permissions",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
}