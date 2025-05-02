/**
 * Fix Admin Role Assignment
 * 
 * This script checks if the main admin user (bperdomo@zoho.com) has the super_admin role
 * and assigns it if missing. This resolves the issue where the admin user doesn't have
 * full access to admin tools in different environments.
 */

// ES Module imports
import { db } from "./db/index.js";
import { users, roles, adminRoles } from "./db/schema.js";
import { eq, and } from "drizzle-orm";

async function fixAdminRoleAssignment() {
  try {
    console.log("Starting admin role fix script...");
    
    // 1. Get the admin user ID
    const [adminUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, "bperdomo@zoho.com"))
      .limit(1);
    
    if (!adminUser) {
      console.error("Admin user not found - please run the application first to create the admin");
      return;
    }
    
    console.log(`Found admin user with ID: ${adminUser.id}`);
    
    // 2. Get the super_admin role ID
    const [superAdminRole] = await db
      .select()
      .from(roles)
      .where(eq(roles.name, "super_admin"))
      .limit(1);
    
    // If the super_admin role doesn't exist, create it
    let superAdminRoleId;
    if (!superAdminRole) {
      console.log("Super admin role not found - creating it");
      const [newRole] = await db
        .insert(roles)
        .values({
          name: "super_admin",
          description: "Super Administrator role with full system access",
          createdAt: new Date()
        })
        .returning();
      
      superAdminRoleId = newRole.id;
      console.log(`Created super_admin role with ID: ${superAdminRoleId}`);
    } else {
      superAdminRoleId = superAdminRole.id;
      console.log(`Found super_admin role with ID: ${superAdminRoleId}`);
    }
    
    // 3. Check if the admin already has the super_admin role
    const existingRoleAssignment = await db
      .select()
      .from(adminRoles)
      .where(
        and(
          eq(adminRoles.userId, adminUser.id),
          eq(adminRoles.roleId, superAdminRoleId)
        )
      )
      .limit(1);
    
    if (existingRoleAssignment.length > 0) {
      console.log("Admin already has super_admin role assigned");
      return;
    }
    
    // 4. Assign the super_admin role to the admin user
    await db
      .insert(adminRoles)
      .values({
        userId: adminUser.id,
        roleId: superAdminRoleId,
        createdAt: new Date()
      });
    
    console.log(`Successfully assigned super_admin role to user ${adminUser.email}`);
    console.log("Fix completed successfully - please restart the application");
    
  } catch (error) {
    console.error("Error fixing admin role:", error);
  }
}

// Run the function
fixAdminRoleAssignment();