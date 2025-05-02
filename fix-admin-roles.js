
import { db } from './db/index.js';
import { roles, adminRoles, users } from './db/schema.js';
import { rolePermissions, PERMISSIONS } from './db/schema/permissions.js';
import { eq, and } from 'drizzle-orm';

async function fixAdminRoles() {
  try {
    console.log('Starting admin role fix...');

    // 1. Get super_admin role
    const [superAdminRole] = await db
      .select()
      .from(roles)
      .where(eq(roles.name, 'super_admin'));

    if (!superAdminRole) {
      throw new Error('super_admin role not found');
    }

    // 2. Get all admin users
    const adminUsers = await db
      .select()
      .from(users)
      .where(eq(users.isAdmin, true));

    // 3. Ensure each admin has super_admin role
    for (const user of adminUsers) {
      const [existingRole] = await db
        .select()
        .from(adminRoles)
        .where(
          and(
            eq(adminRoles.userId, user.id),
            eq(adminRoles.roleId, superAdminRole.id)
          )
        );

      if (!existingRole) {
        await db.insert(adminRoles).values({
          userId: user.id,
          roleId: superAdminRole.id,
          createdAt: new Date()
        });
        console.log(`Added super_admin role to user ${user.email}`);
      }
    }

    // 4. Ensure all permissions are assigned
    const allPermissions = Object.values(PERMISSIONS).flat();
    
    // Clear existing permissions
    await db
      .delete(rolePermissions)
      .where(eq(rolePermissions.roleId, superAdminRole.id));

    // Add all permissions
    for (const permission of allPermissions) {
      await db.insert(rolePermissions).values({
        roleId: superAdminRole.id,
        permission,
        createdAt: new Date()
      });
    }

    console.log('Successfully fixed admin roles and permissions');
  } catch (error) {
    console.error('Error fixing admin roles:', error);
  }
}

fixAdminRoles();
