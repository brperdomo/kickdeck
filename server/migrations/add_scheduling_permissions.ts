import { db } from "@db";
import { roles } from "@db/schema";
import { PERMISSIONS, PERMISSION_GROUPS } from "@db/schema/permissions";
import { eq } from "drizzle-orm";
import { rolePermissions } from "@db/schema/permissions";

/**
 * Migration to add scheduling permissions to tournament admins
 */
export async function addSchedulingPermissions() {
  console.log("Starting migration to add scheduling permissions to tournament admins...");

  try {
    // Get the tournament_admin role ID
    const [tournamentAdminRole] = await db
      .select()
      .from(roles)
      .where(eq(roles.name, "tournament_admin"));

    if (!tournamentAdminRole) {
      console.log("Tournament admin role not found");
      return;
    }

    // Get existing tournament admin permissions
    const existingPermissions = await db
      .select({ permission: rolePermissions.permission })
      .from(rolePermissions)
      .where(eq(rolePermissions.roleId, tournamentAdminRole.id));

    const existingPermissionSet = new Set(existingPermissions.map(p => p.permission));

    // Define the scheduling permissions to add
    const schedulingPermissions = PERMISSION_GROUPS.SCHEDULING;

    // Prepare permissions to insert
    const permissionsToAdd = schedulingPermissions.filter(p => !existingPermissionSet.has(p));

    if (permissionsToAdd.length === 0) {
      console.log("All scheduling permissions already exist for tournament admin role");
      return;
    }

    // Insert new permissions
    await db.transaction(async (tx) => {
      for (const permission of permissionsToAdd) {
        await tx.insert(rolePermissions).values({
          roleId: tournamentAdminRole.id,
          permission,
          createdAt: new Date()
        });
      }
    });

    console.log(`Added ${permissionsToAdd.length} new scheduling permissions to tournament admin role`);
  } catch (error) {
    console.error("Error adding scheduling permissions:", error);
  }
}