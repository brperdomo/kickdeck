import { db } from "@db";
import { users, roles, adminRoles, households } from "@db/schema";
import { eq, and } from "drizzle-orm";
import { crypto } from "./crypto";

export async function createAdmin() {
  try {
    // Check if admin already exists
    const [existingAdmin] = await db
      .select()
      .from(users)
      .where(eq(users.email, "bperdomo@zoho.com"))
      .limit(1);

    let adminUser;
    if (!existingAdmin) {
      // Ensure a default household exists for the admin user
      const [existingHousehold] = await db.select().from(households).limit(1);
      if (!existingHousehold) {
        await db.insert(households).values({
          lastName: "Admin",
          address: "",
          city: "",
          state: "",
          zipCode: "",
          primaryEmail: "bperdomo@zoho.com",
          createdAt: new Date().toISOString(),
        });
      }

      const hashedPassword = await crypto.hash("!Nova2025");

      // Create the admin user and get the returned user with ID
      const [newAdmin] = await db.insert(users).values({
        email: "bperdomo@zoho.com",
        username: "bperdomo@zoho.com",
        password: hashedPassword,
        firstName: "Admin",
        lastName: "User",
        isAdmin: true,
        isParent: false,
        createdAt: new Date().toISOString()
      }).returning();
      
      adminUser = newAdmin;
      console.log("Admin user created successfully");
    } else {
      adminUser = existingAdmin;
      console.log("Admin user already exists");
    }

    // Ensure super_admin role exists
    const [superAdminRole] = await db
      .select()
      .from(roles)
      .where(eq(roles.name, "super_admin"))
      .limit(1);
    
    let superAdminRoleId;
    if (!superAdminRole) {
      console.log("Creating super_admin role");
      const [newRole] = await db
        .insert(roles)
        .values({
          name: "super_admin",
          description: "Super Administrator role with full system access",
          createdAt: new Date()
        })
        .returning();
      
      superAdminRoleId = newRole.id;
    } else {
      superAdminRoleId = superAdminRole.id;
    }
    
    // Check if the admin already has the super_admin role
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
    
    if (existingRoleAssignment.length === 0) {
      // Assign the super_admin role to the admin user
      await db
        .insert(adminRoles)
        .values({
          userId: adminUser.id,
          roleId: superAdminRoleId,
          createdAt: new Date()
        });
      
      console.log("Assigned super_admin role to admin user");
    } else {
      console.log("Admin user already has super_admin role");
    }
  } catch (error) {
    console.error("Error creating admin user:", error);
    throw error;
  }
}